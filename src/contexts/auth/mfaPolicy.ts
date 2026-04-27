import type { UserRole } from './types';

/**
 * Accounts that must use MFA (TOTP or phone factor) before accessing the app.
 * Platform admins, property owners, and managers handle sensitive operations and payouts.
 */
export const MFA_REQUIRED_ROLES: readonly UserRole[] = [
  'super_admin',
  'admin',
  'manager',
  'owner',
] as const;

export function roleRequiresMfa(role: UserRole | null): boolean {
  if (!role) return false;
  return (MFA_REQUIRED_ROLES as readonly string[]).includes(role);
}
