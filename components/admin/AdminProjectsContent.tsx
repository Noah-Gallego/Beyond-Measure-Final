'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/utils/supabase';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, CheckCircle, Clock, AlertCircle, RefreshCw, Trash2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import DeleteProjectModal from '@/components/DeleteProjectModal';

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

// Create a client component that uses the router
export default function AdminProjectsContent() {
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<Project[]>([]);
  const [reviewNotes, setReviewNotes] = useState<{[key: string]: string}>({});
  const [isAdmin, setIsAdmin] = useState(false);
  const [message, setMessage] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [selectedProjectTitle, setSelectedProjectTitle] = useState<string>('');
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();
  const { user } = useAuth();
  // Dynamically import useSearchParams to ensure proper Suspense handling
  const nextNavigation = require('next/navigation');
  const searchParams = nextNavigation.useSearchParams();
  const status = searchParams?.get('status') || 'all';

  useEffect(() => {
    // Initialize statusFilter from URL if available
    if (status && ['all', 'pending', 'draft', 'active'].includes(status)) {
      setStatusFilter(status);
    }
    
    checkUserRole();
    fetchProjects();
  }, [status]);

  useEffect(() => {
    // Only fetch projects when statusFilter changes (after initial load)
    if (!loading) {
      fetchProjects();
    }
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
      } else if (statusFilter === 'active') {
        query = query.eq('status', 'active');
      } else if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      } else {
        // For 'all', we want to include active projects too now
        query = query.in('status', ['draft', 'pending_review', 'active']);
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
      
      setMessage(`Project successfully ${status === 'active' ? 'approved' : status === 'denied' ? 'denied' : 'sent back for revision'}.`);
      
      // Clear the review notes for this project
      setReviewNotes(prev => {
        const newNotes = { ...prev };
        delete newNotes[projectId];
        return newNotes;
      });
      
      // Refresh the project list
      fetchProjects();
    } catch (error) {
      console.error('Error reviewing project:', error);
      setMessage(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };
  
  const handleSubmitForReview = async (projectId: string) => {
    try {
      setLoading(true);
      
      // Update the project status to pending_review
      const { error } = await supabase
        .from('projects')
        .update({ status: 'pending_review' })
        .eq('id', projectId);
      
      if (error) {
        console.error('Error submitting project for review:', error);
        setMessage(`Error: ${error.message}`);
        return;
      }
      
      setMessage('Project successfully submitted for review.');
      fetchProjects();
    } catch (error) {
      console.error('Error submitting project for review:', error);
      setMessage(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };
  
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending_review':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <Clock className="w-3 h-3 mr-1" />
            Pending Review
          </span>
        );
      case 'active':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3 mr-1" />
            Active
          </span>
        );
      case 'draft':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            <Clock className="w-3 h-3 mr-1" />
            Draft
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            {status}
          </span>
        );
    }
  };
  
  const openDeleteModal = (projectId: string, projectTitle: string) => {
    setSelectedProjectId(projectId);
    setSelectedProjectTitle(projectTitle);
    setShowDeleteModal(true);
  };
  
  const deleteProject = async () => {
    if (!selectedProjectId) return;
    
    try {
      setIsDeleting(true);
      
      // Delete the project
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', selectedProjectId);
      
      if (error) {
        console.error('Error deleting project:', error);
        setMessage(`Error: ${error.message}`);
        return;
      }
      
      setMessage('Project successfully deleted.');
      setShowDeleteModal(false);
      fetchProjects();
    } catch (error) {
      console.error('Error deleting project:', error);
      setMessage(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsDeleting(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className="container mx-auto py-12 px-4">
        <h1 className="text-3xl font-bold mb-6">Admin Projects Dashboard</h1>
        
        {message && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6">
            <p>{message}</p>
          </div>
        )}
        
        <p>You must be an admin to access this page.</p>
        <Button className="mt-4" onClick={() => router.push('/')}>Go to Home</Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-12 px-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold">Project Management</h1>
          <p className="text-gray-600">Review and manage all teacher projects</p>
        </div>
        <Button onClick={() => router.push('/admin/dashboard')} className="flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Button>
      </div>
      
      {message && (
        <div className={`border-l-4 p-4 mb-6 ${
          message.toLowerCase().includes('error') 
            ? 'bg-red-100 border-red-500 text-red-700' 
            : 'bg-green-100 border-green-500 text-green-700'
        }`}>
          <p>{message}</p>
        </div>
      )}
      
      <Tabs defaultValue={statusFilter} onValueChange={setStatusFilter} className="mb-6">
        <div className="bg-white rounded-xl shadow p-4 mb-6">
          <h2 className="text-lg font-semibold mb-2">Filter Projects</h2>
          <p className="text-sm text-gray-600 mb-4">
            Select a filter to view different sets of projects based on their status.
          </p>
          
          <TabsList className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <TabsTrigger value="all" className="data-[state=active]:bg-gray-100">All Projects</TabsTrigger>
            <TabsTrigger value="pending" className="data-[state=active]:bg-yellow-100">Pending Review</TabsTrigger>
            <TabsTrigger value="draft" className="data-[state=active]:bg-blue-100">Draft</TabsTrigger>
            <TabsTrigger value="active" className="data-[state=active]:bg-green-100">Active</TabsTrigger>
          </TabsList>
        </div>
        
        <TabsContent value="all">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : projects.length === 0 ? (
            <div className="bg-white rounded-xl shadow-md p-6 text-center">
              <p className="text-lg text-gray-600">No projects found</p>
            </div>
          ) : (
            <div className="space-y-6">
              {projects.map((project) => (
                <Card key={project.id} className="overflow-hidden">
                  <CardHeader className="bg-gray-50 border-b">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="mb-1">{project.title}</CardTitle>
                        <CardDescription>
                          By {project.teacher_name} at {project.school_name}
                        </CardDescription>
                      </div>
                      <div>{getStatusBadge(project.status)}</div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      <div>
                        <h3 className="font-medium text-sm text-gray-500 mb-1">Description</h3>
                        <p>{project.description}</p>
                      </div>
                      
                      <div>
                        <h3 className="font-medium text-sm text-gray-500 mb-1">Student Impact</h3>
                        <p>{project.student_impact || 'No student impact provided'}</p>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <h3 className="font-medium text-sm text-gray-500 mb-1">Funding Goal</h3>
                          <p>${project.funding_goal.toLocaleString()}</p>
                        </div>
                        <div>
                          <h3 className="font-medium text-sm text-gray-500 mb-1">Current Funding</h3>
                          <p>${(project.current_amount || 0).toLocaleString()}</p>
                        </div>
                      </div>
                      
                      {project.status === 'pending_review' && (
                        <div>
                          <h3 className="font-medium text-sm text-gray-500 mb-1">Review Notes</h3>
                          <Textarea
                            placeholder="Enter notes about this project (required for approval/rejection)"
                            className="min-h-[100px] w-full"
                            value={reviewNotes[project.id] || ''}
                            onChange={(e) => setReviewNotes(prev => ({ ...prev, [project.id]: e.target.value }))}
                          />
                        </div>
                      )}
                    </div>
                  </CardContent>
                  <CardFooter className="bg-gray-50 border-t pt-4">
                    {project.status === 'pending_review' && (
                      <div className="flex flex-col sm:flex-row gap-2 w-full">
                        <Button
                          variant="success"
                          className="sm:flex-1"
                          onClick={() => handleReviewProject(project.id, 'active')}
                          disabled={loading || !reviewNotes[project.id]}
                        >
                          Approve Project
                        </Button>
                        <Button
                          variant="secondary"
                          className="sm:flex-1"
                          onClick={() => handleReviewProject(project.id, 'needs_revision')}
                          disabled={loading || !reviewNotes[project.id]}
                        >
                          Request Revisions
                        </Button>
                        <Button
                          variant="destructive"
                          className="sm:flex-1"
                          onClick={() => handleReviewProject(project.id, 'denied')}
                          disabled={loading || !reviewNotes[project.id]}
                        >
                          Deny Project
                        </Button>
                      </div>
                    )}
                    
                    {project.status === 'draft' && (
                      <div className="w-full">
                        <Button
                          className="w-full"
                          variant="sky"
                          onClick={() => handleSubmitForReview(project.id)}
                          disabled={loading}
                        >
                          Submit for Review on Behalf of Teacher
                        </Button>
                        <p className="mt-2 text-xs text-muted-foreground">
                          This project is still in draft status. The teacher has not submitted it for review yet.
                        </p>
                      </div>
                    )}

                    {project.status === 'active' && (
                      <div className="w-full flex justify-end">
                        <Button
                          variant="destructive"
                          onClick={() => openDeleteModal(project.id, project.title)}
                          disabled={loading}
                          className="flex items-center gap-1.5"
                        >
                          <Trash2 className="h-4 w-4" />
                          <span>Delete Project</span>
                        </Button>
                      </div>
                    )}
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Delete Project Modal */}
      <DeleteProjectModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={deleteProject}
        projectTitle={selectedProjectTitle}
        isDeleting={isDeleting}
      />
    </div>
  );
} 