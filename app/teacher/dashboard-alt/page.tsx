'use client';

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/utils/supabase";
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardContent, 
  CardFooter 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  BookOpen, 
  Plus, 
  ArrowUpRight, 
  ArrowRight,
  BookPlus,
  Star,
  CheckCircle,
  Loader
} from "lucide-react";
import Link from "next/link";

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

// Mock projects data for fallback
const MOCK_PROJECTS = [
  {
    id: "mock-1",
    title: "Classroom Science Kits",
    description: "Provide interactive science kits for hands-on learning experiences.",
    current_funding: 750,
    funding_goal: 1500,
    status: "active",
    created_at: new Date().toISOString(),
    teacher_id: "mock-teacher-id",
    end_date: new Date(Date.now() + 30*24*60*60*1000).toISOString() // 30 days from now
  },
  {
    id: "mock-2",
    title: "Art Supplies for Creative Expression",
    description: "Stock our art corner with supplies for student creativity and expression.",
    current_funding: 850,
    funding_goal: 1000,
    status: "active",
    created_at: new Date().toISOString(),
    teacher_id: "mock-teacher-id",
    end_date: new Date(Date.now() + 15*24*60*60*1000).toISOString() // 15 days from now
  },
  {
    id: "mock-3",
    title: "Digital Learning Tablets",
    description: "Provide tablets for interactive digital learning activities in the classroom.",
    current_funding: 2000,
    funding_goal: 2000,
    status: "funded",
    created_at: new Date().toISOString(),
    teacher_id: "mock-teacher-id",
    end_date: new Date(Date.now() - 5*24*60*60*1000).toISOString() // 5 days ago
  }
];

// Define type for debug state to fix implicit any errors
type DebugState = Record<string, unknown>;

