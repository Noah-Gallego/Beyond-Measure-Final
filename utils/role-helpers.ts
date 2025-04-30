import { supabase } from './supabase';
import { User } from '@supabase/supabase-js';

/**
 * Get the user's role from both auth metadata and database
 * This ensures we have the correct role even if auth metadata is not updated
 */
export async function getUserRole(user: User | null): Promise<string> {
  if (!user) return 'anonymous';
  
  // First check auth metadata (fastest)
  const metadataRole = user.user_metadata?.role?.toLowerCase();
  
  // Then check the database to ensure we have the most up-to-date role
  try {
    const { data, error } = await supabase
      .from('users')
      .select('role')
      .eq('auth_id', user.id)
      .single();
    
    if (error) {
      console.error('Error fetching user role from database:', error);
      // Fallback to metadata role
      return metadataRole || 'donor';
    }
    
    if (data?.role) {
      // If database role exists but differs from metadata, we should sync them
      if (metadataRole && metadataRole !== data.role.toLowerCase()) {
        console.warn(`Role mismatch: metadata=${metadataRole}, database=${data.role}`);
        // Use the database role as the source of truth
      }
      
      return data.role.toLowerCase();
    }
  } catch (error) {
    console.error('Error in getUserRole:', error);
  }
  
  // Default fallback to metadata or 'donor' if nothing else works
  return metadataRole || 'donor';
}

/**
 * Check if a user has a donor profile in the database
 */
export async function hasDonorProfile(userId: string): Promise<boolean> {
  if (!userId) return false;
  
  try {
    // First check if we have a donor profile directly
    const { data: donorProfile, error: donorError } = await supabase
      .from('donor_profiles')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();
    
    if (donorProfile) return true;
    
    // If no direct match, try finding through the users table
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('auth_id', userId)
      .maybeSingle();
    
    if (userData) {
      const { data: donorByUserData } = await supabase
        .from('donor_profiles')
        .select('id')
        .eq('user_id', userData.id)
        .maybeSingle();
      
      if (donorByUserData) return true;
    }
    
    // No donor profile found
    return false;
  } catch (error) {
    console.error('Error checking donor profile:', error);
    return false;
  }
} 