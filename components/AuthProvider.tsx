'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../utils/supabase';
import { Session, User } from '@supabase/supabase-js';

type AuthContextType = {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    // Initial session check
    const getInitialSession = async () => {
      try {
        // Add a timeout for the initial session check
        const sessionPromise = supabase.auth.getSession();
        
        // Create a timeout promise
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => {
            reject(new Error('Session check timed out'));
          }, 5000); // 5 seconds timeout
        });
        
        // Race between the session check and the timeout
        const { data } = await Promise.race([
          sessionPromise,
          timeoutPromise,
        ]) as any;
        
        if (isMounted) {
          setSession(data?.session);
          setUser(data?.session?.user ?? null);
          console.log("Auth session check complete:", !!data?.session);
        }
      } catch (error) {
        console.error('Error checking auth session:', error);
        // Reset loading state even on error
        if (isMounted) {
          setIsLoading(false);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    getInitialSession();

    // Listen for auth changes with error handling
    try {
      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        if (isMounted) {
          console.log("Auth state changed:", !!session);
          setSession(session);
          setUser(session?.user ?? null);
          setIsLoading(false);
        }
      });

      return () => {
        isMounted = false;
        subscription?.unsubscribe();
      };
    } catch (error) {
      console.error('Error setting up auth listener:', error);
      setIsLoading(false);
      return () => {
        isMounted = false;
      };
    }
  }, []);

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      
      // Redirect to home page after sign out
      if (typeof window !== 'undefined') {
        window.location.href = '/';
      }
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const value = {
    user,
    session,
    isLoading,
    signOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook to use auth in components
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 