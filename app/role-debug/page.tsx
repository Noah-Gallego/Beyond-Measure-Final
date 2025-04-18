"use client"

import { Suspense } from "react"
import ClientOnly from "@/components/client-only"
import { useEffect, useState } from "react"
import dynamic from "next/dynamic"

// Dynamically import the content wrapper to ensure proper handling of hooks
const RoleDebugContentWrapper = dynamic(
  () => import("@/components/role-debug/RoleDebugContentWrapper"),
  { ssr: false }
)

// Loading component
function RoleDebugLoading() {
  return (
    <div className="container mx-auto py-10 px-4">
      <h1 className="text-3xl font-bold mb-6">Role Debugging</h1>
      <div className="animate-spin h-10 w-10 border-4 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
    </div>
  );
}

// Main page export with proper Suspense boundaries
export default function RoleDebugPage() {
  // Mounted state to ensure client-side only rendering
  const [mounted, setMounted] = useState(false)
  
  useEffect(() => {
    setMounted(true)
  }, [])
  
  if (!mounted) {
    return <RoleDebugLoading />
  }
  
  return (
    <ClientOnly fallback={<RoleDebugLoading />}>
      <Suspense fallback={<RoleDebugLoading />}>
        <RoleDebugContentWrapper />
      </Suspense>
    </ClientOnly>
  )
} 