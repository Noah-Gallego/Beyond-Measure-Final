'use client';

import { Suspense } from 'react';
import ProfileAvatarPageClient from '@/components/profile/ProfileAvatarPageClient';

// Loading fallback component
function AvatarPageLoading() {
  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    </div>
  );
}

// Main content component with proper Suspense
export default function ProfileAvatarPage() {
  return (
    <Suspense fallback={<AvatarPageLoading />}>
      <ProfileAvatarPageClient />
    </Suspense>
  );
} 