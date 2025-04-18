'use client';

import { Suspense, useEffect, useState } from 'react';
import ClientOnly from '@/components/client-only';
import dynamic from 'next/dynamic';

// Dynamically import the content component
const ProfileAvatarPage = dynamic(
  () => import('@/components/profile/ProfileAvatarPage'),
  { ssr: false }
);

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

// Main page component with ClientOnly and Suspense
export default function ProfileAvatarPageWrapper() {
  // Ensure it's mounted before rendering anything
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);
  
  if (!mounted) {
    return <AvatarPageLoading />;
  }
  
  return (
    <ClientOnly fallback={<AvatarPageLoading />}>
      <Suspense fallback={<AvatarPageLoading />}>
        <ProfileAvatarPage />
      </Suspense>
    </ClientOnly>
  );
} 