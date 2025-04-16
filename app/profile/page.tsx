"use client"

import { useState, useEffect, useRef } from "react"
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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Switch } from "@/components/ui/switch"
import { 
  User, 
  School, 
  MapPin, 
  Save, 
  ChevronLeft, 
  Globe, 
  Twitter, 
  Facebook, 
  Instagram, 
  Linkedin, 
  Github, 
  ShieldCheck, 
  BookOpen,
  Upload,
  Camera
} from "lucide-react"
import Link from "next/link"

// Define types for profile data
interface TeacherProfile {
  id: string;
  school_name?: string;
  school_district?: string;
  position_title?: string;
  account_status?: string;
  school_address?: string;
  school_city?: string;
  school_state?: string;
  school_postal_code?: string;
  bio?: string;
  philosophy?: string;
}

interface DonorProfile {
  id: string;
  donation_total?: number;
  projects_supported?: number;
  is_anonymous_by_default?: boolean;
}

interface Testimonial {
  text?: string;
  author?: string;
  role?: string;
  years_experience?: string;
  is_public?: boolean;
}

interface ProfileData {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  bio?: string;
  philosophy?: string;
  created_at?: string;
  updated_at?: string;
  accent_color?: string;
  website_url?: string;
  twitter_url?: string;
  facebook_url?: string;
  instagram_url?: string;
  linkedin_url?: string;
  github_url?: string;
  testimonial?: Testimonial;
  profile?: TeacherProfile | DonorProfile;
  profile_image_url?: string;
}

// Type guard to check if profile is TeacherProfile
function isTeacherProfile(profile: any): profile is TeacherProfile {
  return profile && (
    (profile as TeacherProfile).school_name !== undefined || 
    (profile as TeacherProfile).position_title !== undefined
  );
}

// Type guard to check if profile is DonorProfile
function isDonorProfile(profile: any): profile is DonorProfile {
  return profile && (profile as DonorProfile).donation_total !== undefined;
}

