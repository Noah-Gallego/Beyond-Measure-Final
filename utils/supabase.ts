import { createClient } from '@supabase/supabase-js';

// Make sure we're using string literals or environment variables
// that are definitely accessible in the browser
const supabaseUrl = 'https://efneocmdolkzdfhtqkpl.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVmbmVvY21kb2xremRmaHRxa3BsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE3Mjc3NzcsImV4cCI6MjA1NzMwMzc3N30.I59hRNWS56rlavD6W91tFnUjv3qqFt4h7qR6yZyxS54';

// Set up robust error handling and better persistence
const supabaseOptions = {
  auth: {
    // Use local storage for better persistence
    persistSession: true,
    autoRefreshToken: true,
    storageKey: 'beyond-measure-auth',
    detectSessionInUrl: true,
  },
  global: {
    // Add custom error handlers
    fetch: (...args: Parameters<typeof fetch>) => fetch(...args).catch(err => {
      console.error('Network error when connecting to Supabase:', err);
      throw err;
    })
  },
  // Force longer timeouts
  realtime: {
    timeout: 60000
  }
};

// Create the Supabase client with enhanced options
export const supabase = createClient(supabaseUrl, supabaseAnonKey, supabaseOptions);

// Expose easier way to check connection status
export const checkConnection = async () => {
  try {
    const { error } = await supabase.from('users').select('count', { count: 'exact', head: true }).limit(1);
    return { ok: !error, error: error?.message };
  } catch (err) {
    console.error('Supabase connection check failed:', err);
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
};

// Wishlist functions
export const addToWishlist = async (donorId: string, projectId: string) => {
  try {
    // Get the current authenticated user
    const { data: authData } = await supabase.auth.getUser();
    
    if (!authData?.user) {
      throw new Error('You must be logged in to add to wishlist');
    }
    
    // Special handling - check if donor profile is valid
    const { data: donorCheck, error: donorError } = await supabase
      .from('donor_profiles')
      .select('id, user_id')
      .eq('id', donorId)
      .maybeSingle();
      
    if (donorError) {
      console.error('Error verifying donor profile existence:', donorError);
      // Continue anyway as the profile ID might still be valid for RLS
    }
    
    if (!donorCheck) {
      console.warn('Donor profile not found in database, attempting to recreate');
      
      // Clear the stored data so we can recreate it
      if (typeof window !== 'undefined') {
        localStorage.removeItem(`donor_profile_${authData.user.id}`);
      }
      
      // Try to recreate the donor profile instead of just throwing an error
      const createResult = await createDonorProfile(authData.user.id);
      
      if (!createResult.success || !createResult.donorProfile) {
        console.error('Failed to recreate donor profile:', createResult.error);
        throw new Error('donor_profile_invalid');
      }
      
      // Use the newly created donor profile ID
      donorId = createResult.donorProfile.id;
      console.log('Successfully recreated donor profile with ID:', donorId);
    } else {
      console.log('Using donor profile:', donorCheck);
    }
    
    // First, try to use the RPC function which bypasses RLS
    try {
      console.log('Attempting to use toggle_project_wishlist RPC function');
      const { data: rpcResult, error: rpcError } = await supabase.rpc('toggle_project_wishlist', {
        p_donor_id: donorId,
        p_project_id: projectId
      });
      
      if (rpcError) {
        console.error('Error calling toggle_project_wishlist RPC:', rpcError);
        // Fall through to the direct method
      } else {
        console.log('RPC toggle_project_wishlist result:', rpcResult);
        // If the RPC call was successful, return success
        return { success: true, data: { added: rpcResult } };
      }
    } catch (rpcCallError) {
      console.error('Exception in RPC call:', rpcCallError);
      // Continue with direct method
    }
    
    // Check if item already exists in wishlist to avoid duplicates
    const { data: existingItem, error: checkError } = await supabase
      .from('donor_wishlists')
      .select('id')
      .match({ donor_id: donorId, project_id: projectId })
      .maybeSingle();
      
    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Error checking for existing wishlist item:', checkError);
      // Continue anyway - we'll handle the unique constraint if needed
    }
    
    // If item already exists, just return success
    if (existingItem) {
      return { success: true, data: existingItem, message: 'Item already in wishlist' };
    }
    
    // If the direct donor check succeeded, verify the auth.uid matches
    if (donorCheck && donorCheck.user_id) {
      // Debug log to check IDs
      console.log('Comparing donor profile user_id vs auth.uid:');
      console.log('- donor profile user_id:', donorCheck.user_id);
      console.log('- auth.uid():', authData.user.id);
      
      // If they don't match, we'll have RLS issues
      if (donorCheck.user_id !== authData.user.id) {
        console.warn('User ID mismatch - donor belongs to different user');
        // Try to find the correct donor profile
        const { data: correctDonorProfile } = await supabase
          .from('donor_profiles')
          .select('id')
          .eq('user_id', authData.user.id)
          .maybeSingle();
          
        if (correctDonorProfile) {
          console.log('Found correct donor profile:', correctDonorProfile);
          donorId = correctDonorProfile.id;
          
          // Update localStorage
          if (typeof window !== 'undefined') {
            localStorage.setItem(`donor_profile_${authData.user.id}`, JSON.stringify(correctDonorProfile));
          }
        } else {
          // This is a serious issue - donor profile doesn't match auth user
          throw new Error('donor_profile_mismatch');
        }
      }
    }
    
    // Insert the wishlist item
    const { data: insertData, error: insertError } = await supabase
      .from('donor_wishlists')
      .insert([{ donor_id: donorId, project_id: projectId }])
      .select()
      .single();
      
    if (insertError) {
      console.error('Direct insert failed:', insertError);
      
      // If error is about unique violation, the item was already in the wishlist
      if (insertError.code === '23505') { // PostgreSQL unique violation code
        return { success: true, message: 'Item already in wishlist' };
      }
      
      if (insertError.message && insertError.message.includes('foreign key constraint')) {
        // This likely means the donor profile doesn't exist or can't be accessed
        throw new Error('donor_profile_invalid');
      }
      
      // If we get an RLS error, try fallback API approach
      if (insertError.message && insertError.message.includes('row-level security')) {
        try {
          console.log('Attempting API fallback due to RLS error');
          const apiResult = await apiAddToWishlist(donorId, projectId);
          return { success: true, data: apiResult.data };
        } catch (apiError: any) {
          console.error('API fallback also failed:', apiError);
          throw new Error(`RLS policy violation: ${apiError.message || 'Unable to add to wishlist'}`);
        }
      }
      
      throw insertError;
    }
    
    // If we get here, the operation was successful
    // Mark donor setup as completed in case it wasn't already
    if (typeof window !== 'undefined') {
      localStorage.setItem(`donor_setup_completed_${authData.user.id}`, 'true');
    }
    
    return { success: true, data: insertData };
  } catch (error: any) {
    console.error('Error adding to wishlist:', error.message);
    return { success: false, error: error.message };
  }
};

