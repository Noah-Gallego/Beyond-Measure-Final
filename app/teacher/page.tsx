import { Suspense } from 'react';
import TeacherDashboardContent from '@/components/TeacherDashboardContent';

export default function TeacherDashboard() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">Teacher Dashboard</h1>
        <Suspense fallback={
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        }>
          <TeacherDashboardContent />
        </Suspense>
      </div>
    </div>
  );
} 