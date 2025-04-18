'use client';

import { useState, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';

interface SearchProjectsProps {
  variant?: 'default' | 'compact';
  className?: string;
  alignment?: 'default' | 'left';
}

// Loading fallback for search input
function SearchInputLoading({ variant = 'default', className = '', alignment = 'default' }: SearchProjectsProps) {
  return (
    <div 
      className={`relative flex items-center ${className} ${
        variant === 'compact' ? 'w-full' : 'w-full max-w-xl'
      } ${alignment === 'left' ? 'pl-0 ml-0' : 'mx-auto'}`}
    >
      <div className={`w-full ${
        variant === 'compact' ? 'h-9' : 'h-11'
      } bg-gray-200 animate-pulse rounded-md`}></div>
    </div>
  );
}

// Inner component that safely uses useSearchParams
function SearchProjectsContent({ variant = 'default', className = '', alignment = 'default' }: SearchProjectsProps) {
  // Dynamic import to ensure proper Suspense handling
  const nextNavigation = require('next/navigation');
  const searchParams = nextNavigation.useSearchParams();
  
  const router = useRouter();
  const [query, setQuery] = useState(() => {
    const q = searchParams?.get('q');
    return q ?? '';
  });
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Construct the search URL with current params and the new query
    const params = new URLSearchParams(searchParams.toString());
    
    if (query) {
      params.set('q', query);
    } else {
      params.delete('q');
    }
    
    router.push(`/search?${params.toString()}`);
  };
  
  return (
    <form 
      onSubmit={handleSearch} 
      className={`relative flex items-center ${className} ${
        variant === 'compact' ? 'w-full' : 'w-full max-w-xl'
      } ${alignment === 'left' ? 'pl-0 ml-0' : 'mx-auto'}`}
    >
      <Input
        type="text"
        placeholder="Search for projects..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className={`pr-10 ${
          variant === 'compact' ? 'h-9 text-sm' : 'h-11'
        }`}
      />
      
      <Button 
        type="submit" 
        variant="ghost" 
        size="icon" 
        className="absolute right-0 hover:bg-transparent"
      >
        <Search className="h-4 w-4 text-gray-500" />
        <span className="sr-only">Search</span>
      </Button>
    </form>
  );
}

// Main component with Suspense boundary
export default function SearchProjects(props: SearchProjectsProps) {
  return (
    <Suspense fallback={<SearchInputLoading {...props} />}>
      <SearchProjectsContent {...props} />
    </Suspense>
  );
} 