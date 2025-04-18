'use client';

import { Suspense } from 'react';
import SearchFilters from './SearchFilters';

// This component is wrapped in Suspense to handle useSearchParams safely
function SearchFiltersContent() {
  return <SearchFilters />;
}

export default function SearchFilterWrapper() {
  return (
    <Suspense fallback={
      <div className="rounded-lg border bg-card text-card-foreground shadow-sm w-full animate-pulse">
        <div className="h-24"></div>
      </div>
    }>
      <SearchFiltersContent />
    </Suspense>
  );
} 