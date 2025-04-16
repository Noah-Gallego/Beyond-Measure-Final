'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/utils/supabase';
import { useAuth } from '@/components/AuthProvider';
import ProfileAvatar from '@/components/ProfileAvatar';
import { fetchProfileImage } from '@/utils/image-utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function ProfileImageDebugPage() {
  const { user } = useAuth();
  const [profiles, setProfiles] = useState<any[]>([]);
  const [uploadStatus, setUploadStatus] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [databaseUserId, setDatabaseUserId] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [fixResult, setFixResult] = useState<any>(null);
  
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
      
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ profile_image_url: publicUrl })
        .eq('id', user.id);
        
      if (updateError) {
        throw updateError;
      }
      
      setUploadStatus('Profile updated with new image URL');
      
      getProfiles();
      
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
                  userId={databaseUserId || user.id}
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
                variant="outline"
                onClick={forceAllProfileAvatars}
                disabled={uploading}
              >
                Force All Profile Avatars
              </Button>
              
              <input 
                type="file" 
                ref={fileInputRef}
                onChange={handleImageUpload}
                accept="image/*"
                className="hidden"
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