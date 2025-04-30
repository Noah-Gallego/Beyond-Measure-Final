import { createClient as createSupabaseClient } from '@supabase/supabase-js';

// Make sure we're using string literals or environment variables
// that are definitely accessible in the browser
const supabaseUrl = 'https://efneocmdolkzdfhtqkpl.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVmbmVvY21kb2xremRmaHRxa3BsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE3Mjc3NzcsImV4cCI6MjA1NzMwMzc3N30.I59hRNWS56rlavD6W91tFnUjv3qqFt4h7qR6yZyxS54';

// Set up robust error handling and better persistence
const supabaseOptions = {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    storageKey: 'beyond-measure-auth',
    detectSessionInUrl: true,
  },
  global: {
    // Add custom error handlers
    fetch: (...args: Parameters<typeof fetch>) => fetch(...args).catch(err => {
      console.error('Network error when connecting to Supabase:', err);
      throw err;
    })
  },
  // Force longer timeouts
  realtime: {
    timeout: 60000
  }
};

export const createClient = () => {
  return createSupabaseClient(supabaseUrl, supabaseAnonKey, supabaseOptions);
}; 