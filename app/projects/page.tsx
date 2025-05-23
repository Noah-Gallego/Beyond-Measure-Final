import ProjectsRedirectClient from './client';

export default function ProjectsRedirectPage() {
  return <ProjectsRedirectClient />;
}

// Add metadata
export function generateMetadata() {
  return {
    title: 'Projects - Beyond Measure',
    // This adds a redirect header for SEO
    alternates: {
      canonical: '/teacher/projects',
    },
  }
}

// Static optimization
export const dynamic = 'force-static';
export const dynamicParams = false;

// Redirect to the teacher projects page
export async function generateStaticParams() {
  return [];
} 