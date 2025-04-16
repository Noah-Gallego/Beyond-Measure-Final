import { User } from '@supabase/supabase-js';

/**
 * Determines the appropriate dashboard URL based on the user's role
 * @param user Supabase user object
 * @returns Dashboard URL for the specific user role
 */
export function getDashboardUrlByRole(user: User | null): string {
  if (!user) return '/';
  
  // Get the user role from metadata
  const role = user.user_metadata?.role?.toLowerCase() || 'donor';
  
  // Return the appropriate dashboard URL based on role
  switch (role) {
    case 'teacher':
      return '/teacher/dashboard';
    case 'admin':
      return '/admin/dashboard';
    case 'donor':
    default:
      return '/dashboard';
  }
}

/**
 * Formats a user's display name
 * @param user Supabase user object
 * @returns Formatted name string
 */
export function formatUserName(user: User | null): string {
  if (!user) return 'User';
  
  // Try to get first and last name from metadata
  const firstName = user.user_metadata?.first_name || '';
  const lastName = user.user_metadata?.last_name || '';
  
  if (firstName && lastName) {
    return `${firstName} ${lastName}`;
  } else if (firstName) {
    return firstName;
  } else if (user.email) {
    // If no name is available, use the part of the email before the @
    return user.email.split('@')[0];
  } else {
    return 'User';
  }
} 