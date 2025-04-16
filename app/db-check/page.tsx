'use client';

import CheckDatabase from '@/components/CheckDatabase';
import Link from 'next/link';

export default function DatabaseCheckPage() {
  return (
    <div className="container mx-auto py-10 px-4">
      <h1 className="text-3xl font-bold mb-6">Database Check</h1>
      <p className="mb-6 text-gray-600">
        This page checks your Supabase database configuration and helps you set up
        the necessary tables if they don't exist.
      </p>
      
      <div className="mb-8 flex flex-wrap gap-4">
        <Link href="/db-direct">
          <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
            Direct Database Operations
          </button>
        </Link>
        
        <Link href="/mcp-supabase">
          <button className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700">
            MCP Supabase Tools
          </button>
        </Link>
        
        <Link href="/setup-demo">
          <button className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">
            Setup Demo Project
          </button>
        </Link>
      </div>
      
      <CheckDatabase />
    </div>
  );
} 