'use client';

import { useState, useEffect, Suspense } from 'react';
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
import { ArrowLeft, CheckCircle, Clock, AlertCircle, RefreshCw, Trash2, AlertTriangle, Home } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import DeleteProjectModal from '@/components/DeleteProjectModal';
import dynamic from 'next/dynamic';

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
  teacher_id?: string;
};

// Add this component before AdminProjectsContent
function TeacherNameDisplay({ teacherId, initialName }: { teacherId: string | null, initialName: string }) {
  const [teacherName, setTeacherName] = useState(initialName);
  const [isLoading, setIsLoading] = useState(false);
  
  useEffect(() => {
    // Only fetch if we have an ID and the initial name is missing
    if (teacherId && (initialName === 'Unknown Teacher' || initialName === 'Unknown')) {
      const getTeacherInfo = async () => {
        setIsLoading(true);
        try {
          const teacherInfo = await fetch(`/api/admin/get-teacher?id=${teacherId}`).then(r => r.json());
          if (teacherInfo?.teacher) {
            const { first_name, last_name } = teacherInfo.teacher;
            if (first_name || last_name) {
              setTeacherName(`${first_name || ''} ${last_name || ''}`.trim());
            }
          }
        } catch (error) {
          console.error('Error fetching teacher:', error);
        } finally {
          setIsLoading(false);
        }
      };
      
      getTeacherInfo();
    }
  }, [teacherId, initialName]);
  
  if (isLoading) {
    return <span className="text-muted-foreground italic">Loading...</span>;
  }
  
  if (!teacherId) {
    return <span>{teacherName}</span>;
  }
  
  return (
    <Link 
      href={`/teacher/profile/${teacherId}`} 
      className="text-navy hover:underline"
    >
      {teacherName}
    </Link>
  );
}

