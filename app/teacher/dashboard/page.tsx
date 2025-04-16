"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/AuthProvider"
import { supabase } from "@/utils/supabase"
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardContent, 
  CardFooter 
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { 
  CalendarCheck, 
  BookOpen, 
  Plus, 
  ArrowUpRight, 
  CheckCircle, 
  Clock, 
  Star, 
  Zap, 
  BookPlus, 
  ArrowRight,
  PlusCircle,
  LifeBuoy,
  Eye
} from "lucide-react"
import Link from "next/link"
import { Loader } from "lucide-react"

// Define project type for better TypeScript support
interface Project {
  id: string;
  title: string;
  description: string;
  current_funding?: number;
  funding_goal?: number;
  status: string;
  created_at: string;
  teacher_id?: string;
  end_date?: string;
}

export default function TeacherDashboard() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const [projects, setProjects] = useState<Project[]>([])
  const [isProjectsLoading, setIsProjectsLoading] = useState(true)
  const [isTeacher, setIsTeacher] = useState(false)
  const [isAccessChecked, setIsAccessChecked] = useState(false)
  const [teacherProfileId, setTeacherProfileId] = useState<string | null>(null)
  const [role, setRole] = useState<string | null>(null)
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [error, setError] = useState<string | null>(null)

  // Add an effect to refresh data when the page loads
  useEffect(() => {
    if (teacherProfileId) {
      fetchProjects(teacherProfileId)
    }
  }, [teacherProfileId, refreshTrigger])

  // Redirect if not logged in or not a teacher
  useEffect(() => {
    if (!isLoading) {
      // Not logged in, redirect to auth
      if (!user) {
        router.push('/auth')
        return
      }

      // Check if the user is a teacher based on metadata
      const userRole = user.user_metadata?.role?.toLowerCase()
      if (userRole !== 'teacher') {
        // Redirect non-teachers to the appropriate dashboard
        if (userRole === 'admin') {
          router.push('/admin/dashboard')
        } else {
          router.push('/dashboard')
        }
        setIsTeacher(false)
        setIsAccessChecked(true)
        return
      }
      
      // If we reach here, do a database check for the teacher role
      checkTeacherRole()
    }
  }, [user, isLoading, router])
  
  // Check if user is a teacher in the database and get teacher profile ID
  const checkTeacherRole = async () => {
    if (!user) {
      setIsTeacher(false)
      setIsAccessChecked(true)
      return
    }
    
    try {
      setIsAccessChecked(false)
      
      console.log("Checking teacher access for user:", user.id);
      console.log("User metadata:", user.user_metadata);
      
      // First, check if the user should be a teacher based on metadata
      const userRoleFromMetadata = user.user_metadata?.role?.toLowerCase();
      const isTeacherByMetadata = userRoleFromMetadata === 'teacher';
      
      console.log("Is teacher by metadata:", isTeacherByMetadata);
      
      if (!isTeacherByMetadata) {
        console.log("User is not a teacher according to metadata");
        setIsTeacher(false);
        setIsAccessChecked(true);
        return;
      }
      
      // Get user's app record from users table
      const { data: appUser, error: appUserError } = await supabase
        .from("users")
        .select("*")
        .eq("auth_id", user.id)
        .maybeSingle();
        
      if (appUserError && appUserError.code !== "PGRST116") {
        console.error("Error fetching app user:", appUserError.message || JSON.stringify(appUserError));
      }
      
      let userId = appUser?.id;
      
      // If app user doesn't exist, create one
      if (!appUser) {
        console.log("App user not found, creating one");
        const { data: newUser, error: createUserError } = await supabase
          .from("users")
          .insert({
            auth_id: user.id,
            email: user.email,
            first_name: user.user_metadata?.first_name || '',
            last_name: user.user_metadata?.last_name || '',
            role: 'teacher',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select()
          .single();
          
        if (createUserError) {
          console.error("Error creating app user:", createUserError.message || JSON.stringify(createUserError));
        } else if (newUser) {
          console.log("Created new app user:", newUser);
          userId = newUser.id;
        }
      } else if (appUser.role !== 'teacher') {
        // Update role if needed
        console.log("Updating app user role to teacher");
        const { error: updateError } = await supabase
          .from("users")
          .update({ role: 'teacher', updated_at: new Date().toISOString() })
          .eq("id", appUser.id);
          
        if (updateError) {
          console.error("Error updating app user role:", updateError.message || JSON.stringify(updateError));
        }
      }
      
      // If we couldn't get or create a user ID, we can't proceed
      if (!userId) {
        console.error("Failed to get or create app user ID");
        setIsTeacher(false);
        setIsAccessChecked(true);
        return;
      }
      
      // Now get teacher profile using app user ID
      const { data: teacherProfile, error: teacherError } = await supabase
        .from("teacher_profiles")
        .select("id")
        .eq("user_id", userId)
        .maybeSingle();
      
      if (teacherError && teacherError.code !== "PGRST116") {
        console.error("Error fetching teacher profile:", teacherError.message || JSON.stringify(teacherError));
      }
      
      // If teacher profile exists, use it
      if (teacherProfile) {
        console.log("Teacher profile found:", teacherProfile);
        setTeacherProfileId(teacherProfile.id);
        setIsTeacher(true);
        await fetchProjects(teacherProfile.id);
        setIsAccessChecked(true);
        return;
      }
      
      // Create teacher profile if it doesn't exist
      console.log("Teacher profile not found, creating one");
      const { data: newTeacherProfile, error: createProfileError } = await supabase
        .from("teacher_profiles")
        .insert({
          user_id: userId,
          school_name: "School Name (Update Required)",
          school_address: "School Address (Update Required)",
          school_city: "City (Update Required)",
          school_state: "State (Update Required)",
          school_postal_code: "Postal Code (Update Required)",
          position_title: "Teacher (Update Required)",
          account_status: "pending",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (createProfileError) {
        console.error("Error creating teacher profile:", createProfileError.message || JSON.stringify(createProfileError));
        setIsTeacher(isTeacherByMetadata); // Set based on metadata as fallback
        setTeacherProfileId("not-found");
        setProjects([]);
        setIsProjectsLoading(false);
      } else if (newTeacherProfile) {
        console.log("Created new teacher profile:", newTeacherProfile);
        setTeacherProfileId(newTeacherProfile.id);
        setIsTeacher(true);
        await fetchProjects(newTeacherProfile.id);
      }
      
      setIsAccessChecked(true);
    } catch (error) {
      console.error("Error checking teacher role:", error);
      // For safety, deny access on error
      setIsTeacher(false);
      setIsAccessChecked(true);
      setIsProjectsLoading(false);
    }
  }
  
  // Function to fetch projects for the teacher
  const fetchProjects = async (teacherId: string) => {
    if (!teacherId || teacherId === "not-found") {
      console.log("Invalid teacher ID or no teacher profile:", teacherId);
      setProjects([]);
      setIsProjectsLoading(false);
      return;
    }
    
    setIsProjectsLoading(true);
    console.log("Fetching projects for teacher ID:", teacherId);
    
    try {
      // Fetch projects by teacher ID
      const { data: projects, error } = await supabase
        .from("projects")
        .select("*")
        .eq("teacher_id", teacherId);
      
      if (error) {
        console.error("Error fetching projects:", error.message || JSON.stringify(error));
        throw error;
      }
      
      console.log("Projects fetched for teacher:", projects?.length || 0);
      
      if (projects && projects.length > 0) {
        setProjects(projects);
        setIsProjectsLoading(false);
        return;
      }
      
      console.log("No projects found directly linked to teacher ID, checking teacher profiles");
      
      // If no projects found, try to check teacher profiles for this user
      const { data: user } = await supabase.auth.getUser();
      
      if (user?.user?.id) {
        console.log("Looking up teacher profiles for auth user:", user.user.id);
        
        // Get app user ID from auth ID
        const { data: appUser, error: appUserError } = await supabase
          .from("users")
          .select("id")
          .eq("auth_id", user.user.id)
          .maybeSingle();
          
        if (appUserError) {
          console.error("Error fetching app user:", appUserError.message || JSON.stringify(appUserError));
        }
        
        if (!appUser?.id) {
          console.log("No app user found for auth ID");
          setProjects([]);
          setIsProjectsLoading(false);
          return;
        }
        
        console.log("Found app user:", appUser.id);
          
        // Find teacher profiles for this user
        const { data: teacherProfiles, error: profilesError } = await supabase
          .from("teacher_profiles")
          .select("id")
          .eq("user_id", appUser.id);
        
        if (profilesError) {
          console.error("Error fetching teacher profiles:", profilesError.message || JSON.stringify(profilesError));
          throw profilesError;
        }
        
        console.log("Teacher profiles found:", teacherProfiles?.length || 0);
        
        if (teacherProfiles && teacherProfiles.length > 0) {
          // Query projects for each teacher profile
          let allProjects: any[] = [];
          
          for (const profile of teacherProfiles) {
            console.log("Checking projects for teacher profile:", profile.id);
            const { data: profileProjects, error: projectsError } = await supabase
              .from("projects")
              .select("*")
              .eq("teacher_id", profile.id);
            
            if (projectsError) {
              console.error("Error fetching projects for profile:", projectsError.message || JSON.stringify(projectsError));
            } else if (profileProjects) {
              console.log(`Found ${profileProjects.length} projects for profile ${profile.id}`);
              allProjects = [...allProjects, ...profileProjects];
            }
          }
          
          if (allProjects.length > 0) {
            console.log("Total projects found across all profiles:", allProjects.length);
            setProjects(allProjects);
            setIsProjectsLoading(false);
            return;
          }
        } else if (teacherId !== "not-found") {
          // Try again with the teacherId parameter if it doesn't match our found profiles
          console.log("No projects found for user profiles, trying original teacher ID again");
          const { data: directProjects, error: directError } = await supabase
            .from("projects")
            .select("*")
            .eq("teacher_id", teacherId);
          
          if (directError) {
            console.error("Error in second attempt:", directError.message || JSON.stringify(directError));
          } else if (directProjects && directProjects.length > 0) {
            console.log("Found projects on second direct attempt:", directProjects.length);
            setProjects(directProjects);
            setIsProjectsLoading(false);
            return;
          }
        }
      }
      
      // If we get here, no projects were found
      console.log("No projects found for this teacher after all attempts");
      setProjects([]);
      setIsProjectsLoading(false);
    } catch (err: unknown) {
      console.error("Exception in fetchProjects:", err);
      const errorMessage = err instanceof Error ? err.message : JSON.stringify(err);
      setError("Error fetching projects: " + errorMessage);
      setProjects([]);
      setIsProjectsLoading(false);
    }
  }
  
  // Refresh projects - can be called after creating a project
  const refreshProjects = () => {
    setRefreshTrigger(prev => prev + 1)
  }
  
  // Calculate days left for a project
  const getDaysLeft = (endDate: string | undefined) => {
    if (!endDate) return 'No deadline'
    
    const end = new Date(endDate)
    const today = new Date()
    const diffTime = end.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    return diffDays > 0 ? `${diffDays} days left` : 'Ended'
  }

  // Create a sample project directly from the dashboard
  const createSampleProject = async () => {
    if (!user || !teacherProfileId || teacherProfileId === "not-found") {
      alert("Cannot create a sample project without a valid teacher profile");
      return;
    }
    
    try {
      setIsProjectsLoading(true);
      
      console.log("Creating sample project for teacher profile:", teacherProfileId);
      
      // Create a sample project directly
      const { data: project, error } = await supabase
        .from("projects")
        .insert({
          teacher_id: teacherProfileId,
          title: "Sample Classroom Project",
          description: "This is a sample project created for testing the teacher dashboard.",
          funding_goal: 750,
          current_amount: 250,
          status: "active",
          student_impact: "This sample project will help demonstrate how the dashboard works.",
          start_date: new Date().toISOString(),
          end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
          main_image_url: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?q=80&w=1000",
          published_at: new Date().toISOString()
        })
        .select();
      
      if (error) {
        console.error("Error creating sample project:", error);
        alert("Failed to create sample project: " + error.message);
        setIsProjectsLoading(false);
        return;
      }
      
      console.log("Sample project created:", project);
      
      // Refresh projects
      refreshProjects();
      alert("Sample project created successfully!");
    } catch (error: any) {
      console.error("Exception creating sample project:", error);
      alert("An error occurred: " + error.message);
      setIsProjectsLoading(false);
    }
  };

  // Show loading spinner while checking access
  if (!isAccessChecked || isLoading) {
    return (
      <div className="container mx-auto py-10">
        <div className="flex justify-center items-center min-h-[60vh]">
          <Loader className="animate-spin h-8 w-8 text-blue-500" />
        </div>
      </div>
    )
  }

  // Show access denied if not a teacher
  if (!isTeacher) {
    return (
      <div className="container mx-auto py-10">
        <div className="max-w-4xl mx-auto bg-white p-8 rounded-lg shadow-md">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
          <p className="text-gray-700 mb-4">
            You do not have permission to access the teacher dashboard. This area is restricted to verified teachers only.
          </p>
          <p className="text-gray-700 mb-6">
            If you are a teacher and believe this is an error, please contact support.
          </p>
          <Link href="/" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 inline-block">
            Return to Home
          </Link>
        </div>
      </div>
    )
  }

  // Render the teacher dashboard
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="grid grid-cols-1 gap-6">
        {/* Header with welcome message */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
          <div>
            <h1 className="text-3xl font-bold text-[#0E5D7F] tracking-tight">Teacher Dashboard</h1>
            <p className="text-muted-foreground mt-1 font-inter">
              Welcome back, {user?.user_metadata?.first_name || user?.email?.split('@')[0] || 'Teacher'}!
            </p>
          </div>
          <Button className="mt-4 md:mt-0 bg-[#E96951] hover:bg-[#E96951]/90">
            <Link href="/teacher/projects/create" className="flex items-center gap-2">
              <Plus size={16} />
              <span>Create New Project</span>
            </Link>
          </Button>
        </div>

        {/* Stats overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
          <Card className="bg-[#F8F9FA] border-[#E5E7EB]">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-[#0E5D7F]">Total Projects</CardTitle>
              <BookOpen className="h-4 w-4 text-[#3AB5E9]" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{projects.length || 0}</div>
              <p className="text-xs text-muted-foreground font-inter">
                {projects.filter(p => p.status === 'active').length || 0} active
              </p>
            </CardContent>
          </Card>
          <Card className="bg-[#F8F9FA] border-[#E5E7EB]">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-[#0E5D7F]">Funds Raised</CardTitle>
              <Star className="h-4 w-4 text-[#E96951]" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${projects.reduce((sum, p) => sum + (p.current_funding || 0), 0).toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground font-inter">
                ${projects.reduce((sum, p) => sum + (p.funding_goal || 0), 0).toLocaleString()} goal
              </p>
            </CardContent>
          </Card>
          <Card className="bg-[#F8F9FA] border-[#E5E7EB]">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-[#0E5D7F]">Funded Projects</CardTitle>
              <CheckCircle className="h-4 w-4 text-[#A8BF87]" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {projects.filter(p => p.status === 'funded').length || 0}
              </div>
              <p className="text-xs text-muted-foreground font-inter">
                {Math.round((projects.filter(p => p.status === 'funded').length / Math.max(projects.length, 1)) * 100)}% success rate
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Projects section */}
        <div className="mt-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-[#0E5D7F] tracking-tight">Your Projects</h2>
            <div className="flex items-center gap-3">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={refreshProjects}
                className="flex items-center gap-1 text-[#0E5D7F] hover:text-[#0E5D7F]/80 font-inter"
              >
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className="h-4 w-4" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" 
                  />
                </svg>
                Refresh
              </Button>
              <Link href="/teacher/projects" className="text-[#0E5D7F] hover:text-[#0E5D7F]/80 flex items-center gap-1 text-sm font-medium font-inter">
                See All
                <ArrowRight size={14} />
              </Link>
            </div>
          </div>
          
          {isProjectsLoading ? (
            <div className="flex items-center justify-center h-40">
              <Loader className="animate-spin h-8 w-8 text-[#0E5D7F]" />
            </div>
          ) : projects.length === 0 ? (
            <div>
              <Card className="bg-yellow-50 border-yellow-200 mb-6 p-4">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg text-amber-900">No Projects Found</CardTitle>
                </CardHeader>
                <CardContent className="pb-2">
                  <p className="text-amber-700 mb-3">
                    It looks like there are no projects in your account. This could be because:
                  </p>
                  <ul className="list-disc pl-5 space-y-1 text-amber-700 mb-4">
                    <li>The database tables haven't been set up correctly</li>
                    <li>You haven't created any projects yet</li>
                    <li>There was an error fetching your projects</li>
                  </ul>
                  <p className="text-amber-700">
                    You can use our setup demo page to automatically create the necessary database tables 
                    and a sample project.
                  </p>
                </CardContent>
                <CardFooter>
                  <Link href="/setup-demo">
                    <Button className="bg-amber-600 hover:bg-amber-700">
                      Setup Demo Project
                    </Button>
                  </Link>
                </CardFooter>
              </Card>

              <Card className="bg-[#F8F9FA] border-[#E5E7EB] p-8 text-center">
                <BookPlus className="mx-auto h-12 w-12 text-muted-foreground opacity-50 mb-4" />
                <h3 className="text-lg font-semibold mb-2">No projects yet</h3>
                <p className="text-muted-foreground mb-4">Create your first project to start fundraising for your classroom.</p>
                <div className="space-y-3">
                  <Button className="bg-[#E96951] hover:bg-[#E96951]/90 w-full">
                    <Link href="/teacher/projects/create" className="flex items-center gap-2">
                      <Plus size={16} />
                      <span>Create New Project</span>
                    </Link>
                  </Button>
                  
                  <Button 
                    onClick={createSampleProject} 
                    variant="outline" 
                    className="w-full border-[#0E5D7F] text-[#0E5D7F] hover:bg-[#0E5D7F]/10"
                  >
                    <Zap size={16} className="mr-2" />
                    Create Sample Project
                  </Button>
                </div>
              </Card>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map((project) => (
                <Card key={project.id} className="overflow-hidden">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg font-bold truncate tracking-tight">{project.title}</CardTitle>
                        <CardDescription className="mt-1 line-clamp-2 font-inter">{project.description}</CardDescription>
                      </div>
                      {project.status === 'funded' ? (
                        <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full font-inter">
                          Funded
                        </span>
                      ) : (
                        <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full font-inter">
                          {getDaysLeft(project.end_date)}
                        </span>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="pb-3">
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <div className="flex justify-between text-sm font-inter">
                          <span>${project.current_funding || 0} raised</span>
                          <span>${project.funding_goal || 0} goal</span>
                        </div>
                        <Progress 
                          value={((project.current_funding || 0) / (project.funding_goal || 1)) * 100} 
                          className="h-2 bg-slate-200"
                        />
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button variant="outline" className="w-full text-[#0E5D7F] border-[#0E5D7F] hover:bg-[#0E5D7F]/5">
                      <Link href={`/teacher/projects/${project.id}`} className="flex items-center gap-2 w-full justify-center">
                        Manage Project
                        <ArrowUpRight size={16} />
                      </Link>
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Quick links section */}
        <div className="mt-8">
          <h2 className="text-2xl font-bold text-[#0E5D7F] mb-4">Quick Links</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-[#0E5D7F]">Create a Project</CardTitle>
                <CardDescription>Start a new fundraising campaign</CardDescription>
              </CardHeader>
              <CardContent className="pb-3">
                <p className="text-sm text-muted-foreground">
                  Set up a new project to fund classroom needs, from supplies to field trips.
                </p>
              </CardContent>
              <CardFooter>
                <Button className="w-full bg-[#E96951] hover:bg-[#E96951]/90">
                  <Link href="/teacher/projects/create" className="flex items-center gap-2 w-full justify-center">
                    <Plus size={16} />
                    <span>Create Project</span>
                  </Link>
                </Button>
              </CardFooter>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-[#0E5D7F]">Learning Resources</CardTitle>
                <CardDescription>Teaching materials and guides</CardDescription>
              </CardHeader>
              <CardContent className="pb-3">
                <p className="text-sm text-muted-foreground">
                  Explore our collection of teacher resources and professional development materials.
                </p>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full text-[#0E5D7F] border-[#0E5D7F] hover:bg-[#0E5D7F]/5">
                  <Link href="/resources" className="flex items-center gap-2 w-full justify-center">
                    Browse Resources
                  </Link>
                </Button>
              </CardFooter>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-[#0E5D7F]">Support Center</CardTitle>
                <CardDescription>Get help with your projects</CardDescription>
              </CardHeader>
              <CardContent className="pb-3">
                <p className="text-sm text-muted-foreground">
                  Find answers to common questions or contact our support team for assistance.
                </p>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full text-[#0E5D7F] border-[#0E5D7F] hover:bg-[#0E5D7F]/5">
                  <Link href="/support" className="flex items-center gap-2 w-full justify-center">
                    Get Support
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
} 