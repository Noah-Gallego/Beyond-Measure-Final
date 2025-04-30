'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { supabase } from '../utils/supabase';

export default function TeacherNav() {
  const [isTeacher, setIsTeacher] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const pathname = usePathname();

  useEffect(() => {
    const checkUserRole = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          setIsTeacher(false);
          setIsLoading(false);
          return;
        }
        
        const { data, error } = await supabase
          .from('users')
          .select('role')
          .eq('auth_id', user.id)
          .single();
        
        if (error) {
          console.error('Error checking user role:', error);
          setIsTeacher(false);
        } else {
          setIsTeacher(data.role === 'teacher');
        }
      } catch (error) {
        console.error('Error checking user role:', error);
        setIsTeacher(false);
      } finally {
        setIsLoading(false);
      }
    };
    
    checkUserRole();
  }, []);

  if (isLoading || !isTeacher || !pathname.startsWith('/teacher')) {
    return null;
  }

  const isActive = (path: string) => {
    if (path === '/teacher' && pathname === '/teacher') {
      return true;
    }
    if (path !== '/teacher' && pathname.startsWith(path)) {
      return true;
    }
    return false;
  };

  return (
    <div className="bg-gradient-to-r from-indigo-800 to-purple-800 text-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-12">
          <div className="flex items-center">
            <span className="font-bold text-sm mr-4 text-white">Teacher Portal:</span>
            <nav className="flex space-x-4">
              <Link
                href="/teacher"
                className={`px-3 py-1 text-sm rounded-md transition-colors ${
                  isActive('/teacher')
                    ? 'text-white font-bold bg-white/25'
                    : 'text-white font-medium hover:bg-white/25 hover:text-white'
                }`}
              >
                Dashboard
              </Link>
              <Link
                href="/teacher/projects"
                className={`px-3 py-1 text-sm rounded-md transition-colors ${
                  isActive('/teacher/projects')
                    ? 'text-white font-bold bg-white/25'
                    : 'text-white font-medium hover:bg-white/25 hover:text-white'
                }`}
              >
                My Projects
              </Link>
              <Link
                href="/teacher/projects"
                className={`px-3 py-1 text-sm rounded-md transition-colors ${
                  pathname === '/teacher/projects'
                    ? 'text-white font-bold bg-white/25'
                    : 'text-white font-medium hover:bg-white/25 hover:text-white'
                }`}
              >
                Create Project
              </Link>
              <Link
                href="/teacher/profile"
                className={`px-3 py-1 text-sm rounded-md transition-colors ${
                  isActive('/teacher/profile')
                    ? 'text-white font-bold bg-white/25'
                    : 'text-white font-medium hover:bg-white/25 hover:text-white'
                }`}
              >
                Teacher Profile
              </Link>
              <Link
                href="/profile"
                className={`px-3 py-1 text-sm rounded-md transition-colors ${
                  pathname === '/profile'
                    ? 'text-white font-bold bg-white/25'
                    : 'text-white font-medium hover:bg-white/25 hover:text-white'
                }`}
              >
                Account
              </Link>
            </nav>
          </div>
          <div>
            <Link
              href="/teacher/projects/create"
              className="btn btn-sm bg-white/30 hover:bg-white/50 backdrop-blur-sm transition-colors text-indigo-100 hover:text-white font-bold shadow-sm"
            >
              + New Project
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
} 