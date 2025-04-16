"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function ProjectsRedirectPage() {
  const router = useRouter()
  
  useEffect(() => {
    // Redirect to the new teacher projects page
    router.replace("/teacher/projects")
  }, [router])

  return (
    <div className="container mx-auto py-10 flex items-center justify-center h-[50vh]">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Redirecting...</h1>
        <p>Please wait while we redirect you to the updated projects page.</p>
      </div>
    </div>
  )
} 