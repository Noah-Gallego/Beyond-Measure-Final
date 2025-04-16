'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../../utils/supabase';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';

interface DashboardStats {
  pendingProjects: number;
  pendingTeachers: number;
  activeProjects: number;
  totalTeachers: number;
  totalDonors: number;
  totalDonations: number;
}

export default function AdminDashboardPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isAccessChecked, setIsAccessChecked] = useState(false);
  const [stats, setStats] = useState<DashboardStats>({
    pendingProjects: 0,
    pendingTeachers: 0,
    activeProjects: 0,
    totalTeachers: 0,
    totalDonors: 0,
    totalDonations: 0
  });

  useEffect(() => {
    if (!authLoading) {
      // Redirect if not logged in
      if (!user) {
        router.push('/auth');
        return;
      }
      
      // Quick check if the user has admin role in their metadata
      const metadataRole = user.user_metadata?.role?.toLowerCase();
      if (metadataRole !== 'admin') {
        // Not an admin based on metadata, redirect to appropriate dashboard
        if (metadataRole === 'teacher') {
          router.push('/teacher/dashboard');
        } else {
          router.push('/dashboard');
        }
        setIsAdmin(false);
        setIsAccessChecked(true);
        return;
      }
      
      // If we're here, continue with the database role check
      checkUserRole();
    }
  }, [user, authLoading, router]);

  const checkUserRole = async () => {
    try {
      if (!user) {
        setIsAdmin(false);
        setIsAccessChecked(true);
        return;
      }
      
      const { data, error } = await supabase
        .from('users')
        .select('role')
        .eq('auth_id', user.id)
        .single();
      
      if (error) {
        console.error('Error checking user role:', error);
        setIsAdmin(false);
        setIsAccessChecked(true);
        return;
      }
      
      const isAdminRole = data.role === 'admin';
      setIsAdmin(isAdminRole);
      setIsAccessChecked(true);
      
      if (isAdminRole) {
        fetchDashboardStats();
      }
    } catch (error) {
      console.error('Error checking user role:', error);
      setIsAdmin(false);
      setIsAccessChecked(true);
    }
  };

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      
      // Get count of pending projects
      const { count: pendingProjects, error: pendingProjectsError } = await supabase
        .from('projects')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'pending_review');
      
      // Get count of pending teacher verifications
      const { count: pendingTeachers, error: pendingTeachersError } = await supabase
        .from('teacher_profiles')
        .select('id', { count: 'exact', head: true })
        .eq('account_status', 'pending');
      
      // Get count of active projects
      const { count: activeProjects, error: activeProjectsError } = await supabase
        .from('projects')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'active');
      
      // Get count of total teachers
      const { count: totalTeachers, error: totalTeachersError } = await supabase
        .from('teacher_profiles')
        .select('id', { count: 'exact', head: true });
      
      // Get count of total donors
      const { count: totalDonors, error: totalDonorsError } = await supabase
        .from('donor_profiles')
        .select('id', { count: 'exact', head: true });
      
      // Get count of total donations
      const { count: totalDonations, error: totalDonationsError } = await supabase
        .from('donations')
        .select('id', { count: 'exact', head: true });
      
      setStats({
        pendingProjects: pendingProjects || 0,
        pendingTeachers: pendingTeachers || 0,
        activeProjects: activeProjects || 0,
        totalTeachers: totalTeachers || 0,
        totalDonors: totalDonors || 0,
        totalDonations: totalDonations || 0
      });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isAccessChecked || loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              You do not have permission to access the admin dashboard. This area is restricted to administrators only.
            </p>
            <p className="text-gray-700 dark:text-gray-300 mb-6">
              If you believe you should have admin access, please contact the system administrator.
            </p>
            <Link href="/" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
              Return to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">Admin Dashboard</h1>
        
        {loading ? (
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <>
            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Pending Reviews</h2>
                <div className="flex space-x-6">
                  <div>
                    <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{stats.pendingProjects}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Projects</p>
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-green-600 dark:text-green-400">{stats.pendingTeachers}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Teachers</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Platform Status</h2>
                <div className="flex space-x-6">
                  <div>
                    <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">{stats.activeProjects}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Active Projects</p>
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">{stats.totalTeachers}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Teachers</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Donor Activity</h2>
                <div className="flex space-x-6">
                  <div>
                    <p className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">{stats.totalDonors}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Donors</p>
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-pink-600 dark:text-pink-400">{stats.totalDonations}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Donations</p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Admin Actions */}
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Admin Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              <Link href="/admin/projects" className="block">
                <div className="bg-white dark:bg-gray-800 border-l-4 border-blue-500 rounded-lg shadow p-6 hover:shadow-md transition">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Review Projects</h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">Review and approve pending projects from teachers.</p>
                  <div className="flex items-center text-blue-600 font-medium">
                    <span>Review Projects</span>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-1" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
              </Link>
              
              <Link href="/admin/teachers" className="block">
                <div className="bg-white dark:bg-gray-800 border-l-4 border-green-500 rounded-lg shadow p-6 hover:shadow-md transition">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Verify Teachers</h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">Verify teacher accounts and school information.</p>
                  <div className="flex items-center text-green-600 font-medium">
                    <span>Verify Teachers</span>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-1" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
              </Link>
              
              <Link href="/admin/categories" className="block">
                <div className="bg-white dark:bg-gray-800 border-l-4 border-purple-500 rounded-lg shadow p-6 hover:shadow-md transition">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Manage Categories</h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">Add, edit, or remove project categories.</p>
                  <div className="flex items-center text-purple-600 font-medium">
                    <span>Manage Categories</span>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-1" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
              </Link>
              
              <Link href="/admin/reports" className="block">
                <div className="bg-white dark:bg-gray-800 border-l-4 border-yellow-500 rounded-lg shadow p-6 hover:shadow-md transition">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">View Reports</h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">Access platform analytics and financial reports.</p>
                  <div className="flex items-center text-yellow-600 font-medium">
                    <span>View Reports</span>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-1" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
              </Link>
              
              <Link href="/admin/featured" className="block">
                <div className="bg-white dark:bg-gray-800 border-l-4 border-pink-500 rounded-lg shadow p-6 hover:shadow-md transition">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Manage Featured</h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">Set featured projects and teachers on the platform.</p>
                  <div className="flex items-center text-pink-600 font-medium">
                    <span>Manage Featured</span>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-1" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
              </Link>
              
              <Link href="/admin/settings" className="block">
                <div className="bg-white dark:bg-gray-800 border-l-4 border-gray-500 rounded-lg shadow p-6 hover:shadow-md transition">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Platform Settings</h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">Configure platform settings and user permissions.</p>
                  <div className="flex items-center text-gray-600 font-medium">
                    <span>Platform Settings</span>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-1" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
} 