'use client';

import { useEffect, useState, Suspense } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuth } from "@/components/AuthProvider"
import { supabase, getWishlistCount } from "@/utils/supabase"
import Link from "next/link"
import { Heart, HeartOff } from "lucide-react"
import { createClient } from '@/utils/supabase/client'
import { useSearchParams } from 'next/navigation'
import { createDonorProfile } from '@/utils/supabase'

// Add CSS animation using style tag
const heartPulseAnimation = `
@keyframes heartPulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.3); }
  100% { transform: scale(1); }
}

.heart-btn {
  transition: all 0.2s ease;
}

.heart-btn:hover {
  transform: scale(1.1);
}

.heart-btn.active {
  color: #e11d48;
  fill: #e11d48;
}

.heart-pulse {
  animation: heartPulse 0.4s ease-in-out;
}
`;

// Internal component that safely uses searchParams
function DashboardInnerContent() {
  // Dynamically import useSearchParams to ensure proper Suspense handling
  const { useSearchParams } = require('next/navigation');
  const searchParams = useSearchParams();
  
  return <DashboardContent searchParams={searchParams} />;
}

// Content component that doesn't directly use useSearchParams
function DashboardContent({ searchParams }: { searchParams: any }) {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const [projects, setProjects] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isAuthorized, setIsAuthorized] = useState(false)
  const [redirecting, setRedirecting] = useState(false)
  const [userRole, setUserRole] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('overview')
  const [wishlistCount, setWishlistCount] = useState(0)
  const [refreshKey, setRefreshKey] = useState(0)
  
  // Direct wishlist count function that bypasses all caching
  const getDirectWishlistCount = async (userId: string): Promise<number> => {
    console.log('DIRECT COUNT: Starting direct wishlist count for user', userId);
    try {
      // Step 1: Get user database ID
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('auth_id', userId)
        .maybeSingle();
      
      if (userError) {
        console.error('DIRECT COUNT: Error getting user data:', userError);
        return 0;
      }
      
      if (!userData) {
        console.error('DIRECT COUNT: User not found in database, userId:', userId);
        return 0;
      }
      
      console.log('DIRECT COUNT: Found user record:', userData.id);
      
      // Step 2: Get donor profile
      const { data: donorData, error: donorError } = await supabase
        .from('donor_profiles')
        .select('id')
        .eq('user_id', userData.id)
        .maybeSingle();
      
      if (donorError && donorError.code !== 'PGRST116') {
        console.error('DIRECT COUNT: Error getting donor profile:', donorError);
        return 0;
      }
      
      if (!donorData) {
        console.log('DIRECT COUNT: No donor profile found for user:', userData.id);
        return 0;
      }
      
      console.log('DIRECT COUNT: Found donor profile:', donorData.id);
      
      // Step 3: Direct raw SQL count (most reliable)
      const { data: rawCountData, error: rawCountError } = await supabase.rpc(
        'count_donor_wishlists',
        { donor_id_param: donorData.id }
      );
      
      if (rawCountError) {
        console.error('DIRECT COUNT: Error with count RPC function:', rawCountError);
        
        // Fall back to regular count
        const { count, error: countError } = await supabase
          .from('donor_wishlists')
          .select('*', { count: 'exact', head: true })
          .eq('donor_id', donorData.id);
        
        if (countError) {
          console.error('DIRECT COUNT: Error counting wishlist items:', countError);
          return 0;
        }
        
        console.log('DIRECT COUNT: Direct count from regular query:', count);
        return count || 0;
      }
      
      console.log('DIRECT COUNT: Raw count from RPC:', rawCountData);
      return rawCountData || 0;
    } catch (error) {
      console.error('DIRECT COUNT: Unexpected error in direct count:', error);
      return 0;
    }
  };

  // Handle tab selection from URL parameter
  useEffect(() => {
    // Check if there's a tab parameter in the URL
    if (searchParams?.tab) {
      const validTabs = ['overview', 'wishlist', 'funded', 'account'];
      const requestedTab = searchParams.tab.toLowerCase();
      
      // Only set if it's a valid tab
      if (validTabs.includes(requestedTab)) {
        setActiveTab(requestedTab);
      }
    }
  }, [searchParams]);

  // Add effect to check for navigation events - refresh data when returning to the page
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

  // Check user role and redirect - first render priority
  useEffect(() => {
    if (!isLoading && user) {
      // Use the new role helper instead of just metadata
      const checkRole = async () => {
        try {
          // Import the getUserRole function
          const { getUserRole } = await import('@/utils/role-helpers');
          const role = await getUserRole(user);
          setUserRole(role);
          
          console.log("Dashboard: User role check:", {
            email: user.email,
            role: role,
            metadata: user.user_metadata
          });
          
          // Set redirecting state to prevent dashboard from showing 
          // while waiting for navigation
          if (role === 'admin' || role === 'teacher') {
            setRedirecting(true);
            
            // Use timeout to ensure we set the state before redirect
            setTimeout(() => {
              if (role === 'admin') {
                console.log("Dashboard: Redirecting admin to admin dashboard");
                window.location.href = '/admin/dashboard';
              } else if (role === 'teacher') {
                console.log("Dashboard: Redirecting teacher to teacher dashboard");
                window.location.href = '/teacher/dashboard';
              }
            }, 100);
            return;
          }
          
          // Only donors or undefined roles get here
          console.log("Dashboard: User authorized as donor");
          setIsAuthorized(true);
        } catch (error) {
          console.error("Error checking user role:", error);
          // Default to donor role as fallback
          setUserRole('donor');
          setIsAuthorized(true);
        }
      };
      
      checkRole();
    } else if (!isLoading && !user) {
      console.log("Dashboard: No user found, redirecting to auth");
      router.push('/auth');
    }
  }, [user, isLoading, router]);

  // Fetch projects only if user is authorized
  useEffect(() => {
    async function fetchProjects() {
      if (!user || !isAuthorized) return;
      
      try {
        setLoading(true);
        console.log("Fetching actual wishlist projects");
        
        // Get user database ID
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('id')
          .eq('auth_id', user.id)
          .maybeSingle();
        
        if (userError || !userData) {
          console.error('Error fetching user data:', userError);
          throw new Error('User not found');
        }
        
        // Get donor profile
        const { data: donorData, error: donorError } = await supabase
          .from('donor_profiles')
          .select('id')
          .eq('user_id', userData.id)
          .maybeSingle();
        
        if (donorError && donorError.code !== 'PGRST116') {
          console.error('Error fetching donor profile:', donorError);
          throw new Error('Error fetching donor profile');
        }
        
        // If no donor profile, attempt to create one instead of showing empty wishlist
        if (!donorData) {
          console.log('No donor profile found. Attempting to create one...');
          
          try {
            // Import the createDonorProfile function
            const { createDonorProfile } = await import('@/utils/supabase');
            const result = await createDonorProfile(user.id);
            
            if (result.success && result.donorProfile) {
              console.log('Successfully created donor profile:', result.donorProfile);
              
              // Fetch wishlist with the new donor profile
              const { data: wishlistData, error: wishlistError } = await supabase
                .from('donor_wishlists')
                .select(`
                  id,
                  project_id,
                  projects (*)
                `)
                .eq('donor_id', result.donorProfile.id);
              
              if (wishlistError) {
                console.error('Error fetching wishlist after creating donor profile:', wishlistError);
                throw new Error('Error fetching wishlist');
              }
              
              // Set the projects from the wishlist
              if (wishlistData && wishlistData.length > 0) {
                setProjects(wishlistData.map(item => item.projects));
                setWishlistCount(wishlistData.length);
              } else {
                setProjects([]);
                setWishlistCount(0);
              }
              
              setLoading(false);
              return;
            } else {
              console.error('Failed to create donor profile:', result.error);
              setProjects([]);
              setWishlistCount(0);
              setLoading(false);
              return;
            }
          } catch (createError) {
            console.error('Error creating donor profile:', createError);
            setProjects([]);
            setWishlistCount(0);
            setLoading(false);
            return;
          }
        }
        
        // Fetch actual wishlist items
        const { data: wishlistData, error: wishlistError } = await supabase
          .from('donor_wishlists')
          .select(`
            id,
            project_id,
            projects (*)
          `)
          .eq('donor_id', donorData.id);
        
        if (wishlistError) {
          console.error('Error fetching wishlist:', wishlistError);
          throw new Error('Error fetching wishlist');
        }
        
        // Double-check with a direct count query for accuracy
        const { count: directCount, error: countError } = await supabase
          .from('donor_wishlists')
          .select('*', { count: 'exact', head: true })
          .eq('donor_id', donorData.id);
          
        if (countError) {
          console.error('Error in direct count query:', countError);
        } else {
          console.log(`Direct count query shows ${directCount} wishlist items`);
        }
        
        // Set the wishlist count using the most reliable method
        const actualCount = directCount ?? wishlistData?.length ?? 0;
        console.log(`Setting wishlist count to ${actualCount} (from direct count: ${directCount}, from data: ${wishlistData?.length})`);
        setWishlistCount(actualCount);
        
        // Process the wishlist items
        if (wishlistData && wishlistData.length > 0) {
          console.log('Wishlist data details:', wishlistData.map(item => ({
            id: item.id,
            project_id: item.project_id,
            hasProject: !!item.projects
          })));
          
          const projectsData = wishlistData
            .filter(item => item.projects) // Only include items with valid projects
            .map(item => ({
              ...item.projects,
              wishlist_id: item.id
            }));
          
          console.log(`Found ${projectsData.length} valid projects in wishlist`);
          setProjects(projectsData);
        } else {
          // No wishlist items found
          console.log('No valid wishlist items found');
          setProjects([]);
        }
      } catch (error) {
        console.error('Error in fetchProjects:', error);
        setProjects([]);
        setWishlistCount(0);
      } finally {
        setLoading(false);
      }
    }

    if (user && isAuthorized) {
      fetchProjects();
    }
  }, [user, isAuthorized, refreshKey]);

  // Add wishlist redirect effect here with other hooks
  useEffect(() => {
    if (activeTab === 'wishlist' && typeof window !== 'undefined') {
      router.push('/account/wishlist');
    }
  }, [activeTab, router]);

  // Use the direct wishlist count for accuracy
  useEffect(() => {
    async function fetchWishlistCount() {
      if (!user || !isAuthorized) return;
      
      console.log('⭐️ DASHBOARD: Fetching wishlist count for user:', user.id);
      console.log('⭐️ Current state:', {
        userAuthenticated: !!user,
        isUserAuthorized: isAuthorized,
        refreshKey,
        currentWishlistCount: wishlistCount
      });
      
      try {
        // Force localStorage clear
        if (typeof window !== 'undefined') {
          console.log('⭐️ Clearing all localStorage wishlist data');
          localStorage.removeItem(`wishlist_count_${user.id}`);
          localStorage.removeItem(`wishlist_${user.id}`);
          localStorage.setItem('last_wishlist_fetch', Date.now().toString());
        }
        
        // Get precise count directly from database, bypassing all caching mechanisms
        const directCount = await getDirectWishlistCount(user.id);
        console.log('⭐️ Direct database count result:', directCount);
        
        // Set the count in state
        setWishlistCount(directCount);
        
        // Store in localStorage for other components
        if (typeof window !== 'undefined') {
          localStorage.setItem(`wishlist_count_${user.id}`, directCount.toString());
          console.log('⭐️ Updated localStorage wishlist count to:', directCount);
        }
      } catch (error) {
        console.error('⭐️ Error in fetchWishlistCount:', error);
        setWishlistCount(0);
      }
    }
    
    fetchWishlistCount();
  }, [user, isAuthorized, refreshKey]);

  // Don't show full dashboard if user is admin/teacher
  if (userRole === 'admin' || userRole === 'teacher') {
    return (
      <div className="container mx-auto py-10 px-4">
        <div className="bg-white rounded-lg shadow-md p-8">
          <h1 className="text-2xl font-bold text-center mb-6">
            {userRole === 'admin' ? 'Admin Access Detected' : 'Teacher Access Detected'}
          </h1>
          
          <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-6">
            <p className="text-blue-800">
              You appear to be a {userRole}, but you're seeing the regular dashboard. This could indicate an issue with your account permissions.
            </p>
          </div>
          
          {/* Add donor role fix link for users who should be donors */}
          {userRole === 'teacher' && user?.user_metadata?.role === 'donor' && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-6">
              <h3 className="text-yellow-800 font-medium mb-2">Role Mismatch Detected</h3>
              <p className="text-yellow-700 mb-3">
                Your auth metadata shows you should be a donor, but your database role is showing as teacher.
                This can happen during registration or profile setup. We can help fix this.
              </p>
              <a 
                href="/fix-donor-role" 
                className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-3 px-6 rounded-lg w-full md:w-auto text-center inline-block"
              >
                Fix My Donor Role
              </a>
            </div>
          )}
          
          <div className="flex flex-col space-y-4 items-center">
            <a 
              href={userRole === 'admin' ? '/admin/dashboard' : '/teacher/dashboard'} 
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg w-full md:w-auto text-center"
            >
              Go to {userRole === 'admin' ? 'Admin' : 'Teacher'} Dashboard
            </a>
            
            <a 
              href="/role-debug" 
              className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-3 px-6 rounded-lg w-full md:w-auto text-center"
            >
              Debug Role Issues
            </a>
            
            <button
              onClick={() => {
                if (userRole === 'admin') {
                  window.location.href = '/admin/dashboard'
                } else {
                  window.location.href = '/teacher/dashboard'
                }
              }}
              className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-lg w-full md:w-auto"
            >
              Force Redirect
            </button>
          </div>
        </div>
      </div>
    )
  }

  // EARLY RETURN: Show loading for non-authorized users or during redirects
  if (isLoading || redirecting || !isAuthorized) {
    return (
      <div className="container mx-auto py-10">
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    )
  }

  // At this point we know:
  // 1. User is authenticated
  // 2. User is not an admin or teacher (otherwise would have redirected)
  // 3. User is authorized to view this dashboard
  
  return (
    <div className="container mx-auto py-10">
      <div className="flex flex-col gap-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-navy">Donor Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, {user?.user_metadata?.name || user?.email || 'User'}
          </p>
        </div>

        <Tabs defaultValue={activeTab} value={activeTab} className="w-full" onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="wishlist" className="text-primary hover:bg-primary/10">
              My Wishlist
            </TabsTrigger>
            <TabsTrigger value="funded">Funded Projects</TabsTrigger>
            <TabsTrigger value="account">Account</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-navy">My Wishlist</CardTitle>
                  <CardDescription>Projects you're interested in supporting</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-center">
                    <div className="text-3xl font-bold text-salmon">
                      {wishlistCount !== undefined ? wishlistCount : '...'}
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => router.push('/search')}
                  >
                    Browse Projects
                  </Button>
                </CardFooter>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-navy">Total Donated</CardTitle>
                  <CardDescription>Amount you've contributed to projects</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-grass">
                    ${projects.reduce((total, project) => total + (project.funded_amount || 0), 0).toFixed(2)}
                  </div>
                </CardContent>
                <CardFooter>
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => router.push('/donations')}
                  >
                    View Donation History
                  </Button>
                </CardFooter>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-navy">Help & Support</CardTitle>
                  <CardDescription>Get assistance with donations</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Need help with donations or have questions about using Beyond Measure?
                  </p>
                </CardContent>
                <CardFooter>
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => router.push('/contact')}
                  >
                    Contact Support
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="wishlist">
            <div className="flex items-center justify-center h-64">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
              <span className="ml-3">Redirecting to wishlist...</span>
            </div>
          </TabsContent>
          
          <TabsContent value="funded">
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-navy">Projects You've Funded</h2>
                <Button onClick={() => router.push('/search')}>Find More Projects</Button>
              </div>
              
              {loading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : projects.length > 0 ? (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {/* Same project cards as above can go here */}
                  <div className="text-center p-12 bg-gray-50 rounded-lg col-span-full">
                    <h3 className="text-lg font-medium mb-2">Donation History Coming Soon</h3>
                    <p className="text-muted-foreground mb-6">
                      We're still working on this feature. Check back soon to see all the projects you've supported!
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center p-12 bg-gray-50 rounded-lg">
                  <h3 className="text-lg font-medium mb-2">No Funded Projects Yet</h3>
                  <p className="text-muted-foreground mb-6">
                    You haven't donated to any projects yet. Browse available projects to find ones you'd like to support.
                  </p>
                  <Button onClick={() => router.push('/search')}>
                    Browse Projects
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="account">
            <Card>
              <CardHeader>
                <CardTitle>Account Information</CardTitle>
                <CardDescription>View and manage your account details</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium mb-1">Email</p>
                    <p className="bg-gray-100 p-2 rounded">{user?.email}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium mb-1">Role</p>
                    <p className="bg-gray-100 p-2 rounded capitalize">{userRole || 'donor'}</p>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex flex-wrap gap-2">
                <Button 
                  variant="outline"
                  onClick={() => router.push('/profile')}
                >
                  Edit Profile
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => router.push('/profile/avatar')}
                >
                  Change Avatar
                </Button>
                <Button 
                  variant="destructive"
                  onClick={async () => {
                    await supabase.auth.signOut();
                    router.push('/');
                  }}
                >
                  Sign Out
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

// Loading fallback component
function DashboardLoading() {
  return (
    <div className="container mx-auto py-10">
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    </div>
  );
}

// Main dashboard component that wraps the searchParams handler with Suspense
export default function DashboardClient() {
  return (
    <>
      <style jsx global>{heartPulseAnimation}</style>
      <Suspense fallback={<DashboardLoading />}>
        <DashboardInnerContent />
      </Suspense>
    </>
  );
} 