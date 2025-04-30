"use client"

import { Suspense } from "react"
import ClientOnly from "@/components/client-only"
import { useEffect, useState } from "react"
import { useAuth } from "@/components/AuthProvider"
import { supabase } from "@/utils/supabase"
import { useRouter } from "next/navigation"

// Loading component
function FixDonorRoleLoading() {
  return (
    <div className="container mx-auto py-10 px-4">
      <h1 className="text-3xl font-bold mb-6">Fix Donor Role</h1>
      <div className="animate-spin h-10 w-10 border-4 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
    </div>
  );
}

function FixDonorRoleContent() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const [isUpdating, setIsUpdating] = useState(false)
  const [isClearing, setIsClearing] = useState(false)
  const [message, setMessage] = useState("")
  const [errorMessage, setErrorMessage] = useState("")
  const [databaseUserData, setDatabaseUserData] = useState<any>(null)
  const [donorProfile, setDonorProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [hasLocalCache, setHasLocalCache] = useState(false)

  useEffect(() => {
    if (!isLoading && user) {
      fetchUserData()
      // Check if there's any local storage cache
      checkLocalCache()
    } else if (!isLoading) {
      setLoading(false)
    }
  }, [isLoading, user])

  const checkLocalCache = () => {
    if (typeof window === 'undefined' || !user) return
    
    // Check for donor-related cache entries
    const cacheKeys = [
      `donor_profile_${user.id}`,
      `donor_setup_completed_${user.id}`
    ]
    
    let hasCache = false
    cacheKeys.forEach(key => {
      if (localStorage.getItem(key)) {
        hasCache = true
      }
    })
    
    setHasLocalCache(hasCache)
  }

  const clearLocalCache = () => {
    if (typeof window === 'undefined' || !user) return
    
    setIsClearing(true)
    
    try {
      // Clear all donor-related cache entries
      const cacheKeys = [
        `donor_profile_${user.id}`,
        `donor_setup_completed_${user.id}`
      ]
      
      cacheKeys.forEach(key => {
        localStorage.removeItem(key)
      })
      
      setMessage("Successfully cleared local cache. Please refresh the dashboard.")
      setHasLocalCache(false)
    } catch (err) {
      console.error('Error clearing cache:', err)
      setErrorMessage("Failed to clear local cache")
    } finally {
      setIsClearing(false)
    }
  }

  const fetchUserData = async () => {
    if (!user) return
    
    try {
      // Get user data from database
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('auth_id', user.id)
        .single()
      
      if (userError && userError.code !== 'PGRST116') {
        console.error('Error fetching user data:', userError)
        setErrorMessage("Error fetching user data")
      } else {
        setDatabaseUserData(userData || null)
        
        // Check if donor profile exists
        if (userData) {
          const { data: donorData, error: donorError } = await supabase
            .from('donor_profiles')
            .select('*')
            .eq('user_id', userData.id)
            .maybeSingle()
            
          if (donorError && donorError.code !== 'PGRST116') {
            console.error('Error fetching donor profile:', donorError)
          } else {
            setDonorProfile(donorData || null)
          }
        }
      }
    } catch (err) {
      console.error('Error:', err)
      setErrorMessage("An unexpected error occurred")
    } finally {
      setLoading(false)
    }
  }

  const fixDonorRole = async () => {
    if (!user) {
      setErrorMessage("Not logged in")
      return
    }
    
    setIsUpdating(true)
    setMessage("")
    setErrorMessage("")
    
    try {
      // Step 1: Update auth metadata to donor role
      const { error: authError } = await supabase.auth.updateUser({
        data: { role: 'donor' }
      })
      
      if (authError) {
        throw new Error(`Auth update failed: ${authError.message}`)
      }
      
      // Step 2: Ensure user exists in the database
      let userId = databaseUserData?.id
      
      if (!databaseUserData) {
        // Create user record if it doesn't exist
        const { data: newUser, error: createError } = await supabase
          .from('users')
          .insert({
            auth_id: user.id,
            email: user.email,
            first_name: user.user_metadata?.first_name || '',
            last_name: user.user_metadata?.last_name || '',
            role: 'donor',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select()
          .single()
          
        if (createError) {
          throw new Error(`Database user creation failed: ${createError.message}`)
        }
        
        userId = newUser.id
      } else {
        // Update existing user role to donor
        const { error: dbError } = await supabase
          .from('users')
          .update({ role: 'donor', updated_at: new Date().toISOString() })
          .eq('id', databaseUserData.id)
          
        if (dbError) {
          throw new Error(`Database role update failed: ${dbError.message}`)
        }
      }
      
      // Step 3: Ensure donor profile exists
      if (!donorProfile && userId) {
        // Use RPC function first
        try {
          const { data: rpcData, error: rpcError } = await supabase.rpc('get_or_create_donor_profile', {
            p_user_id: user.id,
            p_is_anonymous: false
          })
          
          if (rpcError) {
            throw rpcError
          }
          
          setMessage("Successfully fixed donor role and created donor profile via RPC")
        } catch (rpcErr) {
          console.error('RPC failed:', rpcErr)
          
          // Fallback to direct insert
          const { error: donorCreateError } = await supabase
            .from('donor_profiles')
            .insert({
              user_id: userId,
              is_anonymous: false,
              created_at: new Date().toISOString()
            })
            
          if (donorCreateError) {
            throw new Error(`Donor profile creation failed: ${donorCreateError.message}`)
          }
          
          setMessage("Successfully fixed donor role and created donor profile")
        }
      } else {
        setMessage("Successfully fixed donor role (donor profile already exists)")
      }
      
      // Reload user data to show updated state
      await fetchUserData()
      
      // Save to localStorage for local caching
      if (typeof window !== 'undefined') {
        localStorage.setItem(`donor_setup_completed_${user.id}`, 'true')
      }
      
      // Update hasLocalCache state
      checkLocalCache()
      
    } catch (err: any) {
      console.error('Error:', err)
      setErrorMessage(err.message || "An error occurred")
    } finally {
      setIsUpdating(false)
    }
  }
  
  const goToDashboard = () => {
    router.push('/dashboard')
  }
  
  const logoutAndRedirect = async () => {
    try {
      // Clear any local cache first
      if (typeof window !== 'undefined' && user) {
        localStorage.removeItem(`donor_profile_${user.id}`)
        localStorage.removeItem(`donor_setup_completed_${user.id}`)
      }
      
      // Sign out the user
      await supabase.auth.signOut()
      
      // Redirect to auth page
      router.push('/auth')
    } catch (error) {
      console.error('Error during sign out:', error)
      setErrorMessage("Failed to sign out")
    }
  }
  
  if (loading) {
    return <FixDonorRoleLoading />
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

  const hasMismatchedRole = user.user_metadata?.role !== 'donor' || databaseUserData?.role !== 'donor'
  const needsDonorProfile = !donorProfile
  const needsFix = hasMismatchedRole || needsDonorProfile

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-4">Fix Donor Role & Setup</h1>
      
      <div className="bg-gray-100 p-4 rounded mb-6">
        <h2 className="text-lg font-semibold mb-2">Current User Information</h2>
        <div className="space-y-2 mb-4">
          <p><strong>Email:</strong> {user.email}</p>
          <p><strong>Auth Role (Metadata):</strong> {user.user_metadata?.role || 'Not set'}</p>
          <p><strong>Database Role:</strong> {databaseUserData?.role || 'Not found'}</p>
          <p><strong>Donor Profile:</strong> {donorProfile ? 'Exists' : 'Not found'}</p>
          <p><strong>Local Cache:</strong> {hasLocalCache ? 'Found' : 'None'}</p>
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
      
      {needsFix ? (
        <div className="bg-yellow-50 p-4 rounded mb-6">
          <h3 className="text-yellow-800 font-medium mb-2">Issues Detected</h3>
          <ul className="list-disc list-inside text-yellow-700 space-y-1">
            {user.user_metadata?.role !== 'donor' && (
              <li>Your auth metadata role is not set to donor</li>
            )}
            {databaseUserData?.role !== 'donor' && (
              <li>Your database role is not set to donor</li>
            )}
            {needsDonorProfile && (
              <li>You don't have a donor profile in the database</li>
            )}
          </ul>
        </div>
      ) : (
        <div className="bg-green-50 p-4 rounded mb-6">
          <h3 className="text-green-800 font-medium">All Good!</h3>
          <p className="text-green-700">Your donor role is properly set up.</p>
        </div>
      )}
      
      <div className="flex flex-wrap gap-4 mb-6">
        <button 
          onClick={fixDonorRole}
          disabled={isUpdating || !needsFix}
          className={`px-4 py-2 text-white rounded ${
            needsFix ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-400'
          } disabled:bg-blue-300`}
        >
          {isUpdating ? 'Fixing...' : needsFix ? 'Fix Donor Role & Setup' : 'No Fix Needed'}
        </button>
        
        <button 
          onClick={clearLocalCache}
          disabled={isClearing || !hasLocalCache}
          className={`px-4 py-2 text-white rounded ${
            hasLocalCache ? 'bg-orange-500 hover:bg-orange-600' : 'bg-gray-400'
          } disabled:bg-orange-300`}
        >
          {isClearing ? 'Clearing...' : 'Clear Browser Cache'}
        </button>
        
        <button 
          onClick={logoutAndRedirect}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded"
        >
          Logout & Clear Session
        </button>
        
        <button 
          onClick={goToDashboard}
          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded"
        >
          Go to Dashboard
        </button>
        
        <a 
          href="/role-debug" 
          className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded inline-block"
        >
          Advanced Role Debug
        </a>
      </div>
      
      <div className="bg-blue-50 p-4 rounded mb-6">
        <h3 className="text-blue-800 font-medium mb-2">Troubleshooting Steps</h3>
        <ol className="list-decimal list-inside text-blue-700 space-y-2">
          <li>First click "Fix Donor Role & Setup" to ensure your role and donor profile are correct</li>
          <li>Then click "Clear Browser Cache" to remove any stored profile data</li>
          <li>Try going to the dashboard. If you still see the teacher dashboard, try logging out and back in</li>
          <li>If issues persist, visit the advanced role debug page for more options</li>
        </ol>
      </div>
      
      <div className="text-sm text-gray-500 mt-8">
        <p>After fixing your role, you may need to log out and log back in for all changes to take effect.</p>
      </div>
    </div>
  )
}

// Main page export with proper Suspense boundaries
export default function FixDonorRolePage() {
  // Mounted state to ensure client-side only rendering
  const [mounted, setMounted] = useState(false)
  
  useEffect(() => {
    setMounted(true)
  }, [])
  
  if (!mounted) {
    return <FixDonorRoleLoading />
  }
  
  return (
    <ClientOnly fallback={<FixDonorRoleLoading />}>
      <Suspense fallback={<FixDonorRoleLoading />}>
        <FixDonorRoleContent />
      </Suspense>
    </ClientOnly>
  )
} 