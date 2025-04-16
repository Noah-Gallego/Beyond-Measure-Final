'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/utils/supabase';

export default function TestDatabase() {
  const [loading, setLoading] = useState(true);
  const [tables, setTables] = useState<any[]>([]);
  const [teacherProfiles, setTeacherProfiles] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [debug, setDebug] = useState<any>(null);
  const [testResults, setTestResults] = useState<string[]>([]);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    // Get the current user
    supabase.auth.getUser().then(({ data }) => {
      if (data && data.user) {
        setUser(data.user);
      }
    });

    async function loadData() {
      try {
        setLoading(true);
        
        // List all tables in the database - previous approach using information_schema doesn't work
        // Try direct checks for specific tables instead
        const tableChecks = await Promise.allSettled([
          supabase.from('teacher_profiles').select('count(*)', { count: 'exact', head: true }),
          supabase.from('projects').select('count(*)', { count: 'exact', head: true })
        ]);
        
        const tableResults = [
          { schemaname: 'public', tablename: 'teacher_profiles', exists: tableChecks[0].status === 'fulfilled' && !tableChecks[0].value.error },
          { schemaname: 'public', tablename: 'projects', exists: tableChecks[1].status === 'fulfilled' && !tableChecks[1].value.error }
        ];
        
        setTables(tableResults);
        
        // Try to fetch all teacher profiles
        const { data: teacherData, error: teacherError } = await supabase
          .from('teacher_profiles')
          .select('*')
          .limit(10);
        
        if (teacherError) {
          console.error('Error fetching teacher profiles:', teacherError);
          setError((prev) => `${prev || ''}\nError fetching teacher profiles: ${teacherError.message}`);
          setDebug((prev: any) => ({ ...prev, teacherError }));
        } else {
          setTeacherProfiles(teacherData || []);
        }
        
        // Try to fetch all projects
        const { data: projectsData, error: projectsError } = await supabase
          .from('projects')
          .select('*')
          .limit(10);
        
        if (projectsError) {
          console.error('Error fetching projects:', projectsError);
          setError((prev) => `${prev || ''}\nError fetching projects: ${projectsError.message}`);
          setDebug((prev: any) => ({ ...prev, projectsError }));
        } else {
          setProjects(projectsData || []);
        }
      } catch (e) {
        console.error('Unexpected error:', e);
        setError(`Unexpected error: ${e instanceof Error ? e.message : String(e)}`);
        setDebug(e);
      } finally {
        setLoading(false);
      }
    }
    
    loadData();
  }, []);

  // Function to test creating a teacher profile
  const testCreateTeacherProfile = async () => {
    if (!user) {
      setTestResults([...testResults, "No user logged in"]);
      return;
    }
    
    try {
      setTestResults([...testResults, "Creating teacher profile..."]);
      
      // Check if user already has a profile
      const { data: existingProfile, error: checkError } = await supabase
        .from('teacher_profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();
      
      if (checkError && checkError.code !== 'PGRST116') {
        setTestResults([...testResults, `Error checking profile: ${checkError.message}`]);
        return;
      }
      
      if (existingProfile) {
        setTestResults([...testResults, `Profile already exists with ID: ${existingProfile.id}`]);
        return;
      }
      
      // Create teacher profile
      const { data: newProfile, error: createError } = await supabase
        .from('teacher_profiles')
        .insert([
          { user_id: user.id, school_name: 'Test School' }
        ])
        .select()
        .single();
      
      if (createError) {
        setTestResults([...testResults, `Error creating profile: ${createError.message}`]);
        return;
      }
      
      setTestResults([...testResults, `Profile created with ID: ${newProfile.id}`]);
      
      // Reload the data
      window.location.reload();
    } catch (e) {
      setTestResults([...testResults, `Exception: ${e instanceof Error ? e.message : String(e)}`]);
    }
  };
  
  // Function to test creating a project
  const testCreateProject = async () => {
    if (!user) {
      setTestResults([...testResults, "No user logged in"]);
      return;
    }
    
    try {
      setTestResults([...testResults, "Creating test project..."]);
      
      // Get teacher profile ID
      const { data: profile, error: profileError } = await supabase
        .from('teacher_profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();
      
      if (profileError) {
        setTestResults([...testResults, `Error finding teacher profile: ${profileError.message}`]);
        return;
      }
      
      if (!profile) {
        setTestResults([...testResults, "No teacher profile found. Create one first."]);
        return;
      }
      
      // Create test project
      const testProject = {
        title: `Test Project ${new Date().toISOString()}`,
        description: 'This is a test project created from the debug page',
        teacher_id: profile.id,
        funding_goal: 1000,
        current_funding: 0,
        status: 'draft'
      };
      
      // Log project data
      console.log('Creating project with data:', testProject);
      setTestResults([...testResults, `Attempting to create project with teacher_id: ${profile.id}`]);
      
      const { data: newProject, error: projectError } = await supabase
        .from('projects')
        .insert([testProject])
        .select()
        .single();
      
      if (projectError) {
        setTestResults([...testResults, `Error creating project: ${projectError.message}`]);
        return;
      }
      
      setTestResults([...testResults, `Project created with ID: ${newProject.id}`]);
      
      // Reload the data
      window.location.reload();
    } catch (e) {
      setTestResults([...testResults, `Exception: ${e instanceof Error ? e.message : String(e)}`]);
    }
  };

  // Function to test creating the necessary database tables
  const testCreateTables = async () => {
    try {
      setTestResults([...testResults, "Attempting to create necessary database tables..."]);
      
      // Create teacher_profiles table with correct schema
      const createTeacherProfilesSQL = `
        CREATE TABLE IF NOT EXISTS teacher_profiles (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
          school_name TEXT,
          position_title TEXT,
          school_address TEXT,
          school_city TEXT,
          school_state TEXT,
          school_postal_code TEXT,
          bio TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
        );
      `;
      
      // Create projects table with correct schema (no user_id field)
      const createProjectsSQL = `
        CREATE TABLE IF NOT EXISTS projects (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          teacher_id UUID NOT NULL,
          title TEXT NOT NULL,
          description TEXT NOT NULL,
          funding_goal NUMERIC(10,2) NOT NULL,
          current_funding NUMERIC(10,2) DEFAULT 0,
          status TEXT DEFAULT 'draft',
          main_image_url TEXT,
          student_impact TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
        );
      `;
      
      // Try to execute manually looking at table structure - no direct SQL execution
      setTestResults([...testResults, "Checking if tables exist..."]);
      
      // Check each table individually
      const { error: teacherCheckError } = await supabase
        .from('teacher_profiles')
        .select('count(*)', { count: 'exact', head: true });
        
      if (teacherCheckError) {
        setTestResults([...testResults, `Teacher profiles table does not exist or cannot be accessed. Error: ${teacherCheckError.message}`]);
        
        // Attempt to create via RPC function if available
        try {
          const { error: rpcError } = await supabase.rpc('create_teacher_profiles_table');
          
          if (rpcError) {
            setTestResults([...testResults, `RPC creation failed: ${rpcError.message}`]);
            
            // Try with direct table creation using Supabase API
            setTestResults([...testResults, "Attempting direct table creation with Supabase API..."]);
            
            // Here we would try to create via Supabase SQL execution if available
            setTestResults([...testResults, "To create tables, please run this SQL in the Supabase dashboard:"]);
            setTestResults([...testResults, createTeacherProfilesSQL]);
            setTestResults([...testResults, createProjectsSQL]);
          } else {
            setTestResults([...testResults, "Teacher profiles table created via RPC function!"]);
          }
        } catch (e) {
          setTestResults([...testResults, `Exception in RPC: ${e instanceof Error ? e.message : String(e)}`]);
        }
      } else {
        setTestResults([...testResults, "Teacher profiles table already exists!"]);
      }
      
      // Check projects table
      const { error: projectsCheckError } = await supabase
        .from('projects')
        .select('count(*)', { count: 'exact', head: true });
        
      if (projectsCheckError) {
        setTestResults([...testResults, `Projects table does not exist or cannot be accessed. Error: ${projectsCheckError.message}`]);
        
        // Try RPC for projects table
        try {
          const { error: rpcError } = await supabase.rpc('create_projects_table');
          
          if (rpcError) {
            setTestResults([...testResults, `Projects RPC creation failed: ${rpcError.message}`]);
          } else {
            setTestResults([...testResults, "Projects table created via RPC function!"]);
          }
        } catch (e) {
          setTestResults([...testResults, `Exception in projects RPC: ${e instanceof Error ? e.message : String(e)}`]);
        }
      } else {
        setTestResults([...testResults, "Projects table already exists!"]);
      }
      
      // Refresh the page to see if tables are now accessible
      setTestResults([...testResults, "Run completed. You may refresh the page to see if tables are now accessible."]);
    } catch (e) {
      setTestResults([...testResults, `Exception creating tables: ${e instanceof Error ? e.message : String(e)}`]);
    }
  };

  // Function to check RLS policies
  const testCheckRLSPolicies = async () => {
    try {
      setTestResults([...testResults, "Checking Row Level Security policies..."]);
      
      if (!user) {
        setTestResults([...testResults, "No user logged in, can't check RLS policies"]);
        return;
      }
      
      // Try to get the auth user
      const { data: authData, error: authError } = await supabase.auth.getUser();
      
      if (authError) {
        setTestResults([...testResults, `Error getting auth user: ${authError.message}`]);
        return;
      }
      
      if (!authData || !authData.user) {
        setTestResults([...testResults, "Auth user data is null/undefined"]);
        return;
      }
      
      setTestResults([...testResults, `Authenticated as: ${authData.user.email} (${authData.user.id})`]);
      
      // Check if role is correct in metadata
      const userRole = authData.user.user_metadata?.role;
      if (userRole !== 'teacher') {
        setTestResults([...testResults, `User role is not 'teacher', found: ${userRole || 'undefined'}`]);
        
        // Try to update the role 
        setTestResults([...testResults, "Attempting to update user role to 'teacher'..."]);
        try {
          // This direct auth metadata update will only work for the user's own profile
          const { error: updateError } = await supabase.auth.updateUser({
            data: { role: 'teacher' }
          });
          
          if (updateError) {
            setTestResults([...testResults, `Error updating role: ${updateError.message}`]);
          } else {
            setTestResults([...testResults, "Role updated to 'teacher' successfully"]);
          }
        } catch (e) {
          setTestResults([...testResults, `Exception updating role: ${e instanceof Error ? e.message : String(e)}`]);
        }
      } else {
        setTestResults([...testResults, "User role is correctly set to 'teacher'"]);
      }
      
      // Test direct SQL query through function (may require admin privileges)
      try {
        const sqlQuery = `
          SELECT table_name, grantee, privilege_type 
          FROM information_schema.role_table_grants 
          WHERE table_name IN ('teacher_profiles', 'projects')
        `;
        
        const { data: permissionsData, error: permissionsError } = await supabase.rpc('exec_sql', { sql: sqlQuery });
        
        if (permissionsError) {
          setTestResults([...testResults, `Cannot check table permissions: ${permissionsError.message}`]);
        } else {
          setTestResults([...testResults, "Table permissions: " + JSON.stringify(permissionsData)]);
        }
      } catch (e) {
        setTestResults([...testResults, `Exception checking permissions: ${e instanceof Error ? e.message : String(e)}`]);
      }
    } catch (e) {
      setTestResults([...testResults, `Exception in RLS check: ${e instanceof Error ? e.message : String(e)}`]);
    }
  };

  return (
    <div className="container mx-auto py-10 px-4">
      <h1 className="text-3xl font-bold mb-6">Database Test Page</h1>
      
      {/* Current User Info */}
      <div className="mb-8 p-4 bg-blue-50 border border-blue-200 rounded-md">
        <h2 className="text-xl font-bold mb-2">Current User</h2>
        {user ? (
          <div>
            <p><strong>ID:</strong> {user.id}</p>
            <p><strong>Email:</strong> {user.email}</p>
            <p><strong>Role:</strong> {user.user_metadata?.role || 'Unknown'}</p>
          </div>
        ) : (
          <p>Not logged in</p>
        )}
      </div>
      
      {/* Test Actions */}
      <div className="mb-8 p-4 bg-green-50 border border-green-200 rounded-md">
        <h2 className="text-xl font-bold mb-4">Test Actions</h2>
        <div className="flex flex-wrap gap-4 mb-4">
          <button 
            onClick={testCreateTeacherProfile}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Create Teacher Profile
          </button>
          <button 
            onClick={testCreateProject}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Create Test Project
          </button>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
          >
            Refresh Page
          </button>
        </div>
        
        <h3 className="text-lg font-medium mb-3">Database Troubleshooting:</h3>
        <div className="flex flex-wrap gap-4">
          <button 
            onClick={testCreateTables}
            className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
          >
            Create/Fix Tables
          </button>
          <button 
            onClick={testCheckRLSPolicies}
            className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700"
          >
            Check RLS Policies
          </button>
        </div>
        
        {/* Test Results */}
        {testResults.length > 0 && (
          <div className="mt-4 p-3 bg-white border rounded-md">
            <h3 className="text-lg font-semibold mb-2">Test Results</h3>
            <ul className="list-disc pl-5 space-y-1">
              {testResults.map((result, index) => (
                <li key={index} className="text-sm">{result}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
      
      {loading ? (
        <div className="text-center p-10">
          <div className="animate-spin inline-block h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
          <p className="mt-4">Loading database information...</p>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 p-4 rounded-md mb-6">
          <h2 className="text-lg font-semibold text-red-700 mb-2">Error</h2>
          <pre className="whitespace-pre-wrap text-red-600">{error}</pre>
          
          <h3 className="text-lg font-semibold text-red-700 mt-4 mb-2">Debug Information</h3>
          <pre className="bg-gray-800 text-gray-200 p-4 rounded overflow-auto max-h-96">
            {JSON.stringify(debug, null, 2)}
          </pre>
        </div>
      ) : (
        <div className="space-y-10">
          <div>
            <h2 className="text-2xl font-bold mb-4">Database Tables</h2>
            {tables.length === 0 ? (
              <p>No tables found in the public schema.</p>
            ) : (
              <div className="bg-white shadow overflow-hidden rounded-md">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Schema</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Table Name</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {tables.map((table, index) => (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{table.schemaname}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 flex items-center">
                          {table.tablename}
                          {table.exists ? (
                            <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Exists
                            </span>
                          ) : (
                            <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              Missing
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          
          <div>
            <h2 className="text-2xl font-bold mb-4">Teacher Profiles</h2>
            {teacherProfiles.length === 0 ? (
              <p>No teacher profiles found.</p>
            ) : (
              <div className="bg-white shadow overflow-hidden rounded-md">
                <pre className="p-4 overflow-auto max-h-96">{JSON.stringify(teacherProfiles, null, 2)}</pre>
              </div>
            )}
          </div>
          
          <div>
            <h2 className="text-2xl font-bold mb-4">Projects</h2>
            {projects.length === 0 ? (
              <p>No projects found.</p>
            ) : (
              <div className="bg-white shadow overflow-hidden rounded-md">
                <pre className="p-4 overflow-auto max-h-96">{JSON.stringify(projects, null, 2)}</pre>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
} 