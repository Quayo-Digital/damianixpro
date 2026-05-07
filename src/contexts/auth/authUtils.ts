import { supabase } from '@/integrations/supabase/client';
import { UserRole } from './types';
import { logger } from '@/utils/logger';

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

// Supabase unavailable (503), table missing (404), or network - return null, avoid error spam
const SUPABASE_UNAVAILABLE_PATTERNS = [
  'Service Unavailable',
  '503',
  '404',
  'Not Found',
  'not found',
  'relation',
  'does not exist',
  'PGRST116',
  'PGRST301',
  'fetch',
  'network',
  'Failed to fetch',
  'internet connection',
];

function isSupabaseUnavailable(error: { message?: string; code?: string } | null): boolean {
  if (!error) return false;
  const msg = String(error.message ?? '').toLowerCase();
  const code = String(error.code ?? '');
  return SUPABASE_UNAVAILABLE_PATTERNS.some(
    (p) => msg.includes(p.toLowerCase()) || code.includes(p)
  );
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
      if (isSupabaseUnavailable(error)) {
        logger.debug('Supabase unavailable or user_roles inaccessible', { message: error.message });
        return null;
      }
      logger.warn('Error fetching user role', { message: error.message });
      return null;
    }

    return (data?.role as UserRole) || null;
  } catch (error) {
    if (error instanceof Error && isSupabaseUnavailable(error)) {
      logger.debug('Supabase unavailable', { message: error.message });
      return null;
    }
    logger.warn('Error in fetchUserRoleFromDb', error);
    return null;
  }
}

// Store user role in database - never throws; fails silently when Supabase is down
export async function storeUserRole(userId: string, role: UserRole): Promise<void> {
  try {
    const { error } = await supabase.from('user_roles').upsert(
      {
        user_id: userId,
        role: role as any,
      },
      { onConflict: 'user_id' }
    );

    if (error) {
      logger.debug('Could not store user role (Supabase may be unavailable)', {
        message: error.message,
        code: error.code,
      });
      return;
    }
  } catch (error) {
    logger.debug('Could not store user role (Supabase may be unavailable)', {
      message: error instanceof Error ? error.message : String(error),
    });
  }
}

// Validate if the provided role is a valid UserRole
const USER_ROLE_VALUES: readonly UserRole[] = [
  'super_admin',
  'admin',
  'owner',
  'agent',
  'tenant',
  'vendor',
  'user',
  'manager',
  'accountant',
  'facility_manager',
] as const;

export function isValidUserRole(role: string): role is UserRole {
  return (USER_ROLE_VALUES as readonly string[]).includes(role);
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
export function checkIsAccountant(role: UserRole | null): boolean {
  return role === 'accountant';
}
export function checkIsFacilityManager(role: UserRole | null): boolean {
  return role === 'facility_manager';
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
    case 'facility_manager':
      return 'Facility Manager';
    case 'accountant':
      return 'Accountant';
    case 'user':
      return 'User';
    default:
      return 'Guest';
  }
}
