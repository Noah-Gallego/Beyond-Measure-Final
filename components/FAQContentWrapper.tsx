'use client';

import { Suspense } from 'react';
import FAQClientContent from './FAQClientContent';

// Loading component
function FAQLoading() {
  return (
    <div className="flex justify-center items-center min-h-[60vh]">
      <div className="animate-spin h-10 w-10 border-4 border-[#3AB5E9] border-t-transparent rounded-full"></div>
    </div>
  );
}

// Inner content that safely imports and doesn't use useSearchParams
function SafeFAQContent() {
  return <FAQClientContent />;
}

// Wrapped with Suspense to handle any potential useSearchParams usage
export default function FAQContentWrapper() {
  return (
    <Suspense fallback={<FAQLoading />}>
      <SafeFAQContent />
    </Suspense>
  );
} 