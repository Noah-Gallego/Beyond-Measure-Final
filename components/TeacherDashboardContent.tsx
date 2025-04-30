'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../utils/supabase';
import Link from 'next/link';

export default function TeacherDashboardContent() {
  const [isTeacher, setIsTeacher] = useState(false);
  const [teacherName, setTeacherName] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [projectStats, setProjectStats] = useState({
    draft: 0,
    pending_review: 0,
    approved: 0,
    total: 0
  });

  useEffect(() => {
    checkUserRole();
  }, []);

  const checkUserRole = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setIsTeacher(false);
        setError('You must be logged in to view this page');
        setIsLoading(false);
        return;
      }
      
      // Get user data and teacher profile in one query
      const { data, error } = await supabase
        .from('users')
        .select(`
          id,
          role,
          first_name,
          last_name,
          teacher_profiles(id)
        `)
        .eq('auth_id', user.id)
        .single();
      
      if (error) {
        console.error('Error checking user role:', error);
        setIsTeacher(false);
        setError('Error verifying user role');
        setIsLoading(false);
        return;
      }
      
      setIsTeacher(data.role === 'teacher');
      
      if (data.role !== 'teacher') {
        setError('You must be a teacher to view this page');
        setIsLoading(false);
        return;
      }

      // Set teacher name
      setTeacherName(`${data.first_name || ''} ${data.last_name || ''}`);
      
      // Get teacher profile ID - in Supabase nested fields are returned as arrays or objects
      let teacherProfileId = null;
      
      if (data.teacher_profiles) {
        // Handle both possible formats: array or object with id property
        if (Array.isArray(data.teacher_profiles) && data.teacher_profiles.length > 0) {
          teacherProfileId = data.teacher_profiles[0].id;
        } else if (data.teacher_profiles && typeof data.teacher_profiles === 'object' && 'id' in data.teacher_profiles) {
          teacherProfileId = data.teacher_profiles.id;
        }
      }
      
      if (!teacherProfileId) {
        console.error('Teacher profile not found:', data);
        setError('Teacher profile not found. Please complete your profile setup.');
        setIsLoading(false);
        return;
      }
      
      // Now fetch project stats with the correct teacher profile ID
      fetchProjectStats(teacherProfileId);
    } catch (error) {
      console.error('Error checking user role:', error);
      setIsTeacher(false);
      setError('An error occurred while verifying your account');
      setIsLoading(false);
    }
  };

  const fetchProjectStats = async (teacherProfileId: string) => {
    try {
      console.log('Fetching stats for teacher ID:', teacherProfileId);
      
      // Get project counts by status for this specific teacher
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('teacher_id', teacherProfileId);
      
      if (error) {
        console.error('Error fetching project stats:', error);
        setIsLoading(false);
        return;
      }

      console.log('Projects found:', data?.length || 0);
      
      // Count projects by status
      const stats = {
        draft: 0,
        pending_review: 0,
        approved: 0,
        total: data?.length || 0
      };

      if (data && data.length > 0) {
        data.forEach((project: { status: string }) => {
          if (project.status === 'draft') stats.draft++;
          else if (project.status === 'pending_review') stats.pending_review++;
          else if (project.status === 'approved') stats.approved++;
        });
      }

      console.log('Project stats:', stats);
      setProjectStats(stats);
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching project stats:', error);
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!isTeacher) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
        <p className="text-gray-700 dark:text-gray-300 mb-4">{error || 'You do not have permission to access this page.'}</p>
        <Link href="/" className="text-blue-600 hover:underline">
          Return to Home
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="mb-8">
        {teacherName && (
          <p className="mt-2 text-gray-600 dark:text-gray-400 flex items-center">
            <span className="mr-2">👋</span>
            Hello, {teacherName}
          </p>
        )}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">Total Projects</h2>
          <p className="text-3xl font-bold text-blue-600">{projectStats.total}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">Draft Projects</h2>
          <p className="text-3xl font-bold text-gray-600">{projectStats.draft}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">Pending Review</h2>
          <p className="text-3xl font-bold text-yellow-600">{projectStats.pending_review}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">Approved Projects</h2>
          <p className="text-3xl font-bold text-green-600">{projectStats.approved}</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow mb-8">
        <div className="p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Link 
              href="/teacher/projects"
              className="flex items-center p-4 bg-blue-50 dark:bg-blue-900/30 rounded-lg border border-blue-100 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
            >
              <div className="mr-4 bg-blue-100 dark:bg-blue-800 rounded-full p-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
                </svg>
              </div>
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white">View My Projects</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Manage all your projects</p>
              </div>
            </Link>
            <Link 
              href="/teacher/projects/create"
              className="flex items-center p-4 bg-green-50 dark:bg-green-900/30 rounded-lg border border-green-100 dark:border-green-800 hover:bg-green-100 dark:hover:bg-green-900/50 transition-colors"
            >
              <div className="mr-4 bg-green-100 dark:bg-green-800 rounded-full p-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <div>
                <h3 className="font-medium text-gray-900 dark:!text-white">Create New Project</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Start a new funding request</p>
              </div>
            </Link>
            <Link 
              href="/teacher/profile"
              className="flex items-center p-4 bg-purple-50 dark:bg-purple-900/30 rounded-lg border border-purple-100 dark:border-purple-800 hover:bg-purple-100 dark:hover:bg-purple-900/50 transition-colors"
            >
              <div className="mr-4 bg-purple-100 dark:bg-purple-800 rounded-full p-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-600 dark:text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white">Teacher Profile</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Update your teacher information</p>
              </div>
            </Link>
          </div>
        </div>
      </div>

      {/* Getting Started Guide */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Getting Started</h2>
          <div className="space-y-4">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center justify-center h-8 w-8 rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300 mr-3">1</div>
              <div>
                <h3 className="text-md font-medium text-gray-900 dark:text-white">Create Your Project</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Start by creating a new project with details about your funding needs and goals.</p>
              </div>
            </div>
            <div className="flex">
              <div className="flex-shrink-0 flex items-center justify-center h-8 w-8 rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300 mr-3">2</div>
              <div>
                <h3 className="text-md font-medium text-gray-900 dark:text-white">Submit for Review</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Once your project is ready, submit it for admin review.</p>
              </div>
            </div>
            <div className="flex">
              <div className="flex-shrink-0 flex items-center justify-center h-8 w-8 rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300 mr-3">3</div>
              <div>
                <h3 className="text-md font-medium text-gray-900 dark:text-white">Project Approved</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">After approval, your project will be visible to donors and ready for funding.</p>
              </div>
            </div>
            <div className="mt-6">
              <Link 
                href="/teacher/projects/create"
                className="inline-flex items-center px-4 py-2 bg-white text-blue-600 border border-blue-200 rounded-md hover:bg-gray-50"
              >
                Create Your First Project
                <svg xmlns="http://www.w3.org/2000/svg" className="ml-2 h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
} 