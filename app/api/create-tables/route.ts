import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/utils/supabase';

export async function POST(request: NextRequest) {
  try {
    // Create the profiles table first
    const createProfilesSQL = `
      CREATE TABLE IF NOT EXISTS profiles (
        id UUID PRIMARY KEY,
        email TEXT,
        first_name TEXT,
        last_name TEXT,
        role TEXT,
        bio TEXT,
        profile_image_url TEXT,
        website_url TEXT,
        twitter_url TEXT,
        facebook_url TEXT,
        instagram_url TEXT, 
        linkedin_url TEXT,
        github_url TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
      );
    `;
    
    console.log('Creating profiles table...');
    
    try {
      // Try direct SQL execution
      const { error: sqlError } = await supabase.rpc('run_sql', { sql: createProfilesSQL });
      
      if (sqlError) {
        console.error('Failed to create profiles table via SQL:', sqlError);
      } else {
        console.log('Profiles table created successfully');
      }
    } catch (profilesError) {
      console.error('Error during profiles table creation:', profilesError);
    }
    
    // Create teacher_profiles table
    const createTeacherProfilesSQL = `
      CREATE TABLE IF NOT EXISTS teacher_profiles (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID NOT NULL,
        school_name TEXT,
        position_title TEXT,
        school_address TEXT,
        school_city TEXT,
        school_state TEXT,
        school_postal_code TEXT,
        bio TEXT,
        philosophy TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
      );
    `;
    
    console.log('Creating teacher_profiles table...');
    
    try {
      // Try using the RPC function first
      const { error: rpcError } = await supabase.rpc('create_teacher_profiles_table', {});
      
      if (rpcError) {
        console.error('RPC error:', rpcError);
        
        // If RPC fails, use direct SQL
        const { error: sqlError } = await supabase.rpc('run_sql', { sql: createTeacherProfilesSQL });
        
        if (sqlError) {
          console.error('Failed to create teacher_profiles table via SQL:', sqlError);
        } else {
          console.log('Teacher profiles table created successfully via SQL');
        }
      } else {
        console.log('Teacher profiles table created successfully via RPC');
      }
    } catch (teacherError) {
      console.error('Error during teacher_profiles table creation:', teacherError);
    }
    
    // Create projects table
    const createProjectsSQL = `
      CREATE TABLE IF NOT EXISTS projects (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        teacher_id UUID NOT NULL,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        funding_goal NUMERIC(10,2) NOT NULL,
        current_funding NUMERIC(10,2) DEFAULT 0,
        status TEXT DEFAULT 'draft',
        main_image_url TEXT,
        student_impact TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
      );
    `;
    
    console.log('Creating projects table...');
    
    try {
      // Try using the RPC function first
      const { error: rpcError } = await supabase.rpc('create_projects_table', {});
      
      if (rpcError) {
        console.error('RPC error:', rpcError);
        
        // If RPC fails, use direct SQL
        const { error: sqlError } = await supabase.rpc('run_sql', { sql: createProjectsSQL });
        
        if (sqlError) {
          console.error('Failed to create projects table via SQL:', sqlError);
        } else {
          console.log('Projects table created successfully via SQL');
        }
      } else {
        console.log('Projects table created successfully via RPC');
      }
    } catch (projectsError) {
      console.error('Error during projects table creation:', projectsError);
    }
    
    // Create sample demo data if requested
    const { createSampleData } = await request.json();
    
    if (createSampleData) {
      console.log('Creating sample data...');
      
      try {
        // Create a demo teacher profile
        const { data: teacherProfile, error: teacherError } = await supabase
          .from('teacher_profiles')
          .insert({
            user_id: 'demo-user-id',
            school_name: 'Demo School',
            position_title: 'Teacher',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select()
          .single();
        
        if (teacherError) {
          console.error('Failed to create demo teacher profile:', teacherError);
        } else {
          console.log('Demo teacher profile created:', teacherProfile);
          
          // Create a sample project
          const { data: project, error: projectError } = await supabase
            .from('projects')
            .insert({
              teacher_id: teacherProfile.id,
              title: 'Demo Classroom Project',
              description: 'This is a demo project for testing purposes.',
              funding_goal: 1000,
              current_funding: 500,
              status: 'active',
              student_impact: 'This project will help students learn.',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .select()
            .single();
          
          if (projectError) {
            console.error('Failed to create demo project:', projectError);
          } else {
            console.log('Demo project created:', project);
          }
        }
      } catch (sampleDataError) {
        console.error('Error creating sample data:', sampleDataError);
      }
    }
    
    // Check all tables now
    const tables = ['profiles', 'teacher_profiles', 'projects'];
    const tableStatuses: Record<string, boolean> = {};
    
    for (const table of tables) {
      try {
        const { error } = await supabase
          .from(table)
          .select('count(*)', { count: 'exact', head: true })
          .limit(1);
        
        tableStatuses[table] = !error;
      } catch (error) {
        tableStatuses[table] = false;
      }
    }
    
    return NextResponse.json({
      success: true,
      message: 'Table creation attempt completed',
      tables: tableStatuses
    });
  } catch (error: any) {
    console.error('Error in create-tables API:', error);
    return NextResponse.json({ 
      error: `Unexpected error: ${error.message}`,
      stack: error.stack
    }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic'; 