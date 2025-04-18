"use client";

import { Suspense } from "react";
import { Loader } from "lucide-react";
import DashboardContent from "@/components/teacher/DashboardContent";

export default function AlternativeTeacherDashboard() {
  return (
    <Suspense fallback={
      <div className="container mx-auto py-10">
        <div className="flex justify-center items-center min-h-[60vh]">
          <Loader className="animate-spin h-8 w-8 text-blue-500" />
          <span className="ml-2">Loading dashboard...</span>
        </div>
      </div>
    }>
      <DashboardContent />
    </Suspense>
  );
} 