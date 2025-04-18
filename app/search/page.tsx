'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { supabase } from '@/utils/supabase';
import Link from 'next/link';
import ProjectsList from '@/components/ProjectsList';
import SearchProjects from '@/components/SearchProjects';
import SearchFilters from '@/components/SearchFilters';
import { Button } from '@/components/ui/button';
import { ChevronRight, Home, Search as SearchIcon } from 'lucide-react';

// Split the component to add Suspense boundary
function SearchPageContent() {
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || '';
  const category = searchParams.get('category') || 'all';
  const minFunding = searchParams.get('minFunding') || '0';
  const maxFunding = searchParams.get('maxFunding') || '50000';
  const [categoryName, setCategoryName] = useState('All Categories');
  
  // Log the parameters for debugging
  useEffect(() => {
    console.log('SearchPage params:', { 
      category, 
      minFunding, 
      maxFunding 
    });
  }, [category, minFunding, maxFunding]);
  
  // Fetch category name if needed
  useEffect(() => {
    const fetchCategoryName = async () => {
      if (category && category !== 'all') {
        try {
          const { data, error } = await supabase
            .from('categories')
            .select('name')
            .eq('id', category)
            .single();
            
          if (error) {
            console.error('Error fetching category:', error);
            return;
          }
          
          if (data) {
            console.log('Found category name:', data.name, 'for id:', category);
            setCategoryName(data.name);
          }
        } catch (error) {
          console.error('Error:', error);
        }
      } else {
        setCategoryName('All Categories');
      }
    };
    
    fetchCategoryName();
  }, [category]);

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
          Search
        </span>
      </nav>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Sidebar Filters - Hidden on mobile, always visible on desktop */}
        <div className="hidden md:block">
          <SearchFilters />
        </div>
        
        {/* Main Content */}
        <div className="md:col-span-3">
          {/* Search Header */}
          <div className="bg-white rounded-xl shadow-md p-6 mb-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <h1 className="text-2xl font-bold text-navy">
                {query ? `Results for "${query}"` : "All Projects"}
              </h1>
              
              {/* Simple Search Bar - No Filters */}
              <div className="w-full md:w-64">
                <SearchProjects variant="compact" className="shadow-none" />
              </div>
            </div>
          </div>
          
          {/* Projects List */}
          <ProjectsList 
            searchQuery={query} 
            categoryFilter={category}
            minFunding={parseInt(minFunding)} 
            maxFunding={parseInt(maxFunding)}
          />
        </div>
      </div>
    </div>
  );
}

// Main component with Suspense boundary
export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="container mx-auto px-4 py-8 flex justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    }>
      <SearchPageContent />
    </Suspense>
  );
} 