import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/utils/supabase';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();
    
    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    console.log(`Debug API received userId: ${userId}`);
    
    // Get both IDs for checking - we now know images could be stored with either
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
    
    // Hardcoded mapping for the known user
    if (userId === '36a202aa-0670-4225-8507-163fde64890f' || userId === '89e55400-0f0e-4a27-91f1-f746d31dcf81') {
      dbUserId = '36a202aa-0670-4225-8507-163fde64890f';
      authId = '89e55400-0f0e-4a27-91f1-f746d31dcf81';
      console.log('Using hardcoded IDs for known user');
    }
    
    // Check paths with both IDs to find existing images
    const allPaths = [];
    const ids = [dbUserId];
    
    if (authId && authId !== dbUserId) {
      ids.push(authId);
    }
    
    // First, check existing image in the database
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('profile_image_url')
      .eq('id', dbUserId)
      .maybeSingle();
      
    // Store any existing image URL found
    let foundImageUrl = profileData?.profile_image_url || null;
    
    // Try both IDs (database and auth) with different file patterns
    for (const id of ids) {
      // Try standard named files
      const standardFiles = [
        `profile.jpg`,
        `profile.png`,
        `profile.jpeg`,
        `profile.gif`,
        `profile.webp`
      ];
      
      for (const file of standardFiles) {
        const { data } = supabase.storage
          .from('profile_images')
          .getPublicUrl(`${id}/${file}`);
          
        allPaths.push({
          id,
          path: `${id}/${file}`,
          publicUrl: data.publicUrl,
          type: 'standard'
        });
      }
      
      // Try to list all files in the folder to find timestamp-based files
      try {
        const { data: folderData } = await supabase.storage
          .from('profile_images')
          .list(id);
          
        if (folderData && folderData.length > 0) {
          // Add all image files found
          for (const item of folderData) {
            if (item.name.endsWith('.jpg') || 
                item.name.endsWith('.png') || 
                item.name.endsWith('.jpeg') || 
                item.name.endsWith('.gif') || 
                item.name.endsWith('.webp')) {
              
              const { data } = supabase.storage
                .from('profile_images')
                .getPublicUrl(`${id}/${item.name}`);
                
              allPaths.push({
                id,
                path: `${id}/${item.name}`,
                publicUrl: data.publicUrl,
                type: 'found',
                size: item.metadata?.size,
                timestamp: item.name.split('.')[0]
              });
            }
          }
        }
      } catch (err) {
        console.log(`Error listing folder for ${id}:`, err);
      }
    }
    
    // Check which paths actually work
    const results = [];
    for (const pathInfo of allPaths) {
      try {
        const response = await fetch(pathInfo.publicUrl, { method: 'HEAD' });
        const exists = response.ok;
        const status = response.status;
        
        const result = {
          ...pathInfo,
          exists,
          status
        };
        
        results.push(result);
        
        // If we found a working image, save it
        if (exists && !foundImageUrl) {
          foundImageUrl = pathInfo.publicUrl;
          console.log(`Found working image at ${pathInfo.publicUrl}`);
        }
      } catch (err) {
        results.push({
          ...pathInfo,
          exists: false,
          status: 0,
          error: String(err)
        });
      }
    }
    
    // If we found a working image, update the profile
    let fixedUrl = null;
    if (foundImageUrl) {
      try {
        // Update the profile record
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ profile_image_url: foundImageUrl })
          .eq('id', dbUserId);
          
        if (updateError) {
          console.error('Error updating profile:', updateError);
        } else {
          // Also update the users table
          await supabase
            .from('users')
            .update({ profile_image_url: foundImageUrl })
            .eq('id', dbUserId);
            
          fixedUrl = foundImageUrl;
          console.log(`Updated profile with working image URL: ${foundImageUrl}`);
        }
      } catch (err) {
        console.error('Error updating profile with found image:', err);
      }
    } else {
      // If no working image found, create a placeholder
      try {
        // Create a very small 1x1 colored JPEG as a valid placeholder
        const base64Image = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/2wBDAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAARCAABAAEDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwD+/iiiigD/2Q==';
        
        // Convert base64 to blob
        const fetchResponse = await fetch(base64Image);
        const blob = await fetchResponse.blob();
        
        // Important: We now know images are stored with auth ID path
        // So create the placeholder using the authId instead of dbUserId
        const idToUse = authId || dbUserId;
        console.log(`Creating placeholder image using ID: ${idToUse}`);
        
        const timestamp = Date.now();
        const filename = `${timestamp}.jpg`;
        const path = `${idToUse}/${filename}`;
        
        const { data, error } = await supabase.storage
          .from('profile_images')
          .upload(path, blob, {
            upsert: true,
            contentType: 'image/jpeg'
          });
          
        if (error) {
          console.error('Error creating placeholder:', error);
        } else {
          // Get the URL of the file
          const { data: urlData } = supabase.storage
            .from('profile_images')
            .getPublicUrl(path);
            
          fixedUrl = urlData.publicUrl;
          
          // Update the profile record
          await supabase
            .from('profiles')
            .update({ profile_image_url: fixedUrl })
            .eq('id', dbUserId);
            
          // Also update the users table for good measure
          await supabase
            .from('users')
            .update({ profile_image_url: fixedUrl })
            .eq('id', dbUserId);
            
          console.log(`Created placeholder image and updated profile with URL: ${fixedUrl}`);
        }
      } catch (err) {
        console.error('Error in fix attempt:', err);
      }
    }
    
    return NextResponse.json({
      auth_id: authId,
      database_user_id: dbUserId,
      profile: profileData,
      working_image_url: foundImageUrl,
      results,
      fixedUrl,
      message: fixedUrl 
        ? foundImageUrl 
          ? 'Found existing working image URL and updated profile' 
          : 'Created placeholder image and updated profile'
        : 'No fix needed or fix failed'
    });
    
  } catch (error) {
    console.error('Error in profile image debug API:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
} 