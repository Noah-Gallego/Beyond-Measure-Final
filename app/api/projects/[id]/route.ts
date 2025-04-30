import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/utils/supabaseAdmin';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const projectId = params.id;
    
    if (!projectId) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
    }
    
    // Use the admin client to bypass RLS policies
    const { data, error } = await supabaseAdmin
      .from('projects')
      .select(`
        id, title, description, student_impact, funding_goal, current_amount, status, 
        main_image_url, created_at, updated_at,
        teacher_profiles:teacher_id(
          id, user_id,
          school_name, school_city, school_state
        ),
        categories:project_categories(
          category:categories(id, name)
        )
      `)
      .eq('id', projectId)
      .single();
    
    if (error) {
      console.error('Error fetching project details:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    if (!data) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }
    
    // Transform data to match expected format
    let teacherData = null;
    if (data.teacher_profiles) {
      // Handle the teacher profile data
      const teacherProfile = data.teacher_profiles;
      teacherData = {
        id: teacherProfile.id,
        display_name: 'Teacher', // Default name
        school: teacherProfile.school_name ? {
          name: teacherProfile.school_name,
          city: teacherProfile.school_city,
          state: teacherProfile.school_state
        } : null
      };
      
      // Fetch teacher user details for display name and profile image
      const { data: userData, error: userError } = await supabaseAdmin
        .from('users')
        .select('first_name, last_name, profile_image_url')
        .eq('id', teacherProfile.user_id)
        .single();
        
      if (!userError && userData) {
        const firstName = userData.first_name || '';
        const lastName = userData.last_name || '';
        teacherData.display_name = `${firstName} ${lastName}`.trim() || 'Teacher';
        teacherData.profile_image_url = userData.profile_image_url;
      }
    }
    
    // Extract categories from the nested structure
    const categories = data.categories 
      ? data.categories
          .map(pc => pc.category)
          .filter(Boolean)
          .map(cat => ({
            id: cat.id,
            name: cat.name
          }))
      : [];
    
    const formattedProject = {
      ...data,
      teacher: teacherData,
      categories: categories
    };
    
    return NextResponse.json(formattedProject);
  } catch (error) {
    console.error('Error in project details API:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 