import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";
import { headers } from "next/headers";

export async function POST(request: Request) {
  try {
    // Properly await headers when used
    const headersList = await headers();
    
    const supabase = await createClient();
    
    // Check if user is authenticated and has admin role
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    // Get user data to check for admin role
    const { data: userData } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single();
      
    if (!userData || userData.role !== 'admin') {
      return NextResponse.json(
        { error: "Forbidden - Admin access required" },
        { status: 403 }
      );
    }
    
    // Create site_config table if it doesn't exist
    const { error } = await supabase.rpc('create_site_config_table');
    
    if (error) {
      // If the RPC function doesn't exist, we'll create the table directly
      const { error: createTableError } = await supabase.from('site_config').select('id').limit(1);
      
      if (createTableError && createTableError.code === '42P01') {
        // Table doesn't exist, create it
        const { error: sqlError } = await supabase.sql(`
          CREATE TABLE IF NOT EXISTS site_config (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            site_name TEXT DEFAULT 'Beyond Measure',
            site_url TEXT DEFAULT 'https://beyondmeasure.com',
            site_description TEXT DEFAULT 'Platform for educational projects funding',
            contact_email TEXT DEFAULT 'contact@beyondmeasure.com',
            support_email TEXT DEFAULT 'support@beyondmeasure.com',
            maintenance_mode BOOLEAN DEFAULT false,
            theme TEXT DEFAULT 'light',
            primary_color TEXT DEFAULT '#1E40AF',
            logo_url TEXT DEFAULT '/logo.png',
            favicon_url TEXT DEFAULT '/favicon.ico',
            show_footer BOOLEAN DEFAULT true,
            feature_projects BOOLEAN DEFAULT true,
            feature_donations BOOLEAN DEFAULT true,
            feature_comments BOOLEAN DEFAULT true,
            feature_user_registration BOOLEAN DEFAULT true,
            feature_search BOOLEAN DEFAULT true,
            feature_notifications BOOLEAN DEFAULT true,
            project_approval TEXT DEFAULT 'manual',
            cache_ttl INTEGER DEFAULT 30,
            max_upload_size INTEGER DEFAULT 10,
            rate_limit INTEGER DEFAULT 60,
            debug_mode BOOLEAN DEFAULT false,
            analytics_enabled BOOLEAN DEFAULT true,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
          
          -- Create initial record if table is empty
          INSERT INTO site_config (id)
          SELECT uuid_generate_v4()
          WHERE NOT EXISTS (SELECT 1 FROM site_config LIMIT 1);
        `);
        
        if (sqlError) throw sqlError;
      } else if (createTableError) {
        throw createTableError;
      }
    }
    
    return NextResponse.json({ success: true, message: "Site configuration table initialized" });
    
  } catch (error) {
    console.error('Error creating site_config table:', error);
    return NextResponse.json(
      { error: "Failed to create site_config table" },
      { status: 500 }
    );
  }
} 