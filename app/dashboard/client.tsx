'use client';

import { useEffect, useState, Suspense } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuth } from "@/components/AuthProvider"
import { supabase } from "@/utils/supabase"
import Link from "next/link"

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

  // Check user role and redirect - first render priority
  useEffect(() => {
    if (!isLoading && user) {
      // Get user role with fallback
      const role = String(user.user_metadata?.role || '').toLowerCase()
      setUserRole(role)
      
      console.log("Dashboard: User role check:", {
        email: user.email,
        role: role,
        metadata: user.user_metadata
      })
      
      // Set redirecting state to prevent dashboard from showing 
      // while waiting for navigation
      if (role === 'admin' || role === 'teacher') {
        setRedirecting(true)
        
        // Use timeout to ensure we set the state before redirect
        setTimeout(() => {
          if (role === 'admin') {
            console.log("Dashboard: Redirecting admin to admin dashboard")
            window.location.href = '/admin/dashboard'
          } else if (role === 'teacher') {
            console.log("Dashboard: Redirecting teacher to teacher dashboard")
            window.location.href = '/teacher/dashboard'
          }
        }, 100)
        return
      }
      
      // Only donors or undefined roles get here
      console.log("Dashboard: User authorized as donor")
      setIsAuthorized(true)
    } else if (!isLoading && !user) {
      console.log("Dashboard: No user found, redirecting to auth")
      router.push('/auth')
    }
  }, [user, isLoading, router])

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

  // Fetch projects only if user is authorized
  useEffect(() => {
    async function fetchProjects() {
      if (!user || !isAuthorized) return
      
      try {
        setLoading(true)
        const { data, error } = await supabase
          .from('projects')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
        
        if (error) {
          console.error('Error fetching projects:', error)
          throw error
        }
        
        setProjects(data || [])
      } catch (error) {
        console.error('Error fetching projects:', error)
      } finally {
        setLoading(false)
      }
    }

    if (user && isAuthorized) {
      fetchProjects()
    }
  }, [user, isAuthorized])

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

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="projects">My Projects</TabsTrigger>
            <TabsTrigger value="account">Account</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-navy">Projects</CardTitle>
                  <CardDescription>You have {projects.length} active projects</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-salmon">{projects.length}</div>
                </CardContent>
                <CardFooter>
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => router.push('/projects/create')}
                  >
                    Create New Project
                  </Button>
                </CardFooter>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-navy">Total Funded</CardTitle>
                  <CardDescription>Amount received for your projects</CardDescription>
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
                    onClick={() => router.push('/projects')}
                  >
                    View All Projects
                  </Button>
                </CardFooter>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-navy">Help & Support</CardTitle>
                  <CardDescription>Get assistance with your projects</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Need help with your projects or have questions about using Beyond Measure?
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
          
          <TabsContent value="projects">
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-navy">Your Projects</h2>
                <Button onClick={() => router.push('/projects/create')}>Create Project</Button>
              </div>
              
              {loading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : projects.length > 0 ? (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {projects.map((project) => (
                    <Card key={project.id} className="overflow-hidden">
                      <CardHeader className="p-0">
                        <div className="h-40 bg-gray-100 relative">
                          {/* Project Image would go here */}
                        </div>
                      </CardHeader>
                      <CardContent className="p-6">
                        <CardTitle>{project.title || 'Untitled Project'}</CardTitle>
                        <CardDescription className="line-clamp-2 h-10">
                          {project.description || 'No description provided'}
                        </CardDescription>
                        <div className="mt-2">
                          <div className="flex justify-between text-sm mb-1">
                            <span>Progress</span>
                            <span>{Math.round((project.funded_amount || 0) / (project.funding_goal || 1) * 100)}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2.5">
                            <div 
                              className="bg-green-500 h-2.5 rounded-full" 
                              style={{ width: `${Math.min(100, Math.round((project.funded_amount || 0) / (project.funding_goal || 1) * 100))}%` }}
                            ></div>
                          </div>
                        </div>
                      </CardContent>
                      <CardFooter className="bg-gray-50 px-6 py-3">
                        <Button 
                          variant="outline"
                          className="w-full"
                          onClick={() => router.push(`/projects/${project.id}`)}
                        >
                          View Details
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center p-12 bg-gray-50 rounded-lg">
                  <h3 className="text-lg font-medium mb-2">No Projects Yet</h3>
                  <p className="text-muted-foreground mb-6">
                    You haven't created any projects yet. Start by creating your first project.
                  </p>
                  <Button onClick={() => router.push('/projects/create')}>
                    Create Your First Project
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
    <Suspense fallback={<DashboardLoading />}>
      <DashboardInnerContent />
    </Suspense>
  );
} 