export const removeFromWishlist = async (donorId: string, projectId: string) => {
  try {
    // Get the current authenticated user
    const { data: authData } = await supabase.auth.getUser();
    
    if (!authData?.user) {
      throw new Error('You must be logged in to remove from wishlist');
    }
    
    console.log('Removing from wishlist with donor ID and project ID:', { donorId, projectId });
    
    // First find the wishlist item ID since the delete_wishlist_item RPC needs it
    try {
      // Get the wishlist item ID
      const { data: wishlistItem } = await supabase
        .from('donor_wishlists')
        .select('id')
        .eq('donor_id', donorId)
        .eq('project_id', projectId)
        .maybeSingle();
      
      if (wishlistItem && wishlistItem.id) {
        console.log('Found wishlist item ID, attempting delete with RPC:', wishlistItem.id);
        
        // Try the RPC function which has SECURITY DEFINER privileges
        try {
          const { data: rpcResult, error: rpcError } = await supabase.rpc('delete_wishlist_item', {
            p_wishlist_id: wishlistItem.id
          });
          
          if (!rpcError) {
            console.log('Successfully deleted wishlist item via RPC:', rpcResult);
            
            // Clear any cached data
            if (typeof window !== 'undefined') {
              localStorage.removeItem(`wishlist_${authData.user.id}`);
              localStorage.setItem('last_wishlist_fetch', Date.now().toString());
            }
            
            return { success: true };
          }
          
          console.error('RPC delete_wishlist_item failed:', rpcError);
        } catch (rpcError) {
          console.error('Exception in RPC delete_wishlist_item call:', rpcError);
        }
        
        // Fall back to direct ID-based delete if RPC failed
        const { error } = await supabase
          .from('donor_wishlists')
          .delete()
          .eq('id', wishlistItem.id);
        
        if (!error) {
          console.log('Successfully removed by ID');
          
          // Clear any cached data
          if (typeof window !== 'undefined') {
            localStorage.removeItem(`wishlist_${authData.user.id}`);
            localStorage.setItem('last_wishlist_fetch', Date.now().toString());
          }
          
          return { success: true };
        }
      }
    } catch (idLookupErr) {
      console.error('Exception in ID lookup:', idLookupErr);
    }
    
    // Try direct approach - just delete with the provided IDs
    try {
      const { error } = await supabase
        .from('donor_wishlists')
        .delete()
        .eq('donor_id', donorId)
        .eq('project_id', projectId);
      
      if (!error) {
        console.log('Successfully removed from wishlist directly');
        
        // Clear any cached data
        if (typeof window !== 'undefined') {
          localStorage.removeItem(`wishlist_${authData.user.id}`);
          localStorage.setItem('last_wishlist_fetch', Date.now().toString());
        }
        
        return { success: true };
      }
      
      // If we got here, direct delete failed
      console.log('Direct removal failed, trying toggle_project_wishlist RPC');
    } catch (directDeleteErr) {
      console.error('Exception in direct delete:', directDeleteErr);
    }
    
    // Attempt with toggle_project_wishlist RPC function
    try {
      console.log('Attempting RPC toggle_project_wishlist for deletion');
      const { data: rpcResult, error: rpcError } = await supabase.rpc('toggle_project_wishlist', {
        p_donor_id: donorId,
        p_project_id: projectId
      });
      
      if (!rpcError) {
        console.log('Successfully removed via RPC toggle_project_wishlist');
        
        // Clear any cached data
        if (typeof window !== 'undefined') {
          localStorage.removeItem(`wishlist_${authData.user.id}`);
          localStorage.setItem('last_wishlist_fetch', Date.now().toString());
        }
        
        return { success: true };
      }
      
      console.error('RPC fallback failed:', rpcError);
    } catch (rpcErr) {
      console.error('Exception in RPC fallback:', rpcErr);
    }
    
    // Final check - if we got here but the item doesn't exist, consider it a success
    try {
      const { count } = await supabase
        .from('donor_wishlists')
        .select('*', { count: 'exact', head: true })
        .eq('donor_id', donorId)
        .eq('project_id', projectId);
      
      if (count === 0) {
        console.log('Item not found in wishlist, considering it already deleted');
        return { success: true, message: 'Item was not in wishlist' };
      }
    } catch (countErr) {
      console.error('Exception in count check:', countErr);
    }
    
    // If we got here, all deletion attempts failed
    console.error('All deletion attempts failed');
    return { success: false, error: 'Could not remove from wishlist after multiple attempts' };
  } catch (error: any) {
    console.error('Error removing from wishlist:', error.message);
    return { success: false, error: error.message };
  }
};

