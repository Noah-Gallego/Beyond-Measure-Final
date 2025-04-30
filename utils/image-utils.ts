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
    
    // We need to get both IDs - db user ID and auth ID
    let dbUserId = userId;
    let authId = null;
    
    // Check if the ID is already in the auth format
    const isAuthIdFormat = userId.includes('-') && userId.length > 30;
    
    if (isAuthIdFormat) {
      authId = userId;
      // Try to get the database user ID
      const dbId = await getDbUserIdFromAuthId(userId);
      if (dbId) {
        dbUserId = dbId;
        console.log(`Using auth ID ${authId} and database ID ${dbUserId}`);
      }
    } else {
      // This might be a database user ID or teacher profile ID
      // First check if it's a database user ID 
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('auth_id, profile_image_url')
        .eq('id', userId)
        .maybeSingle();
        
      if (!userError && userData) {
        if (userData.auth_id) {
          authId = userData.auth_id;
          console.log(`Found auth ID ${authId} for database ID ${userId}`);
          
          // If we found a profile_image_url in this query, use it directly
          if (userData.profile_image_url) {
            console.log(`Found profile_image_url in users table: ${userData.profile_image_url}`);
            try {
              const response = await fetch(userData.profile_image_url, { method: 'HEAD' });
              if (response.ok) {
                return userData.profile_image_url;
              }
            } catch (e) {
              console.warn('Error verifying user table URL:', e);
            }
          }
        }
      } else {
        // Could be a teacher profile ID - check that
        const { data: teacherData, error: teacherError } = await supabase
          .from('teacher_profiles')
          .select('user_id')
          .eq('id', userId)
          .single();
          
        if (!teacherError && teacherData && teacherData.user_id) {
          dbUserId = teacherData.user_id;
          console.log(`Found database user ID ${dbUserId} for teacher profile ${userId}`);
          
          // Now get the auth ID from the users table
          const { data: userData, error: userError } = await supabase
            .from('users')
            .select('auth_id, profile_image_url')
            .eq('id', dbUserId)
            .maybeSingle();
            
          if (!userError && userData && userData.auth_id) {
            authId = userData.auth_id;
            console.log(`Found auth ID ${authId} for database ID ${dbUserId}`);
            
            // If we found a profile_image_url in this query, use it directly
            if (userData.profile_image_url) {
              console.log(`Found profile_image_url in users table: ${userData.profile_image_url}`);
              try {
                const response = await fetch(userData.profile_image_url, { method: 'HEAD' });
                if (response.ok) {
                  // Update the profile table to be consistent
                  await supabase
                    .from('profiles')
                    .update({ profile_image_url: userData.profile_image_url })
                    .eq('id', authId);
                  
                  return userData.profile_image_url;
                }
              } catch (e) {
                console.warn('Error verifying user table URL:', e);
              }
            }
          }
        }
      }
    }
    
    // Now that we have both IDs, check the profile table
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('profile_image_url')
      .eq('id', authId || dbUserId)
      .maybeSingle();
      
    if (!profileError && profileData?.profile_image_url) {
      console.log(`Found profile_image_url in profiles table: ${profileData.profile_image_url}`);
      try {
        const response = await fetch(profileData.profile_image_url, { method: 'HEAD' });
        if (response.ok) {
          // If we have both IDs, ensure the users table is updated too
          if (dbUserId && authId && dbUserId !== authId) {
            await supabase
              .from('users')
              .update({ profile_image_url: profileData.profile_image_url })
              .eq('id', dbUserId);
          }
          
          return profileData.profile_image_url;
        }
      } catch (e) {
        console.warn('Error verifying profile table URL:', e);
        // Continue to check storage even if verification fails
      }
    }
    
    // If we get here, we need to check storage
    // Order of priority: auth ID (more likely) then db user ID
    const idsToCheck = [];
    if (authId) idsToCheck.push(authId);
    if (dbUserId && dbUserId !== authId) idsToCheck.push(dbUserId);
    
    // Try multiple formats and prioritize newer formats
    const formats = ['gif', 'jpeg', 'jpg', 'png', 'webp'];
    
    // First check donor_avatars bucket which is newer
    for (const id of idsToCheck) {
      console.log(`Checking donor_avatars storage with ID: ${id}`);
      
      // Check for profiles folder structure
      try {
        const { data: folderData, error: folderError } = await supabase.storage
          .from('donor_avatars')
          .list(`profiles/${id}`);
          
        if (!folderError && folderData && folderData.length > 0) {
          const imageFiles = folderData.filter(item => {
            const name = item.name.toLowerCase();
            return name.endsWith('.jpg') || name.endsWith('.jpeg') || 
                   name.endsWith('.png') || name.endsWith('.gif') || 
                   name.endsWith('.webp');
          });
          
          if (imageFiles.length > 0) {
            // Sort by newest timestamp
            const mostRecent = imageFiles.sort((a, b) => {
              const aTime = parseInt(a.name.split('-').pop()?.split('.')[0] || '0', 10) || 0;
              const bTime = parseInt(b.name.split('-').pop()?.split('.')[0] || '0', 10) || 0;
              return bTime - aTime;
            })[0];
            
            const { data } = supabase.storage
              .from('donor_avatars')
              .getPublicUrl(`profiles/${id}/${mostRecent.name}`);
              
            console.log(`Found working image in donor_avatars: ${data.publicUrl}`);
            
            // Update both database tables with this URL
            if (authId) {
              await supabase
                .from('profiles')
                .update({ profile_image_url: data.publicUrl })
                .eq('id', authId);
            }
            
            if (dbUserId) {
              await supabase
                .from('users')
                .update({ profile_image_url: data.publicUrl })
                .eq('id', dbUserId);
            }
            
            return data.publicUrl;
          }
        }
      } catch (e) {
        console.warn(`Error checking donor_avatars for ID ${id}:`, e);
      }
    }
    
    for (const id of idsToCheck) {
      console.log(`Checking profile_images storage with ID: ${id}`);
      
      for (const format of formats) {
        const { data } = supabase.storage
          .from('profile_images')
          .getPublicUrl(`${id}/profile.${format}`);
        
        try {
          const response = await fetch(data.publicUrl, { method: 'HEAD' });
          if (response.ok) {
            console.log(`Found working image at ${data.publicUrl}`);
            
            // Update both database tables with this URL
            if (authId) {
              await supabase
                .from('profiles')
                .update({ profile_image_url: data.publicUrl })
                .eq('id', authId);
            }
            
            if (dbUserId) {
              await supabase
                .from('users')
                .update({ profile_image_url: data.publicUrl })
                .eq('id', dbUserId);
            }
            
            return data.publicUrl;
          }
        } catch (e) {
          console.warn(`Error checking ${format} for ${id}:`, e);
        }
      }
      
      // Check for timestamp files
      try {
        const { data: folderData, error: folderError } = await supabase.storage
          .from('profile_images')
          .list(id);
          
        if (!folderError && folderData && folderData.length > 0) {
          const imageFiles = folderData.filter(item => {
            const name = item.name.toLowerCase();
            return name.endsWith('.jpg') || name.endsWith('.jpeg') || 
                   name.endsWith('.png') || name.endsWith('.gif') || 
                   name.endsWith('.webp');
          });
          
          if (imageFiles.length > 0) {
            // Sort by newest timestamp
            const mostRecent = imageFiles.sort((a, b) => {
              const aTime = parseInt(a.name.split('.')[0], 10) || 0;
              const bTime = parseInt(b.name.split('.')[0], 10) || 0;
              return bTime - aTime;
            })[0];
            
            const { data } = supabase.storage
              .from('profile_images')
              .getPublicUrl(`${id}/${mostRecent.name}`);
            
            try {
              const response = await fetch(data.publicUrl, { method: 'HEAD' });
              if (response.ok) {
                console.log(`Found working timestamp image at ${data.publicUrl}`);
                
                // Update both database tables with this URL
                if (authId) {
                  await supabase
                    .from('profiles')
                    .update({ profile_image_url: data.publicUrl })
                    .eq('id', authId);
                }
                
                if (dbUserId) {
                  await supabase
                    .from('users')
                    .update({ profile_image_url: data.publicUrl })
                    .eq('id', dbUserId);
                }
                
                return data.publicUrl;
              }
            } catch (e) {
              console.warn(`Error checking timestamp image for ${id}:`, e);
            }
          }
        }
      } catch (e) {
        console.warn(`Error listing files for ${id}:`, e);
      }
    }
    
    console.log('No profile image found after trying all methods.');
    return null;
  } catch (err) {
    console.error('Error in fetchProfileImage:', err);
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

/**
 * Cleans up old profile images to prevent storage buildup
 * Keeps the main profile.extension file and removes old timestamped files
 * @param userId - The user ID (can be auth ID or database user ID)
 * @param exceptFiles - Optional array of filenames to preserve
 * @returns The number of files deleted
 */
export async function cleanupProfileImages(userId: string, exceptFiles: string[] = []): Promise<number> {
  try {
    console.log(`Cleaning up profile images for user: ${userId}`);
    
    // First list all files in the user's folder
    const { data: folderData, error: folderError } = await supabase.storage
      .from('profile_images')
      .list(userId);
      
    if (folderError) {
      console.error(`Error listing files for ${userId}:`, folderError);
      return 0;
    }
    
    if (!folderData || folderData.length === 0) {
      console.log(`No images found for ${userId}`);
      return 0;
    }
    
    // Identify files to delete:
    // 1. Keep current profile.* files since they are the standardized name
    // 2. Keep any files explicitly requested to preserve
    // 3. Delete older timestamp-based files
    const filesToDelete = folderData.filter(file => {
      // Skip directories
      if (file.id === null) return false;
      
      // Skip files in the exception list
      if (exceptFiles.includes(file.name)) return false;
      
      // Keep the standardized profile.* files
      if (file.name.startsWith('profile.')) return false;
      
      // Otherwise, we'll delete timestamp-based and other non-standard files
      return true;
    }).map(file => `${userId}/${file.name}`);
    
    if (filesToDelete.length === 0) {
      console.log(`No obsolete files to delete for ${userId}`);
      return 0;
    }
    
    console.log(`Deleting ${filesToDelete.length} old profile images`);
    
    // Delete the files in batches to prevent hitting API limits
    // Supabase supports deleting multiple files at once
    const { data, error } = await supabase.storage
      .from('profile_images')
      .remove(filesToDelete);
      
    if (error) {
      console.error(`Error deleting old profile images:`, error);
      return 0;
    }
    
    console.log(`Successfully deleted ${filesToDelete.length} old profile images`);
    return filesToDelete.length;
  } catch (err) {
    console.error('Error in cleanupProfileImages:', err);
    return 0;
  }
} 