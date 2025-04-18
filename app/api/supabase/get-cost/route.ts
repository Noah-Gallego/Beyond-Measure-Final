import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { organizationId, type } = body;
    
    // Dummy response for MCP environment
    return NextResponse.json({
      amount: 5,
      recurrence: 'monthly'
    });
  } catch (error: any) {
    console.error('Error getting cost:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic'; 