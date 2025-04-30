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
    const theme = formData.get('theme') as string;
    const primaryColor = formData.get('primaryColor') as string;
    const logoUrl = formData.get('logoUrl') as string;
    const faviconUrl = formData.get('faviconUrl') as string;
    const showFooter = formData.get('showFooter') === 'on';
    
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
          theme,
          primary_color: primaryColor,
          logo_url: logoUrl,
          favicon_url: faviconUrl,
          show_footer: showFooter,
          updated_at: new Date().toISOString()
        })
        .eq('id', configExists[0].id);
        
      if (error) throw error;
    } else {
      // Create new record
      const { error } = await supabase
        .from('site_config')
        .insert({
          theme,
          primary_color: primaryColor,
          logo_url: logoUrl,
          favicon_url: faviconUrl,
          show_footer: showFooter,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
        
      if (error) throw error;
    }
    
    return NextResponse.json({ success: true });
    
  } catch (error) {
    console.error('Error updating appearance settings:', error);
    return NextResponse.json(
      { error: "Failed to update appearance settings" },
      { status: 500 }
    );
  }
} 