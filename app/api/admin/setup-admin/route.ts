import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    
    // Check if user is authenticated
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized - Please login first" },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    
    // Check if admins table exists by trying to query it
    const { data: tableCheck, error: tableError } = await supabase
      .from('admins')
      .select('*')
      .limit(1);
      
    let tableExists = !tableError;
    let createTableResult = null;
    
    // If table doesn't exist, create it using SQL
    if (!tableExists) {
      // Create the admins table
      const { data, error } = await supabase.rpc('create_admins_table');
      
      if (error) {
        // If RPC doesn't exist, use raw SQL as fallback
        const { error: sqlError } = await supabase.rpc('exec_sql', {
          sql_query: `
            CREATE TABLE IF NOT EXISTS admins (
              id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
              user_id UUID NOT NULL REFERENCES auth.users(id),
              created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
              UNIQUE (user_id)
            );
          `
        });
        
        if (sqlError) {
          return NextResponse.json(
            { error: "Failed to create admins table", details: sqlError },
            { status: 500 }
          );
        }
        
        createTableResult = "Created admins table via SQL";
      } else {
        createTableResult = "Created admins table via RPC";
      }
      
      tableExists = true;
    }
    
    // Add current user as admin if not already
    let adminData = null;
    if (tableExists) {
      // Check if user is already admin
      const { data: existingAdmin, error: checkError } = await supabase
        .from('admins')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();
        
      if (checkError) {
        return NextResponse.json(
          { error: "Error checking admin status", details: checkError },
          { status: 500 }
        );
      }
      
      // If not admin, add as admin
      if (!existingAdmin) {
        const { data: newAdmin, error: insertError } = await supabase
          .from('admins')
          .insert([{ user_id: userId }])
          .select()
          .single();
          
        if (insertError) {
          return NextResponse.json(
            { error: "Failed to add user as admin", details: insertError },
            { status: 500 }
          );
        }
        
        adminData = newAdmin;
      } else {
        adminData = existingAdmin;
      }
    }
    
    // Get user profile info
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();
    
    // Return info about what was done
    return NextResponse.json({
      success: true,
      table_exists: tableExists,
      table_created: createTableResult,
      admin_data: adminData,
      user_id: userId,
      profile: profile || null,
      message: adminData ? "You are now an admin" : "You were already an admin"
    });
    
  } catch (error) {
    console.error('Error in admin setup:', error);
    return NextResponse.json(
      { error: "Failed to set up admin access", details: error },
      { status: 500 }
    );
  }
} 