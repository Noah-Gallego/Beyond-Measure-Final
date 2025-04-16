'use client';

import { useState } from 'react';
import { supabase } from '@/utils/supabase'; // Using the full client from utils

export default function DbDirectPage() {
  const [logs, setLogs] = useState<string[]>([]);
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // Add a log message
  const addLog = (message: string) => {
    setLogs(prev => [...prev, message]);
  };

  // Check Supabase connection
  const checkConnection = async () => {
    setLoading(true);
    addLog('Checking Supabase connection...');
    
    try {
      // Use a simple query that doesn't require access to specific tables
      const { data, error } = await supabase.auth.getSession();
      
      if (error) {
        throw error;
      }
      
      addLog('Supabase connection successful');
      setResults({
        type: 'connection',
        status: 'success',
        session: data?.session ? 'Active' : 'None'
      });
    } catch (error: any) {
      addLog(`Connection error: ${error.message}`);
      setResults({
        type: 'connection',
        status: 'error',
        message: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  // Check for required tables
  const checkTables = async () => {
    setLoading(true);
    addLog('Checking for required tables...');
    
    const tables = ['teacher_profiles', 'projects'];
    const tableResults: {name: string, exists: boolean, error?: string}[] = [];
    
    for (const table of tables) {
      try {
        addLog(`Checking table: ${table}`);
        const { error } = await supabase
          .from(table)
          .select('count(*)', { count: 'exact', head: true })
          .limit(1);
        
        tableResults.push({
          name: table,
          exists: !error
        });
        
        if (error) {
          addLog(`Table '${table}' check error: ${error.message}`);
        } else {
          addLog(`Table '${table}' exists`);
        }
      } catch (error: any) {
        tableResults.push({
          name: table,
          exists: false,
          error: error.message
        });
        addLog(`Exception checking table '${table}': ${error.message}`);
      }
    }
    
    setResults({
      type: 'tables',
      tables: tableResults
    });
    setLoading(false);
  };

  // Create tables
  const createTables = async () => {
    setLoading(true);
    addLog('Attempting to create tables...');
    
    try {
      // First try to create teacher_profiles
      addLog('Creating teacher_profiles table...');
      
      const createTeacherProfilesQuery = `
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
      
      // Execute using RPC if available
      try {
        const { error: rpcError } = await supabase.rpc('run_sql', { 
          sql: createTeacherProfilesQuery 
        });
        
        if (rpcError) {
          addLog(`RPC error: ${rpcError.message}`);
          addLog('Falling back to direct SQL execution...');
          // Fallback: could try another approach here if needed
        } else {
          addLog('Teacher profiles table created successfully via RPC!');
        }
      } catch (rpcError: any) {
        addLog(`RPC exception: ${rpcError.message}`);
        addLog('SQL to run in Supabase dashboard:');
        addLog(createTeacherProfilesQuery);
      }
      
      // Now try to create projects table
      addLog('Creating projects table...');
      
      const createProjectsQuery = `
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
      
      try {
        const { error: rpcError } = await supabase.rpc('run_sql', { 
          sql: createProjectsQuery 
        });
        
        if (rpcError) {
          addLog(`RPC error: ${rpcError.message}`);
          addLog('SQL to run in Supabase dashboard:');
          addLog(createProjectsQuery);
        } else {
          addLog('Projects table created successfully via RPC!');
        }
      } catch (rpcError: any) {
        addLog(`RPC exception: ${rpcError.message}`);
        addLog('SQL to run in Supabase dashboard:');
        addLog(createProjectsQuery);
      }
      
      // Check if tables were created
      await checkTables();
    } catch (error: any) {
      addLog(`Error creating tables: ${error.message}`);
      setResults({
        type: 'creation',
        status: 'error',
        message: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-10 px-4">
      <h1 className="text-3xl font-bold mb-6">Direct Database Operations</h1>
      <p className="mb-6 text-gray-600">
        This page directly uses the Supabase client from your utils directory to perform database operations.
      </p>
      
      <div className="mb-6 flex flex-wrap gap-4">
        <button
          onClick={checkConnection}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          {loading ? 'Loading...' : 'Check Connection'}
        </button>
        
        <button
          onClick={checkTables}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          {loading ? 'Loading...' : 'Check Tables'}
        </button>
        
        <button
          onClick={createTables}
          disabled={loading}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
        >
          {loading ? 'Creating...' : 'Create Tables'}
        </button>
      </div>
      
      {/* Logs */}
      <div className="mb-6 p-4 bg-gray-100 rounded max-h-60 overflow-y-auto">
        <h2 className="text-lg font-semibold mb-2">Logs</h2>
        {logs.length === 0 ? (
          <p className="text-gray-500">No operations performed yet</p>
        ) : (
          <ul className="space-y-1">
            {logs.map((log, i) => (
              <li key={i} className="text-sm font-mono">{log}</li>
            ))}
          </ul>
        )}
      </div>
      
      {/* Results */}
      {results && (
        <div className="mb-6">
          <h2 className="text-xl font-bold mb-2">Results</h2>
          
          {results.type === 'connection' && (
            <div className={`p-4 rounded-md ${
              results.status === 'success' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
            }`}>
              <p className="font-medium">
                {results.status === 'success' ? 'Connection Successful' : 'Connection Failed'}
              </p>
              {results.status === 'success' && (
                <p>Session: {results.session}</p>
              )}
              {results.status === 'error' && (
                <p className="text-red-600">{results.message}</p>
              )}
            </div>
          )}
          
          {results.type === 'tables' && (
            <div className="bg-white shadow overflow-hidden rounded-md">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Table</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {results.tables.map((table: any, i: number) => (
                    <tr key={i}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {table.name}
                      </td>
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
          )}
        </div>
      )}
      
      <div className="mt-10 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
        <h2 className="text-lg font-semibold mb-2">Important Note</h2>
        <p className="mb-2">
          This page attempts to directly create tables, but this may fail if your Supabase permissions 
          don't allow SQL execution through the client. If that happens, you'll need to manually run 
          the SQL in the Supabase dashboard.
        </p>
        <p>
          The SQL statements will be shown in the logs if the automatic creation fails.
        </p>
      </div>
    </div>
  );
} 