'use client';

import { useState } from 'react';
import { supabase } from '../utils/supabase';
import { Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import DeleteProjectModal from './DeleteProjectModal';

interface ProjectActionsProps {
  projectId: string;
  projectTitle: string;  // Add project title for the confirmation modal
  currentStatus: string;
  isTeacher?: boolean;
  isAdmin?: boolean;
  onProjectUpdated?: () => void;
  buttonVariant?: 'default' | 'small';
}

export default function ProjectActions({ 
  projectId, 
  projectTitle,
  currentStatus, 
  isTeacher = false, 
  isAdmin = false, 
  onProjectUpdated,
  buttonVariant = 'default'
}: ProjectActionsProps) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const router = useRouter();

  const submitForReview = async () => {
    if (currentStatus !== 'draft') {
      setMessage('Only draft projects can be submitted for review.');
      return;
    }

    try {
      setLoading(true);
      
      const { data, error } = await supabase.rpc('submit_project_for_review', {
        p_project_id: projectId
      });
      
      if (error) {
        console.error('Error submitting project for review:', error);
        setMessage(`Error: ${error.message}`);
        return;
      }
      
      setMessage('Project successfully submitted for review!');
      
      if (onProjectUpdated) {
        onProjectUpdated();
      }
    } catch (error) {
      console.error('Error submitting project:', error);
      setMessage('An error occurred while submitting the project.');
    } finally {
      setLoading(false);
    }
  };

  // New function to open the delete modal
  const openDeleteModal = () => {
    setShowDeleteModal(true);
  };

  // New function to delete a project
  const deleteProject = async () => {
    try {
      setIsDeleting(true);
      console.log('Deleting project with ID:', projectId);
      
      // Call the API endpoint
      const response = await fetch('/api/delete-project', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ projectId }),
      });
      
      console.log('Delete API response status:', response.status);
      const result = await response.json();
      console.log('Delete API response body:', result);
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete project');
      }
      
      console.log('Project deleted successfully');
      setMessage('Project successfully deleted!');
      
      // Close the modal
      setShowDeleteModal(false);
      
      // Run callback immediately
      if (onProjectUpdated) {
        onProjectUpdated();
      }
      
      // Redirect to projects list immediately - no delay
      router.push('/teacher/projects');
      router.refresh();
    } catch (error: any) {
      console.error('Error deleting project:', error);
      setMessage(`Error: ${error.message}`);
    } finally {
      setIsDeleting(false);
    }
  };

  const getStatusBadge = () => {
    switch (currentStatus) {
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
      case 'funded':
        return (
          <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
            Funded
          </div>
        );
      case 'completed':
        return (
          <div className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-medium">
            Completed
          </div>
        );
      case 'denied':
      case 'rejected':
        return (
          <div className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-medium">
            Rejected
          </div>
        );
      default:
        return (
          <div className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm font-medium">
            {currentStatus}
          </div>
        );
    }
  };

  const getActionButton = () => {
    // Only show action buttons for teachers or admins
    if (!isTeacher && !isAdmin) return null;

    const btnClass = buttonVariant === 'small' 
      ? "px-3 py-1.5 text-sm rounded-md focus:outline-none focus:ring-2 focus:ring-offset-1"
      : "px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2";
      
    // For draft projects, show Submit button
    if (currentStatus === 'draft' && isTeacher) {
      return (
        <div className="flex space-x-2">
          <button
            className={`${btnClass} bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500`}
            onClick={submitForReview}
            disabled={loading}
          >
            {loading ? 'Submitting...' : 'Submit for Review'}
          </button>
          
          <button
            className={`${btnClass} bg-red-600 text-white hover:bg-red-700 focus:ring-red-500`}
            onClick={openDeleteModal}
            disabled={isDeleting}
          >
            {buttonVariant === 'small' ? <Trash2 className="h-4 w-4" /> : 'Delete'}
          </button>
        </div>
      );
    }
    
    // For rejected projects, show Edit and Resubmit button
    if ((currentStatus === 'denied' || currentStatus === 'rejected') && isTeacher) {
      return (
        <div className="flex space-x-2">
          <button
            className={`${btnClass} bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500`}
            onClick={async () => {
              setLoading(true);
              try {
                const { data, error } = await supabase
                  .from('projects')
                  .update({ status: 'draft' })
                  .eq('id', projectId);
                  
                if (error) {
                  console.error('Error updating project status:', error);
                  setMessage(`Error: ${error.message}`);
                  return;
                }
                
                if (onProjectUpdated) {
                  onProjectUpdated();
                }
                
                setMessage('Project returned to draft status for editing.');
              } catch (error) {
                console.error('Error reverting project:', error);
                setMessage('An error occurred while updating the project.');
              } finally {
                setLoading(false);
              }
            }}
            disabled={loading}
          >
            Edit and Resubmit
          </button>
          
          <button
            className={`${btnClass} bg-red-600 text-white hover:bg-red-700 focus:ring-red-500`}
            onClick={openDeleteModal}
            disabled={isDeleting}
          >
            {buttonVariant === 'small' ? <Trash2 className="h-4 w-4" /> : 'Delete'}
          </button>
        </div>
      );
    }
    
    // For other statuses, only admins or teacher owners can delete
    if ((isTeacher || isAdmin) && ['pending_review', 'approved', 'active', 'needs_revision', 'draft', 'denied', 'rejected'].includes(currentStatus)) {
      return (
        <button
          className={`${btnClass} bg-red-600 text-white hover:bg-red-700 focus:ring-red-500`}
          onClick={openDeleteModal}
          disabled={isDeleting}
        >
          {buttonVariant === 'small' ? <Trash2 className="h-4 w-4" /> : 'Delete'}
        </button>
      );
    }
    
    return null;
  };

  if (buttonVariant === 'small') {
    return (
      <>
        {getActionButton()}
        {message && (
          <div className={`mt-2 p-2 text-xs rounded-md ${message.includes('Error') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
            {message}
          </div>
        )}
        
        {/* Delete Modal */}
        <DeleteProjectModal
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          onConfirm={deleteProject}
          projectTitle={projectTitle}
          isDeleting={isDeleting}
        />
      </>
    );
  }

  return (
    <div className="mt-6 border-t border-gray-200 pt-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Status:</h3>
          {getStatusBadge()}
        </div>
        
        {getActionButton()}
      </div>
      
      {message && (
        <div className={`mt-4 p-3 rounded-md ${message.includes('Error') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
          {message}
        </div>
      )}
      
      {currentStatus === 'pending_review' && (
        <div className="mt-4 bg-yellow-50 p-4 rounded-md">
          <p className="text-sm text-yellow-700">
            <strong>Note:</strong> Once submitted, your project will be reviewed by our team. This process typically takes 1-2 business days. You'll receive a notification when the review is complete.
          </p>
        </div>
      )}
      
      {(currentStatus === 'denied' || currentStatus === 'rejected') && (
        <div className="mt-4 bg-red-50 p-4 rounded-md">
          <p className="text-sm text-red-700">
            <strong>Note:</strong> Your project was not approved. Please review any feedback provided, make the necessary changes, and resubmit.
          </p>
        </div>
      )}
      
      {/* Delete Modal */}
      <DeleteProjectModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={deleteProject}
        projectTitle={projectTitle}
        isDeleting={isDeleting}
      />
    </div>
  );
} 