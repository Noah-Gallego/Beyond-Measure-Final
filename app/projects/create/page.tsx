"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function CreateProjectRedirectPage() {
  const router = useRouter()
  
  useEffect(() => {
    // Redirect to the new teacher projects create page
    router.replace("/teacher/projects/create")
  }, [router])

  return (
    <div className="container mx-auto py-10 flex items-center justify-center h-[50vh]">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Redirecting...</h1>
        <p>Please wait while we redirect you to the updated project creation page.</p>
      </div>
    </div>
  )
} 