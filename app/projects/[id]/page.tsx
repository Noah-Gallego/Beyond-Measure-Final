"use client"

import { useEffect } from "react"
import { useParams, useRouter } from "next/navigation"

export default function ProjectDetailsRedirectPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params?.id
  
  useEffect(() => {
    // Redirect to the teacher projects page
    // If there's a project ID, we'll redirect to that specific project
    if (projectId) {
      router.replace(`/teacher/projects/${projectId}`)
    } else {
      router.replace("/teacher/projects")
    }
  }, [router, projectId])

  return (
    <div className="container mx-auto py-10 flex items-center justify-center h-[50vh]">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Redirecting...</h1>
        <p>Please wait while we redirect you to the updated project details page.</p>
      </div>
    </div>
  )
} 