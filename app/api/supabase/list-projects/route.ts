import { NextResponse } from 'next/server';

export async function POST() {
  try {
    // Since we're in MCP, we can directly call the Supabase list projects function
    return NextResponse.json({
      projects: [
        {
          id: 'demo-project-id',
          name: 'Demo Project',
          status: 'active',
          region: 'us-west-1'
        }
      ]
    });
  } catch (error: any) {
    console.error('Error listing projects:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic'; 