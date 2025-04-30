'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/utils/supabase';
import ProjectCard from './ProjectCard';

type SingleProjectDisplayProps = {
  projectId: string;
};

export default function SingleProjectDisplay({ projectId }: SingleProjectDisplayProps) {
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProject = async () => {
      try {
        setLoading(true);
        
        const { data, error } = await supabase
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
          .eq('id', projectId)
          .single();
        
        if (error) {
          throw error;
        }
        
        if (!data) {
          throw new Error('Project not found');
        }
        
        // Format teacher name
        const teacherFirstName = data.teacher_profiles?.users?.first_name || 'Unknown';
        const teacherLastName = data.teacher_profiles?.users?.last_name || '';
        const teacherName = `${teacherFirstName} ${teacherLastName}`.trim() || 'Unknown Teacher';
        const schoolName = data.teacher_profiles?.school_name || 'Unknown School';
        
        setProject({
          ...data,
          teacher_name: teacherName,
          school_name: schoolName,
          teacher_id: data.teacher_profiles?.id
        });
      } catch (error: any) {
        console.error('Error fetching project:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchProject();
  }, [projectId]);

  if (loading) {
    return <div className="py-8 text-center">Loading project information...</div>;
  }

  if (error || !project) {
    return <div className="py-8 text-center text-red-500">Error: {error || 'Project not found'}</div>;
  }

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <ProjectCard 
        id={project.id}
        title={project.title}
        description={project.description}
        student_impact={project.student_impact}
        funding_goal={project.funding_goal}
        teacher_name={project.teacher_name}
        school_name={project.school_name}
        created_at={project.created_at}
        teacher_id={project.teacher_id}
      />
    </div>
  );
} 