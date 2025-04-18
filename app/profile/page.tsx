import { Suspense } from "react"
import ProfileContentWrapper from "@/components/ProfileContentWrapper"
import ClientOnly from "@/components/client-only"

// Loading Fallback Component
function ProfileLoading() {
  return (
    <div className="flex justify-center items-center min-h-[60vh]">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>
  );
}

// Main Page Component with ClientOnly and proper Suspense
export default function ProfilePage() {
  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-8">Your Profile</h1>
      <ClientOnly fallback={<ProfileLoading />}>
        <Suspense fallback={<ProfileLoading />}>
          <ProfileContentWrapper />
        </Suspense>
      </ClientOnly>
    </div>
  )
} 