export const isProjectInWishlist = async (donorId: string, projectId: string) => {
  try {
    const { data, error } = await supabase
      .from('donor_wishlists')
      .select('id')
      .match({ donor_id: donorId, project_id: projectId })
      .single();
    
    if (error && error.code !== 'PGRST116') throw error; // PGRST116 means no rows returned
    return { success: true, inWishlist: !!data };
  } catch (error: any) {
    console.error('Error checking wishlist status:', error.message);
    return { success: false, inWishlist: false, error: error.message };
  }
};

export const getWishlistedProjects = async (donorId: string) => {
  try {
    // First, fetch all wishlist items for this donor
    const { data: wishlistItems, error: wishlistError } = await supabase
      .from('donor_wishlists')
      .select('project_id')
      .eq('donor_id', donorId);
    
    if (wishlistError) throw wishlistError;
    
    // If there are no items in the wishlist, return an empty array
    if (!wishlistItems || wishlistItems.length === 0) {
      return { success: true, projects: [] };
    }
    
    // Extract the project IDs to an array
    const projectIds = wishlistItems.map(item => item.project_id);
    
    // Then fetch the actual projects using the array of IDs
    const { data: projects, error: projectsError } = await supabase
      .from('projects')
      .select(`
        id, 
        title, 
        description, 
        student_impact, 
        funding_goal, 
        current_amount, 
        main_image_url,
        status
      `)
      .in('id', projectIds);
    
    if (projectsError) throw projectsError;
    return { success: true, projects: projects || [] };
  } catch (error: any) {
    console.error('Error fetching wishlisted projects:', error.message);
    return { success: false, projects: [], error: error.message };
  }
};

