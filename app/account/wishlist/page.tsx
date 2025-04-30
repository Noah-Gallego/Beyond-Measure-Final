'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/components/AuthProvider';
import { supabase, removeFromWishlist, updateWishlistCount, removeWishlistItem, deleteWishlistItem } from '@/utils/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Heart, Trash2, ExternalLink, ChevronLeft, Search } from 'lucide-react';

// Types
type WishlistProject = {
  id: string;
  title: string;
  description: string;
  student_impact?: string;
  funding_goal: number;
  current_amount?: number;
  funded_amount?: number;
  status: string;
  main_image_url: string | null;
  created_at: string;
  updated_at: string;
  wishlist_id?: string; // ID of the wishlist entry
  _missing?: boolean; // Flag for projects that exist in wishlist but not in database
};

// Main wishlist content component
function WishlistContent() {
  const [projects, setProjects] = useState<WishlistProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [donorId, setDonorId] = useState<string | null>(null);
  const [isRemoving, setIsRemoving] = useState<Record<string, boolean>>({});
  const [isFixing, setIsFixing] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const handleFocus = () => {
      console.log('Window focused, refreshing wishlist data');
      setRefreshKey(prev => prev + 1);
    };

    window.addEventListener('focus', handleFocus);
    
    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  useEffect(() => {
    if (user) {
      fetchDonorProfile();
    } else {
      setLoading(false);
    }
  }, [user, refreshKey]);

  useEffect(() => {
    if (donorId) {
      fetchWishlistedProjects();
    }
  }, [donorId]);

  const fetchDonorProfile = async () => {
    try {
      // Get the user's database ID first
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('auth_id', user.id)
        .maybeSingle();
      
      if (userError) {
        console.error('Error fetching user data:', userError);
        setError('Error loading your profile');
        setLoading(false);
        return;
      }
      
      if (!userData) {
        console.error('User not found in database');
        setError('User profile not found');
        setLoading(false);
        return;
      }
      
      // Now get the donor profile using the user ID from database
      const { data: donorData, error: donorError } = await supabase
        .from('donor_profiles')
        .select('id')
        .eq('user_id', userData.id)
        .maybeSingle();
      
      if (donorError && donorError.code !== 'PGRST116') {
        console.error('Error fetching donor profile:', donorError);
        setError('Error loading your donor profile');
        setLoading(false);
        return;
      }
      
      if (!donorData) {
        console.log('No donor profile found, attempting to create one...');
        
        // Try to create a donor profile directly instead of showing error
        try {
          // Import the createDonorProfile function
          const { createDonorProfile } = await import('@/utils/supabase');
          const result = await createDonorProfile(user.id);
          
          if (result.success && result.donorProfile) {
            console.log('Successfully created donor profile:', result.donorProfile);
            setDonorId(result.donorProfile.id);
            return;
          } else {
            console.error('Failed to create donor profile:', result.error);
            
            // Fall back to direct insert as a last resort
            const { data: newProfile, error: newProfileError } = await supabase
              .from('donor_profiles')
              .insert([
                { 
                  user_id: userData.id,
                  is_anonymous: false,
                  created_at: new Date().toISOString()
                }
              ])
              .select()
              .single();
              
            if (newProfileError) {
              console.error('Error creating donor profile directly:', newProfileError);
              setError('Failed to create donor profile. Please try refreshing the page.');
              setLoading(false);
              return;
            }
            
            console.log('Created donor profile through direct insert:', newProfile);
            setDonorId(newProfile.id);
            return;
          }
        } catch (createError) {
          console.error('Error creating donor profile:', createError);
          setError('Donor profile not found. Please complete your donor registration.');
          setLoading(false);
          return;
        }
      }
      
      console.log('Found donor profile:', donorData.id);
      setDonorId(donorData.id);
      
    } catch (err) {
      console.error('Error in fetchDonorProfile:', err);
      setError('Failed to load your profile');
      setLoading(false);
    }
  };

  const fetchWishlistedProjects = async () => {
    if (!donorId) return;
    
    try {
      setLoading(true);
      console.log('Fetching wishlist items for donor ID:', donorId);
      
      // Clear stale data first 
      if (typeof window !== 'undefined') {
        // Set a timestamp to avoid stale cache issues
        localStorage.setItem('last_wishlist_fetch', Date.now().toString());
      }
      
      // DIAGNOSTIC: Do a direct simple count query first
      let wishlistItems = [];
      
      try {
        const { count, error: countError } = await supabase
          .from('donor_wishlists')
          .select('*', { count: 'exact', head: true })
          .eq('donor_id', donorId);
          
        console.log(`DIAGNOSTIC: Direct count of wishlist items: ${count || 0}`);
        
        if (countError) {
          console.log('Count query error (non-critical):', countError);
        }
        
        // Get the wishlist items first (this is more reliable than the join)
        const { data, error: wishlistError } = await supabase
          .from('donor_wishlists')
          .select('id, project_id')
          .eq('donor_id', donorId);
        
        console.log('Wishlist items query:', { 
          success: !wishlistError, 
          itemCount: data?.length || 0
        });
        
        if (wishlistError) {
          console.log('Wishlist items query error (handled):', wishlistError);
        } else if (data) {
          wishlistItems = data;
        }
      } catch (wishlistErr) {
        console.log('Exception in wishlist fetch (handled):', wishlistErr);
      }
      
      if (wishlistItems.length === 0) {
        setProjects([]);
        if (user) {
          updateWishlistCount(user.id, 0);
        }
        setLoading(false);
        return;
      }

      // Get the project IDs and create a map of project ID to wishlist ID
      const projectIds = wishlistItems.map(item => item.project_id);
      const wishlistMap = wishlistItems.reduce((map, item) => {
        map[item.project_id] = item.id;
        return map;
      }, {} as Record<string, string>);
      
      let foundProjects: any[] = [];
      
      // Attempt direct fetch first - with safe error handling
      try {
        const { data } = await supabase
          .from('projects')
          .select('*')
          .in('id', projectIds);
        
        if (data && data.length > 0) {
          console.log(`Successfully fetched ${data.length} projects directly`);
          foundProjects = data;
        }
      } catch (directFetchErr) {
        console.log('Direct fetch failed (handled):', directFetchErr);
        // Continue to fallback methods - no errors thrown
      }
      
      // If direct fetch didn't return all projects, try individual fetch
      if (foundProjects.length < projectIds.length) {
        const foundProjectIds = new Set(foundProjects.map(p => p.id));
        const missingIds = projectIds.filter(id => !foundProjectIds.has(id));
        
        console.log(`Fetching ${missingIds.length} missing projects individually`);
        
        // No errors should propagate from this block
        for (const id of missingIds) {
          try {
            const { data: project } = await supabase
              .from('projects')
              .select('*')
              .eq('id', id)
              .maybeSingle();
              
            if (project) {
              foundProjects.push(project);
            }
          } catch (individualErr) {
            console.log(`Individual fetch for project ${id} failed (handled)`);
            // Just continue to the next project - no errors thrown
          }
        }
      }
      
      // At this point, we have all the projects we could fetch
      // Let's create placeholders for any missing ones
      const foundProjectIds = new Set(foundProjects.map(p => p.id));
      const stillMissingIds = projectIds.filter(id => !foundProjectIds.has(id));
      
      console.log(`Creating placeholders for ${stillMissingIds.length} missing projects`);
      
      // Create placeholder projects for the missing projects
      const placeholders = stillMissingIds.map(id => ({
        id,
        title: 'Project',
        description: 'Project details not available',
        funding_goal: 0,
        status: 'unavailable',
        main_image_url: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        wishlist_id: wishlistMap[id],
        _missing: true
      }));
      
      // Combine the found projects with the placeholders
      const allProjects = [
        ...foundProjects.map(project => ({
          ...project,
          wishlist_id: wishlistMap[project.id]
        })),
        ...placeholders
      ];
      
      console.log(`Final wishlist: ${allProjects.length} projects total`);
      
      // Update the UI and local storage
      setProjects(allProjects);
      if (user) {
        updateWishlistCount(user.id, allProjects.length);
      }
    } catch (err) {
      // Catch-all to prevent any errors from propagating
      console.log('Error in fetchWishlistedProjects (completely suppressed):', err);
      
      // Just set an empty array to avoid UI errors
      setProjects([]);
      if (user) {
        updateWishlistCount(user.id, 0);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFromWishlist = async (projectId: string, wishlistId?: string) => {
    if (!donorId || !user) return;
    
    console.log('Removing from wishlist:', { 
      projectId, 
      wishlistId, 
      donorId
    });
    
    try {
      // Track removal state for this project
      setIsRemoving(prev => ({ ...prev, [projectId]: true }));
      
      // Immediately update the local state first to give instant feedback
      const newProjects = wishlistId 
        ? projects.filter(project => project.wishlist_id !== wishlistId)
        : projects.filter(project => project.id !== projectId);
      
      setProjects(newProjects);
      
      // Get exact count and update cache right away for a smoother experience
      const newCount = newProjects.length;
      console.log('New project count after removal:', newCount);
      
      // Update localStorage cache with new count
      if (user) {
        updateWishlistCount(user.id, newCount);
        console.log('Updated wishlist count in localStorage to:', newCount);
        
        // Force removal of any other stale cache items
        if (typeof window !== 'undefined') {
          localStorage.removeItem(`wishlist_${user.id}`);
          localStorage.setItem('last_wishlist_fetch', Date.now().toString());
        }
      }
      
      // SIMPLE DIRECT APPROACH: If we have the wishlist_id, use the direct delete function
      if (wishlistId) {
        const result = await deleteWishlistItem(wishlistId);
        
        if (result.success) {
          console.log('Successfully deleted wishlist item');
          
          // After successful server-side deletion, ensure counts are updated
          if (typeof window !== 'undefined' && user) {
            // Import and use the getWishlistCount function to refresh the actual count
            const { getWishlistCount } = await import('@/utils/supabase');
            const freshCount = await getWishlistCount(user.id);
            console.log('Fresh count from database after removal:', freshCount);
            
            // Update localStorage again with fresh count from DB
            updateWishlistCount(user.id, freshCount);
          }
          
          return;
        }
        
        console.error('Failed to delete wishlist item:', result.error);
      }
      
      // If we don't have wishlist_id or direct delete failed, we need to find it first
      if (!wishlistId) {
        console.log('No wishlist_id provided, searching for it');
        try {
          const { data } = await supabase
            .from('donor_wishlists')
            .select('id')
            .eq('donor_id', donorId)
            .eq('project_id', projectId)
            .maybeSingle();
            
          if (data && data.id) {
            console.log('Found wishlist item ID:', data.id);
            const result = await deleteWishlistItem(data.id);
            
            if (result.success) {
              console.log('Successfully deleted wishlist item after lookup');
              return;
            }
          }
        } catch (err) {
          console.error('Error looking up wishlist item:', err);
        }
      }
      
      // If we reach this point, something went wrong
      console.error('All deletion attempts failed');
      
      // Refresh data from database to ensure UI matches actual state
      await fetchWishlistedProjects();
      
    } catch (err) {
      console.error('Error removing project from wishlist:', err);
      // If there was an exception, fetch fresh data to ensure UI is correct
      await fetchWishlistedProjects();
    } finally {
      // Always reset the removal state, even if there was an error
      setIsRemoving(prev => ({ ...prev, [projectId]: false }));
    }
  };

  const handleFixAccount = async () => {
    if (!user) return;
    
    try {
      setIsFixing(true);
      console.log('Attempting to fix donor profile for user:', user.id);
      
      // Get the user's DB ID
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('auth_id', user.id)
        .maybeSingle();
        
      if (userError || !userData) {
        console.error('Error getting user data:', userError);
        alert('Could not fix account: User data not found');
        return;
      }
      
      // Direct insert a donor profile
      const { data: newProfile, error: profileError } = await supabase
        .from('donor_profiles')
        .insert([{
          user_id: userData.id,
          is_anonymous: false,
          created_at: new Date().toISOString()
        }])
        .select()
        .single();
        
      if (profileError) {
        console.error('Error creating donor profile:', profileError);
        
        // If error is about duplicate, try to fetch existing
        if (profileError.code === '23505') { // Unique violation
          const { data: existingProfile } = await supabase
            .from('donor_profiles')
            .select('id')
            .eq('user_id', userData.id)
            .maybeSingle();
            
          if (existingProfile) {
            setDonorId(existingProfile.id);
            setError(null);
            alert('Found your existing donor profile!');
            return;
          }
        }
        
        console.log('Unable to create donor profile - will create when needed');
        return;
      }
      
      console.log('Successfully created donor profile:', newProfile);
      setDonorId(newProfile.id);
      setError(null);
      alert('Your donor profile has been created! You can now use the wishlist feature.');
      
    } catch (err) {
      console.error('Error in handleFixAccount:', err);
      alert('An error occurred while fixing your account');
    } finally {
      setIsFixing(false);
    }
  };

  // Calculate funding percentage
  const getFundingPercentage = (current: number = 0, goal: number) => {
    if (!goal || goal <= 0) return 0;
    return Math.min(100, Math.round((current / goal) * 100));
  };

  // If not logged in, redirect to auth
  if (!user && !loading) {
    router.push('/auth?redirect=/account/wishlist');
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10 px-4">
      <div className="flex items-center mb-8">
        <Link href="/dashboard" className="mr-4">
          <Button variant="ghost" size="icon">
            <ChevronLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-[#0E5D7F]">My Wishlist</h1>
          <p className="text-muted-foreground">
            Projects you've saved for future consideration
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-6">
          <p>{error}</p>
          <div className="mt-4 flex gap-3">
            <Button onClick={() => router.push('/dashboard')}>
              Return to Dashboard
            </Button>
            {error.includes('Donor profile not found') && (
              <Button onClick={handleFixAccount} disabled={isFixing} variant="outline">
                {isFixing ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-b-transparent"></div>
                    Fixing...
                  </>
                ) : (
                  'Fix My Account'
                )}
              </Button>
            )}
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center min-h-[40vh]">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <>
          {projects.length > 0 ? (
            <>
              <div className="flex justify-between items-center mb-6">
                <div className="text-sm text-muted-foreground">
                  {projects.length} {projects.length === 1 ? 'project' : 'projects'} in your wishlist
                </div>
                <Link href="/search">
                  <Button className="gap-2">
                    <Search className="h-4 w-4" />
                    Browse More Projects
                  </Button>
                </Link>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {projects.map((project) => (
                  <Card key={project.id} className={`overflow-hidden transition-all duration-300 hover:shadow-lg ${project._missing ? 'border-dashed border-red-300 bg-red-50' : ''}`}>
                    {/* Project Image */}
                    <div className="relative h-48 bg-gray-100">
                      {project.main_image_url ? (
                        <img 
                          src={project.main_image_url} 
                          alt={project.title} 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-200">
                          {project._missing ? (
                            <div className="text-red-500 text-center p-4">
                              <div className="mb-2">⚠️</div>
                              <div>Project no longer available</div>
                            </div>
                          ) : (
                            <Heart className="h-10 w-10 text-gray-400" />
                          )}
                        </div>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className={`absolute top-2 right-2 ${project._missing ? 'bg-red-200 text-red-700 hover:bg-red-300' : 'bg-white/80 hover:bg-white text-red-500 hover:text-red-600'}`}
                        onClick={() => handleRemoveFromWishlist(project.id, project.wishlist_id)}
                        disabled={isRemoving[project.id]}
                      >
                        {isRemoving[project.id] ? (
                          <div className="h-4 w-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </div>

                    <CardHeader className="pb-2">
                      <CardTitle className="line-clamp-1">
                        {project.title}
                        {project._missing && <span className="text-xs text-red-500 ml-2">(Unavailable)</span>}
                      </CardTitle>
                      <CardDescription className="line-clamp-2">
                        {project._missing 
                          ? 'This project has been removed or is no longer available. You can remove it from your wishlist.'
                          : project.description
                        }
                      </CardDescription>
                    </CardHeader>

                    <CardContent>
                      {project._missing ? (
                        <div className="text-sm text-red-500 py-2">
                          Please remove this item from your wishlist to keep it organized.
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm mb-1">
                            <span>${project.current_amount || project.funded_amount || 0} raised</span>
                            <span>Goal: ${project.funding_goal}</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2.5">
                            <div 
                              className="bg-green-500 h-2.5 rounded-full" 
                              style={{ width: `${getFundingPercentage(project.current_amount || project.funded_amount || 0, project.funding_goal)}%` }}
                            ></div>
                          </div>
                          <div className="text-sm text-gray-500">
                            {getFundingPercentage(project.current_amount || project.funded_amount || 0, project.funding_goal)}% funded
                          </div>
                        </div>
                      )}
                    </CardContent>

                    <CardFooter className="flex justify-between border-t pt-4">
                      {project._missing ? (
                        <Button 
                          variant="destructive" 
                          className="w-full gap-1"
                          onClick={() => handleRemoveFromWishlist(project.id, project.wishlist_id)}
                          disabled={isRemoving[project.id]}
                        >
                          {isRemoving[project.id] ? (
                            <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                          ) : (
                            <Trash2 className="h-4 w-4 mr-2" />
                          )}
                          Remove from Wishlist
                        </Button>
                      ) : (
                        <>
                          <Link href={`/projects/${project.id}`} passHref>
                            <Button variant="outline" className="gap-1">
                              <ExternalLink className="h-4 w-4" />
                              View Details
                            </Button>
                          </Link>
                          <Link href={`/projects/${project.id}#donate`} passHref>
                            <Button className="bg-[#3AB5E9] hover:bg-[#0E5D7F]">
                              Donate
                            </Button>
                          </Link>
                        </>
                      )}
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center p-12 bg-gray-50 rounded-lg shadow-sm">
              <div className="mx-auto mb-6 bg-gray-100 p-5 inline-block rounded-full">
                <Heart className="h-10 w-10 text-[#E96951]" />
              </div>
              <h3 className="text-xl font-medium mb-2">Your Wishlist is Empty</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                You haven't added any projects to your wishlist yet. Browse available projects and save ones you're interested in supporting.
              </p>
              <Link href="/search">
                <Button className="gap-2">
                  <Search className="h-4 w-4" />
                  Browse Projects
                </Button>
              </Link>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// Loading fallback component
function WishlistLoading() {
  return (
    <div className="container mx-auto py-10 px-4">
      <div className="flex items-center mb-8">
        <div className="h-10 w-10 bg-gray-200 rounded-full animate-pulse mr-4"></div>
        <div>
          <div className="h-8 w-40 bg-gray-200 rounded animate-pulse mb-2"></div>
          <div className="h-4 w-60 bg-gray-200 rounded animate-pulse"></div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-xl shadow-md h-80 animate-pulse"></div>
        ))}
      </div>
    </div>
  );
}

// Role check wrapper
function RoleCheckWrapper() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  
  useEffect(() => {
    const checkUserRole = async () => {
      if (isLoading) return;
      
      if (!user) {
        // Not logged in, redirect to auth
        router.push('/auth?redirect=/account/wishlist');
        return;
      }
      
      try {
        // Import the helper to get user role
        const { getUserRole } = await import('@/utils/role-helpers');
        const role = await getUserRole(user);
        
        // Allow only donors to access this page
        if (role !== 'donor') {
          console.log('Non-donor accessing wishlist page. Redirecting...');
          
          if (role === 'admin') {
            router.push('/admin/dashboard');
          } else if (role === 'teacher') {
            router.push('/teacher/dashboard');
          } else {
            router.push('/dashboard');
          }
        }
      } catch (error) {
        console.error('Error checking user role:', error);
      }
    };
    
    checkUserRole();
  }, [user, isLoading, router]);
  
  // Show loading state during auth check
  if (isLoading) {
    return <WishlistLoading />;
  }
  
  // Once we're authenticated and role check is handled by redirection in useEffect,
  // render the actual content
  return <WishlistContent />;
}

// Main export with Suspense
export default function WishlistPage() {
  return (
    <Suspense fallback={<WishlistLoading />}>
      <RoleCheckWrapper />
    </Suspense>
  );
} 