'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../../utils/supabase';
import Link from 'next/link';

type Project = {
  id: string;
  title: string;
  description: string;
  student_impact: string;
  funding_goal: number;
  current_amount: number;
  status: string;
  teacher_name?: string;
  school_name?: string;
  created_at: string;
};

export default function AdminProjectsPage() {
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<Project[]>([]);
  const [reviewNotes, setReviewNotes] = useState<{[key: string]: string}>({});
  const [isAdmin, setIsAdmin] = useState(false);
  const [message, setMessage] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    checkUserRole();
    fetchProjects();
  }, [statusFilter]);

  const checkUserRole = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setIsAdmin(false);
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
        return;
      }
      
      setIsAdmin(data.role === 'admin');
      
      if (data.role !== 'admin') {
        setMessage('You do not have permission to access this page.');
      }
    } catch (error) {
      console.error('Error checking user role:', error);
      setIsAdmin(false);
    }
  };

  const fetchProjects = async () => {
    try {
      setLoading(true);
      
      // Build query based on status filter
      let query = supabase
        .from('projects')
        .select(`
          *,
          teacher_profiles:teacher_id (
            id,
            school_name,
            users:user_id (
              first_name,
              last_name
            )
          )
        `)
        .order('created_at', { ascending: false });
      
      // Apply status filter
      if (statusFilter === 'pending') {
        query = query.eq('status', 'pending_review');
      } else if (statusFilter === 'draft') {
        query = query.eq('status', 'draft');
      } else if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      } else {
        // For 'all', we still want to focus on draft and pending
        query = query.in('status', ['draft', 'pending_review']);
      }
      
      const { data, error } = await query;
      
      // Debug log
      console.log(`Fetched projects with ${statusFilter} filter:`, { 
        count: data?.length || 0, 
        statusFilter,
        data,
        error
      });
      
      if (error) {
        console.error('Error fetching projects:', error);
        setMessage(`Error fetching projects: ${error.message}`);
        return;
      }
      
      if (!data || data.length === 0) {
        console.log(`No projects found with status filter: ${statusFilter}`);
        // Let's double check with a direct count query
        const { count, error: countError } = await supabase
          .from('projects')
          .select('*', { count: 'exact', head: true })
          .eq('status', statusFilter === 'pending' ? 'pending_review' : statusFilter === 'all' ? 'draft' : statusFilter);
          
        console.log('Count check result:', { count, countError });
      }
      
      // Format the data for display
      const formattedProjects = data.map((project: any) => {
        // Add null checks to prevent "Cannot read properties of null"
        const teacherFirstName = project.teacher_profiles?.users?.first_name || 'Unknown';
        const teacherLastName = project.teacher_profiles?.users?.last_name || '';
        const schoolName = project.teacher_profiles?.school_name || 'Unknown School';
        
        return {
          ...project,
          teacher_name: `${teacherFirstName} ${teacherLastName}`.trim() || 'Unknown Teacher',
          school_name: schoolName
        };
      });
      
      setProjects(formattedProjects);
    } catch (error) {
      console.error('Error fetching projects:', error);
      setMessage(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleReviewProject = async (projectId: string, status: string) => {
    try {
      setLoading(true);
      
      // Call the admin review function
      const { data, error } = await supabase.rpc('admin_review_project', {
        p_project_id: projectId,
        p_status: status,
        p_notes: reviewNotes[projectId] || null
      });
      
      if (error) {
        console.error('Error reviewing project:', error);
        setMessage(`Error: ${error.message}`);
        return;
      }
      
      setMessage(`Project ${status === 'approved' ? 'approved' : status === 'denied' ? 'denied' : 'sent back for revision'} successfully!`);
      
      // Clear the review notes for this project
      const updatedNotes = { ...reviewNotes };
      delete updatedNotes[projectId];
      setReviewNotes(updatedNotes);
      
      // Refresh the list
      fetchProjects();
    } catch (error) {
      console.error('Error reviewing project:', error);
      setMessage('An error occurred while reviewing the project.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitForReview = async (projectId: string) => {
    try {
      setLoading(true);
      
      // Call the RPC function to submit the project for review rather than direct update
      const { data, error } = await supabase.rpc('admin_submit_project_for_review', {
        p_project_id: projectId
      });
      
      if (error) {
        console.error('Error submitting project for review:', error);
        setMessage(`Error: ${error.message}`);
        return;
      }
      
      setMessage('Project submitted for review successfully!');
      
      // Refresh the list after a brief delay to allow DB to update
      setTimeout(() => {
        fetchProjects();
      }, 1000);
    } catch (error) {
      console.error('Error submitting project:', error);
      setMessage('An error occurred while submitting the project for review.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return (
          <div className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm font-medium">
            Draft
          </div>
        );
      case 'pending_review':
        return (
          <div className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-medium">
            Pending Review
          </div>
        );
      case 'active':
        return (
          <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
            Active
          </div>
        );
      default:
        return (
          <div className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm font-medium">
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </div>
        );
    }
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
        <div className="max-w-4xl mx-auto px-4">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
          <p className="text-gray-700 dark:text-gray-300">{message || 'You do not have permission to access this page.'}</p>
          <Link href="/" className="mt-4 inline-block text-blue-600 hover:underline">
            Return to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
      <div className="max-w-6xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">Project Management</h1>
        
        {message && (
          <div className={`p-4 mb-6 rounded-lg ${message.includes('Error') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
            {message}
          </div>
        )}
        
        <div className="mb-6">
          <div className="flex space-x-2">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-4 py-2 rounded-md ${
                statusFilter === 'all' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
              }`}
            >
              All Projects
            </button>
            <button
              onClick={() => setStatusFilter('draft')}
              className={`px-4 py-2 rounded-md ${
                statusFilter === 'draft' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
              }`}
            >
              Draft
            </button>
            <button
              onClick={() => setStatusFilter('pending')}
              className={`px-4 py-2 rounded-md ${
                statusFilter === 'pending' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
              }`}
            >
              Pending Review
            </button>
          </div>
        </div>
        
        {loading ? (
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : projects.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <p className="text-gray-700 dark:text-gray-300">
              {statusFilter === 'all' 
                ? 'No projects found.' 
                : statusFilter === 'pending' 
                  ? 'No projects pending review.' 
                  : `No projects with status: ${statusFilter}`}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {projects.map((project) => (
              <div key={project.id} className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
                <div className="p-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{project.title}</h2>
                      <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                        <p><span className="font-medium">Teacher:</span> {project.teacher_name}</p>
                        <p><span className="font-medium">School:</span> {project.school_name}</p>
                        <p><span className="font-medium">Funding Goal:</span> ${project.funding_goal.toLocaleString()}</p>
                        <p><span className="font-medium">Created:</span> {new Date(project.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                    {getStatusBadge(project.status)}
                  </div>
                  
                  <div className="mt-4">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">Description</h3>
                    <p className="mt-1 text-gray-700 dark:text-gray-300">{project.description}</p>
                  </div>
                  
                  <div className="mt-4">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">Student Impact</h3>
                    <p className="mt-1 text-gray-700 dark:text-gray-300">{project.student_impact}</p>
                  </div>
                  
                  {project.status === 'pending_review' && (
                    <>
                      <div className="mt-6">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">Review Notes</h3>
                        <textarea 
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                          rows={3}
                          placeholder="Enter your review notes here..."
                          value={reviewNotes[project.id] || ''}
                          onChange={(e) => setReviewNotes({...reviewNotes, [project.id]: e.target.value})}
                        />
                      </div>
                      
                      <div className="mt-6 flex space-x-3">
                        <button
                          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                          onClick={() => handleReviewProject(project.id, 'approved')}
                          disabled={loading}
                        >
                          Approve
                        </button>
                        <button
                          className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2"
                          onClick={() => handleReviewProject(project.id, 'needs_revision')}
                          disabled={loading || !reviewNotes[project.id]}
                        >
                          Request Revisions
                        </button>
                        <button
                          className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                          onClick={() => handleReviewProject(project.id, 'denied')}
                          disabled={loading || !reviewNotes[project.id]}
                        >
                          Deny
                        </button>
                      </div>
                    </>
                  )}
                  
                  {project.status === 'draft' && (
                    <div className="mt-6">
                      <button
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                        onClick={() => handleSubmitForReview(project.id)}
                        disabled={loading}
                      >
                        Submit for Review on Behalf of Teacher
                      </button>
                      <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                        This project is still in draft status. The teacher has not submitted it for review yet.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 