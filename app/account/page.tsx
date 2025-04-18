'use client';

import { Suspense, useEffect, useState } from "react"
import ClientOnly from "@/components/client-only"
import dynamic from "next/dynamic"

// Dynamically import the profile content component
const ProfileContent = dynamic(
  () => import("@/components/ProfileContent"),
  { ssr: false }
);

// Loading fallback component
function AccountLoading() {
  return (
    <div className="flex justify-center items-center min-h-[60vh]">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>
  );
}

export default function AccountPage() {
  // Ensure client-side only rendering
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);
  
  if (!mounted) {
    return (
      <div className="container mx-auto py-10">
        <h1 className="text-3xl font-bold mb-8">Your Account</h1>
        <AccountLoading />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-8">Your Account</h1>
      <ClientOnly fallback={<AccountLoading />}>
        <Suspense fallback={<AccountLoading />}>
          <ProfileContent />
        </Suspense>
      </ClientOnly>
    </div>
  )
}
