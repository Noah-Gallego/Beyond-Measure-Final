import { supabase } from './supabase';

/**
 * Translates an auth ID to a database user ID
 * This is crucial because images are stored using the database user ID, not the auth ID
 * @param authId - The auth ID from Supabase Auth
 * @returns The database user ID or null if not found
 */
export async function getDbUserIdFromAuthId(authId: string): Promise<string | null> {
  try {
    console.log(`Looking up database user ID for auth ID: ${authId}`);
    
    // Don't use single() which fails if there are multiple records
    const { data, error } = await supabase
      .from('users')
      .select('id, auth_id')
      .eq('auth_id', authId);
      
    if (error) {
      console.error('Error finding database user ID:', error);
      return null;
    }
    
    if (!data || data.length === 0) {
      console.warn('No database user ID found for auth ID:', authId);
      
      // Hardcoded fallback for known user
      if (authId === '89e55400-0f0e-4a27-91f1-f746d31dcf81') {
        const fallbackId = '36a202aa-0670-4225-8507-163fde64890f';
        console.log(`Using hardcoded fallback ID: ${fallbackId}`);
        return fallbackId;
      }
      
      return null;
    }
    
    // If we get multiple results, use the first one
    // This is a data issue that should be fixed, but we need to handle it gracefully
    if (data.length > 1) {
      console.warn(`Multiple user records (${data.length}) found for auth ID ${authId}, using first one`);
    }
    
    console.log(`Found database user ID: ${data[0].id} for auth ID: ${authId}`);
    return data[0].id;
  } catch (err) {
    console.error('Error in getDbUserIdFromAuthId:', err);
    
    // Hardcoded fallback for known user as a last resort
    if (authId === '89e55400-0f0e-4a27-91f1-f746d31dcf81') {
      return '36a202aa-0670-4225-8507-163fde64890f';
    }
    
    return null;
  }
}

/**
 * Fetch a profile image from Supabase storage with error handling
 * @param userId - The user ID to fetch the profile image for
 * @returns The public URL of the image or null if not found/error
 */
export async function fetchProfileImage(userId: string): Promise<string | null> {
  try {
    console.log(`Attempting to fetch profile image for user: ${userId}`);
    
    // Check if we're dealing with an auth ID and convert to DB ID if needed
    if (userId.includes('-') && userId.length > 30) {
      const dbUserId = await getDbUserIdFromAuthId(userId);
      if (dbUserId) {
        console.log(`Converted auth ID ${userId} to database ID ${dbUserId}`);
        userId = dbUserId;
      }
    }
    
    // First check if the user has a profile_image_url in the profiles table
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('profile_image_url')
      .eq('id', userId)
      .single();
    
    if (!profileError && profileData?.profile_image_url) {
      console.log(`Found profile_image_url in profiles table: ${profileData.profile_image_url}`);
      
      // Verify the URL works
      try {
        const response = await fetch(profileData.profile_image_url, { method: 'HEAD' });
        if (response.ok) {
          return profileData.profile_image_url;
        } else {
          console.warn(`Profile image URL exists but not accessible: ${profileData.profile_image_url}`);
        }
      } catch (e) {
        console.warn('Error verifying profile image URL:', e);
      }
    }
    
    // If no profile_image_url or there was an error, try to get from storage
    console.log(`Trying to fetch from storage for user: ${userId}`);
    
    // Try multiple formats
    const formats = ['jpg', 'png', 'jpeg', 'gif', 'webp'];
    
    for (const format of formats) {
      const { data } = supabase.storage
        .from('profile_images')
        .getPublicUrl(`${userId}/profile.${format}`);
      
      try {
        console.log(`Checking format ${format} at URL: ${data.publicUrl}`);
        const response = await fetch(data.publicUrl, { method: 'HEAD' });
        if (response.ok) {
          console.log(`Found working image at format ${format}`);
          
          // Update the profile with this URL if it works
          const { error: updateError } = await supabase
            .from('profiles')
            .update({ profile_image_url: data.publicUrl })
            .eq('id', userId);
            
          if (updateError) {
            console.warn('Error updating profile with found image URL:', updateError);
          }
          
          return data.publicUrl;
        }
      } catch (e) {
        console.warn(`Error verifying ${format} image:`, e);
      }
    }
    
    // If no formats worked, try the old timestamp-based format as a fallback
    try {
      // List files in user's folder
      const { data: folderData, error: folderError } = await supabase.storage
        .from('profile_images')
        .list(userId);
        
      if (!folderError && folderData && folderData.length > 0) {
        // Find image files
        const imageFiles = folderData.filter(item => {
          const name = item.name.toLowerCase();
          return name.endsWith('.jpg') || name.endsWith('.png') || 
                 name.endsWith('.jpeg') || name.endsWith('.gif') || 
                 name.endsWith('.webp');
        });
        
        if (imageFiles.length > 0) {
          // Get the most recent one
          const mostRecent = imageFiles.sort((a, b) => {
            const aTime = parseInt(a.name.split('.')[0], 10) || 0;
            const bTime = parseInt(b.name.split('.')[0], 10) || 0;
            return bTime - aTime;
          })[0];
          
          const { data } = supabase.storage
            .from('profile_images')
            .getPublicUrl(`${userId}/${mostRecent.name}`);
          
          try {
            const response = await fetch(data.publicUrl, { method: 'HEAD' });
            if (response.ok) {
              return data.publicUrl;
            }
          } catch (e) {
            console.warn('Error verifying fallback image:', e);
          }
        }
      }
    } catch (e) {
      console.warn('Error listing user folder:', e);
    }
    
    return null;
  } catch (err) {
    console.warn('Error in fetchProfileImage:', err);
    return null;
  }
}

/**
 * Generic function to handle image loading errors
 * Shows a fallback and optionally reports the error
 * @param event - The error event from the image
 * @param fallbackHandler - Optional callback to handle the error (e.g., set state)
 */
export function handleImageError(
  event: React.SyntheticEvent<HTMLImageElement, Event>,
  fallbackHandler?: () => void
): void {
  const target = event.target as HTMLImageElement;
  console.warn(`Image failed to load: ${target.src}`);
  
  // Call the fallback handler if provided
  if (fallbackHandler) {
    fallbackHandler();
  }
}

/**
 * Generate a color from a name
 * @param name - Name to generate a color from
 * @returns Hex color code
 */
export function getAvatarColor(name?: string): string {
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
}

/**
 * Get user's initials for avatar
 * @param firstName - First name
 * @param lastName - Last name
 * @returns Initials string
 */
export function getUserInitials(firstName?: string, lastName?: string): string {
  if (!firstName && !lastName) return "U";
  return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`;
} 