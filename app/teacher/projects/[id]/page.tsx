'use client';

import { ProjectDetail } from '../../../../components/ProjectDetail';
import Link from 'next/link';
import { useParams } from 'next/navigation';

export default function TeacherProjectPage() {
  const params = useParams();
  const projectId = params.id as string;
  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="mb-6">
          <Link 
            href="/teacher/projects" 
            className="text-blue-600 hover:underline flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L7.414 9H15a1 1 0 110 2H7.414l2.293 2.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
            Back to My Projects
          </Link>
        </div>
        
        <ProjectDetail 
          projectId={projectId}
          isTeacher={true}
          allowEdit={true}
        />
      </div>
    </div>
  );
} 