// Helper function to safely access localStorage
const safeLocalStorage = {
  getItem: (key: string): string | null => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(key);
    }
    return null;
  },
  setItem: (key: string, value: string): void => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(key, value);
    }
  },
  removeItem: (key: string): void => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(key);
    }
  }
};

export const getDonorProfile = async (userId: string) => {
  try {
    console.log('getDonorProfile called with userId:', userId);
    
    // First check local storage for cached donor profile
    const cachedProfile = safeLocalStorage.getItem(`donor_profile_${userId}`);
    if (cachedProfile) {
      try {
        const parsed = JSON.parse(cachedProfile);
        console.log('Using cached donor profile:', parsed);
        
        // Verify the cached profile exists in the database
        const { data: verifyData, error: verifyError } = await supabase
          .from('donor_profiles')
          .select('id')
          .eq('id', parsed.id)
          .maybeSingle();
          
        if (verifyError && verifyError.code !== 'PGRST116') {
          console.error('Error verifying cached donor profile:', verifyError);
        }
        
        // If the cached profile exists in the database, use it
        if (verifyData) {
          return { success: true, exists: true, donorId: parsed.id };
        } else {
          console.warn('Cached donor profile not found in database, clearing cache');
          safeLocalStorage.removeItem(`donor_profile_${userId}`);
          // Continue with database lookup
        }
      } catch (e) {
        console.error('Error parsing cached donor profile:', e);
        safeLocalStorage.removeItem(`donor_profile_${userId}`);
      }
    }
    
    // Check both in donor_profiles and users table to find a matching profile
    const { data: donorProfileData, error: donorProfileError } = await supabase
      .from('donor_profiles')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();
    
    console.log('Direct donor profile lookup result:', donorProfileData);
    if (donorProfileError) console.error('Direct donor lookup error:', donorProfileError);
    
    if (donorProfileError && donorProfileError.code !== 'PGRST116') {
      throw donorProfileError;
    }
    
    // If direct match found
    if (donorProfileData) {
      // Cache the donor profile
      safeLocalStorage.setItem(`donor_profile_${userId}`, JSON.stringify(donorProfileData));
      return { success: true, exists: true, donorId: donorProfileData.id };
    }
    
    // If the donor_profiles table has user_id as a foreign key to users.id
    // Let's try looking up via users table
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('auth_id', userId)
      .maybeSingle();
    
    console.log('User data lookup result:', userData);
    if (userError) console.error('User lookup error:', userError);
    
    if (userError && userError.code !== 'PGRST116') {
      throw userError;
    }
    
    if (userData) {
      // Now check for donor profile with this user's id
      const { data: donorByUserData, error: donorByUserError } = await supabase
        .from('donor_profiles')
        .select('id')
        .eq('user_id', userData.id)
        .maybeSingle();
      
      console.log('Donor by user ID lookup result:', donorByUserData);
      if (donorByUserError) console.error('Donor by user ID error:', donorByUserError);
      
      if (donorByUserError && donorByUserError.code !== 'PGRST116') {
        throw donorByUserError;
      }
      
      if (donorByUserData) {
        // Cache the donor profile
        safeLocalStorage.setItem(`donor_profile_${userId}`, JSON.stringify(donorByUserData));
        return { success: true, exists: true, donorId: donorByUserData.id };
      }
    }
    
    // Try RPC method first as final attempt
    console.log('No donor profile found directly, trying RPC get_or_create_donor_profile');
    try {
      const { data: rpcData, error: rpcError } = await supabase.rpc('get_or_create_donor_profile', {
        p_user_id: userId,
        p_is_anonymous: false // Default to not anonymous
      });
      
      if (rpcError) {
        console.error('RPC get_or_create_donor_profile failed:', rpcError);
      } else if (rpcData && rpcData.id) {
        console.log('Successfully created/got donor profile via RPC:', rpcData);
        // Cache the donor profile
        safeLocalStorage.setItem(`donor_profile_${userId}`, JSON.stringify(rpcData));
        return { success: true, exists: true, donorId: rpcData.id };
      }
    } catch (rpcErr) {
      console.error('Exception in RPC get_or_create_donor_profile:', rpcErr);
    }
    
    // No donor profile found
    console.log('No donor profile found via any method');
    return { success: false, exists: false, message: "No donor profile found for this user" };
  } catch (error: any) {
    console.error('Error fetching donor profile:', error.message);
    return { success: false, exists: false, error: error.message };
  }
};

