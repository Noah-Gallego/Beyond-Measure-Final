'use client';

import { Suspense } from 'react';
import ProfileContent from './ProfileContent';

// Loading component
function ProfileLoading() {
  return (
    <div className="flex justify-center items-center min-h-[60vh]">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>
  );
}

// Safe component with proper Suspense boundary
export default function ProfileContentWrapper() {
  return (
    <Suspense fallback={<ProfileLoading />}>
      <ProfileContent />
    </Suspense>
  );
} 