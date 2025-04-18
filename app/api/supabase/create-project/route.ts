import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, organizationId, confirmCostId } = body;
    
    // Dummy response for MCP environment
    return NextResponse.json({
      id: 'project-' + Date.now(),
      name,
      status: 'creating'
    });
  } catch (error: any) {
    console.error('Error creating project:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic'; 