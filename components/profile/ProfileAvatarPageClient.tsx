'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { useRouter } from 'next/navigation';
import ProfileAvatarUpload from '@/components/ProfileAvatarUpload';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';

export default function ProfileAvatarPageClient() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  // Redirect if not logged in
  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.push('/auth');
      } else {
        setLoading(false);
      }
    }
  }, [user, isLoading, router]);

  if (loading || isLoading) {
    return (
      <div className="container mx-auto py-10">
        <div className="flex justify-center items-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10">
      <div className="flex items-center mb-6">
        <Button 
          variant="outline" 
          size="sm" 
          className="mr-4"
          onClick={() => router.push('/profile')}
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back to Profile
        </Button>
        <h1 className="text-2xl font-bold">Update Profile Picture</h1>
      </div>
      
      <div className="bg-white rounded-lg shadow-sm p-6 max-w-2xl mx-auto">
        <ProfileAvatarUpload />
      </div>
    </div>
  );
} 