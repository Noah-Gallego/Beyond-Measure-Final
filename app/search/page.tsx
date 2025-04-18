'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import SearchWrapper from '@/components/SearchWrapper';
import SearchFilterWrapper from '@/components/SearchFilterWrapper';
import { ChevronRight, Home, Search as SearchIcon } from 'lucide-react';
import ProjectsList from '@/components/ProjectsList';
import ClientOnly from '@/components/client-only';
import dynamic from 'next/dynamic';

// A safe inner component that doesn't directly use useSearchParams
function ProjectListingContent({ 
  query, 
  category, 
  minFunding, 
  maxFunding 
}: { 
  query: string, 
  category: string, 
  minFunding: number, 
  maxFunding: number 
}) {
  return (
    <ProjectsList 
      searchQuery={query} 
      categoryFilter={category}
      minFunding={minFunding} 
      maxFunding={maxFunding}
    />
  );
}

// Component that safely uses useSearchParams - must be wrapped in Suspense
function ParamsToProjectsList() {
  // Import useSearchParams dynamically to ensure proper Suspense handling
  const nextNavigation = require('next/navigation');
  const searchParams = nextNavigation.useSearchParams();
  
  const query = searchParams?.get('q') || '';
  const category = searchParams?.get('category') || 'all';
  const minFunding = parseInt(searchParams?.get('minFunding') || '0');
  const maxFunding = parseInt(searchParams?.get('maxFunding') || '50000');
  
  return (
    <ProjectListingContent 
      query={query} 
      category={category} 
      minFunding={minFunding} 
      maxFunding={maxFunding} 
    />
  );
}

// Loading fallback component
function SearchPageLoading() {
  return (
    <div className="container mx-auto px-4 py-8">
      <nav className="flex items-center space-x-4 mb-6">
        <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
        <div className="h-4 w-4 text-gray-400">›</div>
        <div className="h-4 w-16 bg-gray-200 rounded animate-pulse"></div>
      </nav>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="hidden md:block">
          <div className="bg-white rounded-xl shadow-md p-6 h-96 animate-pulse"></div>
        </div>
        
        <div className="md:col-span-3">
          <div className="bg-white rounded-xl shadow-md p-6 mb-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="h-8 w-48 bg-gray-200 rounded animate-pulse"></div>
              <div className="w-full md:w-64 h-10 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </div>
          
          <div className="space-y-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-xl shadow-md h-64 animate-pulse"></div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Dynamically import the content component to handle useSearchParams properly
const SearchContent = dynamic(
  () => import('@/components/search/SearchContent'),
  { 
    ssr: false,
    loading: () => <SearchPageLoading />
  }
);

// Main export with proper client-side handling
export default function SearchPage() {
  // Ensure it's mounted before rendering
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);
  
  if (!mounted) {
    return <SearchPageLoading />;
  }
  
  return (
    <ClientOnly fallback={<SearchPageLoading />}>
      <Suspense fallback={<SearchPageLoading />}>
        <SearchContent />
      </Suspense>
    </ClientOnly>
  );
} 