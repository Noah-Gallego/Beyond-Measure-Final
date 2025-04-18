'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import SearchWrapper from '@/components/SearchWrapper';
import SearchFilterWrapper from '@/components/SearchFilterWrapper';
import { ChevronRight, Home, Search as SearchIcon } from 'lucide-react';

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
  const ProjectsList = require('@/components/ProjectsList').default;
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

// Loading fallback for project listings
function ProjectsListLoading() {
  return (
    <div className="space-y-6">
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-white rounded-xl shadow-md h-64 animate-pulse"></div>
      ))}
    </div>
  );
}

// Main component with search content
export default function SearchContent() {
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center space-x-4 mb-6">
        <Link 
          href="/" 
          className="flex items-center text-gray-600 hover:text-navy transition-colors"
        >
          <Home className="h-4 w-4 mr-1" />
          <span>Home</span>
        </Link>
        <ChevronRight className="h-4 w-4 text-gray-400" />
        <span className="flex items-center text-navy font-medium">
          <SearchIcon className="h-4 w-4 mr-1" />
          <span>Search</span>
        </span>
      </nav>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Sidebar Filters - Hidden on mobile, always visible on desktop */}
        <div className="hidden md:block">
          <SearchFilterWrapper />
        </div>
        
        {/* Main Content */}
        <div className="md:col-span-3">
          {/* Search Header */}
          <div className="bg-white rounded-xl shadow-md p-6 mb-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <h1 className="text-2xl font-bold text-navy">
                Search Results
              </h1>
              
              {/* Simple Search Bar - No Filters */}
              <div className="w-full md:w-64">
                <SearchWrapper variant="compact" className="shadow-none" />
              </div>
            </div>
          </div>
          
          {/* Projects List with Suspense boundary */}
          <Suspense fallback={<ProjectsListLoading />}>
            <ParamsToProjectsList />
          </Suspense>
        </div>
      </div>
    </div>
  );
} 