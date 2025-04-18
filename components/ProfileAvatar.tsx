import { useState, useEffect } from 'react';
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar';
import { fetchProfileImage, getAvatarColor, getUserInitials, getDbUserIdFromAuthId } from '@/utils/image-utils';
import { supabase } from '@/utils/supabase';

interface ProfileAvatarProps {
  userId: string;
  firstName?: string;
  lastName?: string;
  imageUrl?: string;
  className?: string;
  fallbackClassName?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

// Add this function to check if an ID is a teacher profile ID and get the user ID
async function getUserIdFromTeacherProfileId(profileId: string): Promise<string | null> {
  console.log(`Checking if ID ${profileId} is a teacher profile ID`);
  try {
    const { data, error } = await supabase
      .from('teacher_profiles')
      .select('user_id')
      .eq('id', profileId)
      .single();
      
    if (error) {
      console.warn('Error checking teacher profile:', error);
      return null;
    }
    
    if (data && data.user_id) {
      console.log(`Found user_id ${data.user_id} for teacher profile ${profileId}`);
      return data.user_id;
    }
    
    return null;
  } catch (err) {
    console.error('Error checking teacher profile ID:', err);
    return null;
  }
}

/**
 * ProfileAvatar component that handles fetching profile images with fallbacks
 */
export default function ProfileAvatar({
  userId,
  firstName = '',
  lastName = '',
  imageUrl,
  className = '',
  fallbackClassName = '',
  size = 'md'
}: ProfileAvatarProps) {
  const [imgSrc, setImgSrc] = useState<string | null>(imageUrl || null);
  const [imgError, setImgError] = useState(false);
  const [loading, setLoading] = useState(!imageUrl); // Not loading if we have direct URL
  const [actualUserId, setActualUserId] = useState<string>(userId);
  const [refreshTimestamp, setRefreshTimestamp] = useState(Date.now());
  
  // Periodically update the timestamp to force image refresh
  useEffect(() => {
    const interval = setInterval(() => {
      setRefreshTimestamp(Date.now());
    }, 30000); // Refresh every 30 seconds
    
    return () => clearInterval(interval);
  }, []);
  
  // Calculate size classes
  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-16 w-16',
    xl: 'h-24 w-24'
  };
  
  const avatarClass = `${sizeClasses[size]} ${className}`;
  
  // Handle direct image URLs immediately
  useEffect(() => {
    if (imageUrl) {
      setImgSrc(imageUrl);
      setLoading(false);
      setImgError(false);
    }
  }, [imageUrl]);
  
  // Identify the proper user ID to use for image fetching
  useEffect(() => {
    // Skip if we already have an image URL provided
    if (imageUrl) return;
    
    const checkUserId = async () => {
      try {
        // First check if this is a teacher profile ID
        const teacherUserId = await getUserIdFromTeacherProfileId(userId);
        if (teacherUserId) {
          console.log(`ProfileAvatar: Found user_id ${teacherUserId} for teacher profile ${userId}`);
          
          // Now get the auth_id for this user
          const { data: userData, error: userError } = await supabase
            .from('users')
            .select('auth_id, profile_image_url')
            .eq('id', teacherUserId)
            .maybeSingle();
            
          if (!userError && userData && userData.auth_id) {
            console.log(`ProfileAvatar: Found auth_id ${userData.auth_id} for user ${teacherUserId}`);
            setActualUserId(userData.auth_id); // Use auth_id for storage path
            
            if (userData.profile_image_url) {
              setImgSrc(userData.profile_image_url);
              setLoading(false);
              return;
            }
          } else {
            // No auth_id found, just use the user_id from teacher profile
            setActualUserId(teacherUserId);
          }
        } 
        // If it's not a teacher profile ID, check if it's an auth ID
        else if (userId.includes('-') && userId.length > 30) {
          // This is likely an auth ID already
          setActualUserId(userId);
        }
        // Otherwise it might be a direct user ID, check for auth_id
        else {
          const { data: userData, error: userError } = await supabase
            .from('users')
            .select('auth_id, profile_image_url')
            .eq('id', userId)
            .maybeSingle();
            
          if (!userError && userData && userData.auth_id) {
            console.log(`ProfileAvatar: Found auth_id ${userData.auth_id} for user ${userId}`);
            setActualUserId(userData.auth_id); // Use auth_id for storage path
            
            if (userData.profile_image_url) {
              setImgSrc(userData.profile_image_url);
              setLoading(false);
              return;
            }
          } else {
            // No auth_id found, just use the user_id
            setActualUserId(userId);
          }
        }
      } catch (err) {
        console.error('Error in ProfileAvatar ID conversion:', err);
        setActualUserId(userId);
      }
    };
    
    checkUserId();
  }, [userId, imageUrl]);
  
  // Fetch profile image directly from database and storage
  useEffect(() => {
    // Skip if we already have a working image URL
    if (imgSrc && !imgError) return;
    
    // Skip if we have a direct image URL provided
    if (imageUrl) return;
    
    const getImage = async () => {
      // Always reset the loading state
      setLoading(true);
      setImgError(false);

      try {
        // Use the utility function to get the image URL
        const url = await fetchProfileImage(actualUserId);
        
        if (url) {
          console.log(`ProfileAvatar: Found image URL: ${url}`);
          setImgSrc(url);
          setImgError(false);
        } else {
          setImgSrc(null);
          setImgError(true);
          console.log(`ProfileAvatar: No image found for user ${actualUserId}`);
        }
      } catch (error) {
        console.error('Error fetching profile image:', error);
        setImgError(true);
      } finally {
        setLoading(false);
      }
    };
    
    if (actualUserId) {
      getImage();
    }
  }, [actualUserId, imgSrc, imgError, imageUrl, refreshTimestamp]);
  
  // Handle image load error
  const handleImageError = () => {
    console.warn(`ProfileAvatar: Image failed to load: ${imgSrc}`);
    setImgError(true);
    
    // Force a fetch from the utility
    setImgSrc(null);
  };
  
  return (
    <Avatar className={avatarClass}>
      {imgSrc && !imgError ? (
        <AvatarImage 
          src={`${imgSrc}?t=${Date.now()}`}
          alt={`${firstName} ${lastName}`}
          onError={handleImageError}
          className="object-cover"
        />
      ) : null}
      <AvatarFallback 
        className={`text-${size === 'sm' ? 'xs' : size === 'md' ? 'sm' : 'base'} ${fallbackClassName}`}
        style={{ backgroundColor: getAvatarColor(firstName + lastName) }}
      >
        {loading ? (
          <div className="animate-spin h-5 w-5 border-2 border-white rounded-full border-t-transparent" />
        ) : (
          getUserInitials(firstName, lastName)
        )}
      </AvatarFallback>
    </Avatar>
  );
} 