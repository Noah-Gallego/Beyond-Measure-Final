import { Suspense } from "react";
import TeacherListingPage from "@/components/teachers/TeacherListingPage";
import ClientOnly from "@/components/client-only";

// Loading Fallback Component
function ListingLoading() {
  return (
    <div className="flex justify-center items-center min-h-[60vh]">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#3AB5E9]"></div>
    </div>
  );
}

export default function TeachersPage() {
  return (
    <div className="container mx-auto py-10 px-4 sm:px-6">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-[#0E5D7F] mb-4">Our Teachers</h1>
          <p className="text-gray-600 max-w-3xl">
            Meet the dedicated educators who are making a difference in their classrooms. Support their projects and help students succeed.
          </p>
        </div>
        
        <ClientOnly fallback={<ListingLoading />}>
          <Suspense fallback={<ListingLoading />}>
            <TeacherListingPage />
          </Suspense>
        </ClientOnly>
      </div>
    </div>
  );
} 