export const createDonorProfile = async (userId: string, anonymousByDefault: boolean = false) => {
  try {
    // First check the user's auth ID to ensure it matches
    const { data: authData } = await supabase.auth.getUser();
    console.log('Current auth user ID:', authData?.user?.id);
    console.log('User ID being used for profile:', userId);
    
    // Add debug: check what auth.uid() returns from the server
    const { data: authUidData, error: authUidError } = await supabase.rpc('get_auth_uid');
    console.log('Auth UID from server:', authUidData);
    if (authUidError) console.error('Error getting auth.uid():', authUidError);
    
    // Check if the userId matches the authenticated user's id
    if (authData?.user?.id !== userId) {
      console.warn('User ID mismatch: auth user ID does not match the provided user ID');
      return { success: false, error: 'Authentication mismatch - cannot create profile for another user' };
    }
    
    // First, get the user record from the users table
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('auth_id', userId)
      .maybeSingle();
      
    console.log('User data for profile creation:', userData);
    if (userError) {
      console.error('Error finding user record:', userError);
      throw userError;
    }
    
    if (!userData) {
      console.error('No user record found with auth_id:', userId);
      return { success: false, error: 'User record not found' };
    }
    
    // Try the RPC method first
    console.log('Using RPC function get_or_create_donor_profile');
    const { data: rpcData, error: rpcError } = await supabase.rpc('get_or_create_donor_profile', {
      p_user_id: userId,
      p_is_anonymous: anonymousByDefault
    });
    
    // Check for RPC errors or missing data
    const rpcFailed = rpcError || !rpcData;
    
    if (rpcError) {
      console.error('RPC failed:', rpcError);
    }
    
    console.log('RPC response data (detailed):', rpcFailed ? 'Failed' : JSON.stringify(rpcData, null, 2));
    
    // If RPC fails, fall back to direct insert
    if (rpcFailed) {
      console.log('RPC failed, trying direct insert fallback');
      
      // First check if donor profile already exists
      const { data: existingProfile, error: existingProfileError } = await supabase
        .from('donor_profiles')
        .select('id')
        .eq('user_id', userData.id)
        .maybeSingle();
        
      if (existingProfileError && existingProfileError.code !== 'PGRST116') {
        console.error('Error checking for existing profile:', existingProfileError);
        throw existingProfileError;
      }
      
      // If profile exists, return it
      if (existingProfile) {
        console.log('Found existing donor profile:', existingProfile);
        // Store in localStorage
        safeLocalStorage.setItem(`donor_profile_${userId}`, JSON.stringify(existingProfile));
        return { success: true, donorProfile: existingProfile };
      }
      
      // Otherwise create new profile
      const { data: newProfile, error: newProfileError } = await supabase
        .from('donor_profiles')
        .insert([
          { 
            user_id: userData.id,
            is_anonymous: anonymousByDefault,
            created_at: new Date().toISOString()
          }
        ])
        .select()
        .single();
        
      if (newProfileError) {
        console.error('Error creating donor profile directly:', newProfileError);
        throw newProfileError;
      }
      
      console.log('Successfully created donor profile directly:', newProfile);
      
      // Store in localStorage
      safeLocalStorage.setItem(`donor_profile_${userId}`, JSON.stringify(newProfile));
      return { success: true, donorProfile: newProfile };
    }
    
    // If we get here, the operation was successful
    // Mark donor setup as completed in case it wasn't already
    if (typeof window !== 'undefined') {
      localStorage.setItem(`donor_setup_completed_${authData.user.id}`, 'true');
    }
    
    return { success: true, donorProfile: rpcData };
  } catch (error: any) {
    console.error('Error creating donor profile:', error.message);
    return { success: false, error: error.message };
  }
};

