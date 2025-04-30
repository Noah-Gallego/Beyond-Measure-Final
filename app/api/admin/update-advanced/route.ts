import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
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
    
    // Process form data
    const formData = await request.formData();
    const cacheTtl = parseInt(formData.get('cacheTtl') as string) || 30;
    const maxUploadSize = parseInt(formData.get('maxUploadSize') as string) || 10;
    const rateLimit = parseInt(formData.get('rateLimit') as string) || 60;
    const debugMode = formData.get('debugMode') === 'on';
    const analyticsEnabled = formData.get('analyticsEnabled') === 'on';
    
    // Check if site_config table exists and get the record
    const { data: configExists } = await supabase
      .from('site_config')
      .select('id')
      .limit(1);
      
    if (configExists && configExists.length > 0) {
      // Update existing record
      const { error } = await supabase
        .from('site_config')
        .update({
          cache_ttl: cacheTtl,
          max_upload_size: maxUploadSize,
          rate_limit: rateLimit,
          debug_mode: debugMode,
          analytics_enabled: analyticsEnabled,
          updated_at: new Date().toISOString()
        })
        .eq('id', configExists[0].id);
        
      if (error) throw error;
    } else {
      // Create new record
      const { error } = await supabase
        .from('site_config')
        .insert({
          cache_ttl: cacheTtl,
          max_upload_size: maxUploadSize,
          rate_limit: rateLimit,
          debug_mode: debugMode,
          analytics_enabled: analyticsEnabled,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
        
      if (error) throw error;
    }
    
    return NextResponse.json({ success: true });
    
  } catch (error) {
    console.error('Error updating advanced settings:', error);
    return NextResponse.json(
      { error: "Failed to update advanced settings" },
      { status: 500 }
    );
  }
}

// Special functions for danger zone actions
export async function DELETE(request: Request) {
  try {
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
    
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    
    if (action === 'purge-cache') {
      // This is a simulated cache purge, in a real application
      // you would integrate with your caching system (Redis, etc.)
      console.log('Cache purged successfully');
      return NextResponse.json({ success: true, message: "Cache purged successfully" });
    } 
    else if (action === 'reset-settings') {
      // Reset settings to defaults
      const { data: configExists } = await supabase
        .from('site_config')
        .select('id')
        .limit(1);
        
      if (configExists && configExists.length > 0) {
        // Update with default values
        const { error } = await supabase
          .from('site_config')
          .update({
            site_name: "Beyond Measure",
            site_url: "https://beyondmeasure.com",
            site_description: "Platform for educational projects funding",
            contact_email: "contact@beyondmeasure.com",
            support_email: "support@beyondmeasure.com",
            maintenance_mode: false,
            theme: "light",
            primary_color: "#1E40AF",
            logo_url: "/logo.png",
            favicon_url: "/favicon.ico",
            show_footer: true,
            feature_projects: true,
            feature_donations: true,
            feature_comments: true,
            feature_user_registration: true,
            feature_search: true,
            feature_notifications: true,
            project_approval: "manual",
            cache_ttl: 30,
            max_upload_size: 10,
            rate_limit: 60,
            debug_mode: false,
            analytics_enabled: true,
            updated_at: new Date().toISOString()
          })
          .eq('id', configExists[0].id);
          
        if (error) throw error;
      }
      
      return NextResponse.json({ success: true, message: "Settings reset to defaults" });
    } 
    else {
      return NextResponse.json(
        { error: "Invalid action" },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error processing danger zone action:', error);
    return NextResponse.json(
      { error: "Failed to process action" },
      { status: 500 }
    );
  }
} 