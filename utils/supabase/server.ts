import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

// Make sure we're using string literals or environment variables
// that are definitely accessible in the browser
const supabaseUrl = 'https://efneocmdolkzdfhtqkpl.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVmbmVvY21kb2xremRmaHRxa3BsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE3Mjc3NzcsImV4cCI6MjA1NzMwMzc3N30.I59hRNWS56rlavD6W91tFnUjv3qqFt4h7qR6yZyxS54';

export const createClient = async () => {
  const cookieStore = await cookies();
  
  return createSupabaseClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options: any) {
            // This is a server component, we don't set cookies here
          },
          remove(name: string, options: any) {
            // This is a server component, we don't remove cookies here
          },
        },
      },
    }
  );
}; 