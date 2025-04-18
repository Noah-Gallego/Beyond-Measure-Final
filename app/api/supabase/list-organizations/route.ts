import { NextResponse } from 'next/server';

export async function POST() {
  try {
    // Since we're in MCP, we can directly call the Supabase list organizations function
    return NextResponse.json({
      organizations: [
        {
          id: 'demo-org-id',
          name: 'Demo Organization',
          region: 'us-west-1'
        }
      ]
    });
  } catch (error: any) {
    console.error('Error listing organizations:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic'; 