"use client"

import { Suspense } from "react"
import ClientOnly from "@/components/client-only"
import DashboardClient from "./client"

// Create a loading component 
function DashboardLoadingFallback() {
  return (
    <div className="container mx-auto py-10">
      <div className="flex flex-col gap-8">
        <div>
          <div className="h-8 w-48 bg-gray-200 rounded animate-pulse mb-2"></div>
          <div className="h-4 w-64 bg-gray-100 rounded animate-pulse"></div>
        </div>

        <div className="w-full">
          <div className="h-10 w-64 bg-gray-200 rounded-md animate-pulse mb-6"></div>
          
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-lg shadow-sm h-48 animate-pulse"></div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Pure component that doesn't use hooks directly
export default function Dashboard() {
  return (
    <ClientOnly fallback={<DashboardLoadingFallback />}>
      <Suspense fallback={<DashboardLoadingFallback />}>
        <DashboardClient />
      </Suspense>
    </ClientOnly>
  )
}
