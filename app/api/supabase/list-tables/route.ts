import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { projectId } = body;
    
    if (!projectId) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
    }
    
    // Mock response with database tables that should exist
    return NextResponse.json({
      tables: [
        {
          schema: 'public',
          name: 'teacher_profiles',
          type: 'table'
        },
        {
          schema: 'public',
          name: 'projects',
          type: 'table'
        },
        {
          schema: 'auth',
          name: 'users',
          type: 'table'
        }
      ]
    });
  } catch (error: any) {
    console.error('Error listing tables:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic'; 