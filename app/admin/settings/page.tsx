'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Save, AlertTriangle, Info, PaintBucket, Features, Settings, FileCode } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/components/AuthProvider';

export default function AdminSettingsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const supabase = createClient();
  const { toast } = useToast();
  
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState({
    site_name: '',
    site_url: '',
    site_description: '',
    contact_email: '',
    support_email: '',
    maintenance_mode: false,
    theme_primary_color: '#3b82f6',
    theme_secondary_color: '#6366f1',
    theme_accent_color: '#8b5cf6',
    theme_background_color: '#ffffff',
    theme_text_color: '#111827',
    theme_font_primary: 'Montserrat',
    theme_font_secondary: 'Open Sans',
    enable_projects: true,
    enable_donations: true,
    enable_teacher_applications: true,
    enable_blog: false,
    analytics_tracking_id: '',
    api_keys: '',
    backup_frequency: 'daily',
    max_file_upload_size: '10'
  });

  // Effect to check admin status and load config
  useEffect(() => {
    if (authLoading) return;
    
    async function checkAdminAndLoadConfig() {
      if (!user) {
        router.push('/auth');
        return;
      }
      
      try {
        // Check for admin role in profiles
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();
          
        if (profileError || !profileData || profileData.role !== 'admin') {
          // Fallback to users table
          const { data: userData, error: userError } = await supabase
            .from('users')
            .select('role')
            .eq('auth_id', user.id)
            .single();
            
          if (userError || !userData || userData.role !== 'admin') {
            setIsAdmin(false);
            setLoading(false);
            return;
          }
        }
        
        setIsAdmin(true);
        
        // Create site_config table if it doesn't exist
        await fetch('/api/admin/create-site-config-table', {
          method: 'POST',
        });
        
        // Load config
        await loadConfig();
      } catch (error) {
        console.error('Error checking admin status:', error);
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    }
    
    checkAdminAndLoadConfig();
  }, [user, authLoading, router, supabase]);

  async function loadConfig() {
    try {
      const { data, error } = await supabase
        .from('site_config')
        .select('*')
        .order('id', { ascending: false })
        .limit(1)
        .single();
        
      if (error) {
        console.error('Error loading config:', error);
        return;
      }
      
      if (data) {
        // Update state with loaded config
        setConfig({
          ...config,
          ...data
        });
      }
    } catch (error) {
      console.error('Error in loadConfig:', error);
    }
  }

  async function saveConfig(section: string) {
    try {
      setSaving(true);
      
      // Determine which fields to update based on section
      let updateFields = {};
      
      switch (section) {
        case 'site':
          updateFields = {
            site_name: config.site_name,
            site_url: config.site_url,
            site_description: config.site_description,
            contact_email: config.contact_email,
            support_email: config.support_email,
            maintenance_mode: config.maintenance_mode
          };
          break;
        case 'appearance':
          updateFields = {
            theme_primary_color: config.theme_primary_color,
            theme_secondary_color: config.theme_secondary_color,
            theme_accent_color: config.theme_accent_color,
            theme_background_color: config.theme_background_color,
            theme_text_color: config.theme_text_color,
            theme_font_primary: config.theme_font_primary,
            theme_font_secondary: config.theme_font_secondary
          };
          break;
        case 'features':
          updateFields = {
            enable_projects: config.enable_projects,
            enable_donations: config.enable_donations,
            enable_teacher_applications: config.enable_teacher_applications,
            enable_blog: config.enable_blog
          };
          break;
        case 'advanced':
          updateFields = {
            analytics_tracking_id: config.analytics_tracking_id,
            api_keys: config.api_keys,
            backup_frequency: config.backup_frequency,
            max_file_upload_size: config.max_file_upload_size
          };
          break;
        default:
          // If no section specified, update all fields
          updateFields = config;
      }
      
      // Check if config exists
      const { data: existingConfig, error: checkError } = await supabase
        .from('site_config')
        .select('id')
        .limit(1);
        
      if (checkError) {
        throw new Error('Error checking existing config');
      }
      
      let result;
      
      if (existingConfig && existingConfig.length > 0) {
        // Update existing config
        result = await supabase
          .from('site_config')
          .update(updateFields)
          .eq('id', existingConfig[0].id);
      } else {
        // Insert new config
        result = await supabase
          .from('site_config')
          .insert([updateFields]);
      }
      
      if (result.error) {
        throw new Error(result.error.message);
      }
      
      toast({
        title: "Settings saved",
        description: `Your ${section} settings have been updated successfully.`,
        variant: "default",
      });
      
    } catch (error) {
      console.error('Error saving config:', error);
      toast({
        title: "Error saving settings",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[80vh]">
        <div className="relative w-16 h-16">
          <div className="absolute top-0 left-0 w-full h-full rounded-full border-4 border-t-indigo-500 border-r-transparent border-b-indigo-300 border-l-transparent animate-spin"></div>
          <div className="absolute top-2 left-2 w-12 h-12 rounded-full border-4 border-t-transparent border-r-blue-500 border-b-transparent border-l-blue-300 animate-spin-slow"></div>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8 max-w-2xl mx-auto mt-12 border border-slate-100 dark:border-slate-700">
        <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-xl mb-6">
          <h1 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-4 flex items-center">
            <AlertTriangle className="w-8 h-8 mr-2" />
            Access Denied
          </h1>
          <p className="text-slate-700 dark:text-slate-300 mb-4">
            You do not have permission to access the admin settings. This area is restricted to administrators only.
          </p>
          <p className="text-slate-600 dark:text-slate-400 mb-6">
            If you believe you should have admin access, please contact the system administrator.
          </p>
        </div>
        <Button asChild variant="default">
          <a href="/" className="inline-flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L7.414 9H15a1 1 0 110 2H7.414l2.293 2.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
            Return to Home
          </a>
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto space-y-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white mb-2">Site Settings</h1>
        <p className="text-slate-500 dark:text-slate-400">Configure your platform settings and appearance.</p>
      </div>
      
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-100 dark:border-slate-700 overflow-hidden">
        <Tabs defaultValue="general">
          <div className="border-b border-slate-200 dark:border-slate-700 px-6">
            <TabsList className="bg-transparent border-b-0 h-14 justify-start px-0 w-full -mb-px relative">
              <TabsTrigger 
                value="general" 
                className="data-[state=active]:text-indigo-600 data-[state=active]:border-indigo-600 rounded-none border-b-2 border-transparent h-14 relative"
              >
                <Info className="w-4 h-4 mr-2" />
                General
              </TabsTrigger>
              <TabsTrigger 
                value="appearance" 
                className="data-[state=active]:text-indigo-600 data-[state=active]:border-indigo-600 rounded-none border-b-2 border-transparent h-14 relative"
              >
                <PaintBucket className="w-4 h-4 mr-2" />
                Appearance
              </TabsTrigger>
              <TabsTrigger 
                value="features" 
                className="data-[state=active]:text-indigo-600 data-[state=active]:border-indigo-600 rounded-none border-b-2 border-transparent h-14 relative"
              >
                <Features className="w-4 h-4 mr-2" />
                Features
              </TabsTrigger>
              <TabsTrigger 
                value="advanced" 
                className="data-[state=active]:text-indigo-600 data-[state=active]:border-indigo-600 rounded-none border-b-2 border-transparent h-14 relative"
              >
                <FileCode className="w-4 h-4 mr-2" />
                Advanced
              </TabsTrigger>
            </TabsList>
          </div>
          
          <TabsContent value="general" className="p-6">
            <Card className="border-0 shadow-none">
              <CardHeader className="px-0 pt-0">
                <CardTitle>Site Information</CardTitle>
                <CardDescription>
                  Basic information about your site that appears throughout the platform.
                </CardDescription>
              </CardHeader>
              <CardContent className="px-0 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="site_name">Site Name</Label>
                    <Input
                      id="site_name"
                      value={config.site_name}
                      onChange={(e) => setConfig({ ...config, site_name: e.target.value })}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="site_url">Site URL</Label>
                    <Input
                      id="site_url"
                      value={config.site_url}
                      onChange={(e) => setConfig({ ...config, site_url: e.target.value })}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="site_description">Site Description</Label>
                  <textarea
                    id="site_description"
                    rows={3}
                    className="w-full resize-none min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={config.site_description}
                    onChange={(e) => setConfig({ ...config, site_description: e.target.value })}
                    aria-label="Site Description"
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="contact_email">Contact Email</Label>
                    <Input
                      id="contact_email"
                      type="email"
                      value={config.contact_email}
                      onChange={(e) => setConfig({ ...config, contact_email: e.target.value })}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="support_email">Support Email</Label>
                    <Input
                      id="support_email"
                      type="email"
                      value={config.support_email}
                      onChange={(e) => setConfig({ ...config, support_email: e.target.value })}
                    />
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch
                    id="maintenance_mode"
                    checked={config.maintenance_mode}
                    onCheckedChange={(checked) => setConfig({ ...config, maintenance_mode: checked })}
                  />
                  <Label htmlFor="maintenance_mode" className="font-medium">
                    Maintenance Mode
                  </Label>
                  <span className="text-sm text-slate-500 dark:text-slate-400 ml-2">
                    When enabled, only administrators can access the site.
                  </span>
                </div>
              </CardContent>
              <CardFooter className="flex justify-end px-0 pb-0">
                <Button 
                  onClick={() => saveConfig('site')} 
                  disabled={saving}
                  className="bg-gradient-to-r from-indigo-500 to-blue-500 hover:from-indigo-600 hover:to-blue-600"
                >
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save Settings
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
          
          <TabsContent value="appearance" className="p-6">
            <AppearanceSettings 
              config={config} 
              setConfig={setConfig} 
              onSave={() => saveConfig('appearance')} 
              saving={saving} 
            />
          </TabsContent>
          
          <TabsContent value="features" className="p-6">
            <FeatureSettings 
              config={config} 
              setConfig={setConfig} 
              onSave={() => saveConfig('features')} 
              saving={saving} 
            />
          </TabsContent>
          
          <TabsContent value="advanced" className="p-6">
            <AdvancedSettings 
              config={config} 
              setConfig={setConfig} 
              onSave={() => saveConfig('advanced')} 
              saving={saving} 
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function AppearanceSettings({ 
  config, 
  setConfig, 
  onSave, 
  saving 
}: { 
  config: any; 
  setConfig: (config: any) => void; 
  onSave: () => void; 
  saving: boolean;
}) {
  return (
    <Card className="border-0 shadow-none">
      <CardHeader className="px-0 pt-0">
        <CardTitle>Appearance</CardTitle>
        <CardDescription>
          Customize the look and feel of your platform.
        </CardDescription>
      </CardHeader>
      <CardContent className="px-0 space-y-6">
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-medium mb-4">Theme Colors</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label htmlFor="theme_primary_color">Primary Color</Label>
                <div className="flex items-center space-x-2">
                  <Input
                    id="theme_primary_color"
                    type="color"
                    className="w-12 h-10 p-1"
                    value={config.theme_primary_color}
                    onChange={(e) => setConfig({ ...config, theme_primary_color: e.target.value })}
                  />
                  <Input
                    value={config.theme_primary_color}
                    onChange={(e) => setConfig({ ...config, theme_primary_color: e.target.value })}
                    className="font-mono"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="theme_secondary_color">Secondary Color</Label>
                <div className="flex items-center space-x-2">
                  <Input
                    id="theme_secondary_color"
                    type="color"
                    className="w-12 h-10 p-1"
                    value={config.theme_secondary_color}
                    onChange={(e) => setConfig({ ...config, theme_secondary_color: e.target.value })}
                  />
                  <Input
                    value={config.theme_secondary_color}
                    onChange={(e) => setConfig({ ...config, theme_secondary_color: e.target.value })}
                    className="font-mono"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="theme_accent_color">Accent Color</Label>
                <div className="flex items-center space-x-2">
                  <Input
                    id="theme_accent_color"
                    type="color"
                    className="w-12 h-10 p-1"
                    value={config.theme_accent_color}
                    onChange={(e) => setConfig({ ...config, theme_accent_color: e.target.value })}
                  />
                  <Input
                    value={config.theme_accent_color}
                    onChange={(e) => setConfig({ ...config, theme_accent_color: e.target.value })}
                    className="font-mono"
                  />
                </div>
              </div>
            </div>
          </div>
          
          <div className="border-t border-slate-200 dark:border-slate-700 pt-6">
            <h3 className="text-lg font-medium mb-4">Typography</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="theme_font_primary">Primary Font</Label>
                <select
                  id="theme_font_primary"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  value={config.theme_font_primary}
                  onChange={(e) => setConfig({ ...config, theme_font_primary: e.target.value })}
                  aria-label="Primary Font"
                >
                  <option value="Montserrat">Montserrat</option>
                  <option value="Poppins">Poppins</option>
                  <option value="Inter">Inter</option>
                  <option value="Roboto">Roboto</option>
                  <option value="Open Sans">Open Sans</option>
                  <option value="Lato">Lato</option>
                </select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="theme_font_secondary">Secondary Font</Label>
                <select
                  id="theme_font_secondary"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  value={config.theme_font_secondary}
                  onChange={(e) => setConfig({ ...config, theme_font_secondary: e.target.value })}
                  aria-label="Secondary Font"
                >
                  <option value="Open Sans">Open Sans</option>
                  <option value="Roboto">Roboto</option>
                  <option value="Inter">Inter</option>
                  <option value="Lato">Lato</option>
                  <option value="Montserrat">Montserrat</option>
                  <option value="Poppins">Poppins</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-end px-0 pb-0">
        <Button 
          onClick={onSave} 
          disabled={saving}
          className="bg-gradient-to-r from-indigo-500 to-blue-500 hover:from-indigo-600 hover:to-blue-600"
        >
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save Appearance
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}

function FeatureSettings({ 
  config, 
  setConfig, 
  onSave,
  saving 
}: { 
  config: any; 
  setConfig: (config: any) => void; 
  onSave: () => void;
  saving: boolean;
}) {
  return (
    <Card className="border-0 shadow-none">
      <CardHeader className="px-0 pt-0">
        <CardTitle>Feature Settings</CardTitle>
        <CardDescription>
          Enable or disable features across your platform.
        </CardDescription>
      </CardHeader>
      <CardContent className="px-0 space-y-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
            <div className="space-y-0.5">
              <Label className="text-base" htmlFor="enable_projects">Projects</Label>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Allow teachers to create and manage projects
              </p>
            </div>
            <Switch
              id="enable_projects"
              checked={config.enable_projects}
              onCheckedChange={(checked) => setConfig({ ...config, enable_projects: checked })}
            />
          </div>
          
          <div className="flex items-center justify-between p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
            <div className="space-y-0.5">
              <Label className="text-base" htmlFor="enable_donations">Donations</Label>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Enable donations functionality for projects
              </p>
            </div>
            <Switch
              id="enable_donations"
              checked={config.enable_donations}
              onCheckedChange={(checked) => setConfig({ ...config, enable_donations: checked })}
            />
          </div>
          
          <div className="flex items-center justify-between p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
            <div className="space-y-0.5">
              <Label className="text-base" htmlFor="enable_teacher_applications">Teacher Applications</Label>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Allow new teachers to apply for accounts
              </p>
            </div>
            <Switch
              id="enable_teacher_applications"
              checked={config.enable_teacher_applications}
              onCheckedChange={(checked) => setConfig({ ...config, enable_teacher_applications: checked })}
            />
          </div>
          
          <div className="flex items-center justify-between p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
            <div className="space-y-0.5">
              <Label className="text-base" htmlFor="enable_blog">Blog</Label>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Enable the platform blog for news and updates
              </p>
            </div>
            <Switch
              id="enable_blog"
              checked={config.enable_blog}
              onCheckedChange={(checked) => setConfig({ ...config, enable_blog: checked })}
            />
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-end px-0 pb-0">
        <Button 
          onClick={onSave} 
          disabled={saving}
          className="bg-gradient-to-r from-indigo-500 to-blue-500 hover:from-indigo-600 hover:to-blue-600"
        >
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save Features
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}

function AdvancedSettings({ 
  config, 
  setConfig, 
  onSave,
  saving 
}: { 
  config: any; 
  setConfig: (config: any) => void; 
  onSave: () => void;
  saving: boolean;
}) {
  return (
    <Card className="border-0 shadow-none">
      <CardHeader className="px-0 pt-0">
        <CardTitle>Advanced Settings</CardTitle>
        <CardDescription>
          Configure technical aspects of your platform.
        </CardDescription>
      </CardHeader>
      <CardContent className="px-0 space-y-6">
        <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-900/50 mb-6">
          <div className="flex items-start">
            <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-500 mt-0.5 mr-3 flex-shrink-0" />
            <p className="text-sm text-amber-800 dark:text-amber-400">
              These settings are for advanced users. Incorrect configuration may affect the functionality of your platform.
            </p>
          </div>
        </div>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="analytics_tracking_id">Analytics Tracking ID</Label>
            <Input
              id="analytics_tracking_id"
              value={config.analytics_tracking_id}
              onChange={(e) => setConfig({ ...config, analytics_tracking_id: e.target.value })}
              placeholder="UA-XXXXXXXXX-X or G-XXXXXXXXXX"
            />
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Enter your Google Analytics tracking ID to enable analytics.
            </p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="api_keys">API Keys (JSON format)</Label>
            <textarea
              id="api_keys"
              rows={4}
              className="w-full resize-none min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm font-mono ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              value={config.api_keys}
              onChange={(e) => setConfig({ ...config, api_keys: e.target.value })}
              placeholder='{"service_name": "key_value"}'
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="backup_frequency">Database Backup Frequency</Label>
              <select
                id="backup_frequency"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                value={config.backup_frequency}
                onChange={(e) => setConfig({ ...config, backup_frequency: e.target.value })}
                aria-label="Database Backup Frequency"
              >
                <option value="hourly">Hourly</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="max_file_upload_size">Max File Upload Size (MB)</Label>
              <Input
                id="max_file_upload_size"
                type="number"
                min="1"
                max="100"
                value={config.max_file_upload_size}
                onChange={(e) => setConfig({ ...config, max_file_upload_size: e.target.value })}
              />
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-end px-0 pb-0">
        <Button 
          onClick={onSave} 
          disabled={saving}
          className="bg-gradient-to-r from-indigo-500 to-blue-500 hover:from-indigo-600 hover:to-blue-600"
        >
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save Advanced Settings
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
} 