// Function to update the wishlist count in localStorage
export const updateWishlistCount = (userId: string, count: number): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(`wishlist_count_${userId}`, count.toString());
    console.log('Updated cached wishlist count to:', count);
  }
};

// Add a direct function to remove a wishlist item by ID
export const removeWishlistItem = async (wishlistId: string) => {
  try {
    console.log('Directly removing wishlist item by ID:', wishlistId);
    
    // Verify user is logged in
    const { data: authData } = await supabase.auth.getUser();
    
    if (!authData?.user) {
      throw new Error('You must be logged in to remove from wishlist');
    }
    
    // First try to use the RPC function which has SECURITY DEFINER privileges
    try {
      console.log('Attempting to use delete_wishlist_item RPC function');
      const { data: rpcResult, error: rpcError } = await supabase.rpc('delete_wishlist_item', {
        p_wishlist_id: wishlistId
      });
      
      if (!rpcError) {
        console.log('Successfully deleted wishlist item via RPC:', rpcResult);
        
        // Clear any cached data
        if (typeof window !== 'undefined') {
          localStorage.removeItem(`wishlist_${authData.user.id}`);
          localStorage.setItem('last_wishlist_fetch', Date.now().toString());
        }
        
        return { success: true };
      }
      
      console.error('RPC delete_wishlist_item failed:', rpcError);
      // Fall back to direct methods
    } catch (rpcError) {
      console.error('Exception in RPC delete_wishlist_item call:', rpcError);
      // Continue with direct methods
    }
    
    // Now try the most direct approach - delete by ID only
    try {
      const { error } = await supabase
        .from('donor_wishlists')
        .delete()
        .eq('id', wishlistId);
      
      if (!error) {
        console.log('Successfully removed wishlist item directly by ID');
        
        // Clear any cached data
        if (typeof window !== 'undefined') {
          localStorage.removeItem(`wishlist_${authData.user.id}`);
          localStorage.setItem('last_wishlist_fetch', Date.now().toString());
        }
        
        return { success: true };
      }
      
      // If we got here, there was an error with the direct delete
      console.log('Direct wishlist deletion failed, trying fallback approaches');
    } catch (directDeleteErr) {
      console.error('Exception in direct delete:', directDeleteErr);
    }
    
    // If direct delete failed, get item details for more targeted deletion
    const { data: itemData, error: itemError } = await supabase
      .from('donor_wishlists')
      .select('donor_id, project_id')
      .eq('id', wishlistId)
      .maybeSingle();
      
    if (itemError) {
      console.error('Error getting wishlist item details:', itemError);
      
      // If the item doesn't exist, consider it a successful delete
      if (itemError.code === 'PGRST116') {
        return { success: true, message: 'Item already deleted' };
      }
    }
    
    // If we couldn't get the item details, try RPC function as fallback
    if (!itemData) {
      console.log('Could not find wishlist item, considering it already deleted');
      return { success: true, message: 'Item not found' };
    }
    
    // Try to remove using the RPC function which has higher privileges
    try {
      console.log('Attempting RPC toggle_project_wishlist for deletion');
      const { data: rpcResult, error: rpcError } = await supabase.rpc('toggle_project_wishlist', {
        p_donor_id: itemData.donor_id,
        p_project_id: itemData.project_id
      });
      
      if (!rpcError) {
        console.log('Successfully removed via RPC toggle_project_wishlist');
        
        // Clear any cached data
        if (typeof window !== 'undefined') {
          localStorage.removeItem(`wishlist_${authData.user.id}`);
          localStorage.setItem('last_wishlist_fetch', Date.now().toString());
        }
        
        return { success: true };
      }
      
      console.error('RPC fallback also failed:', rpcError);
    } catch (rpcErr) {
      console.error('Exception in RPC fallback:', rpcErr);
    }
    
    // Final fallback - try with just the ID but force refresh from DB afterward
    console.log('Attempting final fallback delete with just the ID');
    const { error: finalError } = await supabase
      .from('donor_wishlists')
      .delete()
      .eq('id', wishlistId);
    
    if (!finalError) {
      console.log('Final fallback delete succeeded');
      
      // Clear any cached data
      if (typeof window !== 'undefined') {
        localStorage.removeItem(`wishlist_${authData.user.id}`);
        localStorage.setItem('last_wishlist_fetch', Date.now().toString());
      }
      
      return { success: true };
    }
    
    // If all approaches failed, return error
    console.error('All deletion approaches failed:', finalError);
    return { success: false, error: 'Could not delete wishlist item after multiple attempts' };
  } catch (error: any) {
    console.error('Error in removeWishlistItem:', error);
    return { success: false, error: error.message };
  }
};