export default function ProfilePage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState<ProfileData>({
    id: '',
    first_name: '',
    last_name: '',
    email: '',
    role: 'teacher',
    bio: '',
    created_at: '',
    updated_at: '',
    profile_image_url: '',
    profile: {
      id: '',
      school_name: '',
      school_district: '',
      school_address: '',
      school_city: '',
      school_state: '',
      school_postal_code: '',
      position_title: '',
      bio: '',
      philosophy: '',
    } as TeacherProfile
  });
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imageError, setImageError] = useState(false);

  // Function to create a user profile - defined at component level for access everywhere
  const createUserProfile = async () => {
    if (!user) return null;
    
    console.log('Creating user profile for user:', user.id);
    
    try {
      // Create a basic profile
      const firstName = user.user_metadata?.first_name || user.email?.split('@')[0] || '';
      const lastName = user.user_metadata?.last_name || '';
      
      const newProfile = {
        id: user.id,
        email: user.email,
        first_name: firstName,
        last_name: lastName,
        role: user.user_metadata?.role || 'teacher', // Default to teacher
        created_at: new Date().toISOString(),
        // Set a default accent color for the avatar based on name
        accent_color: getThemeColor(firstName + lastName)
      };
      
      // Insert the profile directly without RPC
      const { data: insertedProfile, error: insertError } = await supabase
        .from('profiles')
        .upsert(newProfile)
        .select();
        
      if (insertError) {
        console.error('Error creating profile via upsert:', insertError);
        return null;
      }
      
      console.log('Successfully created profile:', insertedProfile?.[0] || insertedProfile);
      return insertedProfile?.[0] || insertedProfile;
    } catch (error) {
      console.error('Exception in createUserProfile:', error);
      return null;
    }
  };

  useEffect(() => {
    // Redirect if not logged in
    if (!isLoading && !user) {
      router.push('/auth');
      return;
    }

    const ensureTables = async () => {
      try {
        // Check if profiles table exists
        const { error: checkProfilesError } = await supabase
          .from('profiles')
          .select('id')
          .limit(1);

        if (checkProfilesError && checkProfilesError.code === '42P01') {
          console.log('Profiles table does not exist, trying to create it...');
          try {
            // Try using the RPC function
            await supabase.rpc('create_profiles_table', {});
          } catch (rpcError) {
            console.error('Error calling create_profiles_table RPC:', rpcError);
            console.log('Table creation via RPC failed. Please run the SQL migrations manually.');
            alert('Database setup is incomplete. Please contact the administrator or run the migrations in /migrations/create_tables.sql');
          }
        }

        // Check if teacher_profiles table exists
        const { error: checkTeacherProfilesError } = await supabase
          .from('teacher_profiles')
          .select('id')
          .limit(1);

        if (checkTeacherProfilesError && checkTeacherProfilesError.code === '42P01') {
          console.log('Teacher profiles table does not exist, trying to create it...');
          try {
            // Try using the RPC function
            await supabase.rpc('create_teacher_profiles_table', {});
          } catch (rpcError) {
            console.error('Error calling create_teacher_profiles_table RPC:', rpcError);
            console.log('Table creation via RPC failed. Please run the SQL migrations manually.');
          }
        }
      } catch (error) {
        console.error('Error checking or creating tables:', error);
      }
    };

    const fetchUserProfile = async () => {
      if (!user) return;
      
      // Log user information for debugging
      console.log('Current user:', { 
        id: user.id, 
        email: user.email,
        metadata: user.user_metadata
      });

      try {
        setLoading(true);
        
        // First ensure tables exist
        await ensureTables();
        
        // Get the user record
        const { data: userData, error: userError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (userError) {
          console.error('Error fetching user data:', userError);
          
          // Try creating the profile
          const newProfile = await createUserProfile();
          
          if (newProfile) {
            setProfileData(newProfile as ProfileData);
            setFormData(newProfile as ProfileData);
            setLoading(false);
            return;
          }
          
          // If creating also failed, use fallback
          setLoading(false);
          return;
        }

        // Log profile data for debugging
        console.log('DEBUG - Fetched profile data:', userData);
        console.log('DEBUG - Philosophy field in profiles:', userData.philosophy);

        // Fetch role-specific profile data based on user role
        if (userData.role === 'teacher') {
          console.log('DEBUG - Fetching teacher profile data');
          
          // Get teacher profile
          const { data: teacherData, error: teacherError } = await supabase
            .from('teacher_profiles')
            .select('id, school_name, school_district, school_address, school_city, school_state, school_postal_code, position_title, employment_verified, nonprofit_status_verified, account_status, bio, philosophy')
            .eq('user_id', userData.id)
            .maybeSingle();
          
          if (teacherError) {
            console.error('Error fetching teacher profile:', teacherError);
          } else if (teacherData) {
            console.log('DEBUG - Teacher profile found:', teacherData);
            console.log('DEBUG - Philosophy field:', teacherData.philosophy);
            userData.profile = teacherData;
          }
        } else if (userData.role === 'donor') {
          try {
            const { data: donorProfile, error: donorError } = await supabase
              .from('donor_profiles')
              .select('*')
              .eq('user_id', userData.id)
              .single();

            if (donorError) {
              console.error('Error fetching donor profile:', donorError);
              
              // If table doesn't exist or record doesn't exist, we can proceed without the donor profile
              if (donorError.code === 'PGRST116' || donorError.code === '42P01') {
                console.log('Donor profile not found or table does not exist');
              }
            } else if (donorProfile) {
              userData.profile = donorProfile;
            }
          } catch (error) {
            console.error('Exception in donor profile fetch:', error);
          }
        }

        setProfileData(userData as ProfileData);
        setFormData(userData as ProfileData);
        setLoading(false);
      } catch (error) {
        console.error('Error in fetchUserProfile:', error);
        setLoading(false);
      }
    };

    if (user) {
      fetchUserProfile();
    }
  }, [user, isLoading, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name.startsWith('profile.') && formData) {
      const profileField = name.split('.')[1];
      setFormData({
        ...formData,
        profile: {
          ...formData.profile as (TeacherProfile | DonorProfile),
          [profileField]: value
        } as (TeacherProfile | DonorProfile)
      });
    } else {
      setFormData(formData ? {
        ...formData,
        [name]: value
      } : {} as ProfileData);
    }
  };

  const handleTestimonialToggle = () => {
    setFormData(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        testimonial: {
          ...(prev.testimonial || {}),
          is_public: !(prev.testimonial?.is_public)
        }
      };
    });
  };

  const handleSave = async () => {
    if (!user || !formData) return;
    
    try {
      setSaving(true);
      
      console.log("Saving profile with data:", formData);
      
      // Update basic profile data
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          first_name: formData.first_name,
          last_name: formData.last_name,
          bio: formData.bio,
          website_url: formData.website_url,
          twitter_url: formData.twitter_url,
          facebook_url: formData.facebook_url,
          instagram_url: formData.instagram_url,
          linkedin_url: formData.linkedin_url,
          github_url: formData.github_url,
          testimonial: formData.testimonial,
          profile_image_url: formData.profile_image_url,
          philosophy: formData.philosophy // Save philosophy directly to profiles table
        })
        .eq('id', user.id);
      
      if (profileError) {
        console.error('Error updating profile:', profileError);
        alert('Error updating profile. Please try again.');
        setSaving(false);
        return;
      }
      
      // Update role-specific profile data
      if (formData.role === 'teacher' && formData.profile) {
        if (isTeacherProfile(formData.profile)) {
          console.log("DEBUG - Attempting to update teacher profile with bio:", formData.profile.bio);
          console.log("DEBUG - Teacher profile ID:", formData.profile.id);
          
          try {
            // Check if a teacher profile already exists
            const { data: existingProfile, error: fetchError } = await supabase
              .from('teacher_profiles')
              .select('id')
              .eq('user_id', user.id)
              .maybeSingle();
            
            if (fetchError) {
              console.error('DEBUG - Error checking existing teacher profile:', fetchError);
              throw fetchError;
            }
            
            let teacherProfileId;
            
            // If profile doesn't exist, create one
            if (!existingProfile) {
              console.log('DEBUG - Creating new teacher profile for user:', user.id);
              
              const teacherProfile = formData.profile as TeacherProfile;
              
              const { data: newTeacherProfile, error: createError } = await supabase
                .from('teacher_profiles')
                .insert({
                  user_id: user.id,
                  school_name: teacherProfile.school_name || null,
                  position_title: teacherProfile.position_title || null,
                  school_address: teacherProfile.school_address || null,
                  school_city: teacherProfile.school_city || null,
                  school_state: teacherProfile.school_state || null,
                  school_postal_code: teacherProfile.school_postal_code || null,
                  bio: teacherProfile.bio || null,
                  philosophy: teacherProfile.philosophy || null
                })
                .select()
                .single();
                
              if (createError) {
                console.error('DEBUG - Error creating teacher profile:', createError);
                throw createError;
              }
              
              teacherProfileId = newTeacherProfile.id;
              console.log('DEBUG - Created new teacher profile with ID:', teacherProfileId);
            } else {
              teacherProfileId = existingProfile.id;
              console.log('DEBUG - Found existing teacher profile with ID:', teacherProfileId);
              
              // Update the existing profile - all fields at once including bio
              const teacherProfile = formData.profile as TeacherProfile;
              
              const { error: updateError } = await supabase
                .from('teacher_profiles')
                .update({
                  school_name: teacherProfile.school_name || null,
                  position_title: teacherProfile.position_title || null,
                  school_address: teacherProfile.school_address || null,
                  school_city: teacherProfile.school_city || null,
                  school_state: teacherProfile.school_state || null,
                  school_postal_code: teacherProfile.school_postal_code || null,
                  bio: teacherProfile.bio || null,
                  philosophy: teacherProfile.philosophy || null
                })
                .eq('id', teacherProfileId);
                
              if (updateError) {
                console.error('DEBUG - Error updating teacher profile:', updateError);
                throw updateError;
              }
              
              console.log('DEBUG - Teacher profile updated successfully');
            }
          } catch (error) {
            console.error('DEBUG - Error handling teacher profile:', error);
            alert('There was an issue updating your teacher profile. Please try again.');
            setSaving(false);
            return;
          }
        }
      }
      
      // Refresh data
      setProfileData(formData);
      setEditMode(false);
      alert('Profile updated successfully!');
    } catch (error) {
      console.error('Error saving profile:', error);
      alert('Error saving profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

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
  
  // Get user's initials for avatar
  const getUserInitials = (firstName?: string, lastName?: string) => {
    if (!firstName && !lastName) return "U";
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`;
  };
  
  // Handle image upload
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    
    try {
      setUploadingImage(true);
      
      // Create a unique filename using the user's ID and timestamp
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/profile.${fileExt}`;
      const filePath = `${fileName}`;
      
      console.log('Attempting to upload file to path:', filePath);
      
      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('profile_images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });
        
      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw uploadError;
      }
      
      // Get the public URL
      const { data } = supabase.storage
        .from('profile_images')
        .getPublicUrl(filePath);
        
      const publicUrl = data.publicUrl;
      
      console.log("Uploaded image URL:", publicUrl);
      
      // Check if image URL is accessible
      try {
        console.log('Verifying image URL is accessible...');
        const response = await fetch(publicUrl, { method: 'HEAD' });
        if (!response.ok) {
          console.warn(`Image URL verification failed with status ${response.status}`);
        } else {
          console.log('Image URL verification succeeded!');
        }
      } catch (verifyError) {
        console.warn('Error verifying image URL:', verifyError);
        // Continue anyway as this is just a verification step
      }
      
      // Update user profile with new image URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ profile_image_url: publicUrl })
        .eq('id', user.id);
        
      if (updateError) {
        console.error('Error updating profile with new image:', updateError);
        throw updateError;
      }
      
      // Update state to show new image
      setProfileData(prev => {
        if (!prev) return prev;
        return { ...prev, profile_image_url: publicUrl };
      });
      
      setFormData(prev => {
        if (!prev) return prev;
        return { ...prev, profile_image_url: publicUrl };
      });
      
      alert("Profile picture updated successfully!");
    } catch (error) {
      console.error('Error uploading image:', error);
      alert("Failed to upload image. Please try again.");
    } finally {
      setUploadingImage(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Handle image error
  const handleImageError = () => {
    console.log("Failed to load profile image");
    setImageError(true);
  };
  
  // Handle image load success
  const handleImageLoad = () => {
    setImageError(false);
  };

  if (isLoading || loading) {
    return (
      <div className="container mx-auto py-10">
        <div className="flex justify-center items-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto py-10">
        <div className="text-center py-10">
          <h1 className="text-2xl font-bold text-gray-800">Account not found</h1>
          <p className="mt-2 text-gray-600">Please sign in to view your profile.</p>
          <Button className="mt-4" onClick={() => router.push('/auth')}>
            Sign In
          </Button>
        </div>
      </div>
    );
  }
  
  // If user is authenticated but profile couldn't be loaded, create a minimal profile
  if (!profileData) {
    const minimalProfile: ProfileData = {
      id: user.id,
      first_name: user.user_metadata?.first_name || user.email?.split('@')[0] || '',
      last_name: user.user_metadata?.last_name || '',
      email: user.email || '',
      role: user.user_metadata?.role || 'teacher',
      created_at: new Date().toISOString()
    };
    
    return (
      <div className="container mx-auto py-10">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center">
            <Link href="/dashboard" className="mr-4">
              <Button variant="ghost" size="icon">
                <ChevronLeft className="h-5 w-5" />
              </Button>
            </Link>
            <h1 className="text-2xl font-bold text-[#0E5D7F]">My Profile</h1>
          </div>
          <Button 
            onClick={async () => {
              setLoading(true);
              const newProfile = await createUserProfile();
              if (newProfile) {
                setProfileData(newProfile as ProfileData);
                setFormData(newProfile as ProfileData);
                setLoading(false);
              } else {
                setLoading(false);
                alert("We couldn't create your profile. Please try again later.");
              }
            }}
            className="bg-[#3AB5E9] hover:bg-[#3AB5E9]/90"
          >
            Setup Profile
          </Button>
        </div>
        
        <div className="bg-white rounded-lg p-8 shadow-sm border">
          <div className="text-center mb-6">
            <Avatar className="h-24 w-24 mx-auto mb-4">
              <AvatarFallback className="bg-[#3AB5E9] text-xl">
                {minimalProfile.first_name?.charAt(0)}{minimalProfile.last_name?.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <h2 className="text-xl font-semibold text-[#0E5D7F]">
              {minimalProfile.first_name} {minimalProfile.last_name}
            </h2>
            <p className="text-sm text-muted-foreground">{minimalProfile.email}</p>
          </div>
          
          <div className="bg-yellow-50 p-4 rounded-md border border-yellow-200 mb-6">
            <p className="text-yellow-800 text-sm">
              We encountered an issue loading your profile data. This could be because you're a new user or 
              there was a database connection issue. Click "Setup Profile" to create your profile.
            </p>
          </div>
          
          <div className="flex justify-center">
            <Button onClick={() => window.location.reload()} className="mr-4">
              Try Again
            </Button>
            <Button 
              onClick={async () => {
                setLoading(true);
                const newProfile = await createUserProfile();
                if (newProfile) {
                  setProfileData(newProfile as ProfileData);
                  setFormData(newProfile as ProfileData);
                  setLoading(false);
                } else {
                  setLoading(false);
                  alert("We couldn't create your profile. Please try again later.");
                }
              }}
              className="bg-[#3AB5E9] hover:bg-[#3AB5E9]/90"
            >
              Setup Profile
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10 px-4">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center">
          <Link href="/dashboard" className="mr-4">
            <Button variant="ghost" size="icon">
              <ChevronLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold text-[#0E5D7F]">My Profile</h1>
        </div>
        {!editMode ? (
          <Button 
            onClick={() => setEditMode(true)}
            className="bg-[#3AB5E9] hover:bg-[#3AB5E9]/90"
          >
            Edit Profile
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => {
                setFormData(profileData);
                setEditMode(false);
              }}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSave}
              disabled={saving}
              className="bg-[#3AB5E9] hover:bg-[#3AB5E9]/90"
            >
              {saving ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-t-transparent"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Sidebar */}
        <div className="md:col-span-1">
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col items-center space-y-4">
                <div className="relative group">
                  <div className={`h-24 w-24 rounded-full overflow-hidden relative ${editMode ? 'cursor-pointer hover:opacity-90 transition-opacity' : ''}`} 
                       onClick={() => editMode && fileInputRef.current?.click()}>
                    <Avatar className="h-24 w-24">
                      {profileData.profile_image_url && !imageError ? (
                        <AvatarImage 
                          src={profileData.profile_image_url} 
                          alt={`${profileData.first_name} ${profileData.last_name}`}
                          onError={handleImageError}
                          onLoad={handleImageLoad}
                          className="object-cover"
                        />
                      ) : null}
                      <AvatarFallback 
                        className="text-xl" 
                        style={{ 
                          backgroundColor: getThemeColor(profileData.first_name + profileData.last_name)
                        }}
                      >
                        {getUserInitials(profileData.first_name, profileData.last_name)}
                      </AvatarFallback>
                    </Avatar>
                    
                    {editMode && (
                      <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                        <Camera className="h-8 w-8 text-white" />
                      </div>
                    )}
                  </div>
                  
                  {editMode && (
                    <>
                      <div 
                        className="absolute bottom-0 right-0 rounded-full bg-[#3AB5E9] p-1.5 text-white cursor-pointer shadow-md hover:bg-[#3AB5E9]/90 transition-colors z-10"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <Camera className="h-4 w-4" />
                      </div>
                      <input 
                        type="file" 
                        ref={fileInputRef}
                        onChange={handleImageUpload}
                        accept="image/*"
                        className="hidden"
                      />
                      <div className="absolute bottom-14 right-0 opacity-0 group-hover:opacity-100 transition-opacity bg-white p-2 rounded shadow-lg text-xs text-gray-700 w-48">
                        Click to update your profile picture
                      </div>
                    </>
                  )}
                  
                  {uploadingImage && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-full z-20">
                      <div className="h-8 w-8 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                    </div>
                  )}
                </div>
                <div className="text-center">
                  <h2 className="text-xl font-semibold text-[#0E5D7F]">
                    {profileData.first_name} {profileData.last_name}
                  </h2>
                  <p className="text-sm text-muted-foreground">{profileData.email}</p>
                </div>
                
                {/* Role badge */}
                <div className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {profileData.role.charAt(0).toUpperCase() + profileData.role.slice(1)}
                </div>
                
                <div className="w-full space-y-2 pt-4">
                  {profileData.role === 'teacher' && profileData.profile && isTeacherProfile(profileData.profile) && (
                    <>
                      <div className="flex items-center gap-2 text-sm">
                        <School className="h-4 w-4 text-[#3AB5E9]" />
                        <span>{profileData.profile.school_name}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <User className="h-4 w-4 text-[#E96951]" />
                        <span>{profileData.profile.position_title}</span>
                      </div>
                      {profileData.profile.school_city && profileData.profile.school_state && (
                        <div className="flex items-center gap-2 text-sm">
                          <MapPin className="h-4 w-4 text-[#A8BF87]" />
                          <span>
                            {profileData.profile.school_city}, {profileData.profile.school_state}
                          </span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-sm">
                        <ShieldCheck className="h-4 w-4 text-[#F7DBA7]" />
                        <span>
                          {profileData.profile.account_status === 'active' 
                            ? 'Verified Teacher' 
                            : 'Verification Pending'}
                        </span>
                      </div>
                    </>
                  )}
                  
                  {/* Social links */}
                  <div className="border-t pt-4 mt-4">
                    <h3 className="text-sm font-medium mb-2">Connect with me</h3>
                    <div className="flex flex-wrap gap-2">
                      {profileData.website_url && (
                        <a href={profileData.website_url} target="_blank" rel="noopener noreferrer">
                          <Button variant="outline" size="icon" className="h-8 w-8 rounded-full">
                            <Globe className="h-4 w-4" />
                          </Button>
                        </a>
                      )}
                      {profileData.twitter_url && (
                        <a href={profileData.twitter_url} target="_blank" rel="noopener noreferrer">
                          <Button variant="outline" size="icon" className="h-8 w-8 rounded-full">
                            <Twitter className="h-4 w-4" />
                          </Button>
                        </a>
                      )}
                      {profileData.facebook_url && (
                        <a href={profileData.facebook_url} target="_blank" rel="noopener noreferrer">
                          <Button variant="outline" size="icon" className="h-8 w-8 rounded-full">
                            <Facebook className="h-4 w-4" />
                          </Button>
                        </a>
                      )}
                      {profileData.instagram_url && (
                        <a href={profileData.instagram_url} target="_blank" rel="noopener noreferrer">
                          <Button variant="outline" size="icon" className="h-8 w-8 rounded-full">
                            <Instagram className="h-4 w-4" />
                          </Button>
                        </a>
                      )}
                      {profileData.linkedin_url && (
                        <a href={profileData.linkedin_url} target="_blank" rel="noopener noreferrer">
                          <Button variant="outline" size="icon" className="h-8 w-8 rounded-full">
                            <Linkedin className="h-4 w-4" />
                          </Button>
                        </a>
                      )}
                      {profileData.github_url && (
                        <a href={profileData.github_url} target="_blank" rel="noopener noreferrer">
                          <Button variant="outline" size="icon" className="h-8 w-8 rounded-full">
                            <Github className="h-4 w-4" />
                          </Button>
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-center border-t p-4">
              <div className="flex flex-col gap-2 w-full">
                <Link href="/profile">
                  <Button
                    variant="outline"
                    className="w-full justify-start bg-navy/10 border-navy text-navy hover:bg-navy/20"
                  >
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </Button>
                </Link>
                {profileData.role === 'teacher' && (
                  <Link href="/teacher/projects">
                    <Button
                      variant="outline"
                      className="w-full justify-start bg-navy/10 border-navy text-navy hover:bg-navy/20"
                    >
                      <BookOpen className="mr-2 h-4 w-4" />
                      My Projects
                    </Button>
                  </Link>
                )}
              </div>
            </CardFooter>
          </Card>
        </div>

        {/* Main Content */}
        <div className="md:col-span-2">
          <Tabs defaultValue="about" className="w-full">
            <TabsList className="mb-6 grid w-full grid-cols-4">
              <TabsTrigger value="about">About</TabsTrigger>
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="social">Social</TabsTrigger>
              <TabsTrigger value="testimonial">Testimonial</TabsTrigger>
            </TabsList>

            <TabsContent value="about">
              <Card>
                <CardHeader>
                  <CardTitle className="text-[#0E5D7F]">About Me</CardTitle>
                  <CardDescription>Share information about yourself and your teaching philosophy.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {editMode ? (
                    <div className="grid gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="bio">Bio</Label>
                        <Textarea
                          id="bio"
                          name="bio"
                          value={formData?.bio || ''}
                          onChange={handleChange}
                          placeholder="Tell us about yourself and your teaching experience"
                          rows={6}
                        />
                      </div>
                      
                      {profileData.role === 'teacher' && (
                        <div className="grid gap-2">
                          <Label htmlFor="philosophy">Teaching Philosophy</Label>
                          <Textarea
                            id="philosophy"
                            name="philosophy"
                            value={formData?.philosophy || ''}
                            onChange={handleChange}
                            placeholder="Describe your approach to teaching and what inspires you"
                            rows={6}
                          />
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-lg font-medium text-[#0E5D7F] mb-2">Bio</h3>
                        <div className="bg-slate-50 p-4 rounded-md">
                          {profileData.bio ? (
                            <p className="text-gray-700">{profileData.bio}</p>
                          ) : (
                            <p className="text-gray-500 italic">No bio provided yet.</p>
                          )}
                        </div>
                      </div>

                      {profileData.role === 'teacher' && (
                        <div>
                          <h3 className="text-lg font-medium text-[#0E5D7F] mb-2">Teaching Philosophy</h3>
                          <div className="bg-slate-50 p-4 rounded-md">
                            {profileData.philosophy ? (
                              <p className="text-gray-700">{profileData.philosophy}</p>
                            ) : (
                              <p className="text-gray-500 italic">No teaching philosophy provided yet.</p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="details">
              <Card>
                <CardHeader>
                  <CardTitle className="text-[#0E5D7F]">Profile Details</CardTitle>
                  <CardDescription>Update your personal information.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {editMode ? (
                    <div className="grid gap-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                          <Label htmlFor="first_name">First Name</Label>
                          <Input
                            id="first_name"
                            name="first_name"
                            value={formData?.first_name || ''}
                            onChange={handleChange}
                            placeholder="Your first name"
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="last_name">Last Name</Label>
                          <Input
                            id="last_name"
                            name="last_name"
                            value={formData?.last_name || ''}
                            onChange={handleChange}
                            placeholder="Your last name"
                          />
                        </div>
                      </div>
                      
                      <div className="grid gap-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          name="email"
                          value={formData?.email || ''}
                          disabled
                          className="bg-slate-50"
                        />
                        <p className="text-xs text-muted-foreground">Email cannot be changed. Contact support for assistance.</p>
                      </div>
                      
                      {formData?.role === 'teacher' && formData?.profile && isTeacherProfile(formData.profile) && (
                        <>
                          <div className="grid gap-2">
                            <Label htmlFor="profile.school_name">School Name</Label>
                            <Input
                              id="profile.school_name"
                              name="profile.school_name"
                              value={(formData.profile as TeacherProfile).school_name || ''}
                              onChange={handleChange}
                              placeholder="Name of your school"
                            />
                          </div>
                          
                          <div className="grid gap-2">
                            <Label htmlFor="profile.position_title">Position Title</Label>
                            <Input
                              id="profile.position_title"
                              name="profile.position_title"
                              value={(formData.profile as TeacherProfile).position_title || ''}
                              onChange={handleChange}
                              placeholder="Your position or title"
                            />
                          </div>
                          
                          <div className="grid gap-2">
                            <Label htmlFor="profile.school_address">School Address</Label>
                            <Input
                              id="profile.school_address"
                              name="profile.school_address"
                              value={(formData.profile as TeacherProfile).school_address || ''}
                              onChange={handleChange}
                              placeholder="Street address"
                            />
                          </div>
                          
                          <div className="grid grid-cols-3 gap-4">
                            <div className="grid gap-2">
                              <Label htmlFor="profile.school_city">City</Label>
                              <Input
                                id="profile.school_city"
                                name="profile.school_city"
                                value={(formData.profile as TeacherProfile).school_city || ''}
                                onChange={handleChange}
                                placeholder="City"
                              />
                            </div>
                            <div className="grid gap-2">
                              <Label htmlFor="profile.school_state">State</Label>
                              <Input
                                id="profile.school_state"
                                name="profile.school_state"
                                value={(formData.profile as TeacherProfile).school_state || ''}
                                onChange={handleChange}
                                placeholder="State"
                              />
                            </div>
                            <div className="grid gap-2">
                              <Label htmlFor="profile.school_postal_code">Postal Code</Label>
                              <Input
                                id="profile.school_postal_code"
                                name="profile.school_postal_code"
                                value={(formData.profile as TeacherProfile).school_postal_code || ''}
                                onChange={handleChange}
                                placeholder="Postal code"
                              />
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <h3 className="text-sm font-medium text-muted-foreground mb-1">First Name</h3>
                          <p className="text-[#0E5D7F] font-medium">{profileData.first_name}</p>
                        </div>
                        <div>
                          <h3 className="text-sm font-medium text-muted-foreground mb-1">Last Name</h3>
                          <p className="text-[#0E5D7F] font-medium">{profileData.last_name}</p>
                        </div>
                      </div>
                      
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground mb-1">Email</h3>
                        <p className="text-[#0E5D7F]">{profileData.email}</p>
                      </div>
                      
                      {profileData.role === 'teacher' && profileData.profile && isTeacherProfile(profileData.profile) && (
                        <>
                          <div className="border-t pt-4">
                            <h3 className="text-lg font-medium text-[#0E5D7F] mb-4">School Information</h3>
                            
                            <div className="grid grid-cols-2 gap-4 mb-4">
                              <div>
                                <h3 className="text-sm font-medium text-muted-foreground mb-1">School Name</h3>
                                <p className="text-[#0E5D7F] font-medium">{profileData.profile.school_name || 'Not provided'}</p>
                              </div>
                              <div>
                                <h3 className="text-sm font-medium text-muted-foreground mb-1">Position Title</h3>
                                <p className="text-[#0E5D7F]">{profileData.profile.position_title || 'Not provided'}</p>
                              </div>
                            </div>
                            
                            <div>
                              <h3 className="text-sm font-medium text-muted-foreground mb-1">School Address</h3>
                              {profileData.profile.school_address ? (
                                <p className="text-[#0E5D7F]">
                                  {profileData.profile.school_address}<br />
                                  {profileData.profile.school_city}, {profileData.profile.school_state} {profileData.profile.school_postal_code}
                                </p>
                              ) : (
                                <p className="text-gray-500 italic">No address provided</p>
                              )}
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="social">
              <Card>
                <CardHeader>
                  <CardTitle className="text-[#0E5D7F]">Social Links</CardTitle>
                  <CardDescription>Connect your social media accounts.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {editMode ? (
                    <div className="grid gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="website_url" className="flex items-center gap-2">
                          <Globe className="h-4 w-4" /> Website
                        </Label>
                        <Input
                          id="website_url"
                          name="website_url"
                          value={formData?.website_url || ''}
                          onChange={handleChange}
                          placeholder="https://yourwebsite.com"
                        />
                      </div>
                      
                      <div className="grid gap-2">
                        <Label htmlFor="twitter_url" className="flex items-center gap-2">
                          <Twitter className="h-4 w-4" /> Twitter
                        </Label>
                        <Input
                          id="twitter_url"
                          name="twitter_url"
                          value={formData?.twitter_url || ''}
                          onChange={handleChange}
                          placeholder="https://twitter.com/yourusername"
                        />
                      </div>
                      
                      <div className="grid gap-2">
                        <Label htmlFor="facebook_url" className="flex items-center gap-2">
                          <Facebook className="h-4 w-4" /> Facebook
                        </Label>
                        <Input
                          id="facebook_url"
                          name="facebook_url"
                          value={formData?.facebook_url || ''}
                          onChange={handleChange}
                          placeholder="https://facebook.com/yourusername"
                        />
                      </div>
                      
                      <div className="grid gap-2">
                        <Label htmlFor="instagram_url" className="flex items-center gap-2">
                          <Instagram className="h-4 w-4" /> Instagram
                        </Label>
                        <Input
                          id="instagram_url"
                          name="instagram_url"
                          value={formData?.instagram_url || ''}
                          onChange={handleChange}
                          placeholder="https://instagram.com/yourusername"
                        />
                      </div>
                      
                      <div className="grid gap-2">
                        <Label htmlFor="linkedin_url" className="flex items-center gap-2">
                          <Linkedin className="h-4 w-4" /> LinkedIn
                        </Label>
                        <Input
                          id="linkedin_url"
                          name="linkedin_url"
                          value={formData?.linkedin_url || ''}
                          onChange={handleChange}
                          placeholder="https://linkedin.com/in/yourusername"
                        />
                      </div>
                      
                      <div className="grid gap-2">
                        <Label htmlFor="github_url" className="flex items-center gap-2">
                          <Github className="h-4 w-4" /> GitHub
                        </Label>
                        <Input
                          id="github_url"
                          name="github_url"
                          value={formData?.github_url || ''}
                          onChange={handleChange}
                          placeholder="https://github.com/yourusername"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <div className="space-y-4">
                        {profileData.website_url || profileData.twitter_url || 
                         profileData.facebook_url || profileData.instagram_url || 
                         profileData.linkedin_url || profileData.github_url ? (
                          <>
                            {profileData.website_url && (
                              <div className="flex items-center">
                                <Globe className="h-5 w-5 mr-3 text-[#3AB5E9]" />
                                <a 
                                  href={profileData.website_url} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-[#0E5D7F] hover:underline"
                                >
                                  {profileData.website_url.replace(/^https?:\/\//, '')}
                                </a>
                              </div>
                            )}
                            
                            {profileData.twitter_url && (
                              <div className="flex items-center">
                                <Twitter className="h-5 w-5 mr-3 text-[#3AB5E9]" />
                                <a 
                                  href={profileData.twitter_url} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-[#0E5D7F] hover:underline"
                                >
                                  {profileData.twitter_url.replace(/^https?:\/\/(www\.)?twitter\.com\//, '@')}
                                </a>
                              </div>
                            )}
                            
                            {profileData.facebook_url && (
                              <div className="flex items-center">
                                <Facebook className="h-5 w-5 mr-3 text-[#3AB5E9]" />
                                <a 
                                  href={profileData.facebook_url} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-[#0E5D7F] hover:underline"
                                >
                                  {profileData.facebook_url.replace(/^https?:\/\/(www\.)?facebook\.com\//, '')}
                                </a>
                              </div>
                            )}
                            
                            {profileData.instagram_url && (
                              <div className="flex items-center">
                                <Instagram className="h-5 w-5 mr-3 text-[#3AB5E9]" />
                                <a 
                                  href={profileData.instagram_url} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-[#0E5D7F] hover:underline"
                                >
                                  {profileData.instagram_url.replace(/^https?:\/\/(www\.)?instagram\.com\//, '@')}
                                </a>
                              </div>
                            )}
                            
                            {profileData.linkedin_url && (
                              <div className="flex items-center">
                                <Linkedin className="h-5 w-5 mr-3 text-[#3AB5E9]" />
                                <a 
                                  href={profileData.linkedin_url} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-[#0E5D7F] hover:underline"
                                >
                                  {profileData.linkedin_url.replace(/^https?:\/\/(www\.)?linkedin\.com\/in\//, '')}
                                </a>
                              </div>
                            )}
                            
                            {profileData.github_url && (
                              <div className="flex items-center">
                                <Github className="h-5 w-5 mr-3 text-[#3AB5E9]" />
                                <a 
                                  href={profileData.github_url} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-[#0E5D7F] hover:underline"
                                >
                                  {profileData.github_url.replace(/^https?:\/\/(www\.)?github\.com\//, '')}
                                </a>
                              </div>
                            )}
                          </>
                        ) : (
                          <div className="text-center py-6">
                            <p className="text-gray-500 italic">No social links added yet.</p>
                            <p className="text-sm text-muted-foreground mt-1">
                              Click "Edit Profile" to add your social media links.
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="testimonial">
              <Card>
                <CardHeader>
                  <CardTitle className="text-[#0E5D7F]">Your Testimonial</CardTitle>
                  <CardDescription>Share your experience to help other educators.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {editMode ? (
                    <div className="grid gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="testimonial.text">Your Testimonial</Label>
                        <Textarea
                          id="testimonial.text"
                          name="testimonial.text"
                          value={formData?.testimonial?.text || ''}
                          onChange={handleChange}
                          placeholder="Share how this platform has impacted your teaching and student learning..."
                          rows={5}
                        />
                      </div>

                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div className="grid gap-2">
                          <Label htmlFor="testimonial.role">Your Role</Label>
                          <Input
                            id="testimonial.role"
                            name="testimonial.role"
                            value={formData?.testimonial?.role || ''}
                            onChange={handleChange}
                            placeholder="e.g., 5th Grade Teacher"
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="testimonial.years_experience">Years of Experience</Label>
                          <Input
                            id="testimonial.years_experience"
                            name="testimonial.years_experience"
                            value={formData?.testimonial?.years_experience || ''}
                            onChange={handleChange}
                            placeholder="e.g., 8"
                          />
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="isPublic"
                          checked={formData?.testimonial?.is_public || false}
                          onChange={handleTestimonialToggle}
                          className="h-4 w-4 rounded border-gray-300 text-[#3AB5E9] focus:ring-[#3AB5E9]"
                        />
                        <Label htmlFor="isPublic" className="text-sm font-medium">
                          Make my testimonial public on the website
                        </Label>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {profileData.testimonial?.text ? (
                        <>
                          <div>
                            <h3 className="text-lg font-medium text-[#0E5D7F] mb-2">Your Testimonial</h3>
                            <div className="bg-slate-50 p-6 rounded-md">
                              <div className="flex items-start gap-4">
                                <div className="flex-shrink-0">
                                  <Avatar className="h-12 w-12">
                                    <AvatarFallback className="bg-[#3AB5E9]">
                                      {profileData.first_name?.charAt(0)}{profileData.last_name?.charAt(0)}
                                    </AvatarFallback>
                                  </Avatar>
                                </div>
                                <div className="flex-1">
                                  <p className="italic text-sm text-gray-700 mb-2">"{profileData.testimonial.text}"</p>
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <p className="font-medium text-[#0E5D7F]">{profileData.first_name} {profileData.last_name}</p>
                                      <p className="text-xs text-[#3AB5E9]">
                                        {profileData.testimonial.role} {profileData.testimonial.years_experience && `• ${profileData.testimonial.years_experience} years`}
                                      </p>
                                    </div>
                                    {profileData.testimonial.is_public ? (
                                      <div className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">Public</div>
                                    ) : (
                                      <div className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">Private</div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </>
                      ) : (
                        <div className="text-center py-6">
                          <p className="text-gray-500 italic">No testimonial added yet.</p>
                          <p className="text-sm text-muted-foreground mt-1">
                            Click "Edit Profile" to add your testimonial.
                          </p>
                        </div>
                      )}
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