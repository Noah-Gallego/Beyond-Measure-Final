import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    
    // Check if user is authenticated
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    // Execute SQL to create the admins table
    const { data, error } = await supabase.rpc('exec_sql', {
      sql_query: `
        -- Enable UUID extension if not already enabled
        CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
        
        -- Create admins table if it doesn't exist
        CREATE TABLE IF NOT EXISTS admins (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          user_id UUID NOT NULL REFERENCES auth.users(id),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          UNIQUE (user_id)
        );
        
        -- Grant appropriate permissions
        GRANT ALL ON admins TO authenticated;
        GRANT ALL ON admins TO service_role;
      `
    });
    
    if (error) {
      console.error('Error creating admins table:', error);
      return NextResponse.json(
        { 
          error: "Failed to create admins table", 
          details: error,
          message: "This could be because the exec_sql function is not available or you don't have sufficient permissions."
        },
        { status: 500 }
      );
    }
    
    // Add the current user as an admin if not already
    const userId = session.user.id;
    
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
      
      return NextResponse.json({ 
        success: true, 
        message: "Admin table created and you were added as an admin",
        admin: newAdmin
      });
    }
    
    return NextResponse.json({ 
      success: true, 
      message: "Admin table created. You are already an admin.",
      admin: existingAdmin
    });
    
  } catch (error) {
    console.error('Error in create admin table:', error);
    return NextResponse.json(
      { error: "Failed to create admin table", details: error },
      { status: 500 }
    );
  }
} 