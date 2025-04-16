"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"

interface ErrorBoundaryProps {
  children: React.ReactNode
}

export function ErrorBoundary({ children }: ErrorBoundaryProps) {
  const [hasError, setHasError] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)

    // Add global error handler for client-side errors
    const handleError = (event: ErrorEvent) => {
      console.error("Caught in global handler:", event.error)
      setError(event.error)
      setHasError(true)
      event.preventDefault()
    }

    if (typeof window !== "undefined") {
      window.addEventListener("error", handleError)
      return () => window.removeEventListener("error", handleError)
    }
  }, [])

  const handleReset = () => {
    setHasError(false)
    setError(null)
  }

  if (hasError) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center text-center p-4">
        <h2 className="text-2xl font-bold text-[#0E5D7F] mb-4">Something went wrong</h2>
        <p className="text-muted-foreground mb-6 max-w-md">
          We encountered an error while rendering this page. This is likely due to a browser compatibility issue.
        </p>
        <div className="text-left bg-gray-100 p-4 rounded-md mb-6 max-w-md overflow-auto">
          <p className="font-mono text-sm text-red-600">{error?.message || "Unknown error"}</p>
        </div>
        <Button onClick={handleReset} className="bg-[#3AB5E9]">
          Try Again
        </Button>
      </div>
    )
  }

  // Only render children when mounted on client
  if (!isMounted) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#3AB5E9]"></div>
      </div>
    )
  }

  return <>{children}</>
}
