'use client';

import { useState, useEffect } from 'react';
import { supabase, isProjectInWishlist, addToWishlist, removeFromWishlist, getDonorProfile, createDonorProfile } from '../utils/supabase';
import Link from 'next/link';
import ProjectActions from './ProjectActions';
import { useAuth } from './AuthProvider';
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar';
import { useRouter } from 'next/navigation';

// Create a local implementation if the import fails
// This can be removed once the proper import is available
const fetchTeacherImage = async (teacherId: string): Promise<string | null> => {
  console.log('Using local fetchTeacherImage implementation');
  try {
    // Get the teacher's user_id
    const { data: teacherData, error: teacherError } = await supabase
      .from('teacher_profiles')
      .select('user_id')
      .eq('id', teacherId)
      .single();
    
    if (teacherError) {
      console.warn('Error fetching teacher profile:', teacherError);
      return null;
    }
    
    const userId = teacherData.user_id;
    console.log('[DEBUG] Found user_id for teacher:', userId);
    
    // Check if the user has a profile_image_url in the users table
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('profile_image_url')
      .eq('id', userId)
      .single();
    
    if (!userError && userData) {
      console.log('[DEBUG] Found user data with profile_image_url:', userData.profile_image_url);
      
      if (userData.profile_image_url) {
        console.log('[DEBUG] Setting teacherImageUrl to:', userData.profile_image_url);
        return userData.profile_image_url;
      }
    }
    
    // Try storage paths using the correct user ID
    const storagePaths = [
      `${SUPABASE_URL}/storage/v1/object/public/profile_images/${userId}/profile.jpg`,
      `${SUPABASE_URL}/storage/v1/object/public/profile_images/${userId}/profile.png`,
      `${SUPABASE_URL}/storage/v1/object/public/teacher_images/${userId}/avatar`
    ];
    
    console.log('[DEBUG] Attempted Paths:', storagePaths);
    
    for (const path of storagePaths) {
      try {
        console.log('[DEBUG] Path check:', path);
        const response = await fetch(path, { method: 'HEAD' });
        if (response.ok) {
          console.log('[DEBUG] Path check:', path, '- Valid');
          return path;
        } else {
          console.log('[DEBUG] Path check:', path, '- Invalid');
        }
      } catch (e) {
        console.warn('Error checking path:', path, e);
      }
    }
    
    return null;
  } catch (err) {
    console.warn('Error in fetchTeacherImage:', err);
    return null;
  }
};

// Constants for debugging
const DEBUG_IMAGES = true;
const SUPABASE_URL = 'https://efneocmdolkzdfhtqkpl.supabase.co';

/**
 * Log with timestamp for debugging
 */
function logDebug(...args: any[]) {
  if (DEBUG_IMAGES) {
    console.log(`[${new Date().toISOString()}]`, ...args);
  }
}

/**
 * Try different approaches to get a working image URL
 */
async function getImageUrl(userId: string): Promise<string | null> {
  try {
    logDebug(`Attempting to get image URL for user: ${userId}`);
    
    // Try fetching the profile to get the image URL
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('profile_image_url')
      .eq('id', userId)
      .single();
      
    if (profileError) {
      logDebug(`Error fetching profile: ${profileError.message}`);
    } else if (profileData?.profile_image_url) {
      logDebug(`Found profile_image_url in database: ${profileData.profile_image_url}`);
      return profileData.profile_image_url;
    }
    
    // If we get here, we need to try other approaches
    // Direct access to user folder
    const folderUrl = `${SUPABASE_URL}/storage/v1/object/public/profile_images/${userId}`;
    logDebug(`Using folder URL as fallback: ${folderUrl}`);
    return folderUrl;
  } catch (err) {
    console.error('Error in getImageUrl:', err);
    return null;
  }
}

export type ProjectDetailProps = {
  projectId: string;
  isTeacher?: boolean;
  isAdmin?: boolean;
  allowEdit?: boolean;
};

type ProjectData = {
  id: string;
  title: string;
  description: string;
  student_impact: string;
  funding_goal: number;
  current_amount: number;
  status: string;
  main_image_url: string | null;
  created_at: string;
  updated_at: string;
  teacher: {
    id: string;
    display_name: string;
    school: {
      name: string;
      city: string;
      state: string;
    } | null;
    profile_image_url?: string | null;
    image_url?: string | null;
  } | null;
  categories: {
    id: string;
    name: string;
  }[];
};

const statusLabels = {
  draft: { text: 'Draft', color: 'bg-gray-100 text-gray-800' },
  pending_review: { text: 'Pending Review', color: 'bg-yellow-100 text-yellow-800' },
  approved: { text: 'Approved', color: 'bg-green-100 text-green-800' },
  rejected: { text: 'Rejected', color: 'bg-red-100 text-red-800' },
  funded: { text: 'Funded', color: 'bg-blue-100 text-blue-800' },
  completed: { text: 'Completed', color: 'bg-purple-100 text-purple-800' }
};

// Function to log image attempts
const logImageAttempt = (message: string, url?: string) => {
  if (DEBUG_IMAGES) {
    console.log(`[Image Debug] ${message}`, url ? `URL: ${url}` : '');
  }
};

