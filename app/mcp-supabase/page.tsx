'use client';

import { useState, Suspense } from 'react';
import ClientOnly from '@/components/client-only';

// Safe component to handle search params
function SearchParamsHandler() {
  // Dynamically import useSearchParams
  const { useSearchParams } = require('next/navigation');
  const searchParams = useSearchParams();
  const initialProjectId = searchParams?.get('project_id') || null;
  
  return <McpSupabaseInnerContent initialProjectId={initialProjectId} />;
}

// Inner content that doesn't directly use useSearchParams
function McpSupabaseInnerContent({ initialProjectId }: { initialProjectId: string | null }) {
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProject, setSelectedProject] = useState<string | null>(initialProjectId);
  const [selectedOrg, setSelectedOrg] = useState<string | null>(null);
  const [tables, setTables] = useState<any[]>([]);
  const [migrationName, setMigrationName] = useState('create_initial_tables');
  const [loading, setLoading] = useState<{[key: string]: boolean}>({});
  const [logs, setLogs] = useState<string[]>([]);

  // Add a log entry
  const addLog = (message: string) => {
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  // Set loading state for a specific operation
  const setLoadingState = (operation: string, isLoading: boolean) => {
    setLoading(prev => ({ ...prev, [operation]: isLoading }));
  };

  // List organizations
  const listOrganizations = async () => {
    setLoadingState('listOrgs', true);
    addLog('Fetching organizations...');
    
    try {
      const result = await fetch('/api/supabase/list-organizations', {
        method: 'POST'
      }).then(res => res.json());
      
      if (result.error) {
        throw new Error(result.error);
      }
      
      setOrganizations(result.organizations || []);
      addLog(`Found ${result.organizations?.length || 0} organizations`);
    } catch (error: any) {
      addLog(`Error: ${error.message}`);
    } finally {
      setLoadingState('listOrgs', false);
    }
  };

  // List projects
  const listProjects = async () => {
    setLoadingState('listProjects', true);
    addLog('Fetching Supabase projects...');
    
    try {
      const result = await fetch('/api/supabase/list-projects', {
        method: 'POST'
      }).then(res => res.json());
      
      if (result.error) {
        throw new Error(result.error);
      }
      
      setProjects(result.projects || []);
      addLog(`Found ${result.projects?.length || 0} projects`);
    } catch (error: any) {
      addLog(`Error: ${error.message}`);
    } finally {
      setLoadingState('listProjects', false);
    }
  };

  // List tables
  const listTables = async () => {
    if (!selectedProject) {
      addLog('Error: No project selected');
      return;
    }
    
    setLoadingState('listTables', true);
    addLog(`Fetching tables for project ${selectedProject}...`);
    
    try {
      const result = await fetch('/api/supabase/list-tables', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId: selectedProject })
      }).then(res => res.json());
      
      if (result.error) {
        throw new Error(result.error);
      }
      
      setTables(result.tables || []);
      addLog(`Found ${result.tables?.length || 0} tables`);
    } catch (error: any) {
      addLog(`Error: ${error.message}`);
    } finally {
      setLoadingState('listTables', false);
    }
  };

  // Apply migration to create tables
  const createTables = async () => {
    if (!selectedProject) {
      addLog('Error: No project selected');
      return;
    }
    
    setLoadingState('createTables', true);
    addLog('Creating tables...');
    
    const sqlQuery = `
      -- Create extension for UUID generation
      CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
      
      -- Create teacher_profiles table
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
      
      -- Create projects table
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
      const result = await fetch('/api/supabase/apply-migration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: selectedProject,
          name: migrationName,
          query: sqlQuery
        })
      }).then(res => res.json());
      
      if (result.error) {
        throw new Error(result.error);
      }
      
      addLog(`Migration applied successfully: ${migrationName}`);
      // Refresh the table list
      await listTables();
    } catch (error: any) {
      addLog(`Error applying migration: ${error.message}`);
    } finally {
      setLoadingState('createTables', false);
    }
  };

  // Create a new project
  const handleCreateProject = async () => {
    if (!selectedOrg) {
      addLog('Error: No organization selected');
      return;
    }
    
    setLoadingState('createProject', true);
    addLog(`Getting cost information for new project in organization ${selectedOrg}...`);
    
    try {
      // First get the cost
      const costResult = await fetch('/api/supabase/get-cost', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationId: selectedOrg,
          type: 'project'
        })
      }).then(res => res.json());
      
      if (costResult.error) {
        throw new Error(costResult.error);
      }
      
      addLog(`Project cost: $${costResult.amount} ${costResult.recurrence}`);
      
      // Confirm cost
      const confirmResult = await fetch('/api/supabase/confirm-cost', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'project',
          amount: costResult.amount,
          recurrence: costResult.recurrence
        })
      }).then(res => res.json());
      
      if (confirmResult.error) {
        throw new Error(confirmResult.error);
      }
      
      addLog('Cost confirmed. Creating project...');
      
      // Create project
      const createResult = await fetch('/api/supabase/create-project', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `SeedCore-${Date.now()}`,
          organizationId: selectedOrg,
          confirmCostId: confirmResult.id
        })
      }).then(res => res.json());
      
      if (createResult.error) {
        throw new Error(createResult.error);
      }
      
      addLog(`Project created successfully: ${createResult.name} (${createResult.id})`);
      
      // Refresh the project list
      await listProjects();
    } catch (error: any) {
      addLog(`Error creating project: ${error.message}`);
    } finally {
      setLoadingState('createProject', false);
    }
  };
  
  return (
    <div className="container mx-auto py-10 px-4">
      <h1 className="text-3xl font-bold mb-6">MCP Supabase Tools</h1>
      <p className="mb-6 text-gray-600">
        Management tools for Supabase project setup.
      </p>
      
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-3">Organizations</h2>
            <button
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded mr-2"
              onClick={listOrganizations}
              disabled={loading.listOrgs}
            >
              {loading.listOrgs ? 'Loading...' : 'List Organizations'}
            </button>
            
            {organizations.length > 0 && (
          <div className="mt-3">
                <select
              className="border p-2 rounded"
                  value={selectedOrg || ''}
                  onChange={(e) => setSelectedOrg(e.target.value)}
                >
                  <option value="">Select an organization</option>
                  {organizations.map((org) => (
                    <option key={org.id} value={org.id}>
                      {org.name}
                    </option>
                  ))}
                </select>
            
            <button
              className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded ml-2"
              onClick={handleCreateProject}
              disabled={!selectedOrg || loading.createProject}
            >
              {loading.createProject ? 'Creating...' : 'Create New Project'}
            </button>
          </div>
        )}
      </div>
            
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-3">Projects</h2>
            <button
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
              onClick={listProjects}
              disabled={loading.listProjects}
            >
              {loading.listProjects ? 'Loading...' : 'List Projects'}
            </button>
            
            {projects.length > 0 && (
          <div className="mt-3">
                <select
              className="border p-2 rounded"
                  value={selectedProject || ''}
                  onChange={(e) => setSelectedProject(e.target.value)}
                >
                  <option value="">Select a project</option>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
        </div>
        
      {selectedProject && (
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-3">Tables</h2>
          <div className="flex space-x-2">
            <button
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
              onClick={listTables}
              disabled={loading.listTables}
            >
              {loading.listTables ? 'Loading...' : 'List Tables'}
            </button>
            
            <button
              className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded"
              onClick={createTables}
              disabled={loading.createTables}
            >
              {loading.createTables ? 'Creating...' : 'Create Tables'}
            </button>
      </div>
      
      {tables.length > 0 && (
            <div className="mt-4 bg-gray-100 p-4 rounded">
              <h3 className="font-semibold mb-2">Existing Tables</h3>
              <ul className="list-disc pl-5">
                {tables.map((table, index) => (
                  <li key={index}>{table.schema}.{table.name}</li>
                ))}
              </ul>
          </div>
          )}
        </div>
      )}
      
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-3">Logs</h2>
        <div className="bg-black text-green-400 p-4 rounded h-60 overflow-y-auto font-mono text-sm">
          {logs.length === 0 ? (
            <p>No logs yet. Use the buttons above to perform actions.</p>
          ) : (
            logs.map((log, index) => <div key={index}>{log}</div>)
          )}
        </div>
      </div>
    </div>
  );
}

// Loading component for Suspense
function McpSupabaseLoading() {
  return (
      <div className="container mx-auto py-10 px-4">
        <h1 className="text-3xl font-bold mb-6">MCP Supabase Tools</h1>
      <div className="animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
        
        <div className="space-y-4">
          <div className="h-10 bg-gray-200 rounded w-40"></div>
          <div className="h-10 bg-gray-200 rounded w-40"></div>
          <div className="h-10 bg-gray-200 rounded w-40"></div>
        </div>
      </div>
    </div>
  );
}

// Content component with proper Suspense boundary
function McpSupabaseContent() {
  return (
    <Suspense fallback={<McpSupabaseLoading />}>
      <SearchParamsHandler />
    </Suspense>
  );
}

// Main component with ClientOnly and Suspense
export default function McpSupabasePage() {
  return (
    <ClientOnly fallback={<McpSupabaseLoading />}>
      <Suspense fallback={<McpSupabaseLoading />}>
        <McpSupabaseContent />
      </Suspense>
    </ClientOnly>
  );
} 