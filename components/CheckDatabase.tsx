'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../utils/supabase';

export default function CheckDatabase() {
  const [loading, setLoading] = useState(true);
  const [teacherProfiles, setTeacherProfiles] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [tables, setTables] = useState<{name: string, exists: boolean}[]>([]);
  const [results, setResults] = useState<string[]>([]);

  useEffect(() => {
    async function checkDatabase() {
      setLoading(true);
      setResults([...results, "Checking database connection..."]);
      
      try {
        // Simple approach - just try to select from each table
        const tables = ['teacher_profiles', 'projects'];
        const tableStatus = [];
        
        for (const table of tables) {
          try {
            const { data, error } = await supabase
              .from(table)
              .select('id')
              .limit(1);
              
            tableStatus.push({
              name: table,
              exists: !error
            });
            
            setResults([...results, `Table ${table}: ${error ? 'Not found or error' : 'Exists'}`]);
            
            // If the table exists, try to fetch all records
            if (!error) {
              if (table === 'teacher_profiles') {
                const { data: profiles } = await supabase.from(table).select('*').limit(10);
                setTeacherProfiles(profiles || []);
              } else if (table === 'projects') {
                const { data: projectData } = await supabase.from(table).select('*').limit(10);
                setProjects(projectData || []);
              }
            }
          } catch (e) {
            tableStatus.push({
              name: table,
              exists: false
            });
            setResults([...results, `Error checking table ${table}: ${e instanceof Error ? e.message : String(e)}`]);
          }
        }
        
        setTables(tableStatus);
      } catch (e) {
        setError(`Database connection error: ${e instanceof Error ? e.message : String(e)}`);
        setResults([...results, `Error: ${e instanceof Error ? e.message : String(e)}`]);
      } finally {
        setLoading(false);
      }
    }
    
    checkDatabase();
  }, []);

  const createTables = async () => {
    setResults([...results, "Creating tables..."]);
    
    try {
      // Create teacher profiles table
      const { error: teacherError } = await supabase.rpc('create_teacher_profiles_table', {});
      
      if (teacherError) {
        setResults([...results, `Error creating teacher_profiles: ${teacherError.message}`]);
        
        // Try direct SQL as fallback (if user has permission)
        const createTeacherProfilesSQL = `
          CREATE TABLE IF NOT EXISTS teacher_profiles (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            user_id UUID NOT NULL,
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
        setResults([...results, "Please run this SQL in Supabase SQL Editor:"]);
        setResults([...results, createTeacherProfilesSQL]);
      } else {
        setResults([...results, "Teacher profiles table created successfully!"]);
      }
      
      // Create projects table
      const { error: projectsError } = await supabase.rpc('create_projects_table', {});
      
      if (projectsError) {
        setResults([...results, `Error creating projects: ${projectsError.message}`]);
        
        // Try direct SQL as fallback (if user has permission)
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
        setResults([...results, "Please run this SQL in Supabase SQL Editor:"]);
        setResults([...results, createProjectsSQL]);
      } else {
        setResults([...results, "Projects table created successfully!"]);
      }
      
      // Reload to check if tables were created
      window.location.reload();
    } catch (e) {
      setResults([...results, `Error creating tables: ${e instanceof Error ? e.message : String(e)}`]);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Database Check</h1>
      
      <div className="mb-4">
        <button
          onClick={createTables}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 mr-2"
        >
          Create Tables
        </button>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
        >
          Refresh
        </button>
      </div>
      
      {/* Results log */}
      <div className="mb-6 p-4 bg-gray-100 rounded max-h-60 overflow-y-auto">
        <h2 className="text-lg font-semibold mb-2">Logs</h2>
        <ul className="space-y-1">
          {results.map((result, i) => (
            <li key={i} className="text-sm">{result}</li>
          ))}
        </ul>
      </div>
      
      {loading ? (
        <div className="flex justify-center items-center py-10">
          <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
        </div>
      ) : (
        <>
          {/* Table Status */}
          <div className="mb-6">
            <h2 className="text-xl font-bold mb-2">Table Status</h2>
            <div className="bg-white shadow overflow-hidden rounded-md">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Table</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {tables.map((table, i) => (
                    <tr key={i}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{table.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {table.exists ? (
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                            Exists
                          </span>
                        ) : (
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                            Missing
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          
          {/* Data Preview */}
          {teacherProfiles.length > 0 && (
            <div className="mb-6">
              <h2 className="text-xl font-bold mb-2">Teacher Profiles</h2>
              <pre className="bg-gray-100 p-4 rounded overflow-x-auto">
                {JSON.stringify(teacherProfiles, null, 2)}
              </pre>
            </div>
          )}
          
          {projects.length > 0 && (
            <div className="mb-6">
              <h2 className="text-xl font-bold mb-2">Projects</h2>
              <pre className="bg-gray-100 p-4 rounded overflow-x-auto">
                {JSON.stringify(projects, null, 2)}
              </pre>
            </div>
          )}
          
          {error && (
            <div className="bg-red-50 border border-red-200 p-4 rounded-md">
              <h2 className="text-lg font-semibold text-red-700 mb-2">Error</h2>
              <pre className="text-red-600 whitespace-pre-wrap">{error}</pre>
            </div>
          )}
        </>
      )}
    </div>
  );
} 