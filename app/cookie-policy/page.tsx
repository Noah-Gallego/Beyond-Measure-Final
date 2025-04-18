import { Suspense } from 'react';
import CookiePolicyClientContent from '@/components/cookie/CookiePolicyContent';
import ClientOnly from '@/components/client-only';

// Loading fallback component
function CookiePolicyLoading() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="h-8 w-64 bg-gray-200 rounded animate-pulse mb-6"></div>
      <div className="h-4 w-48 bg-gray-100 rounded animate-pulse mb-6"></div>
      <div className="space-y-4">
        <div className="h-4 w-full bg-gray-100 rounded animate-pulse"></div>
        <div className="h-4 w-full bg-gray-100 rounded animate-pulse"></div>
        <div className="h-4 w-5/6 bg-gray-100 rounded animate-pulse"></div>
      </div>
    </div>
  );
}

export default function CookiePolicyPage() {
  return (
    <ClientOnly fallback={<CookiePolicyLoading />}>
      <Suspense fallback={<CookiePolicyLoading />}>
        <CookiePolicyClientContent />
      </Suspense>
    </ClientOnly>
  );
} 