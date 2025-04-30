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
    const siteName = formData.get('siteName') as string;
    const siteUrl = formData.get('siteUrl') as string;
    const siteDescription = formData.get('siteDescription') as string;
    const contactEmail = formData.get('contactEmail') as string;
    const supportEmail = formData.get('supportEmail') as string;
    const maintenanceMode = formData.get('maintenanceMode') === 'on';
    
    // Check if site_config table exists, if not create it
    const { data: configExists } = await supabase
      .from('site_config')
      .select('id')
      .limit(1);
      
    if (configExists && configExists.length > 0) {
      // Update existing record
      const { error } = await supabase
        .from('site_config')
        .update({
          site_name: siteName,
          site_url: siteUrl,
          site_description: siteDescription,
          contact_email: contactEmail,
          support_email: supportEmail,
          maintenance_mode: maintenanceMode,
          updated_at: new Date().toISOString()
        })
        .eq('id', configExists[0].id);
        
      if (error) throw error;
    } else {
      // Create new record
      const { error } = await supabase
        .from('site_config')
        .insert({
          site_name: siteName,
          site_url: siteUrl,
          site_description: siteDescription,
          contact_email: contactEmail,
          support_email: supportEmail,
          maintenance_mode: maintenanceMode,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
        
      if (error) throw error;
    }
    
    return NextResponse.json({ success: true });
    
  } catch (error) {
    console.error('Error updating settings:', error);
    return NextResponse.json(
      { error: "Failed to update settings" },
      { status: 500 }
    );
  }
} 