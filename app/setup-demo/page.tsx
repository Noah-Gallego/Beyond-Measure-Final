'use client';

import { useState, Suspense } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { useAuth } from '@/components/AuthProvider';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import ClientOnly from '@/components/client-only';

// LoadingFallback component
function LoadingFallback() {
  return (
    <div className="container mx-auto py-10 px-4">
      <div className="h-8 w-64 bg-gray-200 rounded-md animate-pulse mb-6"></div>
      <div className="h-4 w-full max-w-2xl bg-gray-100 rounded-md animate-pulse mb-10"></div>
      
      <Card className="mb-8">
        <CardHeader>
          <div className="h-6 w-48 bg-gray-200 rounded-md animate-pulse"></div>
        </CardHeader>
        <CardContent>
          <div className="h-4 w-full bg-gray-100 rounded-md animate-pulse mb-2"></div>
          <div className="h-4 w-4/5 bg-gray-100 rounded-md animate-pulse mb-2"></div>
          <div className="h-4 w-5/6 bg-gray-100 rounded-md animate-pulse"></div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <div className="h-10 w-40 bg-gray-200 rounded-md animate-pulse"></div>
          <div className="h-10 w-40 bg-gray-200 rounded-md animate-pulse"></div>
        </CardFooter>
      </Card>
    </div>
  );
}

// This component safely uses useSearchParams
function SearchParamsHandler() {
  // Import dynamically to ensure it's only used within a component wrapped in Suspense
  const nextNavigation = require('next/navigation');
  const searchParams = nextNavigation.useSearchParams();
  const source = searchParams?.get('source') || '';
  
  return <SetupDemoInnerContent source={source} />;
}

// Deep inner content that doesn't directly use useSearchParams
function SetupDemoInnerContent({ source }: { source: string }) {
  const { user, isLoading } = useAuth();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const createDemoProject = async () => {
    if (!user) {
      setError('You must be logged in to create a demo project');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setResult(null);

      const response = await fetch('/api/create-project', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create demo project');
      }

      setResult(data);
      setLoading(false);
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
      setLoading(false);
    }
  };

  // Function to navigate to contact form with prefilled fields
  const goToContactForm = () => {
    // Get user email from auth if available
    const userEmail = user?.email || '';
    
    // Navigate to contact page with prefilled fields
    router.push(`/#contact?subject=${encodeURIComponent('Request for Demo')}&email=${encodeURIComponent(userEmail)}&message=${encodeURIComponent('I would like to schedule a personalized demo of Beyond Measure for my school/district.')}`);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-10 flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto py-10 px-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Authentication Required</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4">You need to be logged in to create a demo project.</p>
            <p className="mb-4">If you prefer to see a demo first, you can request one by contacting us.</p>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Link href="/auth">
              <Button>Sign In</Button>
            </Link>
            <Link href="/#contact?source=contact">
              <Button variant="outline">Request a Demo</Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10 px-4">
      <h1 className="text-3xl font-bold mb-6 text-[#0E5D7F]">Setup Demo Project</h1>
      <p className="mb-6 text-gray-600">
        This page allows you to quickly set up a demo project for testing purposes.
        It will create all necessary database tables and a sample project in your account.
      </p>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Create Demo Project</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4">
            Click the button below to create a sample project in your teacher account.
            This will ensure that all required database tables exist and populate them with sample data.
          </p>
          <p className="mb-4">
            If you'd prefer a guided tour of the platform, you can also schedule a personalized demo with our team.
          </p>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button
            onClick={createDemoProject}
            disabled={loading}
            className="bg-[#E96951] hover:bg-[#E96951]/90"
          >
            {loading ? 'Creating...' : 'Create Demo Project'}
          </Button>
          <div className="space-x-3">
            <Link href="/#contact?source=contact">
              <Button variant="outline">Request Guided Demo</Button>
            </Link>
            <Link href="/teacher/dashboard">
              <Button variant="outline">Go to Dashboard</Button>
            </Link>
          </div>
        </CardFooter>
      </Card>

      {/* Results */}
      {result && (
        <Card className="bg-green-50 border-green-200 mb-8">
          <CardHeader>
            <CardTitle className="text-green-800">Project Created Successfully!</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-green-800">
              Your demo project has been created. You can now view it on your teacher dashboard.
            </p>
            <pre className="bg-white p-4 rounded overflow-auto max-h-60 text-xs">
              {JSON.stringify(result, null, 2)}
            </pre>
          </CardContent>
          <CardFooter>
            <Button onClick={() => router.push('/teacher/dashboard')}>
              Go to Dashboard
            </Button>
          </CardFooter>
        </Card>
      )}

      {/* Error */}
      {error && (
        <Card className="bg-red-50 border-red-200">
          <CardHeader>
            <CardTitle className="text-red-800">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-800">{error}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Component with proper Suspense for the search params handler
function SetupDemoContentWithSearchParams() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <SearchParamsHandler />
    </Suspense>
  );
}

// Main component with ClientOnly wrapper first
export default function SetupDemoPage() {
  return (
    <ClientOnly fallback={<LoadingFallback />}>
      <Suspense fallback={<LoadingFallback />}>
        <SetupDemoContentWithSearchParams />
      </Suspense>
    </ClientOnly>
  )
} 