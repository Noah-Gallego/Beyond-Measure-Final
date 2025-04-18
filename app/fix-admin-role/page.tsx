"use client"

import { useEffect, useState, Suspense } from "react"
import { useAuth } from "@/components/AuthProvider"
import { supabase } from "@/utils/supabase"
import { useRouter } from "next/navigation"

// Loading fallback component
function FixAdminRoleLoading() {
  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-4">Loading...</h1>
    </div>
  );
}

// Content component that will be wrapped in Suspense
function FixAdminRoleInnerContent() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  // Dynamically import useSearchParams to ensure proper Suspense handling
  const nextNavigation = require('next/navigation');
  const searchParams = nextNavigation.useSearchParams()
  const [databaseUserData, setDatabaseUserData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [isUpdating, setIsUpdating] = useState(false)
  const [message, setMessage] = useState("")
  const [errorMessage, setErrorMessage] = useState("")
  
  useEffect(() => {
    const fetchUserData = async () => {
      if (!user) return
      
      try {
        // Fetch user data from database
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('auth_id', user.id)
          .single()
        
        if (error) {
          console.error('Error fetching user data:', error)
          return
        }
        
        setDatabaseUserData(data)
      } catch (error) {
        console.error('Error:', error)
      } finally {
        setLoading(false)
      }
    }
    
    if (user) {
      fetchUserData()
    } else {
      setLoading(false)
    }
  }, [user])

  const updateToAdminRole = async () => {
    if (!user || !databaseUserData) {
      setErrorMessage("User data not available")
      return
    }
    
    setIsUpdating(true)
    setMessage("")
    setErrorMessage("")
    
    try {
      // 1. Update the user's metadata in Supabase Auth
      const { error: updateMetadataError } = await supabase.auth.updateUser({
        data: { role: 'admin' }
      })
      
      if (updateMetadataError) {
        throw new Error(`Failed to update auth metadata: ${updateMetadataError.message}`)
      }
      
      // 2. Update the user's role in the database
      const { error: updateRoleError } = await supabase
        .from('users')
        .update({ role: 'admin' })
        .eq('id', databaseUserData.id)
      
      if (updateRoleError) {
        throw new Error(`Failed to update database role: ${updateRoleError.message}`)
      }
      
      setMessage("Successfully updated role to admin. You'll be redirected to the admin dashboard shortly.")
      
      // Refresh the page data
      const { data: updatedUser, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .eq('auth_id', user.id)
        .single()
      
      if (!fetchError) {
        setDatabaseUserData(updatedUser)
      }
      
      // Redirect after a short delay
      setTimeout(() => {
        router.push('/admin/dashboard')
      }, 3000)
    } catch (error: any) {
      console.error('Error updating role:', error)
      setErrorMessage(error.message || "Failed to update role")
    } finally {
      setIsUpdating(false)
    }
  }

  if (isLoading || loading) {
    return (
      <div className="container mx-auto p-8">
        <h1 className="text-2xl font-bold mb-4">Loading...</h1>
      </div>
    )
  }
  
  if (!user) {
    return (
      <div className="container mx-auto p-8">
        <div className="bg-red-100 p-4 rounded">
          <p className="text-red-700">You must be logged in to use this page</p>
          <a href="/auth" className="text-blue-600 underline">Go to login</a>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-4">Fix Admin Role</h1>
      
      <div className="bg-gray-100 p-4 rounded mb-6">
        <h2 className="text-lg font-semibold mb-2">Current User Information</h2>
        <div className="space-y-2 mb-4">
          <p><strong>Email:</strong> {user.email}</p>
          <p><strong>Auth Role (Metadata):</strong> {user.user_metadata?.role || 'Not set'}</p>
          <p><strong>Database Role:</strong> {databaseUserData?.role || 'Not found'}</p>
        </div>
      </div>
      
      {message && (
        <div className="bg-green-100 text-green-700 p-4 rounded mb-4">
          {message}
        </div>
      )}
      
      {errorMessage && (
        <div className="bg-red-100 text-red-700 p-4 rounded mb-4">
          {errorMessage}
        </div>
      )}
      
      <div className="flex space-x-4 mb-6">
        <button 
          onClick={updateToAdminRole}
          disabled={isUpdating}
          className="px-4 py-2 bg-blue-600 text-white rounded disabled:bg-blue-300"
        >
          {isUpdating ? 'Updating...' : 'Set Role to Admin'}
        </button>
        
        <a 
          href="/debug-auth" 
          className="px-4 py-2 bg-gray-200 text-gray-800 rounded inline-block"
        >
          Back to Debug Page
        </a>
      </div>
      
      <div className="bg-yellow-50 p-4 rounded border border-yellow-200">
        <p className="text-yellow-800">
          <strong>Note:</strong> This page updates both your Supabase Auth metadata and the database role to 'admin'. 
          Use this only if you know you should have admin access but are being redirected incorrectly.
        </p>
      </div>
    </div>
  )
}

// Wrapper component with its own Suspense boundary
function FixAdminRoleContent() {
  return (
    <Suspense fallback={<FixAdminRoleLoading />}>
      <FixAdminRoleInnerContent />
    </Suspense>
  );
}

// Main component with Suspense boundary
export default function FixAdminRolePage() {
  return (
    <Suspense fallback={<FixAdminRoleLoading />}>
      <FixAdminRoleContent />
    </Suspense>
  )
} 