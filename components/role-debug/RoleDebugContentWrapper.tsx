'use client';

import { useState, useEffect, Suspense } from "react";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/utils/supabase";
import { useRouter } from "next/navigation";

// Loading component
function RoleDebugLoading() {
  return (
    <div className="container mx-auto py-10 px-4">
      <h1 className="text-3xl font-bold mb-6">Role Debugging</h1>
      <div className="animate-spin h-10 w-10 border-4 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
    </div>
  );
}

// Inner content that handles potential useSearchParams safely
function RoleDebugContent() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [dbUser, setDbUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  
  useEffect(() => {
    const fetchUserFromDb = async () => {
      if (!user) return;
      
      try {
        // Fetch user from the database
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('auth_id', user.id)
          .single();
        
        if (error) {
          console.error('Error fetching user data:', error);
          setError(`Database error: ${error.message}`);
          return;
        }
        
        setDbUser(data);
      } catch (err: any) {
        setError(`Error: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };
    
    if (user) {
      fetchUserFromDb();
    } else if (!isLoading) {
      setLoading(false);
    }
  }, [user, isLoading]);
  
  const updateUserRole = async (role: string) => {
    if (!user || !dbUser) {
      setError("User data not available");
      return;
    }
    
    setIsUpdating(true);
    setMessage("");
    setError("");
    
    try {
      // 1. Update auth metadata
      const { error: authError } = await supabase.auth.updateUser({
        data: { role }
      });
      
      if (authError) throw new Error(`Auth update failed: ${authError.message}`);
      
      // 2. Update database role
      const { error: dbError } = await supabase
        .from('users')
        .update({ role })
        .eq('id', dbUser.id);
      
      if (dbError) throw new Error(`Database update failed: ${dbError.message}`);
      
      setMessage(`Role successfully updated to ${role}. Please navigate to /dashboard to be redirected appropriately.`);
      
      // Refresh DB user data
      const { data: refreshedUser } = await supabase
        .from('users')
        .select('*')
        .eq('auth_id', user.id)
        .single();
      
      if (refreshedUser) {
        setDbUser(refreshedUser);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsUpdating(false);
    }
  };
  
  // Navigation handlers
  const goToLogin = () => {
    router.push('/auth');
  };
  
  const goToDashboard = () => {
    router.push('/dashboard');
  };
  
  if (loading) {
    return (
      <div className="container mx-auto py-10 px-4">
        <h1 className="text-3xl font-bold mb-6">Role Debugging</h1>
        <div className="animate-spin h-10 w-10 border-4 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
      </div>
    );
  }
  
  if (!user) {
    return (
      <div className="container mx-auto py-10 px-4">
        <h1 className="text-3xl font-bold mb-6">Role Debugging</h1>
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <p className="font-bold">Not logged in</p>
          <p>Please log in to use this tool.</p>
          <button 
            onClick={goToLogin}
            className="mt-2 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }
  
  const authRole = user.user_metadata?.role || 'none';
  const dbRole = dbUser?.role || 'none';
  const hasRoleMismatch = String(authRole).toLowerCase() !== String(dbRole).toLowerCase();
  
  return (
    <div className="container mx-auto py-10 px-4">
      <h1 className="text-3xl font-bold mb-6">Role Debugging</h1>
      
      {message && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-6">
          {message}
        </div>
      )}
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}
      
      <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">User Information</h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">Authentication and database role details.</p>
        </div>
        <div className="border-t border-gray-200">
          <dl>
            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Email</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{user.email}</dd>
            </div>
            <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Auth User ID</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{user.id}</dd>
            </div>
            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Auth Role (Metadata)</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                  authRole === 'admin' 
                    ? 'bg-purple-100 text-purple-800' 
                    : authRole === 'teacher' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-blue-100 text-blue-800'
                }`}>
                  {authRole}
                </span>
              </dd>
            </div>
            <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Database Role</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                  dbRole === 'admin' 
                    ? 'bg-purple-100 text-purple-800' 
                    : dbRole === 'teacher' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-blue-100 text-blue-800'
                }`}>
                  {dbRole}
                </span>
              </dd>
            </div>
            
            {hasRoleMismatch && (
              <div className="bg-red-50 px-4 py-5 sm:px-6">
                <div className="rounded-md bg-red-50 p-4">
                  <div className="flex">
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-red-800">Role Mismatch Detected</h3>
                      <div className="mt-2 text-sm text-red-700">
                        <p>
                          Your auth metadata role ({authRole}) does not match your database role ({dbRole}).
                          This can cause redirection issues and access problems.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </dl>
        </div>
      </div>
      
      <div className="bg-white shadow sm:rounded-lg mb-6">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Change User Role</h3>
          <div className="mt-2 max-w-xl text-sm text-gray-500">
            <p>Update both the authentication metadata and database role.</p>
          </div>
          <div className="mt-5 flex flex-wrap gap-3">
            <button
              onClick={() => updateUserRole('admin')}
              disabled={isUpdating}
              className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white ${
                isUpdating ? 'bg-purple-300' : 'bg-purple-600 hover:bg-purple-700'
              } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500`}
            >
              Set as Admin
            </button>
            <button
              onClick={() => updateUserRole('teacher')}
              disabled={isUpdating}
              className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white ${
                isUpdating ? 'bg-green-300' : 'bg-green-600 hover:bg-green-700'
              } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500`}
            >
              Set as Teacher
            </button>
            <button
              onClick={() => updateUserRole('donor')}
              disabled={isUpdating}
              className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white ${
                isUpdating ? 'bg-blue-300' : 'bg-blue-600 hover:bg-blue-700'
              } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
            >
              Set as Donor
            </button>
          </div>
        </div>
      </div>
      
      <div className="flex justify-between">
        <button
          onClick={goToDashboard}
          className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded"
        >
          Go to Dashboard
        </button>
        <button
          onClick={() => window.location.reload()}
          className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-2 px-4 rounded"
        >
          Refresh Page
        </button>
      </div>
    </div>
  );
}

// Wrapper with proper Suspense boundary
export default function RoleDebugContentWrapper() {
  return (
    <Suspense fallback={<RoleDebugLoading />}>
      <RoleDebugContent />
    </Suspense>
  );
} 