import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/utils/supabase';
import { cleanupProfileImages } from "@/utils/image-utils";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, action, createPlaceholder } = body;
    
    // Special case for Maria (hardcoded IDs)
    if (userId === '36a202aa-0670-4225-8507-163fde64890f' || 
        userId === '89e55400-0f0e-4a27-91f1-f746d31dcf81' ||
        action === 'fix-maria') {
      return await fixMariaProfileImage();
    }
    
    // Special action for cleanup
    if (action === 'cleanup') {
      return await cleanupAllUserImages();
    }
    
    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    console.log(`Debug API received userId: ${userId}, createPlaceholder: ${createPlaceholder}`);
    
    // Get both IDs for checking
    let dbUserId = userId;
    let authId = null;
    
    // If this looks like a database ID, try to get the auth ID too
    if (userId.includes('-') && userId.length > 30) {
      // First, check if this is an auth ID by seeing if it exists in the users table
      const { data: authCheck } = await supabase
        .from('users')
        .select('id')
        .eq('auth_id', userId);
        
      if (authCheck && authCheck.length > 0) {
        // This is an auth ID
        authId = userId;
        dbUserId = authCheck[0].id;
        console.log(`This is an auth ID. Database user ID: ${dbUserId}`);
      } else {
        // This is probably a database ID, try to get the auth ID
        const { data: dbCheck } = await supabase
          .from('users')
          .select('auth_id')
          .eq('id', userId);
          
        if (dbCheck && dbCheck.length > 0) {
          authId = dbCheck[0].auth_id;
          console.log(`This is a database ID. Auth ID: ${authId}`);
        }
      }
    }
    
    // If createPlaceholder is true, skip checking existing images and create a placeholder immediately
    if (createPlaceholder) {
      console.log('Creating placeholder image immediately as requested');
      return await createPlaceholderImage(authId || dbUserId || userId);
    }
    
    // Check paths with both IDs to find existing images
    const allPaths = [];
    const ids = [];
    
    // Always add the provided ID
    ids.push(userId);
    
    // Also add the other ID if found
    if (authId && authId !== userId) {
      ids.push(authId);
    }
    
    if (dbUserId && dbUserId !== userId && dbUserId !== authId) {
      ids.push(dbUserId);
    }
    
    // First, check existing image in the database
    const tablesChecked = [];
    
    // Check profiles table
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('profile_image_url')
      .in('id', ids)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();
      
    if (!profileError && profileData?.profile_image_url) {
      tablesChecked.push({
        table: 'profiles',
        url: profileData.profile_image_url
      });
    }
    
    // Check users table
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('profile_image_url')
      .in('id', [dbUserId])
      .maybeSingle();
      
    if (!userError && userData?.profile_image_url) {
      tablesChecked.push({
        table: 'users',
        url: userData.profile_image_url
      });
    }
    
    // Check auth table for profile URL in metadata
    // (This would be done if we had direct access to auth metadata)
    
    // Store any existing image URL found
    let foundImageUrl = null;
    
    // Try to verify each image URL found in tables
    for (const tableInfo of tablesChecked) {
      try {
        const response = await fetch(tableInfo.url, { method: 'HEAD' });
        if (response.ok) {
          foundImageUrl = tableInfo.url;
          console.log(`Found working image URL in ${tableInfo.table} table: ${foundImageUrl}`);
          break;
        }
      } catch (e) {
        console.warn(`Error verifying image URL from ${tableInfo.table} table:`, e);
      }
    }
    
    // If we found a working image, update all tables
    let fixedUrl = null;
    if (foundImageUrl) {
      try {
        const updatePromises = [];
        
        // Update all the tables
        if (authId) {
          updatePromises.push(
            supabase
              .from('profiles')
              .update({ profile_image_url: foundImageUrl })
              .eq('id', authId)
          );
        }
        
        if (dbUserId) {
          updatePromises.push(
            supabase
              .from('users')
              .update({ profile_image_url: foundImageUrl })
              .eq('id', dbUserId)
          );
        }
        
        // Execute all updates in parallel
        const results = await Promise.allSettled(updatePromises);
        
        // Check for any errors
        const errors = results
          .filter(r => r.status === 'rejected' || (r.status === 'fulfilled' && r.value?.error))
          .map(r => r.status === 'rejected' ? r.reason : r);
        
        if (errors.length > 0) {
          console.warn('Some updates failed:', errors);
        }
        
        fixedUrl = foundImageUrl;
        console.log(`Updated all profile tables with working image URL: ${foundImageUrl}`);
        
        // Clean up any old images
        try {
          if (authId) {
            await cleanupProfileImages(authId);
          }
          if (dbUserId) {
            await cleanupProfileImages(dbUserId);
          }
        } catch (cleanupError) {
          console.warn('Error cleaning up old profile images:', cleanupError);
        }
      } catch (err) {
        console.error('Error updating profiles with found image:', err);
      }
    } else {
      console.log('No working image found in database tables, checking storage...');
      
      // Try to list all files in the folder to find timestamp-based files for each ID
      for (const id of ids) {
        if (foundImageUrl) break; // Exit early if we already found an image
        
        try {
          console.log(`Checking storage for profile images for user ID: ${id}`);
          const { data: folderData, error: folderError } = await supabase.storage
            .from('profile_images')
            .list(id);
            
          if (folderError) {
            console.log(`Error listing folder for ${id}:`, folderError);
            continue;
          }
            
          if (!folderData || folderData.length === 0) {
            console.log(`No files found in storage for ID ${id}`);
            continue;
          }
          
          console.log(`Found ${folderData.length} files for ID ${id}`);
          
          // Add all image files found, sorted by newest first (if timestamp is in name)
          const imageFiles = folderData
            .filter(item => /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(item.name))
            .sort((a, b) => {
              // First prioritize standard profile.* files
              if (a.name.startsWith('profile.') && !b.name.startsWith('profile.')) return -1;
              if (!a.name.startsWith('profile.') && b.name.startsWith('profile.')) return 1;
              
              // Then try to extract timestamps from filenames for timestamp-based files
              const timestampA = parseInt(a.name.split('.')[0]);
              const timestampB = parseInt(b.name.split('.')[0]);
              
              if (!isNaN(timestampA) && !isNaN(timestampB)) {
                return timestampB - timestampA; // Sort newest first
              }
              return 0;
            });
            
          if (imageFiles.length === 0) {
            console.log(`No image files found in storage for ID ${id}`);
            continue;
          }
          
          console.log(`Found ${imageFiles.length} image files for ID ${id}: ${imageFiles.map(f => f.name).join(', ')}`);
              
          for (const file of imageFiles) {
            const { data } = supabase.storage
              .from('profile_images')
              .getPublicUrl(`${id}/${file.name}`);
              
            const publicUrl = data.publicUrl;
            
            try {
              // Verify the image exists and is accessible
              console.log(`Verifying image at ${publicUrl}`);
              const response = await fetch(publicUrl, { method: 'HEAD' });
              if (response.ok) {
                foundImageUrl = publicUrl;
                console.log(`✅ Found working image in storage: ${publicUrl}`);
                break;
              } else {
                console.log(`❌ Image not accessible: ${publicUrl} (status: ${response.status})`);
              }
            } catch (e) {
              console.warn(`Error verifying image URL from storage: ${publicUrl}`, e);
            }
          }
          
          if (foundImageUrl) break; // Exit loop if we found an image
        } catch (err) {
          console.log(`Error checking storage for ${id}:`, err);
        }
      }
      
      // If we found a working image in storage, update all tables
      if (foundImageUrl && !fixedUrl) {
        try {
          console.log(`Updating database tables with found image URL: ${foundImageUrl}`);
          const updatePromises = [];
          
          // Update all the tables
          if (authId) {
            updatePromises.push(
              supabase
                .from('profiles')
                .update({ profile_image_url: foundImageUrl })
                .eq('id', authId)
            );
          }
          
          if (dbUserId) {
            updatePromises.push(
              supabase
                .from('users')
                .update({ profile_image_url: foundImageUrl })
                .eq('id', dbUserId)
            );
          }
          
          // Execute all updates in parallel
          const results = await Promise.allSettled(updatePromises);
          
          // Check for any errors
          const errors = results
            .filter(r => r.status === 'rejected' || (r.status === 'fulfilled' && r.value?.error))
            .map(r => r.status === 'rejected' ? r.reason : r);
          
          if (errors.length > 0) {
            console.warn('Some updates failed:', errors);
          }
          
          fixedUrl = foundImageUrl;
          console.log(`Updated all profile tables with working image URL from storage: ${foundImageUrl}`);
          
          // Clean up any old images
          try {
            if (authId) {
              await cleanupProfileImages(authId);
            }
            if (dbUserId) {
              await cleanupProfileImages(dbUserId);
            }
          } catch (cleanupError) {
            console.warn('Error cleaning up old profile images:', cleanupError);
          }
        } catch (err) {
          console.error('Error updating profiles with found image from storage:', err);
        }
      }
      
      // If no working image found, create a placeholder
      if (!fixedUrl) {
        console.log('No working image found after checking storage, creating placeholder...');
        try {
          // Use the standardized placeholder SVG
          const color = Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
          
          // Try to get the first letter of the user's name if available
          let initial = '?';
          try {
            const { data: userData } = await supabase
              .from('users')
              .select('first_name, last_name, display_name')
              .eq(dbUserId ? 'id' : 'auth_id', dbUserId || authId)
              .maybeSingle();
              
            if (userData) {
              if (userData.first_name) {
                initial = userData.first_name[0].toUpperCase();
              } else if (userData.display_name) {
                initial = userData.display_name[0].toUpperCase();
              }
            }
          } catch (e) {
            console.warn('Error getting user data for initial:', e);
          }
          
          const placeholderSvg = `<svg width="100" height="100" xmlns="http://www.w3.org/2000/svg">
            <rect width="100%" height="100%" fill="#${color}"/>
            <text x="50%" y="50%" font-family="Arial" font-size="40" fill="white" text-anchor="middle" dominant-baseline="middle">
              ${initial}
            </text>
          </svg>`;
          
          const buffer = Buffer.from(placeholderSvg);
          const filename = `profile.svg`;
          const storageId = authId || dbUserId || userId;
          
          console.log(`Creating placeholder image for user ${storageId} with initial ${initial}`);
          
          // Upload to storage
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('profile_images')
            .upload(`${storageId}/${filename}`, buffer, {
              contentType: 'image/svg+xml',
              upsert: true
            });
            
          if (uploadError) {
            console.error('Error uploading placeholder:', uploadError);
            return NextResponse.json({ error: 'Failed to fix profile image' }, { status: 500 });
          }
          
          // Get public URL
          const { data: publicUrlData } = supabase.storage
            .from('profile_images')
            .getPublicUrl(`${storageId}/${filename}`);
            
          foundImageUrl = publicUrlData.publicUrl;
          
          // Update all tables with the placeholder
          const updatePromises = [];
          
          if (authId) {
            updatePromises.push(
              supabase
                .from('profiles')
                .update({ profile_image_url: foundImageUrl })
                .eq('id', authId)
            );
          }
          
          if (dbUserId) {
            updatePromises.push(
              supabase
                .from('users')
                .update({ profile_image_url: foundImageUrl })
                .eq('id', dbUserId)
            );
          }
          
          // Execute all updates in parallel
          const results = await Promise.allSettled(updatePromises);
          
          // Check for any errors
          const errors = results
            .filter(r => r.status === 'rejected' || (r.status === 'fulfilled' && r.value?.error))
            .map(r => r.status === 'rejected' ? r.reason : r);
            
          if (errors.length > 0) {
            console.warn('Some updates failed when applying placeholder:', errors);
          }
          
          fixedUrl = foundImageUrl;
          console.log(`Created and updated with placeholder image: ${foundImageUrl}`);
          
        } catch (err) {
          console.error('Error creating placeholder image:', err);
        }
      }
    }
    
    return NextResponse.json({
      success: true,
      auth_id: authId,
      database_user_id: dbUserId,
      image_url: fixedUrl || foundImageUrl,
      image_source: fixedUrl 
        ? 'database_fix' 
        : foundImageUrl 
          ? 'storage_found'
          : 'placeholder_created',
      message: fixedUrl 
        ? 'Fixed profile image URL in database' 
        : foundImageUrl 
          ? 'Found existing working image in storage and updated profile' 
          : 'Created placeholder image and updated profile'
    });
    
  } catch (error) {
    console.error('Error in profile image debug API:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

/**
 * Clean up all profile images for all users
 * This will keep the standardized profile.* files and remove any timestamp-based ones
 */
async function cleanupAllUserImages() {
  try {
    console.log('Starting global profile image cleanup');
    
    // First get all users from the database
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, auth_id');
      
    if (usersError) {
      console.error('Error fetching users:', usersError);
      return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
    }
    
    if (!users || users.length === 0) {
      return NextResponse.json({ message: 'No users found' });
    }
    
    // Run cleanup for each user
    const results = [];
    let totalDeleted = 0;
    
    for (const user of users) {
      try {
        // Clean up using database ID
        if (user.id) {
          console.log(`Cleaning up for database user ID: ${user.id}`);
          const dbDeleted = await cleanupProfileImages(user.id);
          totalDeleted += dbDeleted;
          results.push({ id: user.id, type: 'database_id', deleted: dbDeleted });
        }
        
        // Also clean up using auth ID if available
        if (user.auth_id) {
          console.log(`Cleaning up for auth ID: ${user.auth_id}`);
          const authDeleted = await cleanupProfileImages(user.auth_id);
          totalDeleted += authDeleted;
          results.push({ id: user.auth_id, type: 'auth_id', deleted: authDeleted });
        }
      } catch (err) {
        console.error(`Error cleaning up for user ${user.id}:`, err);
        results.push({ id: user.id, error: err.message });
      }
    }
    
    return NextResponse.json({
      success: true,
      message: `Cleaned up ${totalDeleted} old profile images across ${users.length} users`,
      results
    });
  } catch (error) {
    console.error('Error in cleanupAllUserImages:', error);
    return NextResponse.json({ error: 'Failed to clean up all images' }, { status: 500 });
  }
}

/**
 * Creates a placeholder image for a user
 * @param userId The user ID to create the placeholder for
 */
async function createPlaceholderImage(userId: string) {
  try {
    console.log(`Creating placeholder image for user: ${userId}`);
    
    // Get both IDs for the user
    let dbUserId = userId;
    let authId = null;
    
    // Check if this is an auth ID
    if (userId.includes('-') && userId.length > 30) {
      const { data: userData, error } = await supabase
        .from('users')
        .select('id')
        .eq('auth_id', userId)
        .maybeSingle();
        
      if (!error && userData) {
        authId = userId;
        dbUserId = userData.id;
      }
    } else {
      // This might be a database ID, try to get the auth ID
      const { data: userData, error } = await supabase
        .from('users')
        .select('auth_id')
        .eq('id', userId)
        .maybeSingle();
        
      if (!error && userData?.auth_id) {
        authId = userData.auth_id;
        dbUserId = userId;
      }
    }
    
    // Create a colored SVG placeholder with the user's initial
    const color = Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
    const placeholderSvg = `<svg width="100" height="100" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#${color}"/>
      <text x="50%" y="50%" font-family="Arial" font-size="40" fill="white" text-anchor="middle" dominant-baseline="middle">
        ${(userId.toString()[0] || '?').toUpperCase()}
      </text>
    </svg>`;
    
    const buffer = Buffer.from(placeholderSvg);
    
    // Use standardized filename pattern
    const filename = `profile.svg`;
    
    // Try uploading to both IDs for maximum compatibility
    const uploadPromises = [];
    
    if (authId) {
      uploadPromises.push(
        supabase.storage
          .from('profile_images')
          .upload(`${authId}/${filename}`, buffer, {
            contentType: 'image/svg+xml',
            upsert: true
          })
      );
    }
    
    if (dbUserId && dbUserId !== authId) {
      uploadPromises.push(
        supabase.storage
          .from('profile_images')
          .upload(`${dbUserId}/${filename}`, buffer, {
            contentType: 'image/svg+xml',
            upsert: true
          })
      );
    }
    
    // If we don't have either ID, use the original
    if (!authId && !dbUserId) {
      uploadPromises.push(
        supabase.storage
          .from('profile_images')
          .upload(`${userId}/${filename}`, buffer, {
            contentType: 'image/svg+xml',
            upsert: true
          })
      );
    }
    
    // Execute all uploads
    const uploadResults = await Promise.allSettled(uploadPromises);
    
    // Find the first successful upload
    const successfulUpload = uploadResults.find(result => 
      result.status === 'fulfilled' && !result.value.error
    );
    
    if (!successfulUpload) {
      console.error('All uploads failed:', uploadResults);
      return NextResponse.json({ error: 'Failed to upload placeholder image' }, { status: 500 });
    }
    
    // Get the URL of the placeholder
    let imageUrl;
    if (authId) {
      const { data } = supabase.storage
        .from('profile_images')
        .getPublicUrl(`${authId}/${filename}`);
      imageUrl = data.publicUrl;
    } else if (dbUserId) {
      const { data } = supabase.storage
        .from('profile_images')
        .getPublicUrl(`${dbUserId}/${filename}`);
      imageUrl = data.publicUrl;
    } else {
      const { data } = supabase.storage
        .from('profile_images')
        .getPublicUrl(`${userId}/${filename}`);
      imageUrl = data.publicUrl;
    }
    
    // Update all database tables
    const updatePromises = [];
    
    if (authId) {
      updatePromises.push(
        supabase
          .from('profiles')
          .update({ profile_image_url: imageUrl })
          .eq('id', authId)
      );
    }
    
    if (dbUserId) {
      updatePromises.push(
        supabase
          .from('users')
          .update({ profile_image_url: imageUrl })
          .eq('id', dbUserId)
      );
    }
    
    // Execute all updates
    const updateResults = await Promise.allSettled(updatePromises);
    
    // Log any errors
    const errors = updateResults
      .filter(result => 
        result.status === 'rejected' || 
        (result.status === 'fulfilled' && result.value?.error)
      )
      .map(result => 
        result.status === 'rejected' 
          ? result.reason 
          : (result as PromiseFulfilledResult<{ error: any }>).value.error
      );
      
    if (errors.length > 0) {
      console.warn('Some database updates failed:', errors);
    }
    
    return NextResponse.json({
      success: true,
      message: 'Created placeholder image',
      imageUrl,
      authId,
      dbUserId
    });
  } catch (error) {
    console.error('Error creating placeholder image:', error);
    return NextResponse.json({ error: 'Failed to create placeholder image' }, { status: 500 });
  }
}

/**
 * Special handler to fix Maria's profile image
 */
async function fixMariaProfileImage() {
  try {
    console.log('Fixing Maria\'s profile image');
    
    // Hard-coded IDs for Maria
    const authId = '89e55400-0f0e-4a27-91f1-f746d31dcf81';
    const dbUserId = '36a202aa-0670-4225-8507-163fde64890f';
    
    // Create a colored SVG placeholder for Maria
    const placeholderSvg = `<svg width="100" height="100" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#3AB5E9"/>
      <text x="50%" y="50%" font-family="Arial" font-size="40" fill="white" text-anchor="middle" dominant-baseline="middle">MR</text>
    </svg>`;
    
    const buffer = Buffer.from(placeholderSvg);
    
    // Use standardized filenames
    const filenames = ['profile.svg', 'profile.webp', 'profile.jpg', 'profile.png', 'profile.gif'];
    
    // Upload with all common extensions to ensure compatibility with all parts of the app
    for (const filename of filenames) {
      try {
        // Upload to auth ID path
        await supabase.storage
          .from('profile_images')
          .upload(`${authId}/${filename}`, buffer, {
            contentType: 'image/svg+xml',
            upsert: true
          });
          
        // Upload to database ID path
        await supabase.storage
          .from('profile_images')
          .upload(`${dbUserId}/${filename}`, buffer, {
            contentType: 'image/svg+xml',
            upsert: true
          });
      } catch (err) {
        console.warn(`Error uploading ${filename}:`, err);
      }
    }
    
    // Get the public URL of the main profile image
    const { data: publicUrlData } = supabase.storage
      .from('profile_images')
      .getPublicUrl(`${authId}/profile.webp`);
      
    const imageUrl = publicUrlData.publicUrl;
    
    // Update all database tables
    const updatePromises = [];
    
    // Update profiles table
    updatePromises.push(
      supabase
        .from('profiles')
        .update({ profile_image_url: imageUrl })
        .eq('id', authId)
    );
    
    // Update users table
    updatePromises.push(
      supabase
        .from('users')
        .update({ profile_image_url: imageUrl })
        .eq('id', dbUserId)
    );
    
    // Execute all updates
    await Promise.allSettled(updatePromises);
    
    return NextResponse.json({
      success: true,
      message: 'Fixed Maria\'s profile image',
      imageUrl,
      authId,
      dbUserId
    });
  } catch (error) {
    console.error('Error fixing Maria\'s profile image:', error);
    return NextResponse.json({ error: 'Failed to fix Maria\'s profile image' }, { status: 500 });
  }
} 