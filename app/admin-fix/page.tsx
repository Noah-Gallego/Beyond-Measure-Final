"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/components/AuthProvider"
import { supabase } from "@/utils/supabase"

export default function AdminFixPage() {
  const { user, isLoading } = useAuth()
  const [isFixing, setIsFixing] = useState(false)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")
  const [dbUser, setDbUser] = useState<any>(null)
  
  useEffect(() => {
    // Check database user if authenticated
    const checkUser = async () => {
      if (!user) return
      
      try {
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('auth_id', user.id)
          .single()
          
        if (error) {
          console.error("Error fetching user:", error)
          setError(`Database error: ${error.message}`)
          return
        }
        
        setDbUser(data)
      } catch (err: any) {
        setError(`Error: ${err.message}`)
      }
    }
    
    if (!isLoading && user) {
      checkUser()
    }
  }, [user, isLoading])
  
  const forceAdminRole = async () => {
    if (!user || !dbUser) {
      setError("User not available")
      return
    }
    
    setIsFixing(true)
    setMessage("")
    setError("")
    
    try {
      // 1. Update auth metadata with role=admin
      console.log("Setting auth metadata role to admin...")
      const { error: authError } = await supabase.auth.updateUser({
        data: { role: 'admin' }
      })
      
      if (authError) {
        throw new Error(`Auth update failed: ${authError.message}`)
      }
      
      // 2. Update database role
      console.log("Setting database role to admin...")
      const { error: dbError } = await supabase
        .from('users')
        .update({ role: 'admin' })
        .eq('id', dbUser.id)
      
      if (dbError) {
        throw new Error(`Database update failed: ${dbError.message}`)
      }
      
      setMessage("Admin role successfully applied! You can now navigate to the admin dashboard.")
    } catch (err: any) {
      console.error("Fix error:", err)
      setError(err.message || "An unknown error occurred")
    } finally {
      setIsFixing(false)
    }
  }
  
  if (isLoading) {
    return (
      <div className="container mx-auto p-8">
        <h1 className="text-3xl font-bold mb-6">Admin Fix Tool</h1>
        <div className="animate-spin h-10 w-10 border-4 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
      </div>
    )
  }
  
  if (!user) {
    return (
      <div className="container mx-auto p-8">
        <h1 className="text-3xl font-bold mb-6">Admin Fix Tool</h1>
        <div className="bg-red-100 p-6 rounded-lg">
          <p className="text-red-700 font-bold mb-2">Not Logged In</p>
          <p className="text-red-700 mb-4">You need to log in to use this tool.</p>
          <a href="/auth" className="bg-blue-500 hover:bg-blue-700 text-white py-2 px-4 rounded inline-block">
            Go to Login
          </a>
        </div>
      </div>
    )
  }
  
  const currentAuthRole = user.user_metadata?.role || 'none'
  const currentDbRole = dbUser?.role || 'unknown'
  
  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">Admin Fix Tool</h1>
      
      {message && (
        <div className="bg-green-100 border border-green-400 p-4 rounded-lg mb-6 text-green-700">
          <p className="font-bold">Success!</p>
          <p>{message}</p>
        </div>
      )}
      
      {error && (
        <div className="bg-red-100 border border-red-400 p-4 rounded-lg mb-6 text-red-700">
          <p className="font-bold">Error</p>
          <p>{error}</p>
        </div>
      )}
      
      <div className="bg-white shadow-md rounded-lg p-6 mb-8">
        <h2 className="text-xl font-bold mb-4">Current User Status</h2>
        
        <div className="mb-4">
          <p className="text-gray-600">Email: <span className="font-medium text-black">{user.email}</span></p>
          <p className="text-gray-600">Auth Role: <span className="font-medium text-black">{currentAuthRole}</span></p>
          <p className="text-gray-600">Database Role: <span className="font-medium text-black">{currentDbRole}</span></p>
        </div>
        
        <div className="flex space-x-4 mt-6">
          <button
            onClick={forceAdminRole}
            disabled={isFixing}
            className={`${
              isFixing 
                ? 'bg-blue-300 cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-700'
            } text-white py-2 px-4 rounded-lg font-medium`}
          >
            {isFixing ? 'Setting Admin Role...' : 'Force Set Admin Role'}
          </button>
        </div>
      </div>
      
      <div className="bg-white shadow-md rounded-lg p-6 mb-8">
        <h2 className="text-xl font-bold mb-4">Navigation</h2>
        <p className="text-gray-600 mb-4">Once your role is fixed, use these links to navigate:</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <a 
            href="/dashboard"
            className="bg-gray-100 hover:bg-gray-200 text-center p-4 rounded-lg"
          >
            Regular Dashboard
          </a>
          
          <a 
            href="/admin/dashboard"
            className="bg-purple-100 hover:bg-purple-200 text-center p-4 rounded-lg"
          >
            Admin Dashboard
          </a>
          
          <a 
            href="/role-debug"
            className="bg-yellow-100 hover:bg-yellow-200 text-center p-4 rounded-lg"
          >
            Role Debug Tool
          </a>
          
          <button
            onClick={() => window.location.reload()}
            className="bg-green-100 hover:bg-green-200 text-center p-4 rounded-lg"
          >
            Refresh Page
          </button>
        </div>
      </div>
      
      <div className="bg-blue-50 p-4 rounded-lg">
        <p className="text-sm text-blue-800">
          <strong>Note:</strong> After fixing your role, you may need to reload the page or clear your browser cache for changes to take effect.
        </p>
      </div>
    </div>
  )
} 