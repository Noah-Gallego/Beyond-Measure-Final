import { createClient } from '@supabase/supabase-js';

// Check if we're in a browser environment
const isBrowser = typeof window !== 'undefined';

// Get environment variables or use empty strings
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Create a mock client when invalid credentials are provided
const isValidUrl = supabaseUrl && supabaseUrl !== 'your_supabase_url';

// Create the Supabase client
export const supabase = isValidUrl
  ? createClient(supabaseUrl, supabaseAnonKey)
  : createClient('https://demo.supabasedemo.co', 'demo-key-placeholder', {
      auth: {
        // Mock auth to prevent actual API calls
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    });

// Add fallback mock methods for development when no valid Supabase details provided
if (!isValidUrl) {
  // Mock the auth methods to return demo data
  const originalAuth = supabase.auth;
  supabase.auth = {
    ...originalAuth,
    // Mock sign in
    signInWithPassword: async () => {
      console.log('DEMO MODE: Using mock auth - real Supabase URL not configured');
      return {
        data: {
          user: {
            id: 'demo-user-id',
            email: 'demo@beyondmeasure.org',
            user_metadata: {
              name: 'Demo Teacher',
              role: 'teacher'
            }
          },
          session: {
            access_token: 'demo-token',
            refresh_token: 'demo-refresh-token',
            user: {
              id: 'demo-user-id',
              email: 'demo@beyondmeasure.org',
              user_metadata: {
                name: 'Demo Teacher',
                role: 'teacher'
              }
            }
          }
        },
        error: null
      };
    },
    // Mock sign out
    signOut: async () => {
      console.log('DEMO MODE: Signed out');
      return { error: null };
    },
    // Mock session retrieval
    getSession: async () => {
      console.log('DEMO MODE: Getting session');
      return {
        data: {
          session: {
            access_token: 'demo-token',
            refresh_token: 'demo-refresh-token',
            user: {
              id: 'demo-user-id',
              email: 'demo@beyondmeasure.org',
              user_metadata: {
                name: 'Demo Teacher',
                role: 'teacher'
              }
            }
          }
        },
        error: null
      };
    },
    // Mock auth state change
    onAuthStateChange: (callback) => {
      console.log('DEMO MODE: Auth state change');
      // Simulate an auth state change
      setTimeout(() => {
        callback('SIGNED_IN', {
          user: {
            id: 'demo-user-id',
            email: 'demo@beyondmeasure.org',
            user_metadata: {
              name: 'Demo Teacher',
              role: 'teacher'
            }
          }
        });
      }, 100);
      
      return { 
        data: { 
          subscription: { 
            unsubscribe: () => {} 
          } 
        } 
      };
    }
  };

  // Mock the database methods to return demo data
  const originalFrom = supabase.from;
  supabase.from = (table) => {
    console.log(`DEMO MODE: Querying table ${table}`);
    
    const mockProjects = [
      {
        id: 'project-1',
        title: 'Classroom Library Expansion',
        description: 'Help us expand our classroom library with diverse books that represent all students.',
        subject: 'Reading',
        funding_goal: 500,
        funded_amount: 350,
        user_id: 'demo-user-id',
        created_at: new Date().toISOString()
      },
      {
        id: 'project-2',
        title: 'Science Lab Equipment',
        description: 'We need new microscopes for our science lab to engage students in hands-on learning.',
        subject: 'Science',
        funding_goal: 1200,
        funded_amount: 600,
        user_id: 'demo-user-id',
        created_at: new Date(Date.now() - 86400000).toISOString()
      },
      {
        id: 'project-3',
        title: 'Math Manipulatives',
        description: 'Math manipulatives help students understand abstract concepts through concrete models.',
        subject: 'Math',
        funding_goal: 300,
        funded_amount: 300,
        user_id: 'other-user-id',
        created_at: new Date(Date.now() - 172800000).toISOString()
      }
    ];
    
    return {
      ...originalFrom(table),
      select: () => ({
        eq: (field, value) => ({
          order: (column, { ascending }) => ({
            data: mockProjects.filter(p => p[field] === value)
              .sort((a, b) => ascending 
                ? new Date(a[column]).getTime() - new Date(b[column]).getTime()
                : new Date(b[column]).getTime() - new Date(a[column]).getTime()),
            error: null
          })
        }),
        order: (column, { ascending }) => ({
          data: mockProjects.sort((a, b) => ascending 
            ? new Date(a[column]).getTime() - new Date(b[column]).getTime()
            : new Date(b[column]).getTime() - new Date(a[column]).getTime()),
          error: null
        })
      })
    };
  };
} 