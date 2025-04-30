'use client';

import Link from 'next/link';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

type ProjectCardProps = {
  id: string;
  title: string;
  description: string;
  student_impact: string;
  funding_goal: number;
  teacher_name?: string;
  school_name?: string;
  created_at: string;
  teacher_id?: string;
};

export default function ProjectCard({
  id,
  title,
  description,
  student_impact,
  funding_goal,
  teacher_name = 'Unknown',
  school_name = 'Unknown School',
  created_at,
  teacher_id,
}: ProjectCardProps) {
  return (
    <Card className="overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300">
      <CardHeader className="pb-5 border-b">
        <CardTitle className="text-2xl font-bold text-navy mb-5">{title}</CardTitle>
        <div className="space-y-3">
          <div className="flex items-baseline">
            <span className="font-medium text-navy-dark mr-3 min-w-[70px]">Teacher:</span> 
            {teacher_id ? (
              <Link 
                href={`/teacher/profile/${teacher_id}`} 
                className="text-sky hover:underline"
              >
                {teacher_name}
              </Link>
            ) : (
              <span>{teacher_name}</span>
            )}
          </div>
          <div className="flex items-baseline">
            <span className="font-medium text-navy-dark mr-3 min-w-[70px]">School:</span> 
            <span>{school_name}</span>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="py-6 space-y-8">
        <div>
          <h3 className="text-lg font-medium text-navy mb-3">Project Description</h3>
          <p className="text-muted-foreground leading-relaxed">{description}</p>
        </div>
        
        <div>
          <h3 className="text-lg font-medium text-navy mb-3">Student Impact</h3>
          <p className="text-muted-foreground leading-relaxed">{student_impact}</p>
        </div>
        
        <div className="flex items-center justify-between p-5 rounded-md bg-sky/5 border border-sky/20 mt-4">
          <div className="flex gap-10">
            <div>
              <p className="text-sm text-muted-foreground mb-2">Funding Goal</p>
              <p className="text-xl font-semibold text-navy">${funding_goal.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-2">Created On</p>
              <p className="text-lg font-medium text-navy">{new Date(created_at).toLocaleDateString()}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 