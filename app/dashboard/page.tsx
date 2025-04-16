"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuth } from "@/components/AuthProvider"
import { supabase } from "@/utils/supabase"
import Link from "next/link"

export default function Dashboard() {
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
                      <div className="h-48 bg-sky/10"></div>
                      <CardHeader>
                        <CardTitle className="text-navy">{project.title}</CardTitle>
                        <CardDescription>{project.subject}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {project.description}
                        </p>
                        <div className="mt-4 space-y-2">
                          <div className="flex justify-between items-center text-sm">
                            <span>Funding Goal:</span>
                            <span className="font-medium">${project.funding_goal}</span>
                          </div>
                          <div className="flex justify-between items-center text-sm">
                            <span>Funded:</span>
                            <span className="font-medium">${project.funded_amount || 0}</span>
                          </div>
                        </div>
                      </CardContent>
                      <CardFooter>
                        <Button 
                          variant="outline" 
                          className="w-full"
                          onClick={() => router.push(`/projects/${project.id}`)}
                        >
                          View Project
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle>No Projects Yet</CardTitle>
                    <CardDescription>Create your first project to get started</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      Projects allow you to connect with donors and get funding for your classroom needs.
                    </p>
                  </CardContent>
                  <CardFooter>
                    <Button onClick={() => router.push('/projects/create')}>Create Your First Project</Button>
                  </CardFooter>
                </Card>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="account">
            <Card>
              <CardHeader>
                <CardTitle>Account Information</CardTitle>
                <CardDescription>Manage your account details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1">
                  <p className="text-sm font-medium">Email</p>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium">Name</p>
                  <p className="text-sm text-muted-foreground">{user.user_metadata?.name || 'Not set'}</p>
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => router.push('/account')}
                >
                  Edit Profile
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
