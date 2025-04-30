'use client';

import { useState, useRef, useCallback, Suspense } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { supabase } from '@/utils/supabase';
import { Button } from '@/components/ui/button';
import { Loader2, Upload, X, Check } from 'lucide-react';
import Image from 'next/image';
import ProfileAvatar from './ProfileAvatar';

// Loading fallback
function AvatarUploadLoading() {
  return (
    <div className="flex justify-center items-center p-6">
      <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
    </div>
  );
}

// Main component content
function AvatarUploadContent() {
  const { user } = useAuth();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [dbUserId, setDbUserId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Get the database user ID from the auth ID
  const fetchDbUserId = useCallback(async () => {
    if (!user) return null;
    
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id')
        .eq('auth_id', user.id)
        .single();
      
      if (error) {
        console.error('Error fetching database user ID:', error);
        return null;
      }
      
      setDbUserId(data.id);
      return data.id;
    } catch (err) {
      console.error('Unexpected error fetching database user ID:', err);
      return null;
    }
  }, [user]);

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploadError(null);
    setUploadSuccess(false);
    
    const files = e.target.files;
    if (!files || files.length === 0) {
      setSelectedFile(null);
      setPreview(null);
      return;
    }
    
    const file = files[0];
    
    // Check file type
    if (!file.type.startsWith('image/')) {
      setUploadError('Please select an image file');
      setSelectedFile(null);
      setPreview(null);
      return;
    }
    
    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('Image size should be less than 5MB');
      setSelectedFile(null);
      setPreview(null);
      return;
    }
    
    setSelectedFile(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onload = (event) => {
      setPreview(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Clear selected file
  const handleClearFile = () => {
    setSelectedFile(null);
    setPreview(null);
    setUploadError(null);
    setUploadSuccess(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Handle file upload
  const handleUpload = async () => {
    if (!selectedFile || !user) return;
    
    setUploading(true);
    setUploadError(null);
    setUploadSuccess(false);
    
    try {
      // Make sure we have the database user ID
      const userId = dbUserId || await fetchDbUserId();
      if (!userId) {
        throw new Error('Could not determine user ID for upload');
      }
      
      // Upload to Supabase Storage
      const fileName = `profile-${userId}-${Date.now()}`;
      const fileExt = selectedFile.name.split('.').pop();
      const filePath = `profiles/${userId}/${fileName}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('donor_avatars')
        .upload(filePath, selectedFile, {
          cacheControl: '3600',
          upsert: true
        });
      
      if (uploadError) {
        throw new Error(uploadError.message);
      }
      
      // Get the public URL
      const { data: publicUrlData } = supabase.storage
        .from('donor_avatars')
        .getPublicUrl(filePath);
      
      const publicUrl = publicUrlData.publicUrl;
      
      // Update the user record in the database
      const { error: updateError } = await supabase
        .from('users')
        .update({
          profile_image_url: publicUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);
      
      if (updateError) {
        throw new Error(updateError.message);
      }
      
      // Update successful
      setUploadSuccess(true);
      
      // Clear the file input after a short delay
      setTimeout(() => {
        handleClearFile();
      }, 2000);
      
    } catch (err: any) {
      console.error('Error uploading avatar:', err);
      setUploadError(err.message || 'Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="mb-6 flex flex-col items-center">
        <ProfileAvatar 
          userId={user?.id || ''}
          firstName={user?.user_metadata?.first_name || ''}
          lastName={user?.user_metadata?.last_name || ''}
          size="xl"
          className="mb-4"
        />
        <p className="text-sm text-gray-500 mb-2">Current profile image</p>
      </div>
      
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 mb-4">
        {!preview ? (
          <div 
            className="flex flex-col items-center justify-center cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="h-10 w-10 text-gray-400 mb-2" />
            <p className="text-sm text-gray-500 text-center">
              Click to select an image or drag and drop
            </p>
            <p className="text-xs text-gray-400 mt-1">
              PNG, JPG or GIF (max. 5MB)
            </p>
          </div>
        ) : (
          <div className="relative">
            <div className="relative w-full aspect-square overflow-hidden rounded-lg">
              <Image
                src={preview}
                alt="Preview"
                fill
                className="object-cover"
              />
            </div>
            <button
              onClick={handleClearFile}
              className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full"
              aria-label="Remove image"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
      
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
        aria-label="Upload profile image"
      />
      
      {uploadError && (
        <div className="bg-red-50 text-red-700 p-3 rounded-md mb-4 text-sm">
          {uploadError}
        </div>
      )}
      
      {uploadSuccess && (
        <div className="bg-green-50 text-green-700 p-3 rounded-md mb-4 text-sm flex items-center">
          <Check className="h-4 w-4 mr-2" />
          Profile image updated successfully!
        </div>
      )}
      
      <div className="flex gap-3">
        <Button
          type="button"
          variant="outline"
          className="flex-1"
          onClick={() => fileInputRef.current?.click()}
        >
          Select Image
        </Button>
        
        <Button
          type="button"
          className="flex-1"
          onClick={handleUpload}
          disabled={!selectedFile || uploading}
        >
          {uploading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Uploading...
            </>
          ) : (
            'Upload Image'
          )}
        </Button>
      </div>
    </div>
  );
}

// Export with Suspense boundary
export default function ProfileAvatarUpload() {
  return (
    <Suspense fallback={<AvatarUploadLoading />}>
      <AvatarUploadContent />
    </Suspense>
  );
} 