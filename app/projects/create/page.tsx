import { redirect } from 'next/navigation';

// Server-side redirect for better performance
export default function CreateProjectRedirectPage() {
  // Use static redirect
  redirect('/teacher/projects/create');
}

// Static optimization
export const dynamic = 'force-static';
export const dynamicParams = false;

// Metadata
export function generateMetadata() {
  return {
    title: 'Create Project - Beyond Measure',
    alternates: {
      canonical: '/teacher/projects/create',
    },
  }
} 