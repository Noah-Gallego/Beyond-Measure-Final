'use client';

import { Suspense } from 'react';
import ContactForm from './ContactForm';

// Loading fallback
function ContactFormLoading() {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6 animate-pulse">
      <div className="h-8 bg-gray-200 rounded mb-4 w-1/2"></div>
      <div className="h-4 bg-gray-200 rounded mb-6 w-4/5"></div>
      <div className="space-y-4">
        <div className="h-10 bg-gray-200 rounded"></div>
        <div className="h-10 bg-gray-200 rounded"></div>
        <div className="h-10 bg-gray-200 rounded"></div>
        <div className="h-32 bg-gray-200 rounded"></div>
        <div className="h-10 bg-gray-200 rounded w-1/3"></div>
      </div>
    </div>
  );
}

// Inner content with useSearchParams
function ContactFormContent() {
  return <ContactForm />;
}

// Main export with Suspense
export default function WrappedContactForm() {
  return (
    <Suspense fallback={<ContactFormLoading />}>
      <ContactFormContent />
    </Suspense>
  );
} 