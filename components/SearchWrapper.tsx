'use client';

import { Suspense } from 'react';
import SearchProjects from './SearchProjects';

// This component is wrapped in Suspense to handle useSearchParams safely
function SearchContent() {
  return <SearchProjects />;
}

export default function SearchWrapper({ variant, className, alignment = 'default' }: { variant?: 'default' | 'compact', className?: string, alignment?: 'default' | 'left' }) {
  return (
    <Suspense fallback={
      <div className={`max-w-3xl ${alignment === 'left' ? 'pl-0 ml-0' : 'mx-auto'} relative`}>
        <div className="bg-white rounded-full shadow-lg pl-5 pr-5 py-3 flex items-center gap-3 flex-wrap md:flex-nowrap">
          <div className="text-sky flex-shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><path d="m21 21-4.3-4.3"></path></svg>
          </div>
          <div className="flex-1 min-w-0 text-navy opacity-60 truncate">Find a project to fund now</div>
          <div className="rounded-full bg-navy text-white px-4 py-2 font-medium ml-auto whitespace-nowrap flex-shrink-0">Fund Now</div>
        </div>
      </div>
    }>
      <SearchContent />
    </Suspense>
  );
} 