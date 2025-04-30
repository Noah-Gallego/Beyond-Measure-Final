"use client"

import { useEffect, useState, Suspense } from "react"
import { useAuth } from "@/components/AuthProvider"
import { supabase } from "@/utils/supabase"
import { getDashboardUrlByRole } from "@/utils/auth-helpers"

// Wrapper component that doesn't use any hooks that require Suspense
function ClientWrapper() {
  return (
    <Suspense fallback={
      <div className="container mx-auto p-8">
        <h1 className="text-2xl font-bold mb-4">Loading...</h1>
      </div>
    }>
      <DebugAuthContent />
    </Suspense>
  );
}

// Content component that will be wrapped in Suspense
function DebugAuthContent() {
  const { user, isLoading } = useAuth()
  const [databaseUserData, setDatabaseUserData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

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

  if (isLoading || loading) {
    return (
      <div className="container mx-auto p-8">
        <h1 className="text-2xl font-bold mb-4">Loading...</h1>
      </div>
    )
  }

  const getLocalDashboardLink = () => {
    if (!user) return '/'
    
    const role = user.user_metadata?.role?.toLowerCase() || 'donor'
    
    switch (role) {
      case 'teacher':
        return '/teacher/dashboard'
      case 'admin':
        return '/admin/dashboard'
      case 'donor':
      default:
        return '/dashboard'
    }
  }

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-4">Auth Debug Information</h1>
      
      {!user ? (
        <div className="bg-red-100 p-4 rounded">
          <p className="text-red-700">Not logged in</p>
          <a href="/auth" className="text-blue-600 underline">Go to login</a>
        </div>
      ) : (
        <div className="space-y-8">
          <div className="bg-gray-100 p-4 rounded">
            <h2 className="text-xl font-bold mb-2">User Auth Data</h2>
            <pre className="bg-black text-green-400 p-4 rounded overflow-x-auto whitespace-pre-wrap">
              {JSON.stringify({
                id: user.id,
                email: user.email,
                role: user.user_metadata?.role,
                metadata: user.user_metadata
              }, null, 2)}
            </pre>
            <div className="mt-4 space-y-2">
              <p>
                <strong>Local function result:</strong> {getLocalDashboardLink()}
              </p>
              <p>
                <strong>Auth helper function result:</strong> {getDashboardUrlByRole(user)}
              </p>
              <div className="bg-yellow-100 p-3 rounded border border-yellow-300 mt-2">
                <h3 className="font-bold text-yellow-800">Expected Behavior:</h3>
                <ul className="list-disc ml-5 mt-2 space-y-1 text-yellow-800">
                  <li>Admin users should go to <code>/admin/dashboard</code></li>
                  <li>Teacher users should go to <code>/teacher/dashboard</code></li>
                  <li>Donor users should go to <code>/dashboard</code></li>
                </ul>
              </div>
            </div>
          </div>
          
          {databaseUserData && (
            <div className="bg-gray-100 p-4 rounded">
              <h2 className="text-xl font-bold mb-2">Database User Data</h2>
              <pre className="bg-black text-green-400 p-4 rounded overflow-x-auto whitespace-pre-wrap">
                {JSON.stringify(databaseUserData, null, 2)}
              </pre>

              {/* Add mismatch detection */}
              {user.user_metadata?.role?.toLowerCase() !== databaseUserData.role && (
                <div className="bg-red-100 border border-red-300 text-red-700 p-4 rounded mt-4">
                  <p className="font-bold">Role Mismatch Detected!</p>
                  <p className="mt-2">
                    Your authentication metadata role ({user.user_metadata?.role || 'undefined'}) 
                    does not match your database role ({databaseUserData.role}).
                    This could cause redirection issues.
                  </p>
                  <a 
                    href="/fix-admin-role" 
                    className="inline-block mt-3 px-4 py-2 bg-blue-600 text-white rounded"
                  >
                    Fix Admin Role
                  </a>
                </div>
              )}
            </div>
          )}
          
          <div className="flex space-x-4">
            <a 
              href="/dashboard" 
              className="px-4 py-2 bg-blue-500 text-white rounded"
            >
              Go to Dashboard
            </a>
            <a 
              href="/admin/dashboard" 
              className="px-4 py-2 bg-purple-500 text-white rounded"
            >
              Go to Admin Dashboard
            </a>
            <a 
              href="/teacher/dashboard" 
              className="px-4 py-2 bg-green-500 text-white rounded"
            >
              Go to Teacher Dashboard
            </a>
            <a 
              href="/fix-admin-role" 
              className="px-4 py-2 bg-red-500 text-white rounded"
            >
              Fix Admin Role
            </a>
            <a 
              href="/fix-donor-role" 
              className="px-4 py-2 bg-yellow-500 text-white rounded"
            >
              Fix Donor Role
            </a>
          </div>
        </div>
      )}
    </div>
  )
}

// Main component
export default function DebugAuthPage() {
  return <ClientWrapper />;
} 