export default function AlternativeTeacherDashboard() {
  const { user } = useAuth();
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [isProjectsLoading, setIsProjectsLoading] = useState(true);
  const [isTeacher, setIsTeacher] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [debug, setDebug] = useState<DebugState>({});
  const [errorMessages, setErrorMessages] = useState<string[]>([]);
  const [showMockData, setShowMockData] = useState(false);
  const [teacherProfile, setTeacherProfile] = useState<any>(null);

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.push('/auth');
        return;
      }

      checkTeacherRole();
    }
  }, [user, isLoading, router]);
  
  const checkTeacherRole = async () => {
    try {
      setErrorMessages([]);
      setIsLoading(true);
      
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error("Error checking session:", sessionError);
        setDebug((prev: DebugState) => ({ ...prev, sessionError }));
        setErrorMessages((prev: string[]) => [...prev, `Session error: ${sessionError.message}`]);
        setIsTeacher(false);
        setIsLoading(false);
        return false;
      }
      
      if (!session) {
        console.log("No active session found");
        setDebug((prev: DebugState) => ({ ...prev, noSession: true }));
        setErrorMessages((prev: string[]) => [...prev, "No active session found. Please log in."]);
        setIsTeacher(false);
        setIsLoading(false);
        return false;
      }
      
      const { data: userData, error: userError } = await supabase.auth.getUser();
      
      if (userError || !userData) {
        console.error("Error fetching user:", userError);
        setDebug((prev: DebugState) => ({ ...prev, userError }));
        setErrorMessages((prev: string[]) => [...prev, `User fetch error: ${userError?.message || "Unknown error"}`]);
        setIsTeacher(false);
        setIsLoading(false);
        return false;
      }
      
      const currentUser = userData.user;
      setDebug((prev: DebugState) => ({ ...prev, user: currentUser }));
      
      // Check if the user has a teacher_profile
      const { data: teacherData, error: teacherError } = await supabase
        .from('teacher_profiles')
        .select('*')
        .eq('user_id', currentUser.id)
        .single();
      
      if (teacherError && teacherError.code !== 'PGRST116') {
        // PGRST116 is "Results contain 0 rows" - this is expected if the user is not a teacher
        console.error("Error checking teacher role:", teacherError);
        setDebug((prev: DebugState) => ({ ...prev, teacherError }));
        setErrorMessages((prev: string[]) => [...prev, `Teacher role check error: ${teacherError.message} (${teacherError.code})`]);
        setIsTeacher(false);
        setIsLoading(false);
        return false;
      }
      
      const isTeacherUser = !!teacherData;
      setIsTeacher(isTeacherUser);
      
      if (isTeacherUser) {
        setTeacherProfile(teacherData);
        setDebug((prev: DebugState) => ({ ...prev, teacherProfile: teacherData }));
      } else {
        setDebug((prev: DebugState) => ({ ...prev, notTeacher: true }));
        setErrorMessages((prev: string[]) => [...prev, "User does not have a teacher profile"]);
      }
      
      setIsLoading(false);
      return isTeacherUser;
    } catch (error) {
      console.error("Unexpected error in checkTeacherRole:", error);
      setDebug((prev: DebugState) => ({ ...prev, roleCheckError: error }));
      setErrorMessages((prev: string[]) => [...prev, `Unexpected role check error: ${error instanceof Error ? error.message : String(error)}`]);
      setIsTeacher(false);
      setIsLoading(false);
      return false;
    }
  };
  
  const tryFetchProjects = async () => {
    try {
      setIsProjectsLoading(true);
      
      // First try - get teacher profile and use teacher_id
      const { data: teacherProfile, error: teacherError } = await supabase
        .from("teacher_profiles")
        .select("id")
        .eq("user_id", user?.id)
        .maybeSingle();
      
      if (teacherError) {
        console.error("Error fetching teacher profile:", teacherError);
        setDebug((prev: DebugState) => ({ ...prev, teacherError }));
        setErrorMessages((prev: string[]) => [...prev, `Teacher profile error: ${teacherError.message}`]);
        
        // Try alternative approach - query projects directly
        await tryDirectProjectQuery();
        return;
      }
      
      if (teacherProfile?.id) {
        await fetchProjectsByTeacherId(teacherProfile.id);
      } else {
        console.log("No teacher profile found, trying direct query");
        await tryDirectProjectQuery();
      }
    } catch (error) {
      console.error("Error trying to fetch projects:", error);
      setDebug((prev: DebugState) => ({ ...prev, projectsError: error }));
      setErrorMessages((prev: string[]) => [...prev, `Projects fetch error: ${error instanceof Error ? error.message : String(error)}`]);
      setIsProjectsLoading(false);
      
      // Fallback to mock data
      console.log("Using mock projects data as fallback");
      setProjects(MOCK_PROJECTS);
      setShowMockData(true);
    }
  };
  
  const tryDirectProjectQuery = async () => {
    try {
      // Try different approach - limit to recent projects since we can't filter by user directly
      console.log('Trying to fetch most recent projects since user_id field is not available');
      
      const { data: allProjects, error: projectsError } = await supabase
        .from("projects")
        .select("*")
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (projectsError) {
        console.error("Error in direct projects query:", projectsError);
        setDebug(prev => ({ ...prev, directProjectsError: projectsError }));
        setErrorMessages(prev => [...prev, `Direct projects query error: ${projectsError.message}`]);
        
        // Fallback to mock data
        console.log("Using mock projects data as fallback");
        setProjects(MOCK_PROJECTS);
        setShowMockData(true);
      } else if (allProjects && allProjects.length > 0) {
        console.log('Found projects in recent list:', allProjects.length);
        
        // Since we can't filter by user/teacher directly in query,
        // try to describe what's happening instead of showing unrelated projects
        setErrorMessages(prev => [...prev, `Showing ${allProjects.length} most recent projects. Projects table structure doesn't allow filtering by teacher directly.`]);
        
        setProjects(allProjects);
      } else {
        console.log("No projects found in database");
        setProjects([]);
      }
    } catch (error) {
      console.error("Error in tryDirectProjectQuery:", error);
      setDebug(prev => ({ ...prev, directQueryError: error }));
      setErrorMessages(prev => [...prev, `Direct query error: ${error instanceof Error ? error.message : String(error)}`]);
      
      // Fallback to mock data
      console.log("Using mock projects data as fallback");
      setProjects(MOCK_PROJECTS);
      setShowMockData(true);
    } finally {
      setIsProjectsLoading(false);
    }
  };
  
  const fetchProjectsByTeacherId = async (teacherId: string) => {
    try {
      console.log('Fetching projects for teacher ID:', teacherId);
      
      const { data: teacherProjects, error: projectsError } = await supabase
        .from("projects")
        .select("*")
        .eq("teacher_id", teacherId)
        .limit(3);
      
      if (projectsError) {
        console.error("Error fetching projects:", projectsError);
        setDebug(prev => ({ ...prev, projectsError }));
        setErrorMessages(prev => [...prev, `Projects fetch error: ${projectsError.message}`]);
        
        // Fallback to mock data
        console.log("Using mock projects data as fallback");
        setProjects(MOCK_PROJECTS);
        setShowMockData(true);
      } else if (teacherProjects && teacherProjects.length > 0) {
        console.log('Projects fetched:', teacherProjects.length);
        setProjects(teacherProjects);
      } else {
        console.log("No projects found for teacher", teacherId);
        setProjects([]);
      }
    } catch (error) {
      console.error("Error in fetchProjectsByTeacherId:", error);
      setDebug(prev => ({ ...prev, teacherProjectsError: error }));
      setErrorMessages(prev => [...prev, `Teacher projects error: ${error instanceof Error ? error.message : String(error)}`]);
      
      // Fallback to mock data
      console.log("Using mock projects data as fallback");
      setProjects(MOCK_PROJECTS);
      setShowMockData(true);
    } finally {
      setIsProjectsLoading(false);
    }
  };
  
  // Calculate days left for a project
  const getDaysLeft = (endDate: string | undefined) => {
    if (!endDate) return 'No deadline';
    
    const end = new Date(endDate);
    const today = new Date();
    const diffTime = end.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays > 0 ? `${diffDays} days left` : 'Ended';
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-10">
        <div className="flex justify-center items-center min-h-[60vh]">
          <Loader className="animate-spin h-8 w-8 text-blue-500" />
          <span className="ml-2">Loading...</span>
        </div>
      </div>
    );
  }

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
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="grid grid-cols-1 gap-6">
        {/* Header with welcome message */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
          <div>
            <h1 className="text-3xl font-bold text-[#0E5D7F]">Teacher Dashboard (Alternative)</h1>
            <p className="text-muted-foreground mt-1">
              Welcome back, {user?.user_metadata?.first_name || user?.email?.split('@')[0] || 'Teacher'}!
            </p>
            {showMockData && (
              <p className="text-amber-600 font-medium mt-1">
                Using demo data - database connection issues detected
              </p>
            )}
          </div>
          <Button className="mt-4 md:mt-0 bg-[#E96951] hover:bg-[#E96951]/90">
            <Link href="/teacher/projects/create" className="flex items-center gap-2">
              <Plus size={16} />
              <span>Create New Project</span>
            </Link>
          </Button>
        </div>
        
        {/* Show errors if any */}
        {errorMessages.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
            <h2 className="text-amber-800 font-medium mb-2">Issues Detected</h2>
            <ul className="list-disc pl-5 text-amber-700 text-sm space-y-1">
              {errorMessages.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
            <div className="mt-3 flex gap-2">
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => window.location.reload()}
              >
                Refresh Page
              </Button>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => router.push('/test-db')}
              >
                Database Diagnostics
              </Button>
            </div>
          </div>
        )}

        {/* Stats overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
          <Card className="bg-[#F8F9FA] border-[#E5E7EB]">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-[#0E5D7F]">Total Projects</CardTitle>
              <BookOpen className="h-4 w-4 text-[#3AB5E9]" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{projects.length || 0}</div>
              <p className="text-xs text-muted-foreground">
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
              <p className="text-xs text-muted-foreground">
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
              <p className="text-xs text-muted-foreground">
                {Math.round((projects.filter(p => p.status === 'funded').length / Math.max(projects.length, 1)) * 100)}% success rate
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Projects section */}
        <div className="mt-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-[#0E5D7F]">Your Projects</h2>
            <div className="flex items-center gap-3">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => window.location.reload()}
                className="flex items-center gap-1 text-[#0E5D7F] hover:text-[#0E5D7F]/80"
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
              <Link href="/teacher/projects" className="text-[#0E5D7F] hover:text-[#0E5D7F]/80 flex items-center gap-1 text-sm font-medium">
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
            <Card className="bg-[#F8F9FA] border-[#E5E7EB] p-8 text-center">
              <BookPlus className="mx-auto h-12 w-12 text-muted-foreground opacity-50 mb-4" />
              <h3 className="text-lg font-semibold mb-2">No projects yet</h3>
              <p className="text-muted-foreground mb-4">Create your first project to start fundraising for your classroom.</p>
              <Button className="bg-[#E96951] hover:bg-[#E96951]/90">
                <Link href="/teacher/projects/create" className="flex items-center gap-2">
                  <Plus size={16} />
                  <span>Create New Project</span>
                </Link>
              </Button>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map((project) => (
                <Card key={project.id} className="overflow-hidden">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg font-bold truncate">{project.title}</CardTitle>
                        <CardDescription className="mt-1 line-clamp-2">{project.description}</CardDescription>
                      </div>
                      {project.status === 'funded' ? (
                        <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                          Funded
                        </span>
                      ) : (
                        <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                          {getDaysLeft(project.end_date)}
                        </span>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="pb-3">
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <div className="flex justify-between text-sm">
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
                      {!showMockData ? (
                        <Link href={`/teacher/projects/${project.id}`} className="flex items-center gap-2 w-full justify-center">
                          Manage Project
                          <ArrowUpRight size={16} />
                        </Link>
                      ) : (
                        <span className="flex items-center gap-2 w-full justify-center">
                          Demo Project
                          <ArrowUpRight size={16} />
                        </span>
                      )}
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
                <CardTitle className="text-[#0E5D7F]">Database Diagnostics</CardTitle>
                <CardDescription>Troubleshoot database issues</CardDescription>
              </CardHeader>
              <CardContent className="pb-3">
                <p className="text-sm text-muted-foreground">
                  If you're experiencing any issues with your projects or data, use our diagnostic tools.
                </p>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full text-[#0E5D7F] border-[#0E5D7F] hover:bg-[#0E5D7F]/5">
                  <Link href="/test-db" className="flex items-center gap-2 w-full justify-center">
                    Run Diagnostics
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
  );
} 