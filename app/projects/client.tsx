'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';

export default function ProjectsRedirectClient() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const redirectUser = async () => {
      if (isLoading) return;

      // If not logged in, redirect to auth
      if (!user) {
        router.push('/auth?redirect=/search');
        return;
      }

      try {
        // Import the helper to get user role
        const { getUserRole } = await import('@/utils/role-helpers');
        const role = await getUserRole(user);
        
        console.log('Redirecting user based on role:', role);
        
        // Redirect based on role
        if (role === 'teacher') {
          router.push('/teacher/projects');
        } else if (role === 'admin') {
          router.push('/admin/projects');
        } else {
          // Default for donors and unknown roles
          router.push('/search');
        }
      } catch (error) {
        console.error('Error determining user role:', error);
        // Default fallback to search
        router.push('/search');
      }
    };

    redirectUser();
  }, [user, isLoading, router]);

  return (
    <div className="container mx-auto py-10 px-4">
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    </div>
  );
} 