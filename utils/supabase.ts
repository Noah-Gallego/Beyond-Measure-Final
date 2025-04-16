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
    
    // Check if item exists in wishlist
    const { data: existingItem, error: checkError } = await supabase
      .from('donor_wishlists')
      .select('id')
      .match({ donor_id: donorId, project_id: projectId })
      .maybeSingle();
      
    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Error checking for existing wishlist item:', checkError);
      // Continue anyway since we're trying to delete
    }
    
    // If item doesn't exist, just return success
    if (!existingItem) {
      return { success: true, message: 'Item was not in wishlist' };
    }
    
    // Delete the wishlist item - RLS policies will handle permissions
    const { data, error } = await supabase
      .from('donor_wishlists')
      .delete()
      .match({ donor_id: donorId, project_id: projectId });
    
    if (error) {
      console.error('Error removing from wishlist:', error);
      throw error;
    }
    
    return { success: true, data };
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
      
      // Use the direct insert result
      const directResult = newProfile;
      
      // After creating the profile, let's immediately try to retrieve it
      const checkResult = await getDonorProfile(userId);
      console.log('Immediate check after direct insert - getDonorProfile result:', JSON.stringify(checkResult, null, 2));
      
      return { success: true, donorProfile: directResult };
    }
    
    // If RPC succeeded, store in localStorage
    safeLocalStorage.setItem(`donor_profile_${userId}`, JSON.stringify(rpcData));
    
    // If RPC succeeded, continue with that result
    const checkResult = await getDonorProfile(userId);
    console.log('Immediate check after RPC - getDonorProfile result:', JSON.stringify(checkResult, null, 2));
    
    return { success: true, donorProfile: rpcData };
  } catch (error: any) {
    console.error('Error creating donor profile:', error.message);
    return { success: false, error: error.message };
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