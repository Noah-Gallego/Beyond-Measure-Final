import { NextResponse } from 'next/server';
import { supabase } from '@/utils/supabase';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const teacherId = searchParams.get('id');
    
    if (!teacherId) {
      return NextResponse.json({ error: 'Teacher ID is required' }, { status: 400 });
    }
    
    // Get the current user and check if they're an admin
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    
    // Check if the user is an admin
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('auth_id', user.id)
      .single();
    
    if (userError || userData?.role !== 'admin') {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }
    
    // Use the admin function to get teacher info
    const { data: teacherData, error: teacherError } = await supabase
      .rpc('get_teacher_info_for_admin', {
        p_teacher_id: teacherId
      });
    
    if (teacherError) {
      console.error('Error fetching teacher info:', teacherError);
      return NextResponse.json({ error: 'Error fetching teacher info' }, { status: 500 });
    }
    
    return NextResponse.json({ teacher: teacherData?.[0] || null });
  } catch (error: any) {
    console.error('Error in get-teacher API:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic'; 