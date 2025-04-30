import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/utils/supabase';

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const requestBody = await request.json();
    const { 
      authId, 
      email, 
      firstName, 
      lastName, 
      role,
      schoolName,
      schoolAddress,
      schoolCity,
      schoolState,
      schoolPostalCode,
      positionTitle
    } = requestBody;
    
    // Validation
    if (!authId || !email || !firstName || !lastName || !role) {
      return NextResponse.json({ 
        error: 'Missing required fields' 
      }, { status: 400 });
    }
    
    // Verify the authenticated user is creating their own profile
    const { data: authData, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      console.error('Auth verification error:', authError);
      return NextResponse.json({ 
        error: 'Authentication error' 
      }, { status: 401 });
    }
    
    if (authData.user?.id !== authId) {
      console.error(`Auth mismatch: ${authData.user?.id} vs ${authId}`);
      return NextResponse.json({ 
        error: 'Cannot create a profile for another user' 
      }, { status: 403 });
    }
    
    // Step 1: Create user record in the users table
    const { data: userData, error: userError } = await supabase
      .from('users')
      .insert({
        auth_id: authId,
        email,
        first_name: firstName,
        last_name: lastName,
        role,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();
      
    if (userError) {
      console.error('Error creating user record:', userError);
      return NextResponse.json({ 
        error: `Failed to create user record: ${userError.message}` 
      }, { status: 500 });
    }
    
    // Step 2: If user is a teacher, create teacher profile
    if (role === 'teacher' && userData) {
      const { error: teacherError } = await supabase
        .from('teacher_profiles')
        .insert({
          user_id: userData.id,
          school_name: schoolName,
          school_address: schoolAddress,
          school_city: schoolCity,
          school_state: schoolState,
          school_postal_code: schoolPostalCode,
          position_title: positionTitle,
          created_at: new Date().toISOString()
        });
        
      if (teacherError) {
        console.error('Error creating teacher profile:', teacherError);
        // Continue anyway - the base user is created
      }
    }
    
    // Step 3: If user is a donor, optionally create donor profile
    if (role === 'donor' && userData) {
      // Create donor profile via RPC function to ensure proper handling
      const { data: donorData, error: donorError } = await supabase.rpc('get_or_create_donor_profile', {
        p_user_id: authId,
        p_is_anonymous: false
      });
      
      if (donorError) {
        console.error('Error creating donor profile via RPC:', donorError);
        
        // Fallback - direct insert
        const { error: directDonorError } = await supabase
          .from('donor_profiles')
          .insert({
            user_id: userData.id,
            is_anonymous: false,
            created_at: new Date().toISOString()
          });
          
        if (directDonorError) {
          console.error('Error creating donor profile directly:', directDonorError);
          // Continue anyway - the base user is created
        }
      }
    }
    
    // Return success response
    return NextResponse.json({
      success: true,
      userId: userData.id,
      role: role
    });
    
  } catch (error: any) {
    console.error('Error in create-user API:', error);
    return NextResponse.json({ 
      error: `An unexpected error occurred: ${error.message || 'Unknown error'}` 
    }, { status: 500 });
  }
} 