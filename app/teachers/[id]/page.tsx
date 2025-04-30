import { Suspense } from "react";
import PublicTeacherProfile from "@/components/teachers/PublicTeacherProfile";
import ClientOnly from "@/components/client-only";

// Loading Fallback Component
function ProfileLoading() {
  return (
    <div className="flex justify-center items-center min-h-[60vh]">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#3AB5E9]"></div>
    </div>
  );
}

export default function TeacherPublicProfilePage({ params }: { params: { id: string } }) {
  const teacherId = params.id;
  
  return (
    <div className="container mx-auto py-10 px-4 sm:px-6">
      <ClientOnly fallback={<ProfileLoading />}>
        <Suspense fallback={<ProfileLoading />}>
          <PublicTeacherProfile teacherId={teacherId} />
        </Suspense>
      </ClientOnly>
    </div>
  );
} 