// Simple direct function to delete a wishlist item
export const deleteWishlistItem = async (wishlistId: string) => {
  console.log('Directly deleting wishlist item with ID:', wishlistId);
  
  try {
    // First try the RPC function which has SECURITY DEFINER privileges
    try {
      console.log('Attempting to use delete_wishlist_item RPC function');
      const { data: rpcResult, error: rpcError } = await supabase.rpc('delete_wishlist_item', {
        p_wishlist_id: wishlistId
      });
      
      if (!rpcError) {
        console.log('Successfully deleted wishlist item via RPC:', rpcResult);
        
        // Clear any cached data to ensure fresh data on next load
        if (typeof window !== 'undefined') {
          const { data: authData } = await supabase.auth.getUser();
          if (authData?.user) {
            localStorage.removeItem(`wishlist_${authData.user.id}`);
            localStorage.setItem('last_wishlist_fetch', Date.now().toString());
          }
        }
        
        return { success: true };
      }
      
      console.error('RPC delete_wishlist_item failed:', rpcError);
      // Fall back to direct method
    } catch (rpcError) {
      console.error('Exception in RPC delete_wishlist_item call:', rpcError);
      // Continue with direct method
    }
    
    // Fall back to direct delete approach
    const { error } = await supabase
      .from('donor_wishlists')
      .delete()
      .eq('id', wishlistId);
    
    if (error) {
      console.error('Error deleting wishlist item:', error);
      return { success: false, error: error.message };
    }
    
    // Clear any cached data to ensure fresh data on next load
    if (typeof window !== 'undefined') {
      const { data: authData } = await supabase.auth.getUser();
      if (authData?.user) {
        localStorage.removeItem(`wishlist_${authData.user.id}`);
        localStorage.setItem('last_wishlist_fetch', Date.now().toString());
      }
    }
    
    return { success: true };
  } catch (error: any) {
    console.error('Exception deleting wishlist item:', error);
    return { success: false, error: error.message };
  }
};

