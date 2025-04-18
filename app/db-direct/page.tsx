"use client";

import { Suspense } from 'react';
import { Loader } from 'lucide-react';
import DbDirectClient from '@/components/db/DbDirectClient';

// Loading fallback component
function DbDirectLoading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh]">
      <Loader className="w-10 h-10 animate-spin mb-4" />
      <p className="text-lg">Loading database tools...</p>
    </div>
  );
}

// Inner content wrapper with its own Suspense boundary
function DbDirectContent() {
  return (
    <Suspense fallback={<DbDirectLoading />}>
      <DbDirectClient />
    </Suspense>
  );
}

// Main page component with double Suspense
export default function DbDirectPage() {
  return (
    <div className="container mx-auto">
      <Suspense fallback={<DbDirectLoading />}>
        <DbDirectContent />
      </Suspense>
    </div>
  );
} 