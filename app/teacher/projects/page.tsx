'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../../utils/supabase';
import Link from 'next/link';
import ProjectActions from '../../../components/ProjectActions';
import { useAuth } from '@/components/AuthProvider';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ChevronLeft, Plus, BookOpen, ArrowRight, Edit, ExternalLink, School, MapPin, GraduationCap, Users, Calendar, FileText, Sparkles, Award, Target, Clock } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

type Project = {
  id: string;
  title: string;
  description: string;
  funding_goal: number;
  current_funding: number;
  status: string;
  created_at: string;
  updated_at: string;
  main_image_url?: string | null;
};

type UserProfile = {
  id: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  profile_image_url?: string;
  teacher_profile?: {
    id: string;
    school_name?: string;
    school_city?: string;
    school_state?: string;
  };
};

export default function TeacherProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isTeacher, setIsTeacher] = useState(false);
  const [teacherProfileId, setTeacherProfileId] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const { user } = useAuth();

  // Generate theme color based on user name
  const getThemeColor = (name?: string) => {
    if (!name) return "#3AB5E9"; // Default blue
    
    const colors = [
      "#3AB5E9", // Blue
      "#E96951", // Salmon
      "#A8BF87", // Green
      "#F7DBA7", // Yellow
      "#0E5D7F"  // Navy
    ];
    
    // Simple hash of name to pick a consistent color
    const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };
  
  // Get user initials from first and last name
  const getUserInitials = (firstName?: string, lastName?: string) => {
    const first = firstName ? firstName[0] : '';
    const last = lastName ? lastName[0] : '';
    return (first + last).toUpperCase();
  };

  useEffect(() => {
    if (user) {
      fetchUserProfile();
    }
  }, [user]);

  useEffect(() => {
    if (teacherProfileId) {
      fetchProjects();
    }
  }, [teacherProfileId, refreshTrigger]);

  const fetchUserProfile = async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      
      console.log("Checking teacher access for user:", user.id);
      console.log("User metadata:", user.user_metadata);
      
      // First, check if the user should be a teacher based on metadata
      const userRoleFromMetadata = user.user_metadata?.role?.toLowerCase();
      const isTeacherByMetadata = userRoleFromMetadata === 'teacher';
      
      console.log("Is teacher by metadata:", isTeacherByMetadata);
      
      if (!isTeacherByMetadata) {
        console.log("User is not a teacher according to metadata");
        setIsTeacher(false);
        setIsLoading(false);
        setError('You must be a teacher to view this page');
        return;
      }
      
      // Get app user record from users table - this is the crucial step that's missing
      const { data: appUser, error: appUserError } = await supabase
        .from("users")
        .select("*")
        .eq("auth_id", user.id)
        .maybeSingle();
        
      if (appUserError && appUserError.code !== "PGRST116") {
        console.error("Error fetching app user:", appUserError.message || JSON.stringify(appUserError));
      }
      
      let userId = appUser?.id;
      
      // If app user doesn't exist, we need to create one - crucial step from dashboard
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
      }
      
      // Get the user's profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (profileError) {
        console.error('Error fetching profile:', profileError);
        // This is not critical because we checked the metadata role already
      }
      
      setIsTeacher(true);
      
      // Now get teacher profile based on the app user ID - this is the key fix
      if (userId) {
        const { data: teacherData, error: teacherError } = await supabase
          .from('teacher_profiles')
          .select('*')
          .eq('user_id', userId)  // Using the app user ID, not the auth ID
          .single();
        
        if (teacherError && teacherError.code !== 'PGRST116') {
          console.error('Error fetching teacher profile:', teacherError);
        }
        
        // Create teacher profile if it doesn't exist (like dashboard does)
        if (!teacherData) {
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
            console.error("Error creating teacher profile:", createProfileError.message);
          } else if (newTeacherProfile) {
            console.log("Created new teacher profile:", newTeacherProfile);
            
            const userProfileData: UserProfile = {
              id: user.id,
              first_name: user.user_metadata?.first_name || '',
              last_name: user.user_metadata?.last_name || '',
              email: user.email || '',
              profile_image_url: profileData?.profile_image_url,
              teacher_profile: {
                id: newTeacherProfile.id,
                school_name: newTeacherProfile.school_name,
                school_city: newTeacherProfile.school_city,
                school_state: newTeacherProfile.school_state
              }
            };
            
            setUserProfile(userProfileData);
            setTeacherProfileId(newTeacherProfile.id);
          }
        } else {
          // Use existing teacher profile
          const userProfileData: UserProfile = {
            id: user.id,
            first_name: profileData?.first_name || user.user_metadata?.first_name || '',
            last_name: profileData?.last_name || user.user_metadata?.last_name || '',
            email: profileData?.email || user.email || '',
            profile_image_url: profileData?.profile_image_url,
            teacher_profile: {
              id: teacherData.id,
              school_name: teacherData.school_name,
              school_city: teacherData.school_city,
              school_state: teacherData.school_state
            }
          };
          
          setUserProfile(userProfileData);
          setTeacherProfileId(teacherData.id);
        }
      }
      
    } catch (error) {
      console.error('Error fetching user profile:', error);
      setError('Error loading your profile');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchProjects = async () => {
    if (!teacherProfileId) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('Fetching projects for teacher ID:', teacherProfileId);
      
      // Fetch projects by teacher ID
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('teacher_id', teacherProfileId)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching projects:', error);
        setError(error.message);
        return;
      }
      
      console.log('Projects fetched:', data);
      
      if (data && data.length > 0) {
        setProjects(data || []);
        setIsLoading(false);
        return;
      }
      
      // If no projects found directly, try the more comprehensive approach from the dashboard
      console.log("No projects found directly, trying alternative approach");
      
      // Try to check teacher profiles for this user
      if (user) {
        console.log("Looking up teacher profiles for auth user:", user.id);
        
        // Get app user ID from auth ID
        const { data: appUser, error: appUserError } = await supabase
          .from("users")
          .select("id")
          .eq("auth_id", user.id)
          .maybeSingle();
          
        if (appUserError) {
          console.error("Error fetching app user:", appUserError);
        }
        
        if (appUser?.id) {
          console.log("Found app user:", appUser.id);
            
          // Find teacher profiles for this user
          const { data: teacherProfiles, error: profilesError } = await supabase
            .from("teacher_profiles")
            .select("id")
            .eq("user_id", appUser.id);
          
          if (profilesError) {
            console.error("Error fetching teacher profiles:", profilesError);
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
                .eq("teacher_id", profile.id)
                .order('created_at', { ascending: false });
              
              if (projectsError) {
                console.error("Error fetching projects for profile:", projectsError);
              } else if (profileProjects) {
                console.log(`Found ${profileProjects.length} projects for profile ${profile.id}`);
                allProjects = [...allProjects, ...profileProjects];
              }
            }
            
            if (allProjects.length > 0) {
              console.log("Total projects found across all profiles:", allProjects.length);
              setProjects(allProjects);
              setIsLoading(false);
              return;
            }
          }
        }
      }
      
      // If we get here, no projects were found with any method
      console.log("No projects found for this teacher after all attempts");
      setProjects([]);
    } catch (err) {
      console.error('Error in fetchProjects:', err);
      setError('Failed to load projects');
    } finally {
      setIsLoading(false);
    }
  };

  const handleProjectUpdated = () => {
    // Trigger a refresh of the projects list
    setRefreshTrigger(prev => prev + 1);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { color: string, text: string, variant: 'outline' | 'default' | 'secondary' | 'destructive' }> = {
      draft: { color: 'bg-gray-100', text: 'Draft', variant: 'outline' },
      pending_review: { color: 'bg-yellow-100', text: 'Pending Review', variant: 'secondary' },
      active: { color: '', text: 'Active', variant: 'default' },
      rejected: { color: '', text: 'Rejected', variant: 'destructive' },
      funded: { color: 'bg-blue-100', text: 'Funded', variant: 'default' },
      completed: { color: 'bg-purple-100', text: 'Completed', variant: 'default' }
    };
    
    const config = statusConfig[status] || { color: 'bg-gray-100', text: status, variant: 'outline' };
    
    return (
      <Badge variant={config.variant}>
        {config.text}
      </Badge>
    );
  };

  // Calculate funding percentage
  const getFundingPercentage = (current: number, goal: number) => {
    if (!goal || goal <= 0) return 0;
    const percentage = (current / goal) * 100;
    return Math.min(100, Math.max(0, percentage)); // Clamp between 0-100
  };

  if (!isTeacher) {
    return (
      <div className="container mx-auto py-10">
        <div className="flex justify-center items-center min-h-[60vh]">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-red-600">Access Denied</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 mb-4">{error || 'You do not have permission to access this page.'}</p>
            </CardContent>
            <CardFooter>
              <Link href="/dashboard">
                <Button variant="default">
                  Return to Dashboard
                </Button>
              </Link>
            </CardFooter>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10 px-4">
      <div className="mb-8 flex items-center">
        <Link href="/dashboard" className="mr-4">
          <Button variant="ghost" size="icon" className="text-[#0E5D7F] hover:text-[#0E5D7F]/80 hover:bg-[#3AB5E9]/10">
            <ChevronLeft className="h-5 w-5" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold text-[#0E5D7F]">My Projects</h1>
      </div>
      
      {/* Teacher Profile Header */}
      {userProfile && (
        <div className="mb-8 p-6 bg-gradient-to-r from-[#3AB5E9]/10 to-[#0E5D7F]/10 rounded-lg border border-[#3AB5E9]/20 shadow-sm">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
            <div className="flex-shrink-0">
              <Avatar className="h-20 w-20 ring-2 ring-[#3AB5E9]/30 ring-offset-2">
                {userProfile.profile_image_url ? (
                  <AvatarImage src={userProfile.profile_image_url} alt={`${userProfile.first_name || ''} ${userProfile.last_name || ''}`} />
                ) : (
                  <AvatarFallback 
                    className="text-xl font-semibold" 
                    style={{ backgroundColor: getThemeColor((userProfile.first_name || '') + (userProfile.last_name || '')) }}
                  >
                    {getUserInitials(userProfile.first_name, userProfile.last_name)}
                  </AvatarFallback>
                )}
              </Avatar>
            </div>
            <div className="flex-1 text-center md:text-left space-y-2">
              <h2 className="text-xl font-semibold text-[#0E5D7F] flex items-center gap-2 justify-center md:justify-start">
                <GraduationCap className="h-5 w-5 text-[#3AB5E9]" />
                Welcome, {userProfile.first_name || 'Teacher'}!
              </h2>
              {userProfile.teacher_profile?.school_name && (
                <p className="text-gray-600 mt-1 flex items-center gap-2 justify-center md:justify-start">
                  <School className="h-4 w-4 text-[#A8BF87]" />
                  {userProfile.teacher_profile?.school_name}
                </p>
              )}
              {userProfile.teacher_profile?.school_city && userProfile.teacher_profile?.school_state && (
                <p className="text-gray-500 text-sm flex items-center gap-2 justify-center md:justify-start">
                  <MapPin className="h-4 w-4 text-[#E96951]" />
                  {userProfile.teacher_profile?.school_city}, {userProfile.teacher_profile?.school_state}
                </p>
              )}
              <div className="pt-1 md:pt-2">
                <Badge variant="outline" className="bg-[#F7DBA7]/20 text-[#0E5D7F] border-[#F7DBA7]">
                  <Users className="h-3 w-3 mr-1" />
                  Teacher
                </Badge>
              </div>
            </div>
            <div className="flex-shrink-0">
              <Link href="/teacher/projects/create">
                <Button className="gap-2 bg-[#E96951] hover:bg-[#E96951]/90 shadow-md transition-all hover:shadow-lg">
                  <Plus className="h-4 w-4" />
                  Create New Project
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}
      
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-6">
          {error}
        </div>
      )}
      
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#3AB5E9]"></div>
        </div>
      ) : (
        <>
          {projects.length === 0 ? (
            <Card className="text-center p-8 shadow-md border-[#3AB5E9]/20">
              <CardContent className="pt-6">
                <div className="mx-auto mb-6 bg-gray-100 p-4 inline-block rounded-full">
                  <BookOpen className="h-8 w-8 text-[#0E5D7F]" />
                </div>
                <h3 className="text-xl font-medium text-[#0E5D7F] mb-4">No Projects Found</h3>
                <p className="text-gray-600 mb-6 max-w-md mx-auto">
                  You haven't created any projects yet. Start your first project to begin fundraising for your classroom.
                </p>
                <Link href="/teacher/projects/create">
                  <Button className="gap-2 bg-[#E96951] hover:bg-[#E96951]/90">
                    <Plus className="h-4 w-4" />
                    Create Your First Project
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {projects.map(project => (
                <Card key={project.id} className="overflow-hidden transition-all duration-300 hover:shadow-lg border-t-4 border-t-[#3AB5E9] shadow-md">
                  {project.main_image_url ? (
                    <div className="w-full h-48 overflow-hidden">
                      <img 
                        src={project.main_image_url} 
                        alt={project.title} 
                        className="w-full h-full object-cover transition-transform hover:scale-105"
                      />
                    </div>
                  ) : (
                    <div className="w-full h-48 bg-gradient-to-r from-[#3AB5E9]/20 to-[#E96951]/20 flex justify-center items-center">
                      <BookOpen className="h-12 w-12 text-[#0E5D7F]/50" />
                    </div>
                  )}
                  
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg font-semibold text-[#0E5D7F] line-clamp-1 flex gap-2 items-center">
                        {project.status === 'funded' || project.status === 'completed' ? (
                          <Sparkles className="h-5 w-5 text-[#F7DBA7]" />
                        ) : project.status === 'active' ? (
                          <Target className="h-5 w-5 text-[#A8BF87]" />
                        ) : (
                          <FileText className="h-5 w-5 text-[#3AB5E9]" />
                        )}
                        {project.title}
                      </CardTitle>
                      {getStatusBadge(project.status)}
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    <p className="text-gray-600 text-sm line-clamp-2">{project.description}</p>
                    
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium flex items-center gap-1">
                          <Award className="h-4 w-4 text-[#E96951]" />
                          ${project.funding_goal} Goal
                        </span>
                        <span className="font-semibold text-[#A8BF87]">
                          {Math.round(getFundingPercentage(project.current_funding || 0, project.funding_goal))}%
                        </span>
                      </div>
                      <Progress 
                        value={getFundingPercentage(project.current_funding || 0, project.funding_goal)} 
                        className="h-2.5 bg-gray-100 rounded-full" 
                        indicatorClassName={cn(
                          project.status === 'funded' || project.status === 'completed' 
                            ? "bg-[#F7DBA7]" 
                            : "bg-[#A8BF87]"
                        )}
                      />
                    </div>
                    
                    <div className="flex justify-between items-center text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(project.created_at).toLocaleDateString()}
                      </span>
                      {project.status !== 'active' && project.status !== 'funded' && project.status !== 'completed' && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(project.updated_at).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </CardContent>
                  
                  <CardFooter className="flex justify-between border-t pt-4">
                    <Link href={`/teacher/projects/${project.id}`} className="flex items-center gap-1 text-[#3AB5E9] hover:text-[#0E5D7F] font-medium transition-colors">
                      View Details
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                    
                    <div className="flex space-x-2">
                      {project.status !== 'active' && project.status !== 'funded' && project.status !== 'completed' && (
                        <Link href={`/teacher/projects/edit/${project.id}`}>
                          <Button variant="outline" size="sm" className="gap-1 border-[#3AB5E9] text-[#3AB5E9] hover:bg-[#3AB5E9]/10">
                            <Edit className="h-3.5 w-3.5" />
                            Edit
                          </Button>
                        </Link>
                      )}
                      
                      <ProjectActions
                        projectId={project.id}
                        currentStatus={project.status}
                        isTeacher={true}
                        onProjectUpdated={handleProjectUpdated}
                        buttonVariant="small"
                      />
                    </div>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
} 