// Create a client component that uses the router
function AdminProjectsContent() {
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
      
      // Build query with enhanced joins to retrieve teacher data
      let query = supabase
        .from('projects')
        .select(`
          *,
          teacher_profiles:teacher_id (
            *,
            users:user_id (
              id,
              first_name,
              last_name,
              email,
              role
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
        setProjects([]);
        return;
      }
      
      // Format the data for display with improved teacher name handling
      const formattedProjects = data.map((project: any) => {
        // Enhanced teacher info extraction with detailed logging
        const teacherProfile = project.teacher_profiles;
        const teacherUser = teacherProfile?.users;
        
        console.log('Processing project:', {
          projectId: project.id,
          teacherProfileId: project.teacher_id,
          teacherProfile: teacherProfile ? 'exists' : 'null',
          teacherUser: teacherUser ? 'exists' : 'null',
          firstName: teacherUser?.first_name,
          lastName: teacherUser?.last_name
        });
        
        // Try multiple ways to get teacher name
        let teacherName = 'Unknown Teacher';
        let teacherId = null;
        
        if (teacherProfile) {
          teacherId = teacherProfile.id;
          
          if (teacherUser?.first_name || teacherUser?.last_name) {
            const first = teacherUser.first_name || '';
            const last = teacherUser.last_name || '';
            teacherName = `${first} ${last}`.trim();
          } else if (teacherProfile.display_name) {
            teacherName = teacherProfile.display_name;
          }
        }
        
        // Get school name with fallback
        const schoolName = teacherProfile?.school_name || 'Unknown School';
        
        return {
          ...project,
          teacher_name: teacherName,
          school_name: schoolName,
          teacher_id: teacherId
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

  const fetchTeacherInfo = async (teacherId: string) => {
    try {
      const response = await fetch(`/api/admin/get-teacher?id=${teacherId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch teacher: ${response.statusText}`);
      }
      
      const data = await response.json();
      return data.teacher;
    } catch (error) {
      console.error('Error fetching teacher info:', error);
      return null;
    }
  };

  const handleReviewProject = async (projectId: string, status: string) => {
    try {
      setLoading(true);
      
      // First run diagnostic function to see what's happening
      console.log('Running diagnostic function...');
      const { data: diagData, error: diagError } = await supabase.rpc('debug_admin_review', {
        p_project_id: projectId,
        p_status: status,
        p_notes: reviewNotes[projectId] || null
      });
      
      if (diagError) {
        console.error('Diagnostic error:', diagError);
        setMessage(`Diagnostic error: ${diagError.message}`);
        return;
      }
      
      console.log('Diagnostic result:', diagData);
      
      // Map frontend button actions to the correct status values
      const mappedStatus = status === 'approved' ? 'approved' : status;
      
      // Call the admin review function
      const { data, error } = await supabase.rpc('admin_review_project', {
        p_project_id: projectId,
        p_status: mappedStatus,
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
          <div className="flex items-center gap-1.5 bg-navy/10 text-navy px-3 py-1 rounded-full text-sm font-medium">
            <Clock className="h-3.5 w-3.5" />
            <span>Draft</span>
          </div>
        );
      case 'pending_review':
        return (
          <div className="flex items-center gap-1.5 bg-salmon/10 text-salmon px-3 py-1 rounded-full text-sm font-medium">
            <AlertCircle className="h-3.5 w-3.5" />
            <span>Pending Review</span>
          </div>
        );
      case 'active':
        return (
          <div className="flex items-center gap-1.5 bg-grass/10 text-grass px-3 py-1 rounded-full text-sm font-medium">
            <CheckCircle className="h-3.5 w-3.5" />
            <span>Active</span>
          </div>
        );
      default:
        return (
          <div className="flex items-center gap-1.5 bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm font-medium">
            <span>{status.charAt(0).toUpperCase() + status.slice(1)}</span>
          </div>
        );
    }
  };

  // New function to open the delete modal
  const openDeleteModal = (projectId: string, projectTitle: string) => {
    setSelectedProjectId(projectId);
    setSelectedProjectTitle(projectTitle);
    setShowDeleteModal(true);
  };

  // New function to delete a project
  const deleteProject = async () => {
    if (!selectedProjectId) return;
    
    try {
      setIsDeleting(true);
      console.log('Deleting project with ID:', selectedProjectId);
      
      // Get the current session to ensure authentication is fresh
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        setMessage('Error: Your session has expired. Please log in again.');
        setShowDeleteModal(false);
        setIsDeleting(false);
        router.push('/login');
        return;
      }
      
      // Call the API endpoint with proper credentials
      const response = await fetch('/api/delete-project', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionData.session.access_token}`,
        },
        credentials: 'include',
        body: JSON.stringify({ projectId: selectedProjectId }),
      });
      
      console.log('Delete API response status:', response.status);
      const result = await response.json();
      console.log('Delete API response body:', result);
      
      if (!response.ok) {
        if (result.error) {
          // Show the specific error from the API
          console.error('API returned error:', result.error);
          setMessage(`Error: ${result.error}`);
        } else {
          throw new Error('Failed to delete project: Server returned ' + response.status);
        }
        setShowDeleteModal(false);
        return;
      }
      
      console.log('Project deleted successfully');
      setMessage('Project successfully deleted!');
      
      // Close the modal
      setShowDeleteModal(false);
      setSelectedProjectId(null);
      
      // Refresh the list
      fetchProjects();
    } catch (error: any) {
      console.error('Error deleting project:', error);
      setMessage(`Error: ${error.message}`);
      setShowDeleteModal(false);
    } finally {
      setIsDeleting(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className="container mx-auto py-12 px-4">
        <Card className="max-w-md mx-auto overflow-hidden border-t-4 border-t-salmon shadow-md">
          <CardHeader className="bg-gradient-to-r from-salmon-light to-navy-light">
            <CardTitle className="text-xl font-bold text-navy flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-salmon" />
              Access Denied
            </CardTitle>
            <CardDescription>
              {message || 'You do not have permission to access this page.'}
            </CardDescription>
          </CardHeader>
          <CardFooter className="pt-4 border-t">
            <Button asChild className="gap-2 bg-navy hover:bg-navy/90 w-full">
              <Link href="/">
                <Home className="h-4 w-4" />
                Return to Home
              </Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 max-w-7xl">
      <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-navy tracking-tight">Project Management</h1>
          <p className="text-muted-foreground">Review and manage teacher project submissions</p>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => router.push('/admin/dashboard')} 
          className="flex items-center gap-1.5"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Dashboard</span>
        </Button>
      </div>
      
      {message && (
        <Card className={`mb-6 ${message.includes('Error') ? 'border-salmon bg-salmon/5' : 'border-grass bg-grass/5'}`}>
          <CardContent className="py-4">
            <p className={message.includes('Error') ? 'text-salmon' : 'text-grass'}>
              {message}
            </p>
          </CardContent>
        </Card>
      )}
      
      <Tabs defaultValue={statusFilter === 'all' ? 'all' : statusFilter} onValueChange={(value) => setStatusFilter(value)}>
        <TabsList className="mb-6 bg-muted/20">
          <TabsTrigger value="all">All Projects</TabsTrigger>
          <TabsTrigger value="draft">Draft</TabsTrigger>
          <TabsTrigger value="pending">Pending Review</TabsTrigger>
          <TabsTrigger value="active">Active</TabsTrigger>
        </TabsList>
        
        <TabsContent value={statusFilter}>
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="flex items-center gap-2">
                <RefreshCw className="h-5 w-5 animate-spin text-navy" />
                <span className="text-muted-foreground">Loading projects...</span>
              </div>
            </div>
          ) : projects.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-muted-foreground mb-2">
                  {statusFilter === 'all' 
                    ? 'No projects found.' 
                    : statusFilter === 'pending' 
                      ? 'No projects pending review.' 
                      : statusFilter === 'active' 
                        ? 'No active projects found.' 
                        : `No projects with status: ${statusFilter}`}
                </p>
                <Button variant="outline" onClick={() => setStatusFilter('all')}>
                  View All Projects
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {projects.map((project) => (
                <Card key={project.id} className="overflow-hidden">
                  <CardHeader className="pb-3 border-b">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-xl text-navy">{project.title}</CardTitle>
                        <div className="mt-1 text-sm text-muted-foreground">
                          <span className="block mb-1"><span className="font-medium">Teacher:</span> 
                            <TeacherNameDisplay 
                              teacherId={project.teacher_id} 
                              initialName={project.teacher_name} 
                            />
                          </span>
                          <span className="block"><span className="font-medium">School:</span> {project.school_name}</span>
                        </div>
                      </div>
                      {getStatusBadge(project.status)}
                    </div>
                  </CardHeader>
                  
                  <CardContent className="py-4 space-y-4">
                    <div>
                      <h3 className="text-sm font-medium text-navy mb-1.5">Project Description</h3>
                      <p className="text-sm text-muted-foreground">{project.description}</p>
                    </div>
                    
                    <div>
                      <h3 className="text-sm font-medium text-navy mb-1.5">Student Impact</h3>
                      <p className="text-sm text-muted-foreground">{project.student_impact}</p>
                    </div>
                    
                    <div className="flex items-center justify-between py-2 px-3 rounded-md bg-sky/5 border border-sky/20">
                      <div className="flex gap-6">
                        <div>
                          <p className="text-xs text-muted-foreground">Funding Goal</p>
                          <p className="font-semibold text-navy">${project.funding_goal.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Created On</p>
                          <p className="font-medium text-navy">{new Date(project.created_at).toLocaleDateString()}</p>
                        </div>
                      </div>
                    </div>
                    
                    {project.status === 'pending_review' && (
                      <div className="pt-3 border-t">
                        <h3 className="text-sm font-medium text-navy mb-2">Review Notes</h3>
                        <Textarea 
                          className="min-h-24 text-sm resize-none"
                          placeholder="Enter detailed review notes here. Required for requesting revisions or denying a project."
                          value={reviewNotes[project.id] || ''}
                          onChange={(e) => setReviewNotes({...reviewNotes, [project.id]: e.target.value})}
                        />
                      </div>
                    )}
                  </CardContent>
                  
                  <CardFooter className="pt-3 border-t flex-wrap gap-3">
                    {project.status === 'pending_review' && (
                      <div className="w-full flex flex-col sm:flex-row gap-3">
                        <Button
                          variant="grass"
                          className="sm:flex-1"
                          onClick={() => handleReviewProject(project.id, 'approved')}
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

// Create a better loading fallback
function AdminProjectsLoading() {
  return (
    <div className="container mx-auto py-12 px-4">
      <div className="flex items-center justify-between mb-6">
        <div className="h-8 w-64 bg-gray-200 rounded animate-pulse"></div>
        <div className="h-10 w-32 bg-gray-200 rounded animate-pulse"></div>
      </div>
      
      <div className="bg-white rounded-xl p-4 mb-6">
        <div className="h-10 w-full max-w-md bg-gray-200 rounded animate-pulse mb-4"></div>
        <div className="h-8 w-full max-w-lg bg-gray-200 rounded animate-pulse"></div>
      </div>
      
      <div className="space-y-6">
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-white rounded-xl shadow-md p-6 h-64 animate-pulse"></div>
        ))}
      </div>
    </div>
  );
}

// Main component with Suspense boundary
export default function AdminProjectsPage() {
  // Ensure it's mounted before rendering
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);
  
  if (!mounted) {
    return <AdminProjectsLoading />;
  }
  
  return (
    <Suspense fallback={<AdminProjectsLoading />}>
      <AdminProjectsContent />
    </Suspense>
  );
} 