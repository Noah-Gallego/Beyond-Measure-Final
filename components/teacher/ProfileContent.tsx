'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { supabase } from '@/utils/supabase';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ProfileAvatar from '@/components/ProfileAvatar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface TeacherProfile {
  id: string;
  user_id: string;
  school_name: string;
  position_title: string;
  school_address: string;
  school_city: string;
  school_state: string;
  school_postal_code: string;
  bio: string;
  philosophy: string;
  created_at: string;
  updated_at: string;
}

interface DbUser {
  id: string;
  auth_id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  profile_image_url?: string;
  created_at: string;
  updated_at: string;
}

export default function TeacherProfileContent() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [dbUser, setDbUser] = useState<DbUser | null>(null);
  const [teacherProfile, setTeacherProfile] = useState<TeacherProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    schoolName: '',
    positionTitle: '',
    schoolAddress: '',
    schoolCity: '',
    schoolState: '',
    schoolPostalCode: '',
    bio: '',
    philosophy: ''
  });

  // Redirect if not logged in
  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/auth');
    }
  }, [user, isLoading, router]);

  // Fetch user data and teacher profile from database
  useEffect(() => {
    const fetchUserData = async () => {
      if (!user) return;
      
      try {
        // Get user data and teacher profile in one query
        const { data, error } = await supabase
          .from('users')
          .select(`
            id,
            auth_id,
            first_name,
            last_name,
            email,
            role,
            profile_image_url,
            created_at,
            updated_at,
            teacher_profiles(*)
          `)
          .eq('auth_id', user.id)
          .single();
        
        if (error) {
          console.error('Error fetching user data:', error);
          setError('Failed to load profile data');
          setLoading(false);
          return;
        }
        
        setDbUser(data as DbUser);
        
        // Check if user has a teacher role
        if (data.role !== 'teacher') {
          setError('You must be a teacher to access this page');
          setLoading(false);
          router.push('/profile');
          return;
        }
        
        // Extract teacher profile
        let teacherProfileData = null;
        
        if (data.teacher_profiles) {
          if (Array.isArray(data.teacher_profiles) && data.teacher_profiles.length > 0) {
            teacherProfileData = data.teacher_profiles[0];
          } else if (data.teacher_profiles && typeof data.teacher_profiles === 'object') {
            teacherProfileData = data.teacher_profiles;
          }
        }
        
        // If no teacher profile found, create an empty one
        if (!teacherProfileData) {
          console.log('No teacher profile found, creating one...');
          
          const { data: newProfile, error: createError } = await supabase
            .from('teacher_profiles')
            .insert({
              user_id: data.id,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .select()
            .single();
            
          if (createError) {
            console.error('Error creating teacher profile:', createError);
            setError('Failed to create teacher profile');
            setLoading(false);
            return;
          }
          
          teacherProfileData = newProfile;
        }
        
        setTeacherProfile(teacherProfileData as TeacherProfile);
        
        // Initialize form data
        setFormData({
          firstName: data.first_name || '',
          lastName: data.last_name || '',
          email: data.email || '',
          schoolName: teacherProfileData.school_name || '',
          positionTitle: teacherProfileData.position_title || '',
          schoolAddress: teacherProfileData.school_address || '',
          schoolCity: teacherProfileData.school_city || '',
          schoolState: teacherProfileData.school_state || '',
          schoolPostalCode: teacherProfileData.school_postal_code || '',
          bio: teacherProfileData.bio || '',
          philosophy: teacherProfileData.philosophy || ''
        });
        
      } catch (err) {
        console.error('Error:', err);
        setError('An unexpected error occurred');
      } finally {
        setLoading(false);
      }
    };
    
    if (user) {
      fetchUserData();
    } else if (!isLoading) {
      setLoading(false);
    }
  }, [user, isLoading, router]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveProfile = async () => {
    if (!user || !dbUser || !teacherProfile) return;
    
    setSaving(true);
    setError('');
    setSuccess('');
    
    try {
      // Update basic user info in the database
      const { error: dbError } = await supabase
        .from('users')
        .update({
          first_name: formData.firstName,
          last_name: formData.lastName,
          updated_at: new Date().toISOString()
        })
        .eq('id', dbUser.id);
      
      if (dbError) {
        throw new Error(dbError.message);
      }
      
      // Update auth user metadata
      const { error: authError } = await supabase.auth.updateUser({
        data: {
          first_name: formData.firstName,
          last_name: formData.lastName
        }
      });
      
      if (authError) {
        throw new Error(authError.message);
      }
      
      // Update teacher profile
      const { error: profileError } = await supabase
        .from('teacher_profiles')
        .update({
          school_name: formData.schoolName,
          position_title: formData.positionTitle,
          school_address: formData.schoolAddress,
          school_city: formData.schoolCity,
          school_state: formData.schoolState,
          school_postal_code: formData.schoolPostalCode,
          bio: formData.bio,
          philosophy: formData.philosophy,
          updated_at: new Date().toISOString()
        })
        .eq('id', teacherProfile.id);
      
      if (profileError) {
        throw new Error(profileError.message);
      }
      
      // Update local state
      setDbUser(prev => {
        if (!prev) return null;
        return {
          ...prev,
          first_name: formData.firstName,
          last_name: formData.lastName,
        };
      });
      
      setTeacherProfile(prev => {
        if (!prev) return null;
        return {
          ...prev,
          school_name: formData.schoolName,
          position_title: formData.positionTitle,
          school_address: formData.schoolAddress,
          school_city: formData.schoolCity,
          school_state: formData.schoolState,
          school_postal_code: formData.schoolPostalCode,
          bio: formData.bio,
          philosophy: formData.philosophy,
        };
      });
      
      setSuccess('Profile updated successfully');
    } catch (err: any) {
      console.error('Error updating profile:', err);
      setError(err.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!dbUser || !teacherProfile) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
        <p className="text-gray-700 dark:text-gray-300 mb-4">{error || 'You do not have permission to access this page.'}</p>
        <Button variant="default" onClick={() => router.push('/')}>
          Return to Home
        </Button>
      </div>
    );
  }

  return (
    <div>
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 p-4 rounded-md mb-6">
          {error}
        </div>
      )}
      
      {success && (
        <div className="bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 p-4 rounded-md mb-6">
          {success}
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="md:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Your Avatar</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center">
              <ProfileAvatar 
                userId={user?.id || ''}
                firstName={formData.firstName}
                lastName={formData.lastName}
                size="xl"
                className="mb-4"
              />
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => router.push('/profile/avatar')}
              >
                Change Avatar
              </Button>
            </CardContent>
          </Card>
          
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Quick Links</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => router.push('/teacher/dashboard')}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                Dashboard
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => router.push('/teacher/projects')}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                My Projects
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => router.push('/teacher/projects/create')}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Create Project
              </Button>
            </CardContent>
          </Card>
        </div>
        
        <div className="md:col-span-3">
          <Tabs defaultValue="basic">
            <TabsList className="mb-6">
              <TabsTrigger value="basic">Basic Information</TabsTrigger>
              <TabsTrigger value="school">School Information</TabsTrigger>
              <TabsTrigger value="bio">Bio & Philosophy</TabsTrigger>
            </TabsList>
            
            <TabsContent value="basic">
              <Card>
                <CardHeader>
                  <CardTitle>Personal Information</CardTitle>
                  <CardDescription>Update your basic information</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name</Label>
                      <Input 
                        id="firstName"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input 
                        id="lastName"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input 
                      id="email" 
                      name="email"
                      value={formData.email}
                      disabled
                    />
                    <p className="text-sm text-muted-foreground">Email cannot be changed</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="positionTitle">Position Title</Label>
                    <Input 
                      id="positionTitle"
                      name="positionTitle"
                      placeholder="e.g. 5th Grade Teacher, Science Teacher, Art Teacher"
                      value={formData.positionTitle}
                      onChange={handleInputChange}
                    />
                  </div>
                </CardContent>
                <CardFooter>
                  <Button 
                    onClick={handleSaveProfile}
                    disabled={saving}
                  >
                    {saving ? 'Saving...' : 'Save Changes'}
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
            
            <TabsContent value="school">
              <Card>
                <CardHeader>
                  <CardTitle>School Information</CardTitle>
                  <CardDescription>Add details about your school</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="schoolName">School Name</Label>
                    <Input 
                      id="schoolName"
                      name="schoolName"
                      placeholder="Enter your school name"
                      value={formData.schoolName}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="schoolAddress">School Address</Label>
                    <Input 
                      id="schoolAddress"
                      name="schoolAddress"
                      placeholder="Street address"
                      value={formData.schoolAddress}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="schoolCity">City</Label>
                      <Input 
                        id="schoolCity"
                        name="schoolCity"
                        value={formData.schoolCity}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="schoolState">State</Label>
                      <Input 
                        id="schoolState"
                        name="schoolState"
                        value={formData.schoolState}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="schoolPostalCode">Postal Code</Label>
                      <Input 
                        id="schoolPostalCode"
                        name="schoolPostalCode"
                        value={formData.schoolPostalCode}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button 
                    onClick={handleSaveProfile}
                    disabled={saving}
                  >
                    {saving ? 'Saving...' : 'Save Changes'}
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
            
            <TabsContent value="bio">
              <Card>
                <CardHeader>
                  <CardTitle>Bio & Teaching Philosophy</CardTitle>
                  <CardDescription>Tell donors about yourself and your teaching approach</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="bio">Teacher Bio</Label>
                    <Textarea 
                      id="bio"
                      name="bio"
                      placeholder="Share your background, experience, and passion for teaching"
                      value={formData.bio}
                      onChange={handleInputChange}
                      className="min-h-32"
                    />
                    <p className="text-sm text-muted-foreground">This bio will be visible on your projects</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="philosophy">Teaching Philosophy</Label>
                    <Textarea 
                      id="philosophy"
                      name="philosophy"
                      placeholder="Describe your approach to teaching and how it benefits your students"
                      value={formData.philosophy}
                      onChange={handleInputChange}
                      className="min-h-32"
                    />
                  </div>
                </CardContent>
                <CardFooter>
                  <Button 
                    onClick={handleSaveProfile}
                    disabled={saving}
                  >
                    {saving ? 'Saving...' : 'Save Changes'}
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
} 