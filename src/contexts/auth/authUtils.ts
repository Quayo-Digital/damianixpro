import { supabase } from '@/integrations/supabase/client';
import { UserRole } from './types';

// Get user display name from profile data
export function getUserDisplayName(user: any): string {
  if (!user) return 'Guest';
  
  if (user.user_metadata?.full_name) {
    return user.user_metadata.full_name;
  }
  
  return user.email ? user.email.split('@')[0] : 'User';
}

// Get user initials for avatar
export function getUserInitials(user: any): string {
  if (!user) return 'G';
  
  if (user.user_metadata?.full_name) {
    const nameParts = user.user_metadata.full_name.split(' ');
    if (nameParts.length >= 2) {
      return `${nameParts[0][0]}${nameParts[1][0]}`.toUpperCase();
    }
    return nameParts[0][0].toUpperCase();
  }
  
  return user.email ? user.email[0].toUpperCase() : 'U';
}

// Format phone number for consistency
export function formatPhoneNumber(phone: string): string {
  // Remove all non-numeric characters
  const cleaned = phone.replace(/\D/g, '');
  
  // Ensure it starts with country code
  if (!cleaned.startsWith('234') && cleaned.startsWith('0')) {
    return '234' + cleaned.substring(1);
  } else if (!cleaned.startsWith('234') && !cleaned.startsWith('0')) {
    return '234' + cleaned;
  }
  
  return cleaned;
}

// Fetch user role from database
export async function fetchUserRoleFromDb(userId: string): Promise<UserRole | null> {
  try {
    const { data, error } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .maybeSingle();
      
    if (error) {
      // Handle specific error cases
      if (error.code === 'PGRST116' || error.message?.includes('relation') || error.message?.includes('does not exist')) {
        console.warn('user_roles table may not exist or is not accessible:', error.message);
        return null;
      }
      
      // Network errors
      if (error.message?.includes('fetch') || error.message?.includes('network') || error.message?.includes('Failed to fetch')) {
        console.error('Network error fetching user role:', error.message);
        throw new Error('Network error: Unable to connect to database. Please check your internet connection.');
      }
      
      console.error('Error fetching user role:', error);
      return null;
    }
    
    // maybeSingle() returns null if no rows found, which is expected for new users
    return data?.role as UserRole || null;
  } catch (error) {
    // Re-throw network errors so they can be handled upstream
    if (error instanceof Error && (error.message.includes('fetch') || error.message.includes('network'))) {
      throw error;
    }
    console.error('Error in fetchUserRoleFromDb:', error);
    return null;
  }
}

// Store user role in database
export async function storeUserRole(userId: string, role: UserRole): Promise<void> {
  try {
    // Use type assertion to handle the role type issue
    const { error } = await supabase
      .from('user_roles')
      .upsert({ 
        user_id: userId, 
        role: role as any
      }, { 
        onConflict: 'user_id' 
      });
      
    if (error) {
      throw error;
    }
  } catch (error) {
    console.error('Error storing user role:', error);
    throw error;
  }
}

// Validate if the provided role is a valid UserRole
export function isValidUserRole(role: string): role is UserRole {
  return [
    'super_admin', 'admin', 'owner', 'agent', 'tenant', 'vendor', 'user', 'manager'
  ].includes(role as UserRole);
}

// Role helpers
export function checkIsSuperAdmin(role: UserRole | null): boolean {
  return role === 'super_admin';
}
export function checkIsAdmin(role: UserRole | null): boolean {
  // super_admin should be considered as admin everywhere
  return role === 'super_admin' || role === 'admin';
}
export function checkIsOwner(role: UserRole | null): boolean {
  return role === 'owner';
}
export function checkIsAgent(role: UserRole | null): boolean {
  return role === 'agent';
}
export function checkIsTenant(role: UserRole | null): boolean {
  return role === 'tenant';
}
export function checkIsVendor(role: UserRole | null): boolean {
  return role === 'vendor';
}
export function checkIsManager(role: UserRole | null): boolean {
  return role === 'manager';
}

// Get display name for role
export function getRoleDisplay(role: UserRole | null): string {
  switch (role) {
    case 'super_admin':
      return 'Super Admin';
    case 'admin':
      return 'Administrator';
    case 'owner':
      return 'Property Owner';
    case 'agent':
      return 'Property Agent';
    case 'tenant':
      return 'Tenant';
    case 'vendor':
      return 'Service Provider';
    case 'manager':
      return 'Property Manager';
    case 'user':
      return 'User';
    default:
      return 'Guest';
  }
}
