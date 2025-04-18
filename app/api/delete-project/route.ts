import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/utils/supabaseAdmin';
import { supabase } from '@/utils/supabase';

export async function POST(request: NextRequest) {
  try {
    // Get request body
    const { projectId } = await request.json();
    
    if (!projectId) {
      console.error('No project ID provided');
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
    }
    
    console.log('Attempting to delete project with ID:', projectId);
    
    // Get the authentication token from the Authorization header
    const authHeader = request.headers.get('Authorization');
    let user;

    // First try with the auth header if available
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const { data: authData, error: authError } = await supabase.auth.getUser(token);
      
      if (authError) {
        console.error('Auth error with token:', authError);
      } else {
        user = authData.user;
      }
    }
    
    // If no user found yet, try with cookie-based session
    if (!user) {
      const { data: { user: cookieUser }, error: cookieError } = await supabase.auth.getUser();
      
      if (cookieError) {
        console.error('Auth error with cookie:', cookieError);
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
      }
      
      user = cookieUser;
    }
    
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    
    // Call the RPC function to delete the project using admin client
    // This is secure because:
    // 1. It uses the admin client with service_role permissions
    // 2. We explicitly pass the user ID for admin verification
    // 3. It handles all related records properly with cascading deletes
    const { data, error } = await supabaseAdmin.rpc('admin_delete_project', {
      p_project_id: projectId,
      p_user_id: user.id
    });
    
    if (error) {
      console.error('Error deleting project:', error);
      return NextResponse.json({ 
        error: `Failed to delete project: ${error.message}` 
      }, { status: 500 });
    }
    
    // This returns true if successfully deleted
    return NextResponse.json({
      success: true,
      message: 'Project deleted successfully',
      id: projectId
    });
  } catch (error: any) {
    console.error('Exception in delete-project API:', error);
    return NextResponse.json({ 
      error: `Unexpected error: ${error.message}`,
      stack: error.stack
    }, { status: 500 });
  }
} 