// Create a simplified, reliable wishlist count function that matches the wishlist page's approach
export const getWishlistCount = async (userId: string): Promise<number> => {
  try {
    console.log('Getting wishlist count for user:', userId);
    
    // Get user database ID first (exact same approach as wishlist page)
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('auth_id', userId)
      .maybeSingle();
    
    if (userError) {
      console.error('Error getting user data:', userError);
      return 0;
    }
    
    if (!userData) {
      console.error('User not found in database, userId:', userId);
      return 0;
    }
    
    console.log('Found user record:', userData.id);
    
    // Get donor profile
    const { data: donorData, error: donorError } = await supabase
      .from('donor_profiles')
      .select('id')
      .eq('user_id', userData.id)
      .maybeSingle();
    
    if (donorError && donorError.code !== 'PGRST116') {
      console.error('Error getting donor profile:', donorError);
      return 0;
    }
    
    if (!donorData) {
      console.log('No donor profile found for user:', userData.id);
      return 0;
    }
    
    console.log('Found donor profile:', donorData.id);
    
    // Direct count query - exactly like wishlist page
    const { count, error: countError } = await supabase
      .from('donor_wishlists')
      .select('*', { count: 'exact', head: true })
      .eq('donor_id', donorData.id);
    
    if (countError) {
      console.error('Error counting wishlist items:', countError);
      return 0;
    }
    
    // Make sure count is a number - defensive programming
    const actualCount = typeof count === 'number' ? count : 0;
    console.log('Actual wishlist count from database is:', actualCount);
    
    // Cache the result for next time
    if (typeof window !== 'undefined') {
      localStorage.setItem(`wishlist_count_${userId}`, actualCount.toString());
      console.log('Updated cached wishlist count to:', actualCount);
    }
    
    return actualCount;
  } catch (error) {
    console.error('Error in getWishlistCount:', error);
    return 0;
  }
};

// Alternative approach for removing from wishlist that doesn't rely on RLS
export const apiRemoveFromWishlist = async (donorId: string, projectId: string) => {
  try {
    // First verify the current user is logged in
    const { data: authData } = await supabase.auth.getUser();
    
    if (!authData?.user) {
      throw new Error('You must be logged in to remove from wishlist');
    }
    
    // Make a POST request to a server API endpoint that can bypass RLS
    const response = await fetch('/api/wishlist/remove', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: authData.user.id,
        donorId,
        projectId
      }),
    });
    
    if (response.status === 404) {
      // API endpoint doesn't exist - infrastructure issue
      throw new Error('API endpoint not found');
    }
    
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error || 'Failed to remove from wishlist');
    }
    
    return { success: true, data: result.data };
  } catch (error: any) {
    console.error('Error removing from wishlist via API:', error.message);
    throw error; // Let the caller handle the error
  }
};

// Alternative approach that doesn't rely on RLS
export const apiAddToWishlist = async (donorId: string, projectId: string) => {
  try {
    // First verify the current user is logged in
    const { data: authData } = await supabase.auth.getUser();
    
    if (!authData?.user) {
      throw new Error('You must be logged in to add to wishlist');
    }
    
    // Make a POST request to a server API endpoint that can bypass RLS
    const response = await fetch('/api/wishlist/add', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: authData.user.id,
        donorId,
        projectId
      }),
    });
    
    if (response.status === 404) {
      // API endpoint doesn't exist - infrastructure issue
      throw new Error('API endpoint not found');
    }
    
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error || 'Failed to add to wishlist');
    }
    
    return { success: true, data: result.data };
  } catch (error: any) {
    console.error('Error adding to wishlist via API:', error.message);
    throw error; // Let the caller handle the error
  }
};