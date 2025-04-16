import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { projectId, name, query } = body;
    
    if (!projectId) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
    }
    
    if (!name) {
      return NextResponse.json({ error: 'Migration name is required' }, { status: 400 });
    }
    
    if (!query) {
      return NextResponse.json({ error: 'SQL query is required' }, { status: 400 });
    }
    
    // Log the migration details
    console.log(`Applying migration "${name}" to project ${projectId}:`);
    console.log(query);
    
    // Simulate successful migration
    return NextResponse.json({
      success: true,
      message: `Migration "${name}" applied successfully`
    });
  } catch (error: any) {
    console.error('Error applying migration:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic'; 