"use client";

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { HomeIcon, ArrowLeft, AlertCircle } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 px-4">
      <div className="text-center max-w-md">
        <div className="flex justify-center mb-6">
          <div className="bg-red-100 p-4 rounded-full">
            <AlertCircle className="h-12 w-12 text-red-500" />
          </div>
        </div>
        
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Page Not Found</h1>
        <p className="text-gray-600 mb-8">
          Sorry, the page you're looking for doesn't exist or has been moved.
        </p>
        
        <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4 justify-center">
          <Button asChild variant="default">
            <Link href="/" className="inline-flex items-center">
              <HomeIcon className="mr-2 h-4 w-4" />
              Return Home
            </Link>
          </Button>
          <Button 
            variant="outline" 
            onClick={() => window.history.back()}
            className="inline-flex items-center justify-center"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Go Back
          </Button>
        </div>
      </div>
    </div>
  );
} 