import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { type, amount, recurrence } = body;
    
    // Dummy response for MCP environment
    return NextResponse.json({
      id: 'cost-confirmation-' + Date.now()
    });
  } catch (error: any) {
    console.error('Error confirming cost:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic'; 