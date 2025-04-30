'use client';

import { ProjectDetail } from '../../../../components/ProjectDetail';
import { useParams } from 'next/navigation';
import { useAuth } from '../../../../components/AuthProvider';
import { useState, useEffect } from 'react';
import { supabase } from '../../../../utils/supabase';

export default function TeacherProjectPage() {
  const params = useParams();
  const projectId = params.id as string;
  const { user } = useAuth();
  const [isProjectOwner, setIsProjectOwner] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Check if the current user is the owner of this project
  useEffect(() => {
    async function checkProjectOwnership() {
      if (!user) return;
      
      try {
        // Get the user's role
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('role')
          .eq('auth_id', user.id)
          .single();
          
        if (!userError && userData) {
          setUserRole(userData.role);
        }
        
        // Check if the user is the owner of this project
        if (projectId) {
          const { data: projectData, error: projectError } = await supabase
            .from('projects')
            .select('teacher_id')
            .eq('id', projectId)
            .single();
            
          if (!projectError && projectData) {
            const { data: teacherData, error: teacherError } = await supabase
              .from('teacher_profiles')
              .select('user_id')
              .eq('id', projectData.teacher_id)
              .single();
              
            if (!teacherError && teacherData) {
              // Get the database user ID for the current auth user
              const { data: currentUserData, error: currentUserError } = await supabase
                .from('users')
                .select('id')
                .eq('auth_id', user.id)
                .single();
                
              if (!currentUserError && currentUserData) {
                // Check if the current user is the teacher of this project
                setIsProjectOwner(teacherData.user_id === currentUserData.id);
              }
            }
          }
        }
      } catch (error) {
        console.error('Error checking project ownership:', error);
      } finally {
        setLoading(false);
      }
    }
    
    checkProjectOwnership();
  }, [user, projectId]);
  
  const isTeacher = userRole === 'teacher';
  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <ProjectDetail 
          projectId={projectId}
          isTeacher={isTeacher}
          allowEdit={isTeacher && isProjectOwner}
        />
      </div>
    </div>
  );
} 