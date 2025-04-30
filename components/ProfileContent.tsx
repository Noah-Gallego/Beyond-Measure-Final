'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { supabase } from '@/utils/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ProfileAvatar from '@/components/ProfileAvatar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useRouter } from 'next/navigation';

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

export default function ProfileContent() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [dbUser, setDbUser] = useState<DbUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [refreshTimestamp, setRefreshTimestamp] = useState(Date.now());
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
  });

  // Refresh timestamp periodically to force image refresh
  useEffect(() => {
    const interval = setInterval(() => {
      setRefreshTimestamp(Date.now());
    }, 2000);
    
    return () => clearInterval(interval);
  }, []);

  // Redirect if not logged in
  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/auth');
    }
  }, [user, isLoading, router]);

  // Fetch user data from database
  useEffect(() => {
    const fetchUserData = async () => {
      if (!user) return;
      
      try {
        // First try to get user data by auth_id
        let { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('auth_id', user.id)
          .single();
        
        // If not found, try to create the user record
        if (error && error.code === 'PGRST116') { // No rows returned
          console.log('User record not found, attempting to create one');
          
          // Create user record based on auth data
          const { data: newUser, error: createError } = await supabase
            .from('users')
            .insert({
              auth_id: user.id,
              email: user.email,
              first_name: user.user_metadata?.first_name || '',
              last_name: user.user_metadata?.last_name || '',
              role: user.user_metadata?.role || 'donor',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .select()
            .single();
            
          if (createError) {
            console.error('Error creating user record:', createError);
            setError('Failed to create user profile');
            return;
          }
          
          data = newUser;
        } else if (error) {
          console.error('Error fetching user data:', error);
          setError('Failed to load profile data');
          return;
        }
        
        setDbUser(data as DbUser);
        setFormData({
          firstName: data.first_name || user.user_metadata?.first_name || '',
          lastName: data.last_name || user.user_metadata?.last_name || '',
          email: data.email || user.email || '',
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
  }, [user, isLoading]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveProfile = async () => {
    if (!user || !dbUser) return;
    
    setSaving(true);
    setError('');
    setSuccess('');
    
    try {
      // Update user in the database
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
      
      // Update local state
      setDbUser(prev => {
        if (!prev) return null;
        return {
          ...prev,
          first_name: formData.firstName,
          last_name: formData.lastName,
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
      <div className="container mx-auto py-10">
        <div className="flex justify-center items-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-8">Your Profile</h1>
      
      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-md mb-6">
          {error}
        </div>
      )}
      
      {success && (
        <div className="bg-green-50 text-green-700 p-4 rounded-md mb-6">
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
                key={refreshTimestamp}
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
        </div>
        
        <div className="md:col-span-3">
          <Tabs defaultValue="basic">
            <TabsList className="mb-6">
              <TabsTrigger value="basic">Basic Information</TabsTrigger>
              <TabsTrigger value="account">Account Details</TabsTrigger>
            </TabsList>
            
            <TabsContent value="basic">
              <Card>
                <CardHeader>
                  <CardTitle>Profile Information</CardTitle>
                  <CardDescription>Update your personal information</CardDescription>
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
                    <p className="text-sm text-muted-foreground">Email cannot be changed directly</p>
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
            
            <TabsContent value="account">
              <Card>
                <CardHeader>
                  <CardTitle>Account Information</CardTitle>
                  <CardDescription>Your account details and role information</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Account Type</p>
                    <p className="text-sm capitalize font-medium inline-block px-3 py-1 bg-blue-100 text-blue-800 rounded-full">
                      {user?.user_metadata?.role || dbUser?.role || 'User'}
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Account Created</p>
                    <p className="text-sm text-muted-foreground">
                      {dbUser?.created_at ? new Date(dbUser.created_at).toLocaleDateString() : 'Unknown'}
                    </p>
                  </div>
                  
                  {user?.user_metadata?.role === 'teacher' && (
                    <div className="p-4 bg-blue-50 rounded-md mt-4">
                      <h3 className="font-medium text-blue-800 mb-2">Teacher Dashboard</h3>
                      <p className="text-sm text-blue-700 mb-3">Access your teacher-specific features from the dashboard</p>
                      <Button 
                        variant="outline" 
                        onClick={() => router.push('/teacher/dashboard')}
                      >
                        Go to Teacher Dashboard
                      </Button>
                    </div>
                  )}
                  
                  {user?.user_metadata?.role === 'admin' && (
                    <div className="p-4 bg-amber-50 rounded-md mt-4">
                      <h3 className="font-medium text-amber-800 mb-2">Admin Dashboard</h3>
                      <p className="text-sm text-amber-700 mb-3">Access your admin controls from the dashboard</p>
                      <Button 
                        variant="outline" 
                        onClick={() => router.push('/admin/dashboard')}
                      >
                        Go to Admin Dashboard
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
} 