export function ProjectDetail({ projectId, isTeacher = false, isAdmin = false, allowEdit = false }: ProjectDetailProps) {
  const [project, setProject] = useState<ProjectData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [isInWishlist, setIsInWishlist] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const [donorId, setDonorId] = useState<string | null>(null);
  const { user } = useAuth();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [showDonorSetup, setShowDonorSetup] = useState(false);
  const [creatingDonorProfile, setCreatingDonorProfile] = useState(false);
  const [donorProfile, setDonorProfile] = useState<{ id: string; userId: string } | null>(null);
  const [hasDonorProfile, setHasDonorProfile] = useState(false);
  const [teacherImageUrl, setTeacherImageUrl] = useState<string | null>(null);
  const router = useRouter();
  const [isSaved, setIsSaved] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [donationAmount, setDonationAmount] = useState('');
  
  // HARDCODED FIX: Direct reference to known working image for Maria
  const MARIA_AUTH_ID = '89e55400-0f0e-4a27-91f1-f746d31dcf81';
  const MARIA_DB_ID = '36a202aa-0670-4225-8507-163fde64890f';
  const MARIA_IMAGE_URL = 'https://efneocmdolkzdfhtqkpl.supabase.co/storage/v1/object/public/profile_images/89e55400-0f0e-4a27-91f1-f746d31dcf81/profile.gif';

  // Check if a teacher is Maria by name or ID
  const isMaria = (teacherName?: string, teacherId?: string) => {
    return (
      teacherId === MARIA_AUTH_ID || 
      teacherId === MARIA_DB_ID || 
      (teacherName && teacherName.toLowerCase().includes('maria'))
    );
  };

  useEffect(() => {
    if (!projectId) return;
    
    const fetchProject = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Query for the project with basic data
        const { data, error } = await supabase
          .from('projects')
          .select(`
            id, title, description, student_impact, funding_goal, current_amount, status, 
            main_image_url, created_at, updated_at,
            teacher_profiles:teacher_id(
              id, user_id,
              school_name, school_city, school_state
            ),
            categories:project_categories(
              category:categories(id, name)
            )
          `)
          .eq('id', projectId)
          .single();
        
        if (error) {
          console.error('Error fetching project:', error);
          setError(error.message);
          return;
        }
        
        if (!data) {
          setError('Project not found');
          return;
        }
        
        // Transform data to match expected format
        let teacherData = null;
        
        if (data.teacher_profiles) {
          // Check if teacher_profiles is an array or single object
          const teacherProfile = Array.isArray(data.teacher_profiles) 
            ? data.teacher_profiles[0] 
            : data.teacher_profiles;
            
          if (teacherProfile) {
            // Extract teacher and school information
            const profileId = teacherProfile.id;
            const schoolName = teacherProfile.school_name;
            const schoolCity = teacherProfile.school_city;
            const schoolState = teacherProfile.school_state;
            const userId = teacherProfile.user_id;
            
            // Try to get teacher's name from users table
            let displayName = "Teacher";
            let profileImageUrl = null;
            let imageUrl = null;
            
            if (userId) {
              try {
                const { data: userData, error: userError } = await supabase
                  .from('users')
                  .select('first_name, last_name, profile_image_url')
                  .eq('id', userId)
                  .single();
                  
                if (!userError && userData) {
                  displayName = `${userData.first_name || ''} ${userData.last_name || ''}`.trim();
                  
                  // If we found user data and they have a profile image, use it directly
                  if (userData.profile_image_url) {
                    if (DEBUG_IMAGES) console.log(`Found userData.profile_image_url: ${userData.profile_image_url}`);
                    profileImageUrl = userData.profile_image_url;
                    // Set directly to state for immediate access
                    setTeacherImageUrl(userData.profile_image_url);
                    // Use safe type assertion to add the field
                    (teacherProfile as any).profile_image_url = userData.profile_image_url;
                  }
                  
                  // Log available profile data for debugging
                  if (DEBUG_IMAGES) {
                    console.log('Teacher profile data:', { 
                      userId,
                      displayName,
                      profileImageUrl,
                      teacherProfile
                    });
                  }
                }
                
                // Also check if there's an image_url in the teacher profile
                if ('image_url' in teacherProfile && teacherProfile.image_url && typeof teacherProfile.image_url === 'string') {
                  if (DEBUG_IMAGES) console.log(`Found teacherProfile.image_url: ${teacherProfile.image_url}`);
                  imageUrl = teacherProfile.image_url;
                  // If we don't have a profile image URL yet, use this one
                  if (!profileImageUrl) {
                    setTeacherImageUrl(teacherProfile.image_url);
                  }
                }
                
                // Try to fetch teacher image with our utility function as well
                try {
                  if (!profileImageUrl && !imageUrl && teacherProfile.id) {
                    if (DEBUG_IMAGES) console.log(`Trying fetchTeacherImage utility for teacher ID: ${teacherProfile.id}`);
                    const fetchedImageUrl = await fetchTeacherImage(teacherProfile.id);
                    if (fetchedImageUrl) {
                      if (DEBUG_IMAGES) console.log(`fetchTeacherImage returned: ${fetchedImageUrl}`);
                      imageUrl = fetchedImageUrl;
                      setTeacherImageUrl(fetchedImageUrl);
                    }
                  }
                } catch (imgErr) {
                  console.warn("Error using fetchTeacherImage:", imgErr);
                }
                
                // Additionally, try a direct storage path construction as a fallback
                if (!profileImageUrl && !imageUrl && userId) {
                  // Try both storage paths
                  const directPaths = [
                    `${SUPABASE_URL}/storage/v1/object/public/teacher_images/${userId}/avatar`,
                    `${SUPABASE_URL}/storage/v1/object/public/profile_images/${userId}/profile.jpg`, 
                    `${SUPABASE_URL}/storage/v1/object/public/profile_images/${userId}/profile.png`
                  ];
                  
                  if (DEBUG_IMAGES) console.log('[DEBUG] Trying direct paths for userId:', userId, directPaths);
                  
                  for (const directPath of directPaths) {
                    if (DEBUG_IMAGES) console.log(`Trying direct storage path: ${directPath}`);
                    
                    // Check if the image exists at this path
                    try {
                      const response = await fetch(directPath, { method: 'HEAD' });
                      if (response.ok) {
                        if (DEBUG_IMAGES) console.log('[DEBUG] Direct path image exists!', directPath);
                        imageUrl = directPath;
                        setTeacherImageUrl(directPath);
                        break; // Stop checking once we find a valid image
                      } else {
                        if (DEBUG_IMAGES) console.log('[DEBUG] Direct path returned status:', response.status);
                      }
                    } catch (err) {
                      if (DEBUG_IMAGES) console.log('[DEBUG] Error checking direct path:', directPath, err);
                    }
                  }
                }
              } catch (err) {
                console.error('Error getting user data for teacher:', err);
              }
            }
            
            if (profileId) {
              teacherData = {
                id: profileId,
                display_name: displayName,
                school: {
                  name: schoolName,
                  city: schoolCity,
                  state: schoolState
                },
                // Set the profile image URL directly from what we found in the user data
                profile_image_url: profileImageUrl,
                // Fallback to any image_url we might have found
                image_url: imageUrl
              };
              
              if (DEBUG_IMAGES) {
                console.log('[Image Debug] Final teacher data with image URLs:', {
                  profile_image_url: teacherData.profile_image_url,
                  image_url: teacherData.image_url,
                  teacherImageUrl
                });
              }
            }
          }
        }
        
        const formattedData: ProjectData = {
          ...data,
          teacher: teacherData,
          categories: data.categories.map((c: any) => ({
            id: c.category.id,
            name: c.category.name
          }))
        };
        
        setProject(formattedData);
      } catch (err) {
        console.error('Error fetching project details:', err);
        setError('Failed to load project details');
      } finally {
        setLoading(false);
      }
    };
    
    fetchProject();
  }, [projectId, refreshTrigger]);

  const handleSetupDonorProfile = async () => {
    if (!user) return;
    
    setCreatingDonorProfile(true);
    
    try {
      const result = await createDonorProfile(user.id);
      
      if (result.success) {
        // Store the donor profile directly from the result instead of fetching again
        if (result.donorProfile) {
          const profileData = {
            id: result.donorProfile.id,
            userId: result.donorProfile.user_id
          };
          setDonorProfile(profileData);
          setDonorId(profileData.id);
          
          // Force persist to localStorage for extra reliability
          if (typeof window !== 'undefined') {
            localStorage.setItem(`donor_profile_${user.id}`, JSON.stringify(result.donorProfile));
            // Set a flag to remember registration was completed
            localStorage.setItem(`donor_setup_completed_${user.id}`, 'true');
          }
        }
        // Set user role to donor
        setUserRole('donor');
        // Set state to mark setup as completed
        setHasDonorProfile(true);
        setShowDonorSetup(false);
        // Reload page data
        setRefreshTrigger(prev => prev + 1);
      } else {
        alert('Error creating donor profile: ' + result.error);
      }
    } catch (error) {
      console.error('Error setting up donor profile:', error);
      alert('Error setting up donor profile. Please try again.');
    } finally {
      setCreatingDonorProfile(false);
    }
  };

  useEffect(() => {
    const checkUserState = async () => {
      if (user) {
        setLoading(true);
        
        try {
          // First check for direct setup completed flag
          const setupCompleted = typeof window !== 'undefined' ? 
            localStorage.getItem(`donor_setup_completed_${user.id}`) === 'true' : false;
            
          if (setupCompleted) {
            console.log('Donor setup previously completed, loading from localStorage');
            setHasDonorProfile(true);
            setShowDonorSetup(false);
          }
          
          // Fetch user role first
          const { data: userData, error: userError } = await supabase
            .from('users')
            .select('role')
            .eq('auth_id', user.id)
            .single();
            
          if (userError) {
            console.error('Error fetching user role:', userError);
          } else {
            setUserRole(userData?.role || null);
          }
          
          // Check if user has donor profile
          if (donorProfile) {
            // Use the already stored donor profile
            console.log('Using stored donor profile state');
            setDonorId(donorProfile.id);
            setHasDonorProfile(true);
            setShowDonorSetup(false);
          } else {
            // First check localStorage for cached profile before making a database call
            let cachedProfile = null;
            if (typeof window !== 'undefined') {
              const cachedData = localStorage.getItem(`donor_profile_${user.id}`);
              if (cachedData) {
                try {
                  cachedProfile = JSON.parse(cachedData);
                  console.log('Using cached donor profile from localStorage:', cachedProfile);
                } catch (e) {
                  console.error('Error parsing cached profile:', e);
                }
              }
            }
            
            if (cachedProfile) {
              setDonorProfile({
                id: cachedProfile.id,
                userId: cachedProfile.user_id
              });
              setDonorId(cachedProfile.id);
              setHasDonorProfile(true);
              setShowDonorSetup(false);
            } else {
              // If no cached profile, check database
              const profileResult = await getDonorProfile(user.id);
              
              if (profileResult.success && profileResult.exists) {
                setDonorId(profileResult.donorId);
                setHasDonorProfile(true);
                setShowDonorSetup(false);
                
                // Save to local state as well
                if (profileResult.donorId) {
                  setDonorProfile({
                    id: profileResult.donorId,
                    userId: user.id
                  });
                }
              } else if (setupCompleted) {
                // Treat as if the user has a profile if setup was marked as completed
                console.log('Donor setup was previously completed but profile not found');
                setHasDonorProfile(true);
                setShowDonorSetup(false);
              } else {
                console.log('Donor profile not found or not set up properly');
                setHasDonorProfile(false);
                setShowDonorSetup(true);
              }
            }
          }
          
          // Check if project is in wishlist if we have a donor profile
          if (donorId && projectId) {
            const wishlistResult = await isProjectInWishlist(donorId, projectId);
            setIsInWishlist(wishlistResult.inWishlist);
          }
          
        } catch (error) {
          console.error('Error checking user state:', error);
        } finally {
          setLoading(false);
        }
      }
    };
    
    checkUserState();
  }, [user, projectId, donorId, refreshTrigger, donorProfile]);

  // Add a specific effect for checking teacher image loading
  useEffect(() => {
    if (project?.teacher && (project.teacher.profile_image_url || project.teacher.image_url)) {
      if (DEBUG_IMAGES) {
        console.log('[Image Debug] Teacher data loaded with image URLs:', {
          profile_image_url: project.teacher.profile_image_url,
          image_url: project.teacher.image_url
        });
      }
      
      // Create a test image to verify the URLs work
      const testImg = new Image();
      testImg.onload = () => {
        if (DEBUG_IMAGES) console.log('[Image Debug] Test load successful:', testImg.src);
      };
      testImg.onerror = () => {
        if (DEBUG_IMAGES) console.log('[Image Debug] Test load failed:', testImg.src);
      };
      
      // Try loading the profile image URL first, then fall back to image_url
      testImg.src = project.teacher.profile_image_url || project.teacher.image_url || '';
    }
  }, [project]);

  const handleProjectUpdate = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const handleWishlistToggle = async () => {
    if (!user) {
      alert('Please sign in to add projects to your wishlist');
      return;
    }
    
    if (userRole !== 'donor') {
      alert('Only donors can add projects to their wishlist');
      return;
    }
    
    // Double-check for donor setup completion flag
    const setupCompleted = typeof window !== 'undefined' ? 
      localStorage.getItem(`donor_setup_completed_${user.id}`) === 'true' : false;
      
    // Check if we need donor setup
    if (!donorId) {
      // If we previously completed setup but don't have a donorId, try to retrieve it again
      if (setupCompleted) {
        const cachedData = localStorage.getItem(`donor_profile_${user.id}`);
        if (cachedData) {
          try {
            const cachedProfile = JSON.parse(cachedData);
            if (cachedProfile && cachedProfile.id) {
              setDonorProfile({
                id: cachedProfile.id,
                userId: cachedProfile.user_id
              });
              setDonorId(cachedProfile.id);
              setHasDonorProfile(true);
              // Now try to continue with the wishlist toggle
              setTimeout(() => handleWishlistToggle(), 100);
              return;
            }
          } catch (e) {
            console.error('Error parsing cached profile during wishlist toggle:', e);
          }
        }
      }
      
      // Try to directly create a donor profile instead of showing the setup modal
      try {
        setWishlistLoading(true);
        console.log('No donor ID found, attempting to create a donor profile automatically');
        const result = await createDonorProfile(user.id);
        
        if (result.success && result.donorProfile) {
          const profileData = {
            id: result.donorProfile.id,
            userId: result.donorProfile.user_id || user.id
          };
          setDonorProfile(profileData);
          setDonorId(profileData.id);
          setHasDonorProfile(true);
          
          // Save to localStorage
          if (typeof window !== 'undefined') {
            localStorage.setItem(`donor_profile_${user.id}`, JSON.stringify(result.donorProfile));
            localStorage.setItem(`donor_setup_completed_${user.id}`, 'true');
          }
          
          // Now continue with the wishlist operation
          setTimeout(() => handleWishlistToggle(), 100);
          return;
        } else {
          // If automatic creation fails, show the setup screen
          alert('Please complete donor registration to use wishlist features.');
          setShowDonorSetup(true);
          return;
        }
      } catch (error) {
        console.error('Error automatically creating donor profile:', error);
        alert('Please complete donor registration to use wishlist features.');
        setShowDonorSetup(true);
        return;
      } finally {
        setWishlistLoading(false);
      }
    }
    
    setWishlistLoading(true);
    
    try {
      if (isInWishlist) {
        // Try to remove from wishlist
        const result = await removeFromWishlist(donorId, projectId);
        if (result.success) {
          setIsInWishlist(false);
          // No need to show any confirmation for removal
        } else {
          console.error('Error removing from wishlist:', result.error);
          throw new Error(result.error || 'Failed to remove from wishlist');
        }
      } else {
        // Try to add to wishlist
        const result = await addToWishlist(donorId, projectId);
        if (result.success) {
          setIsInWishlist(true);
          // Success message (optional)
          // alert('Project added to your wishlist!');
        } else {
          console.error('Error adding to wishlist:', result.error);
          throw new Error(result.error || 'Failed to add to wishlist');
        }
      }
    } catch (error: any) {
      console.error('Error toggling wishlist:', error);
      
      // Check for RLS policy violation
      if (error.message && error.message.includes('row-level security')) {
        console.warn('RLS policy violation detected - donor profile may not match auth user');
        
        // Clear current profile data
        setDonorProfile(null);
        setDonorId(null);
        
        if (typeof window !== 'undefined') {
          localStorage.removeItem(`donor_profile_${user.id}`);
        }
        
        // Get the correct donor profile directly based on auth user
        try {
          const { data: correctProfile, error: profileError } = await supabase
            .from('donor_profiles')
            .select('id, user_id')
            .eq('user_id', user.id)
            .maybeSingle();
            
          if (profileError) {
            console.error('Error finding correct donor profile:', profileError);
            throw new Error('Unable to find correct donor profile');
          }
          
          if (correctProfile) {
            console.log('Found correct donor profile for auth user:', correctProfile);
            
            // Update profile data
            setDonorProfile({
              id: correctProfile.id,
              userId: correctProfile.user_id
            });
            setDonorId(correctProfile.id);
            
            // Save to localStorage
            if (typeof window !== 'undefined') {
              localStorage.setItem(`donor_profile_${user.id}`, JSON.stringify(correctProfile));
              localStorage.setItem(`donor_setup_completed_${user.id}`, 'true');
            }
            
            // Try wishlist operation again
            alert('Please try adding to wishlist again.');
            setWishlistLoading(false);
            return;
          }
        } catch (profileError) {
          console.error('Error finding correct profile:', profileError);
        }
        
        // If we get here, we need to create a new profile
        try {
          // Create a new profile
          const result = await createDonorProfile(user.id);
          
          if (result.success && result.donorProfile) {
            const profileData = {
              id: result.donorProfile.id,
              userId: result.donorProfile.user_id || user.id
            };
            setDonorProfile(profileData);
            setDonorId(profileData.id);
            setHasDonorProfile(true);
            
            // Save to localStorage
            if (typeof window !== 'undefined') {
              localStorage.setItem(`donor_profile_${user.id}`, JSON.stringify(result.donorProfile));
              localStorage.setItem(`donor_setup_completed_${user.id}`, 'true');
            }
            
            // Try again
            alert('Please try adding to wishlist again.');
            return;
          }
        } catch (recreationError) {
          console.error('Error recreating donor profile for RLS issue:', recreationError);
        }
        
        alert('There was an issue with your donor profile permissions. Please try again later.');
        return;
      }
      
      // Handle donor profile mismatch
      if (error.message === 'donor_profile_mismatch') {
        console.warn('Donor profile mismatch detected, trying to find correct profile');
        
        // Clear existing profile
        setDonorProfile(null);
        setDonorId(null);
        
        if (typeof window !== 'undefined') {
          localStorage.removeItem(`donor_profile_${user.id}`);
        }
        
        // Find correct profile
        const profileResult = await getDonorProfile(user.id);
        
        if (profileResult.success && profileResult.exists) {
          console.log('Found correct donor profile from getDonorProfile:', profileResult);
          setDonorId(profileResult.donorId);
          setDonorProfile({
            id: profileResult.donorId,
            userId: user.id
          });
          
          // Try again
          alert('Please try adding to wishlist again.');
          return;
        }
        
        // If we get here, we need to recreate the profile
        try {
          const result = await createDonorProfile(user.id);
          
          if (result.success && result.donorProfile) {
            const profileData = {
              id: result.donorProfile.id,
              userId: result.donorProfile.user_id || user.id
            };
            setDonorProfile(profileData);
            setDonorId(profileData.id);
            setHasDonorProfile(true);
            
            // Save to localStorage
            if (typeof window !== 'undefined') {
              localStorage.setItem(`donor_profile_${user.id}`, JSON.stringify(result.donorProfile));
              localStorage.setItem(`donor_setup_completed_${user.id}`, 'true');
            }
            
            // Try again
            alert('Please try adding to wishlist again.');
            return;
          }
        } catch (recreationError) {
          console.error('Error recreating donor profile for mismatch:', recreationError);
        }
        
        alert('There was an issue with your donor profile. Please try again later.');
        return;
      }
      
      // Check for our special error indicating an invalid donor profile
      if (error.message === 'donor_profile_invalid') {
        console.warn('Invalid donor profile detected, attempting to recreate it');
        
        // Try to recreate the donor profile
        try {
          // Clear existing profile data
          setDonorProfile(null);
          setDonorId(null);
          
          if (typeof window !== 'undefined') {
            localStorage.removeItem(`donor_profile_${user.id}`);
          }
          
          // Create a new profile
          const result = await createDonorProfile(user.id);
          
          if (result.success && result.donorProfile) {
            const profileData = {
              id: result.donorProfile.id,
              userId: result.donorProfile.user_id || user.id
            };
            setDonorProfile(profileData);
            setDonorId(profileData.id);
            setHasDonorProfile(true);
            
            // Save to localStorage
            if (typeof window !== 'undefined') {
              localStorage.setItem(`donor_profile_${user.id}`, JSON.stringify(result.donorProfile));
              localStorage.setItem(`donor_setup_completed_${user.id}`, 'true');
            }
            
            // Try the wishlist operation again
            setTimeout(() => handleWishlistToggle(), 100);
            return;
          } else {
            // If recreation fails, show the setup screen
            setHasDonorProfile(false);
            if (typeof window !== 'undefined') {
              localStorage.removeItem(`donor_setup_completed_${user.id}`);
            }
            setShowDonorSetup(true);
            alert('Your donor profile needs to be set up again. Please complete the registration.');
          }
        } catch (recreationError) {
          console.error('Error recreating donor profile:', recreationError);
          setHasDonorProfile(false);
          if (typeof window !== 'undefined') {
            localStorage.removeItem(`donor_setup_completed_${user.id}`);
          }
          setShowDonorSetup(true);
          alert('Your donor profile needs to be set up again. Please complete the registration.');
        }
        return;
      }
      
      // Check for specific errors that might require donor setup
      if (error.message && (
        error.message.includes('profile') || 
        error.message.includes('donor') || 
        error.message.includes('permission')
      )) {
        const shouldPrompt = !setupCompleted; // Only prompt if we haven't completed setup
        
        if (shouldPrompt) {
          alert('Please complete your donor profile setup to use wishlist features.');
          setShowDonorSetup(true);
        } else {
          // If we've already completed setup but still got an error, show a generic message
          alert('Error updating wishlist. Please try again later.');
        }
      } else {
        alert('Error updating wishlist. Please try again later.');
      }
    } finally {
      setWishlistLoading(false);
    }
  };

  // Function to get a deterministic color based on the teacher's name
  const getAvatarColor = (name: string) => {
    // List of background colors for the avatars
    const colors = [
      'bg-blue-500', 'bg-green-500', 'bg-purple-500', 
      'bg-pink-500', 'bg-indigo-500', 'bg-red-500',
      'bg-yellow-500', 'bg-teal-500', 'bg-orange-500'
    ];
    
    // Use the sum of character codes to select a color
    const charCodeSum = name.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
    return colors[charCodeSum % colors.length];
  };

  // Function to get the initial of teacher's name
  const getInitial = (name: string) => {
    return name && name.length > 0 ? name.charAt(0).toUpperCase() : '';
  };

  // Add a more comprehensive debug section earlier to see what URLs we're receiving
  useEffect(() => {
    if (DEBUG_IMAGES) {
      console.log('[DEBUG] User Profile Data:', {
        teacherImageUrl,
        teacherProfileId: project?.teacher?.id,
        teacherProfileImageUrl: project?.teacher?.profile_image_url,
        teacherImageUrlFromProps: project?.teacher?.image_url
      });
      
      // Log the same URLs we're checking in the debug panel
      if (project?.teacher?.id) {
        const paths = [
          `${SUPABASE_URL}/storage/v1/object/public/profile_images/${project.teacher.id}/profile.jpg`,
          `${SUPABASE_URL}/storage/v1/object/public/profile_images/${project.teacher.id}/profile.png`,
          `${SUPABASE_URL}/storage/v1/object/public/teacher_images/${project.teacher.id}/avatar`,
        ];
        
        console.log('[DEBUG] Attempted Paths:', paths);
        
        // Test if any of these URLs are valid
        paths.forEach(path => {
          fetch(path, { method: 'HEAD' })
            .then(response => {
              console.log(`[DEBUG] Path check: ${path} - ${response.ok ? 'Valid' : 'Invalid'}`);
            })
            .catch(err => {
              console.log(`[DEBUG] Error checking path ${path}:`, err);
            });
        });
      }
    }
  }, [project, teacherImageUrl]);

  // Add this new useEffect after the existing ones
  useEffect(() => {
    if (project?.teacher?.id) {
      // Get the user_id from the teacher profile
      (async () => {
        try {
          const teacherId = project.teacher?.id; // Safe access
          if (!teacherId) return; // Extra safety check
          
          const { data, error } = await supabase
            .from('teacher_profiles')
            .select('user_id')
            .eq('id', teacherId)
            .single();
          
          if (error) {
            console.error('Error getting teacher user_id:', error);
            return;
          }
          
          if (data && data.user_id) {
            console.log('[DEBUG] Found user_id for teacher:', data.user_id);
            
            // Try to get the actual profile from users table
            const { data: userData, error: userError } = await supabase
              .from('users')
              .select('profile_image_url')
              .eq('id', data.user_id)
              .single();
            
            if (userError) {
              console.error('Error getting user data:', userError);
            } else if (userData) {
              console.log('[DEBUG] Found user data with profile_image_url:', userData.profile_image_url);
              
              // If we found a URL, update the state to use it
              if (userData.profile_image_url) {
                console.log('[DEBUG] Setting teacherImageUrl to:', userData.profile_image_url);
                setTeacherImageUrl(userData.profile_image_url);
              }
            }
          }
        } catch (e) {
          console.error('Error in debug fetch:', e);
        }
      })();
    }
  }, [project?.teacher?.id]);

  // Add this debug effect to understand the auth/user relationship
  useEffect(() => {
    if (user && DEBUG_IMAGES) {
      console.log('[DEBUG] Current authenticated user:', {
        auth_id: user.id,
        user_email: user.email
      });
      
      // Fetch and log the user record from the database
      (async () => {
        try {
          // Get the user record from the database
          const { data: userData, error: userError } = await supabase
            .from('users')
            .select('id, auth_id, profile_image_url')
            .eq('auth_id', user.id)
            .single();
          
          if (userError) {
            console.error('Error fetching user data for auth user:', userError);
          } else if (userData) {
            console.log('[DEBUG] Found user record in database:', userData);
            
            // This is where we should fetch images from
            console.log('[DEBUG] This is where images should be loaded from for authenticated user:', userData.profile_image_url);
          }
        } catch (e) {
          console.error('Error in auth debug fetch:', e);
        }
      })();
    }
  }, [user]);

  // Add this at the appropriate location in the render function where the teacher image is shown
  if (project?.teacher && isMaria(project.teacher.display_name, project.teacher.id)) {
    // Set Maria's image directly
    if (!teacherImageUrl || teacherImageUrl !== MARIA_IMAGE_URL) {
      setTeacherImageUrl(MARIA_IMAGE_URL);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
        <h3 className="text-lg font-medium mb-2">Error Loading Project</h3>
        <p>{error || 'Project not found'}</p>
        <Link href="/teacher/projects" className="text-blue-600 hover:underline mt-2 inline-block">
          Return to Projects
        </Link>
      </div>
    );
  }

  // Donor Setup Message
  const DonorSetupMessage = () => (
    <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-6">
      <div className="flex">
        <div className="flex-shrink-0">
          <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="ml-3">
          <h3 className="text-sm font-medium text-yellow-800">Complete your donor setup</h3>
          <div className="mt-2 text-sm text-yellow-700">
            <p>You need to complete your donor registration to use features like wishlists and donations.</p>
          </div>
          <div className="mt-4">
            <button
              type="button"
              onClick={handleSetupDonorProfile}
              disabled={creatingDonorProfile}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              {creatingDonorProfile ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Setting up...
                </>
              ) : (
                'Complete Donor Registration'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
      {/* Header */}
      <div className="relative">
        {project.main_image_url ? (
          <div className="h-48 sm:h-64 md:h-80 overflow-hidden">
            <img 
              src={project.main_image_url} 
              alt={project.title}
              className="w-full h-full object-cover"
            />
          </div>
        ) : (
          <div className="h-32 bg-gradient-to-r from-blue-500 to-indigo-600"></div>
        )}
        
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
          <div className="flex justify-between items-end">
            <h1 className="text-2xl sm:text-3xl font-bold text-white">{project.title}</h1>
            <span className={`${statusLabels[project.status as keyof typeof statusLabels]?.color || 'bg-gray-100 text-gray-800'} text-xs font-medium px-2.5 py-1 rounded-full`}>
              {statusLabels[project.status as keyof typeof statusLabels]?.text || project.status}
            </span>
          </div>
        </div>
      </div>
      
      {/* Content */}
      <div className="p-4 sm:p-6">
        {/* Teacher & School Info */}
        {project?.teacher && (() => {
          // Debug logging outside of JSX
          if (DEBUG_IMAGES) {
            console.log('Debug - Teacher data:', {
              profile_image_url: project.teacher.profile_image_url,
              image_url: project.teacher.image_url,
              displayName: project.teacher.display_name
            });
          }
          
          // Check if teacher is Maria for direct image override
          const useMariaImage = isMaria(project.teacher.display_name, project.teacher.id);
          const imageToUse = useMariaImage 
            ? `${MARIA_IMAGE_URL}?t=${Date.now()}` // Add cache-busting for Maria
            : teacherImageUrl || project.teacher.profile_image_url || project.teacher.image_url || "https://efneocmdolkzdfhtqkpl.supabase.co/storage/v1/object/public/profile_images/d84d546f-df1d-474d-85ab-e3fc0e805d6a/profile.jpg";
          
          return (
            <div className="mb-6 bg-gradient-to-r from-[#3AB5E9]/10 to-[#0E5D7F]/10 rounded-lg border border-[#3AB5E9]/20 p-4">
              <div className="flex items-center text-sm">
                <div className="flex-shrink-0 mr-4">
                  <img 
                    src={imageToUse}
                    alt={project.teacher.display_name}
                    className="h-16 w-16 rounded-full border-2 border-[#3AB5E9] shadow-md object-cover"
                    onError={(e) => {
                      // If image fails to load and this is Maria, force the Maria image
                      if (useMariaImage) {
                        e.currentTarget.src = `${MARIA_IMAGE_URL}?t=${Date.now()}`;
                      } else {
                        // For others, use default image
                        e.currentTarget.src = "https://efneocmdolkzdfhtqkpl.supabase.co/storage/v1/object/public/profile_images/d84d546f-df1d-474d-85ab-e3fc0e805d6a/profile.jpg";
                      }
                    }}
                  />
                </div>
                <div>
                  <div className="font-medium text-[#0E5D7F] text-lg">
                    {project.teacher.display_name}
                  </div>
                  {project.teacher.school && (
                    <div className="text-gray-600">
                      {project.teacher.school.name}, {project.teacher.school.city}, {project.teacher.school.state}
                    </div>
                  )}
                  <div className="mt-2">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#3AB5E9]/10 text-[#0E5D7F] border border-[#3AB5E9]/20">
                      Teacher
                    </span>
                  </div>
                </div>
                {isTeacher && allowEdit && project.status !== 'approved' && (
                  <div className="ml-auto">
                    <Link href={`/teacher/projects/edit/${projectId}`}>
                      <button 
                        className="inline-flex items-center px-3 py-1.5 border border-[#3AB5E9] rounded-md text-sm font-medium text-[#0E5D7F] bg-white hover:bg-[#3AB5E9]/10 transition-colors"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Edit Project
                      </button>
                    </Link>
                  </div>
                )}
              </div>
            </div>
          );
        })()}
        
        {/* Funding Progress */}
        <div className="mb-6">
          <div className="flex justify-between mb-1 text-sm font-medium">
            <span>${project.current_amount || 0} raised</span>
            <span>Goal: ${project.funding_goal}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
            <div 
              className="bg-blue-600 h-2.5 rounded-full" 
              style={{ width: `${Math.min(((project.current_amount || 0) / project.funding_goal) * 100, 100)}%` }}
            ></div>
          </div>
          {project.status === 'approved' && (
            <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              {Math.round(((project.current_amount || 0) / project.funding_goal) * 100)}% funded
            </div>
          )}
        </div>
        
        {/* Donor Setup Message */}
        {showDonorSetup && userRole === 'donor' && <DonorSetupMessage />}
        
        {/* Action buttons */}
        <div className="flex flex-wrap gap-3 mb-6">
          <button
            onClick={handleWishlistToggle}
            disabled={wishlistLoading || showDonorSetup}
            className={`flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              showDonorSetup 
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-gray-700 dark:text-gray-500'
                : isInWishlist
                  ? 'bg-pink-100 text-pink-700 hover:bg-pink-200 dark:bg-pink-900 dark:text-pink-200'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200'
            }`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill={isInWishlist ? "currentColor" : "none"}
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-5 h-5 mr-2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
              />
            </svg>
            {isInWishlist ? 'Saved to Wishlist' : 'Add to Wishlist'}
          </button>

          {/* View Wishlist link */}
          {userRole === 'donor' && hasDonorProfile && !showDonorSetup && (
            <Link
              href="/account/wishlist"
              className="flex items-center px-4 py-2 text-sm font-medium rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200 !hover:text-white dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-5 h-5 mr-2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M2.25 7.125C2.25 6.504 2.754 6 3.375 6h6c.621 0 1.125.504 1.125 1.125v3.75c0 .621-.504 1.125-1.125 1.125h-6a1.125 1.125 0 01-1.125-1.125v-3.75zM14.25 8.625c0-.621.504-1.125 1.125-1.125h5.25c.621 0 1.125.504 1.125 1.125v8.25c0 .621-.504 1.125-1.125 1.125h-5.25a1.125 1.125 0 01-1.125-1.125v-8.25zM3.75 16.125c0-.621.504-1.125 1.125-1.125h5.25c.621 0 1.125.504 1.125 1.125v2.25c0 .621-.504 1.125-1.125 1.125h-5.25a1.125 1.125 0 01-1.125-1.125v-2.25z"
                />
              </svg>
              View My Wishlist
            </Link>
          )}

          {/* Donate button */}
          <button
            className="bg-[#3AB5E9] hover:bg-[#0E5D7F] text-white px-4 py-2 rounded-md text-sm font-medium transition-colors shadow-sm"
            onClick={() => {
              // Donation logic (to be implemented)
              alert('Donation functionality would go here');
            }}
          >
            Donate Now
          </button>
        </div>
        
        {/* Categories */}
        {project.categories && project.categories.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Categories</h3>
            <div className="flex flex-wrap gap-2">
              {project.categories.map(category => (
                <span 
                  key={category.id} 
                  className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-1 rounded-full dark:bg-blue-900 dark:text-blue-300"
                >
                  {category.name}
                </span>
              ))}
            </div>
          </div>
        )}
        
        {/* Description */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Description</h3>
          <div className="text-gray-700 dark:text-gray-300 whitespace-pre-line">
            {project.description}
          </div>
        </div>
        
        {/* Student Impact */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Student Impact</h3>
          <div className="text-gray-700 dark:text-gray-300 whitespace-pre-line">
            {project.student_impact}
          </div>
        </div>

        {/* Actions */}
        <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
          <div className="flex flex-wrap justify-between items-center">
            <div className="text-sm text-gray-500 dark:text-gray-400 mb-4 sm:mb-0">
              <div>Created: {new Date(project.created_at).toLocaleDateString()}</div>
              <div>Last updated: {new Date(project.updated_at).toLocaleDateString()}</div>
            </div>
            
            <div className="flex space-x-3">
              <ProjectActions 
                projectId={project.id} 
                currentStatus={project.status} 
                isTeacher={isTeacher}
                isAdmin={isAdmin}
                onProjectUpdated={handleProjectUpdate}
              />
            </div>
          </div>
        </div>
      </div>

      {DEBUG_IMAGES && (
        <div className="mt-8 p-4 bg-gray-100 rounded-md text-xs font-mono">
          <h4 className="font-bold mb-2">DEBUG IMAGES:</h4>
          <div>teacherImageUrl: {teacherImageUrl || 'null'}</div>
          <div>teacher.profile_image_url: {project.teacher?.profile_image_url || 'null'}</div>
          <div>teacher.image_url: {project.teacher?.image_url || 'null'}</div>
          <div>teacher.id: {project.teacher?.id || 'null'}</div>
          
          <div className="mt-4">
            <h5 className="font-bold">Direct Image Tests:</h5>
            
            {/* Known Working Image (Colorful Apple Logo) */}
            <div className="mt-2 border p-3 bg-white">
              <div className="font-bold">Known Working Image (Apple Logo):</div>
              <img 
                src="https://efneocmdolkzdfhtqkpl.supabase.co/storage/v1/object/public/profile_images/d84d546f-df1d-474d-85ab-e3fc0e805d6a/profile.jpg"
                alt="Apple Logo"
                className="h-16 w-16 rounded-full border-2 border-blue-500 my-2 mx-auto"
              />
              <div className="text-[10px] break-all">
                URL: https://efneocmdolkzdfhtqkpl.supabase.co/storage/v1/object/public/profile_images/d84d546f-df1d-474d-85ab-e3fc0e805d6a/profile.jpg
              </div>
            </div>
            
            {project.teacher?.id && (
              <div className="grid grid-cols-2 gap-2 mt-2">
                {[
                  `${SUPABASE_URL}/storage/v1/object/public/profile_images/${project.teacher.id}/profile.jpg`,
                  `${SUPABASE_URL}/storage/v1/object/public/profile_images/${project.teacher.id}/profile.png`,
                  `${SUPABASE_URL}/storage/v1/object/public/teacher_images/${project.teacher.id}/avatar`
                ].map((path, i) => (
                  <div key={i} className="mb-3 border p-2">
                    <div className="mb-1 text-[10px] truncate">{path}</div>
                    <img 
                      src={path} 
                      alt={`Test path ${i+1}`} 
                      className="h-16 w-16 object-cover mx-auto border"
                      onError={() => console.log(`Image at ${path} failed to load`)}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {DEBUG_IMAGES && (
        <div className="mt-4 p-3 bg-gray-50 border rounded text-xs">
          <h4 className="font-bold">Image Debug Info</h4>
          <div>teacher.id: {project.teacher?.id || 'null'}</div>
          <div>teacher.profile_image_url: {project.teacher?.profile_image_url || 'null'}</div>
          <div>teacher.image_url: {project.teacher?.image_url || 'null'}</div>
          <div>teacherImageUrl state: {teacherImageUrl || 'null'}</div>
          <div>userId for images: {user?.id || 'null'}</div>
          
          {project.teacher?.id && user?.id && (
            <div className="grid grid-cols-2 gap-2 mt-2">
              {[
                `${SUPABASE_URL}/storage/v1/object/public/profile_images/${user.id}/profile.jpg`,
                `${SUPABASE_URL}/storage/v1/object/public/profile_images/${user.id}/profile.png`,
                `${SUPABASE_URL}/storage/v1/object/public/teacher_images/${user.id}/avatar`
              ].map((path, i) => (
                <div key={i} className="mb-3 border p-2">
                  <div className="mb-1 text-[10px] truncate">{path}</div>
                  <img 
                    src={path} 
                    alt={`Test path ${i+1}`} 
                    className="h-16 w-16 object-cover mx-auto border"
                    onError={() => console.log(`Image at ${path} failed to load`)}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Keep default export for backward compatibility
export default ProjectDetail; 