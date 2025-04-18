'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/utils/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { X } from 'lucide-react';

// Loading fallback component
function SearchFiltersLoading() {
  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-medium">Filters</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-gray-200 rounded w-1/3"></div>
          <div className="space-y-2">
            <div className="h-8 bg-gray-200 rounded"></div>
            <div className="h-8 bg-gray-200 rounded"></div>
            <div className="h-8 bg-gray-200 rounded"></div>
          </div>
        </div>
        
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="h-8 bg-gray-200 rounded"></div>
        </div>
        
        <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
      </CardContent>
    </Card>
  );
}

// Safe component that uses useSearchParams
function SearchFiltersContent() {
  // Dynamically import useSearchParams to ensure proper Suspense handling
  const nextNavigation = require('next/navigation');
  const searchParams = nextNavigation.useSearchParams();
  
  const router = useRouter();
  const [categories, setCategories] = useState<{id: string, name: string}[]>([]);
  const [fundingRange, setFundingRange] = useState<[number, number]>([
    parseInt(searchParams.get('minFunding') || '0'),
    parseInt(searchParams.get('maxFunding') || '50000')
  ]);
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || 'all');
  
  // Fetch categories from the database
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const { data, error } = await supabase
          .from('categories')
          .select('id, name')
          .order('name');
          
        if (error) {
          console.error('Error fetching categories:', error);
          return;
        }
        
        setCategories(data || []);
      } catch (error) {
        console.error('Error:', error);
      }
    };
    
    fetchCategories();
  }, []);
  
  const applyFilters = () => {
    const params = new URLSearchParams(searchParams.toString());
    
    // Apply category filter
    if (selectedCategory && selectedCategory !== 'all') {
      params.set('category', selectedCategory);
    } else {
      params.delete('category');
    }
    
    // Apply funding range filter
    params.set('minFunding', fundingRange[0].toString());
    params.set('maxFunding', fundingRange[1].toString());
    
    router.push(`/search?${params.toString()}`);
  };
  
  const clearFilters = () => {
    const params = new URLSearchParams();
    const query = searchParams.get('q');
    if (query) {
      params.set('q', query);
    }
    
    setSelectedCategory('all');
    setFundingRange([0, 50000]);
    
    router.push(`/search?${params.toString()}`);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(value);
  };
  
  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg font-medium">Filters</CardTitle>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={clearFilters}
            className="h-8 px-2 text-sm"
          >
            <X className="h-4 w-4 mr-1" />
            Clear
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Category Filter */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium">Categories</h3>
          <div className="flex flex-col gap-2">
            <div 
              onClick={() => setSelectedCategory('all')}
              className={`cursor-pointer px-3 py-1.5 rounded-md text-sm ${
                selectedCategory === 'all' 
                  ? 'bg-primary/10 text-primary font-medium' 
                  : 'hover:bg-gray-100 text-gray-700'
              }`}
            >
              All Categories
            </div>
            
            {categories.map(category => (
              <div 
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`cursor-pointer px-3 py-1.5 rounded-md text-sm ${
                  selectedCategory === category.id 
                    ? 'bg-primary/10 text-primary font-medium' 
                    : 'hover:bg-gray-100 text-gray-700'
                }`}
              >
                {category.name}
              </div>
            ))}
          </div>
        </div>
        
        {/* Funding Range Filter */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium">Funding Goal</h3>
            <span className="text-xs text-gray-500">
              {formatCurrency(fundingRange[0])} - {formatCurrency(fundingRange[1])}
            </span>
          </div>
          
          <Slider
            defaultValue={fundingRange}
            min={0}
            max={50000}
            step={500}
            value={fundingRange}
            onValueChange={(value) => setFundingRange(value as [number, number])}
            className="mt-2"
          />
        </div>
        
        {/* Apply Filters Button */}
        <Button 
          className="w-full" 
          onClick={applyFilters}
        >
          Apply Filters
        </Button>
      </CardContent>
    </Card>
  );
}

// Main export with Suspense boundary
export default function SearchFilters() {
  return (
    <Suspense fallback={<SearchFiltersLoading />}>
      <SearchFiltersContent />
    </Suspense>
  );
} 