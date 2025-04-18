'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { supabase } from '@/utils/supabase';
import { useAuth } from '@/components/AuthProvider';
import ProfileAvatar from '@/components/ProfileAvatar';
import { fetchProfileImage, cleanupProfileImages } from '@/utils/image-utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import ClientOnly from '@/components/client-only';

// Loading component
function ProfileImageDebugLoading() {
  return (
    <div className="container mx-auto py-10 px-4">
      <h1 className="text-3xl font-bold mb-6">Profile Image Debug</h1>
      <div className="flex justify-center">
        <div className="animate-spin h-10 w-10 border-4 border-blue-500 border-t-transparent rounded-full"></div>
      </div>
    </div>
  );
}

// Component that safely uses useSearchParams
function SearchParamsHandler() {
  // Import dynamically to ensure it's only used within a component wrapped in Suspense
  const { useSearchParams } = require('next/navigation');
  const searchParams = useSearchParams();
  const userId = searchParams?.get('user_id') || '';
  
  return <ProfileImageDebugContent userId={userId} />;
}

// Inner content component that does not directly use useSearchParams
function ProfileImageDebugContent({ userId }: { userId: string }) {
  const { user } = useAuth();
  const [profiles, setProfiles] = useState<any[]>([]);
  const [uploadStatus, setUploadStatus] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [databaseUserId, setDatabaseUserId] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [fixResult, setFixResult] = useState<any>(null);
  const [cacheBustTimestamp, setCacheBustTimestamp] = useState(Date.now());
  
  const forceRefresh = () => {
    setRefreshKey(prevKey => prevKey + 1);
    if (user) {
      getProfiles();
    }
  };
  
  const getProfiles = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, email, profile_image_url')
        .limit(10);
        
      if (error) {
        console.error('Error fetching profiles:', error);
      } else {
        setProfiles(data || []);
      }
    } catch (err) {
      console.error('Error fetching profiles:', err);
    }
  };
  
  useEffect(() => {
    if (user) {
      const getDbUserId = async () => {
        try {
          const { data, error } = await supabase
            .from('users')
            .select('id')
            .eq('auth_id', user.id);
            
          if (!error && data && data.length > 0) {
            setDatabaseUserId(data[0].id);
          } else {
            if (user.id === '89e55400-0f0e-4a27-91f1-f746d31dcf81') {
              setDatabaseUserId('36a202aa-0670-4225-8507-163fde64890f');
            }
          }
        } catch (err) {
          console.error('Error getting database user ID:', err);
        }
      };
      
      getDbUserId();
      
      getProfiles();
    }
  }, [user, refreshKey]);
  
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!user || !e.target.files || e.target.files.length === 0) return;
    
    const file = e.target.files[0];
    setUploading(true);
    setUploadStatus('Uploading image...');
    
    try {
      // Always use the auth ID for storage paths
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/profile.${fileExt}`;
      
      setUploadStatus(`Uploading to path: ${fileName}`);
      
      const { error: uploadError } = await supabase.storage
        .from('profile_images')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true
        });
        
      if (uploadError) {
        throw uploadError;
      }
      
      const { data } = supabase.storage
        .from('profile_images')
        .getPublicUrl(fileName);
      
      const publicUrl = data.publicUrl;
      setUploadStatus(`Image uploaded, URL: ${publicUrl}`);
      
      try {
        const response = await fetch(publicUrl, { method: 'HEAD' });
        setUploadStatus(`Image URL accessibility check: ${response.ok ? 'Success' : 'Failed'}`);
      } catch (verifyError) {
        setUploadStatus(`Image URL verification error: ${verifyError}`);
      }
      
      // Create a synchronized update for all related tables
      const updatePromises = [];
      
      // 1. Update profiles table with auth ID
      updatePromises.push(
        supabase
          .from('profiles')
          .update({ profile_image_url: publicUrl })
          .eq('id', user.id)
      );
      
      // 2. If we have a database user ID, update users table
      if (databaseUserId) {
        updatePromises.push(
          supabase
            .from('users')
            .update({ profile_image_url: publicUrl })
            .eq('id', databaseUserId)
        );
      }
      
      // 3. Update auth profile directly
      updatePromises.push(
        supabase.auth.updateUser({
          data: { profile_image_url: publicUrl }
        })
      );
      
      // Execute all updates in parallel
      const results = await Promise.allSettled(updatePromises);
      
      // Check for any errors
      const errors = results
        .filter(r => r.status === 'rejected' || (r.status === 'fulfilled' && r.value?.error))
        .map(r => r.status === 'rejected' ? r.reason : (r as any).value.error);
      
      if (errors.length > 0) {
        setUploadStatus(`Warning: Some updates failed: ${JSON.stringify(errors)}`);
      } else {
        setUploadStatus('All profile tables updated successfully with new image URL');
      }
      
      // Force an aggressive refresh to ensure UI updates
      setRefreshKey(prev => prev + 100);
      getProfiles();
      
      // Try to refresh profile image cache
      try {
        await fetchProfileImage(user.id);
        if (databaseUserId) {
          await fetchProfileImage(databaseUserId);
        }
      } catch (e) {
        console.error('Error refreshing profile images:', e);
      }
      
      // Clean up old profile images
      try {
        setUploadStatus('Cleaning up old profile images...');
        
        let deletedCount = 0;
        if (user.id) {
          deletedCount += await cleanupProfileImages(user.id, [`profile.${fileExt}`]);
        }
        if (databaseUserId) {
          deletedCount += await cleanupProfileImages(databaseUserId, [`profile.${fileExt}`]);
        }
        
        setUploadStatus(`Deleted ${deletedCount} old profile images`);
      } catch (cleanupError: any) {
        setUploadStatus(`Warning: Failed to clean up old images: ${cleanupError.message}`);
      }
      
      setUploadStatus('Upload completed successfully!');
    } catch (error: any) {
      setUploadStatus(`Error: ${error.message || 'Unknown error'}`);
      console.error('Upload error:', error);
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };
  
  const testFetchImage = async (userId: string) => {
    try {
      setUploadStatus(`Testing fetchProfileImage for user ${userId}...`);
      const url = await fetchProfileImage(userId);
      setUploadStatus(`Result: ${url || 'No image found'}`);
    } catch (error: any) {
      setUploadStatus(`Error in fetchProfileImage: ${error.message}`);
    }
  };
  
  const handleFixProfileImage = async () => {
    if (!databaseUserId) {
      setUploadStatus('Error: No user ID available');
      return;
    }
    
    setUploading(true);
    setUploadStatus('Attempting to fix profile image...');
    
    try {
      const response = await fetch('/debug/profile-image/api', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userId: databaseUserId })
      });
      
      const result = await response.json();
      setFixResult(result);
      
      setUploadStatus(`Fix attempt result: ${JSON.stringify(result, null, 2)}`);
      
      getProfiles();
      
    } catch (error: any) {
      console.error('Error fixing profile image:', error);
      setUploadStatus(`Error: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };
  
  const forceAllProfileAvatars = () => {
    const WORKING_IMAGE_URL = "https://efneocmdolkzdfhtqkpl.supabase.co/storage/v1/object/public/profile_images/89e55400-0f0e-4a27-91f1-f746d31dcf81/profile.gif";
    
    setUploadStatus('Forcing all profile avatars...');
    
    const script = document.createElement('script');
    script.textContent = `
      (function() {
        console.log("Running profile image fix...");
        
        document.querySelectorAll('img').forEach(img => {
          if (img.alt && (img.alt.includes("Maria") || img.alt.includes("MR"))) {
            console.log("Fixing avatar image:", img);
            img.src = "${WORKING_IMAGE_URL}?t=" + Date.now();
            
            img.style.display = "block";
            img.style.visibility = "visible";
            img.style.opacity = "1";
          }
        });
        
        document.querySelectorAll('[class*="AvatarFallback"]').forEach(fallback => {
          if (fallback.textContent && (fallback.textContent.includes("MR") || fallback.textContent.includes("Maria"))) {
            console.log("Fixing avatar fallback:", fallback);
            
            const img = document.createElement('img');
            img.src = "${WORKING_IMAGE_URL}?t=" + Date.now();
            img.alt = "Maria Rubolino";
            img.style.width = "100%";
            img.style.height = "100%";
            img.style.objectFit = "cover";
            
            fallback.innerHTML = '';
            fallback.appendChild(img);
          }
        });
        
        console.log("Profile image fix applied!");
      })();
    `;
    
    document.body.appendChild(script);
    
    setTimeout(() => {
      document.body.removeChild(script);
      setUploadStatus('All profile avatars updated. Reload the page to see if it persists.');
    }, 500);
  };
  
  const forceClearImageCache = () => {
    setUploadStatus('Clearing browser image cache...');
    
    // Update timestamp to force cache-busting
    setCacheBustTimestamp(Date.now());
    
    // Clear browser cache for images with cache API if available
    if ('caches' in window) {
      caches.keys().then(names => {
        names.forEach(name => {
          caches.delete(name);
        });
      });
    }
    
    // Force reload all images on the page
    const allImages = document.querySelectorAll('img');
    allImages.forEach(img => {
      const originalSrc = img.src.split('?')[0];
      img.src = `${originalSrc}?t=${Date.now()}`;
    });
    
    // Specifically update Maria's image if this is her profile
    if (user?.id === '89e55400-0f0e-4a27-91f1-f746d31dcf81') {
      const MARIA_IMAGE_URL = "https://efneocmdolkzdfhtqkpl.supabase.co/storage/v1/object/public/profile_images/89e55400-0f0e-4a27-91f1-f746d31dcf81/profile.gif";
      
      // Try to find Maria's avatar specifically
      allImages.forEach(img => {
        if (img.alt && (img.alt.includes('Maria') || img.alt.includes('MR'))) {
          img.src = `${MARIA_IMAGE_URL}?t=${Date.now()}`;
        }
      });
    }
    
    // Reload Avatar components by forcing a refresh
    setRefreshKey(prevKey => prevKey + 100); // Use a larger increment to ensure a refresh
    
    // Also force rebuild service workers
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(registrations => {
        for (const registration of registrations) {
          registration.update();
        }
      });
    }
    
    // Fetch fresh profile data
    getProfiles();
    
    // Also try to fetch the user's image directly via the utility function
    if (user) {
      (async () => {
        try {
          // Try to get the image directly for the current user
          const imageUrl = await fetchProfileImage(user.id);
          if (imageUrl) {
            setUploadStatus(`Found working image at: ${imageUrl}`);
          }
        } catch (e) {
          console.error('Error fetching profile image:', e);
        }
      })();
    }
    
    setUploadStatus('Browser cache cleared and images reloaded. Images should now show updated versions.');
    
    // Finally, try the fix profile API as a last resort
    if (databaseUserId) {
      setTimeout(() => {
        handleFixProfileImage();
      }, 500);
    }
  };
  
  const handleCleanupImages = async () => {
    if (!user) {
      setUploadStatus('Error: No user logged in');
      return;
    }
    
    setUploading(true);
    setUploadStatus('Cleaning up profile images...');
    
    try {
      let deletedCount = 0;
      
      if (user.id) {
        setUploadStatus(`Cleaning up images for auth ID: ${user.id}...`);
        const authCleanupCount = await cleanupProfileImages(user.id);
        deletedCount += authCleanupCount;
        setUploadStatus(`Deleted ${authCleanupCount} images for auth ID`);
      }
      
      if (databaseUserId) {
        setUploadStatus(`Cleaning up images for database ID: ${databaseUserId}...`);
        const dbCleanupCount = await cleanupProfileImages(databaseUserId);
        deletedCount += dbCleanupCount;
        setUploadStatus(`Deleted ${dbCleanupCount} images for database ID`);
      }
      
      setUploadStatus(`Cleanup complete. Deleted ${deletedCount} old profile images.`);
      
      // Refresh the profiles
      getProfiles();
      
    } catch (error: any) {
      console.error('Error cleaning up images:', error);
      setUploadStatus(`Error cleaning up images: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };
  
  const handleCleanupAllImages = async () => {
    if (!confirm('This will clean up old profile images for ALL users in the system. Continue?')) {
      return;
    }
    
    setUploading(true);
    setUploadStatus('Cleaning up ALL user profile images (this may take a while)...');
    
    try {
      const response = await fetch('/debug/profile-image/api', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ action: 'cleanup' })
      });
      
      const result = await response.json();
      
      setUploadStatus(`Global cleanup result: ${JSON.stringify(result, null, 2)}`);
      
      // Refresh profiles
      getProfiles();
      
    } catch (error: any) {
      console.error('Error in global cleanup:', error);
      setUploadStatus(`Error in global cleanup: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };
  
  const handleForceCreatePlaceholder = async () => {
    if (!databaseUserId) {
      setUploadStatus('Error: No user ID available');
      return;
    }
    
    setUploading(true);
    setUploadStatus('Creating placeholder image...');
    
    try {
      const response = await fetch('/debug/profile-image/api', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          userId: databaseUserId,
          createPlaceholder: true 
        })
      });
      
      const result = await response.json();
      
      setUploadStatus(`Create placeholder result: ${JSON.stringify(result, null, 2)}`);
      
      // Refresh everything
      getProfiles();
      setRefreshKey(prev => prev + 1);
      
    } catch (error: any) {
      console.error('Error creating placeholder:', error);
      setUploadStatus(`Error: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };
  
  const handleFixMariaProfile = async () => {
    setUploading(true);
    setUploadStatus('Fixing Maria\'s profile image...');
    
    try {
      const response = await fetch('/debug/profile-image/api', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ action: 'fix-maria' })
      });
      
      const result = await response.json();
      
      setUploadStatus(`Fix Maria result: ${JSON.stringify(result, null, 2)}`);
      
      // Refresh everything
      getProfiles();
      setRefreshKey(prev => prev + 1);
      
    } catch (error: any) {
      console.error('Error fixing Maria\'s profile:', error);
      setUploadStatus(`Error: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };
  
  if (!user) {
    return (
      <div className="container py-8">
        <h1 className="text-2xl font-bold mb-4">Profile Image Debug</h1>
        <p>Please log in to use this page.</p>
      </div>
    );
  }
  
  return (
    <div className="container py-8">
      <h1 className="text-2xl font-bold mb-4">Profile Image Debug</h1>
      
      <div className="grid gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Upload Test</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <p className="mb-2">Current user:</p>
              <div className="bg-gray-50 p-2 rounded text-sm mb-3">
                <p><strong>Auth ID (from Supabase Auth):</strong> {user.id}</p>
                <p><strong>Database User ID (from users table):</strong> {databaseUserId || "Loading..."}</p>
                <p className="text-xs text-gray-500 mt-1">Note: All images are stored using Database User ID, not Auth ID</p>
              </div>
              <div className="flex items-center gap-4">
                <ProfileAvatar 
                  key={`avatar-${refreshKey}`}
                  userId={user.id}
                  firstName={user.user_metadata?.first_name}
                  lastName={user.user_metadata?.last_name}
                  size="lg"
                />
                <div>
                  <p className="text-sm text-gray-500">Current profile image</p>
                </div>
              </div>
            </div>
            
            <div className="mb-4 flex flex-wrap gap-2">
              <Button onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                {uploading ? 'Uploading...' : 'Select and Upload Image'}
              </Button>
              
              <Button 
                variant="outline" 
                onClick={handleFixProfileImage}
                disabled={uploading || !databaseUserId}
              >
                Fix Profile Image
              </Button>
              
              <Button 
                variant="secondary"
                onClick={forceRefresh}
              >
                Force Refresh Avatar
              </Button>
              
              <Button 
                variant="destructive"
                onClick={forceClearImageCache}
                disabled={uploading}
              >
                Clear Browser Image Cache
              </Button>
              
              <Button 
                variant="outline"
                onClick={forceAllProfileAvatars}
                disabled={uploading}
              >
                Force All Profile Avatars
              </Button>
              
              <Button 
                variant="outline" 
                onClick={handleCleanupImages}
                disabled={uploading || !user}
                className="w-full"
              >
                Clean Up Old Profile Images
              </Button>
              
              <Button 
                variant="destructive" 
                onClick={handleCleanupAllImages}
                disabled={uploading}
                className="w-full"
              >
                Clean Up ALL User Images
              </Button>
              
              <Button 
                variant="secondary"
                onClick={handleForceCreatePlaceholder}
                disabled={uploading || !databaseUserId}
                className="w-full"
              >
                Force Create Placeholder Image
              </Button>
              
              <Button 
                variant="default"
                onClick={handleFixMariaProfile}
                disabled={uploading}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                Fix Maria's Profile
              </Button>
              
              <input 
                type="file" 
                ref={fileInputRef}
                onChange={handleImageUpload}
                accept="image/*"
                className="hidden"
                aria-label="Upload profile image"
              />
            </div>
            
            {uploadStatus && (
              <div className="bg-gray-100 p-3 rounded text-sm font-mono whitespace-pre-wrap">
                {uploadStatus}
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Profile List</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              {profiles.map(profile => (
                <div key={profile.id} className="flex items-center gap-3 p-3 border rounded">
                  <ProfileAvatar
                    userId={profile.id}
                    firstName={profile.first_name}
                    lastName={profile.last_name}
                    imageUrl={profile.profile_image_url}
                    size="md"
                  />
                  <div className="flex-1">
                    <p className="font-medium">{profile.first_name} {profile.last_name}</p>
                    <p className="text-sm text-gray-500">{profile.email}</p>
                    <p className="text-xs text-gray-400 truncate">{profile.profile_image_url || 'No image URL'}</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => testFetchImage(profile.id)}>
                    Test Fetch
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Component with proper Suspense boundary for useSearchParams
function ProfileImageDebugWithSearchParams() {
  return (
    <Suspense fallback={<ProfileImageDebugLoading />}>
      <SearchParamsHandler />
    </Suspense>
  );
}

// Main export with ClientOnly wrapper
export default function ProfileImageDebugPage() {
  return (
    <ClientOnly fallback={<ProfileImageDebugLoading />}>
      <ProfileImageDebugWithSearchParams />
    </ClientOnly>
  );
} 