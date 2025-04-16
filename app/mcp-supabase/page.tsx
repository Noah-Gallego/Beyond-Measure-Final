'use client';

import { useState } from 'react';

export default function McpSupabasePage() {
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
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
        Use these tools to manage your Supabase projects, check database tables, and create required tables.
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-bold mb-4">Organization & Project</h2>
          
          <div className="space-y-4">
            <button
              onClick={listOrganizations}
              disabled={loading.listOrgs}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 w-full"
            >
              {loading.listOrgs ? 'Loading...' : 'List Organizations'}
            </button>
            
            {organizations.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Select Organization
                </label>
                <select
                  value={selectedOrg || ''}
                  onChange={(e) => setSelectedOrg(e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select an organization</option>
                  {organizations.map((org) => (
                    <option key={org.id} value={org.id}>
                      {org.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
            
            <button
              onClick={handleCreateProject}
              disabled={!selectedOrg || loading.createProject}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 w-full"
            >
              {loading.createProject ? 'Creating...' : 'Create New Project'}
            </button>
            
            <button
              onClick={listProjects}
              disabled={loading.listProjects}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 w-full"
            >
              {loading.listProjects ? 'Loading...' : 'List Projects'}
            </button>
            
            {projects.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Select Project
                </label>
                <select
                  value={selectedProject || ''}
                  onChange={(e) => setSelectedProject(e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
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
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-bold mb-4">Database Operations</h2>
          
          <div className="space-y-4">
            <button
              onClick={listTables}
              disabled={!selectedProject || loading.listTables}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 w-full"
            >
              {loading.listTables ? 'Loading...' : 'List Tables'}
            </button>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Migration Name
              </label>
              <input
                type="text"
                value={migrationName}
                onChange={(e) => setMigrationName(e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="create_initial_tables"
              />
            </div>
            
            <button
              onClick={createTables}
              disabled={!selectedProject || loading.createTables}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 w-full"
            >
              {loading.createTables ? 'Creating...' : 'Create Tables'}
            </button>
          </div>
        </div>
      </div>
      
      {/* Logs */}
      <div className="mt-6 mb-6 p-4 bg-gray-100 rounded max-h-60 overflow-y-auto">
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
      
      {/* Table List */}
      {tables.length > 0 && (
        <div className="mt-6">
          <h2 className="text-xl font-bold mb-2">Tables</h2>
          <div className="bg-white shadow overflow-hidden rounded-md">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Schema</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Table</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {tables.map((table, i) => (
                  <tr key={i}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {table.schema}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {table.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {table.type || 'table'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      
      <div className="mt-10 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
        <h2 className="text-lg font-semibold mb-2">Important Note</h2>
        <p>
          This page uses the MCP Supabase tools. For these tools to work, you need to have the appropriate API routes set up 
          at <code>/api/supabase/*</code> that forward requests to the MCP Supabase functions.
        </p>
      </div>
    </div>
  );
} 