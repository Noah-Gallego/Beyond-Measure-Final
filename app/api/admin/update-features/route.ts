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
    const featureProjects = formData.get('featureProjects') === 'on';
    const featureDonations = formData.get('featureDonations') === 'on';
    const featureComments = formData.get('featureComments') === 'on';
    const featureUserRegistration = formData.get('featureUserRegistration') === 'on';
    const featureSearch = formData.get('featureSearch') === 'on';
    const featureNotifications = formData.get('featureNotifications') === 'on';
    const projectApproval = formData.get('projectApproval') as string;
    
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
          feature_projects: featureProjects,
          feature_donations: featureDonations,
          feature_comments: featureComments,
          feature_user_registration: featureUserRegistration,
          feature_search: featureSearch,
          feature_notifications: featureNotifications,
          project_approval: projectApproval,
          updated_at: new Date().toISOString()
        })
        .eq('id', configExists[0].id);
        
      if (error) throw error;
    } else {
      // Create new record
      const { error } = await supabase
        .from('site_config')
        .insert({
          feature_projects: featureProjects,
          feature_donations: featureDonations,
          feature_comments: featureComments,
          feature_user_registration: featureUserRegistration,
          feature_search: featureSearch,
          feature_notifications: featureNotifications,
          project_approval: projectApproval,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
        
      if (error) throw error;
    }
    
    return NextResponse.json({ success: true });
    
  } catch (error) {
    console.error('Error updating feature settings:', error);
    return NextResponse.json(
      { error: "Failed to update feature settings" },
      { status: 500 }
    );
  }
} 