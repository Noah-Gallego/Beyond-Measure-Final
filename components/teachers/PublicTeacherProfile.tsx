'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/utils/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import ProfileAvatar from '@/components/ProfileAvatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Link from 'next/link';
import { ArrowLeft, GraduationCap, Building, MapPin, BookOpen, Award } from 'lucide-react';

interface TeacherProfileData {
  id: string;
  user_id: string;
  school_name: string;
  position_title: string;
  school_city: string;
  school_state: string;
  bio: string;
  philosophy: string;
  user: {
    first_name: string;
    last_name: string;
    profile_image_url?: string;
  };
  projects?: {
    id: string;
    title: string;
    main_image_url?: string;
    status: string;
    funding_goal: number;
    current_amount: number;
  }[];
}

export default function PublicTeacherProfile({ teacherId }: { teacherId: string }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [teacherProfile, setTeacherProfile] = useState<TeacherProfileData | null>(null);

  useEffect(() => {
    const fetchTeacherProfile = async () => {
      try {
        // First determine if we have a teacher profile ID or a user ID
        const { data: profileData, error: profileError } = await supabase
          .from('teacher_profiles')
          .select(`
            id,
            user_id,
            school_name,
            position_title,
            school_address,
            school_city,
            school_state,
            school_postal_code,
            bio,
            philosophy,
            users:user_id (
              id,
              first_name,
              last_name,
              profile_image_url
            )
          `)
          .eq('id', teacherId)
          .single();

        if (profileError && profileError.code !== 'PGRST116') {
          // Try searching by user_id instead
          const { data: profileByUserData, error: profileByUserError } = await supabase
            .from('teacher_profiles')
            .select(`
              id,
              user_id,
              school_name,
              position_title,
              school_address,
              school_city,
              school_state,
              school_postal_code,
              bio,
              philosophy,
              users:user_id (
                id,
                first_name,
                last_name,
                profile_image_url
              )
            `)
            .eq('user_id', teacherId)
            .single();

          if (profileByUserError) {
            console.error('Error fetching teacher profile:', profileByUserError);
            setError('Teacher profile not found');
            setLoading(false);
            return;
          }

          // Get teacher projects
          const { data: projectsData } = await supabase
            .from('projects')
            .select('id, title, main_image_url, status, funding_goal, current_amount')
            .eq('teacher_id', profileByUserData.id)
            .eq('status', 'approved');

          setTeacherProfile({
            ...profileByUserData,
            user: profileByUserData.users,
            projects: projectsData || []
          });
        } else if (profileData) {
          // Get teacher projects
          const { data: projectsData } = await supabase
            .from('projects')
            .select('id, title, main_image_url, status, funding_goal, current_amount')
            .eq('teacher_id', profileData.id)
            .eq('status', 'approved');

          setTeacherProfile({
            ...profileData,
            user: profileData.users,
            projects: projectsData || []
          });
        } else {
          setError('Teacher profile not found');
        }
      } catch (err) {
        console.error('Error fetching teacher profile:', err);
        setError('An error occurred while fetching the teacher profile');
      } finally {
        setLoading(false);
      }
    };

    fetchTeacherProfile();
  }, [teacherId]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#3AB5E9]"></div>
      </div>
    );
  }

  if (error || !teacherProfile) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
        <h3 className="text-lg font-medium mb-2">Profile Not Found</h3>
        <p>{error || 'Could not find the requested teacher profile'}</p>
        <Link href="/projects" className="text-blue-600 hover:underline mt-2 inline-block">
          Browse Projects
        </Link>
      </div>
    );
  }

  const teacherName = teacherProfile.user ? 
    `${teacherProfile.user.first_name || ''} ${teacherProfile.user.last_name || ''}`.trim() : 
    'Teacher';

  const calculatePercentage = (current: number, goal: number) => {
    return Math.min(Math.round((current / goal) * 100), 100);
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6">
        <Link 
          href="/projects" 
          className="inline-flex items-center text-[#3AB5E9] hover:text-[#0E5D7F] transition-colors"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          <span className="font-medium">Back to Projects</span>
        </Link>
      </div>

      {/* Hero section with teacher info */}
      <div className="relative rounded-xl overflow-hidden mb-12">
        <div className="absolute inset-0 bg-gradient-to-r from-[#3AB5E9]/20 to-[#0E5D7F]/20 z-0"></div>
        <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-0"></div>
        
        <div className="relative z-10 p-8 md:p-12">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
            <div className="w-36 h-36 md:w-48 md:h-48 overflow-hidden rounded-full border-4 border-white shadow-lg transform transition-transform duration-300 hover:scale-105">
              <ProfileAvatar 
                userId={teacherProfile.user_id || ''}
                firstName={teacherProfile.user?.first_name || ''}
                lastName={teacherProfile.user?.last_name || ''}
                imageUrl={teacherProfile.user?.profile_image_url}
                size="xl"
                className="w-full h-full"
              />
            </div>
            
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-3xl md:text-4xl font-bold text-[#0E5D7F] mb-2">{teacherName}</h1>
              
              {teacherProfile.position_title && (
                <p className="text-xl md:text-2xl text-[#3AB5E9] mb-4 font-light">
                  {teacherProfile.position_title}
                </p>
              )}
              
              <div className="flex flex-wrap gap-4 justify-center md:justify-start mt-6">
                {teacherProfile.school_name && (
                  <div className="flex items-center text-gray-700">
                    <Building className="h-5 w-5 mr-2 text-[#3AB5E9]" />
                    <span>{teacherProfile.school_name}</span>
                  </div>
                )}
                
                {(teacherProfile.school_city || teacherProfile.school_state) && (
                  <div className="flex items-center text-gray-700">
                    <MapPin className="h-5 w-5 mr-2 text-[#3AB5E9]" />
                    <span>
                      {teacherProfile.school_city}
                      {teacherProfile.school_city && teacherProfile.school_state ? ', ' : ''}
                      {teacherProfile.school_state}
                    </span>
                  </div>
                )}
                
                {teacherProfile.projects && (
                  <div className="flex items-center text-gray-700">
                    <BookOpen className="h-5 w-5 mr-2 text-[#3AB5E9]" />
                    <span>{teacherProfile.projects.length} {teacherProfile.projects.length === 1 ? 'Project' : 'Projects'}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content tabs */}
      <Tabs defaultValue="about" className="mb-12">
        <TabsList className="w-full justify-start mb-8 border-b border-gray-200 pb-1 overflow-x-auto">
          <TabsTrigger 
            value="about" 
            className="data-[state=active]:text-[#3AB5E9] data-[state=active]:border-b-2 data-[state=active]:border-[#3AB5E9] px-4 py-2 text-lg font-medium"
          >
            About
          </TabsTrigger>
          <TabsTrigger 
            value="projects" 
            className="data-[state=active]:text-[#3AB5E9] data-[state=active]:border-b-2 data-[state=active]:border-[#3AB5E9] px-4 py-2 text-lg font-medium"
          >
            Projects
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="about" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {(teacherProfile.bio || teacherProfile.philosophy) ? (
              <div className="md:col-span-2 space-y-8">
                {teacherProfile.bio && (
                  <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
                    <div className="flex items-center mb-4">
                      <GraduationCap className="h-6 w-6 text-[#3AB5E9] mr-3" />
                      <h2 className="text-xl font-bold text-[#0E5D7F]">Bio</h2>
                    </div>
                    <div className="prose max-w-none text-gray-700">
                      <p className="whitespace-pre-line">{teacherProfile.bio}</p>
                    </div>
                  </div>
                )}
                
                {teacherProfile.philosophy && (
                  <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
                    <div className="flex items-center mb-4">
                      <Award className="h-6 w-6 text-[#3AB5E9] mr-3" />
                      <h2 className="text-xl font-bold text-[#0E5D7F]">Teaching Philosophy</h2>
                    </div>
                    <div className="prose max-w-none text-gray-700">
                      <p className="whitespace-pre-line">{teacherProfile.philosophy}</p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="md:col-span-2 bg-white rounded-xl p-8 border border-gray-100 shadow-sm flex items-center justify-center">
                <p className="text-gray-500 italic text-center">No additional information provided by this teacher.</p>
              </div>
            )}
            
            <div className="bg-gradient-to-br from-[#3AB5E9]/10 to-[#0E5D7F]/10 rounded-xl p-6 border border-[#3AB5E9]/20">
              <h3 className="text-xl font-bold text-[#0E5D7F] mb-4">Quick Info</h3>
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Position</h4>
                  <p className="text-[#0E5D7F] font-medium">{teacherProfile.position_title || 'Teacher'}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500">School</h4>
                  <p className="text-[#0E5D7F] font-medium">{teacherProfile.school_name || 'N/A'}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Location</h4>
                  <p className="text-[#0E5D7F] font-medium">
                    {teacherProfile.school_city || ''}
                    {teacherProfile.school_city && teacherProfile.school_state ? ', ' : ''}
                    {teacherProfile.school_state || 'N/A'}
                  </p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Projects</h4>
                  <p className="text-[#0E5D7F] font-medium">{teacherProfile.projects?.length || 0}</p>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="projects" className="mt-6">
          {teacherProfile.projects && teacherProfile.projects.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {teacherProfile.projects.map(project => (
                <Link 
                  key={project.id} 
                  href={`/projects/${project.id}`}
                  className="group block"
                >
                  <div className="bg-white rounded-xl overflow-hidden border border-gray-100 shadow-sm transition-all duration-300 hover:shadow-md hover:translate-y-[-4px]">
                    <div className="h-48 bg-gray-200 relative overflow-hidden">
                      {project.main_image_url ? (
                        <img 
                          src={project.main_image_url} 
                          alt={project.title} 
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-r from-[#3AB5E9]/20 to-[#0E5D7F]/20 text-[#0E5D7F]">
                          No Image
                        </div>
                      )}
                      
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
                        <span className="inline-block px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                          {calculatePercentage(project.current_amount, project.funding_goal)}% Funded
                        </span>
                      </div>
                    </div>
                    
                    <div className="p-5">
                      <h3 className="text-lg font-bold text-[#0E5D7F] mb-2 group-hover:text-[#3AB5E9] transition-colors line-clamp-2">
                        {project.title}
                      </h3>
                      
                      <div className="mt-4">
                        <div className="flex justify-between text-sm text-gray-600 mb-2">
                          <span>${project.current_amount.toFixed(2)} raised</span>
                          <span>Goal: ${project.funding_goal.toFixed(2)}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-[#3AB5E9] h-2 rounded-full" 
                            style={{ width: `${calculatePercentage(project.current_amount, project.funding_goal)}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-xl p-12 border border-gray-100 shadow-sm flex flex-col items-center justify-center">
              <BookOpen className="h-12 w-12 text-[#3AB5E9]/40 mb-4" />
              <p className="text-gray-500 italic text-center">No active projects found for this teacher.</p>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Call to Action Section */}
      {teacherProfile.projects && teacherProfile.projects.length > 0 && (
        <div className="bg-gradient-to-r from-[#3AB5E9] to-[#0E5D7F] rounded-xl p-8 text-white text-center shadow-md mb-8">
          <h2 className="text-2xl font-bold mb-4">Support {teacherName}'s Classroom</h2>
          <p className="mb-6 max-w-2xl mx-auto">Help make a difference in students' lives by supporting this teacher's projects.</p>
          <Link 
            href="/projects" 
            className="inline-block bg-white text-[#0E5D7F] px-6 py-3 rounded-lg font-medium shadow-sm hover:bg-gray-100 transition-colors"
          >
            Browse All Projects
          </Link>
        </div>
      )}
    </div>
  );
} 