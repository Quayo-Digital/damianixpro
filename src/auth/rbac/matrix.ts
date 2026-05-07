import type { UserRole } from '@/contexts/auth/types';
import raw from '../../../config/rbac-permission-matrix.json';

type MatrixFile = {
  version: number;
  roles: Record<string, string[]>;
};

const matrix = raw as MatrixFile;

function collectAllPermissions(): readonly string[] {
  const set = new Set<string>();
  for (const list of Object.values(matrix.roles)) {
    for (const p of list) {
      if (p !== '*') set.add(p);
    }
  }
  return Object.freeze([...set].sort());
}

/** Every concrete permission id (excludes wildcard `*`). */
export const ALL_PERMISSIONS = collectAllPermissions();
export type Permission = (typeof ALL_PERMISSIONS)[number];

const ALL_SET = new Set<string>(ALL_PERMISSIONS);

function expandWildcards(perms: readonly string[]): Set<string> {
  if (perms.includes('*')) return new Set(ALL_SET);
  return new Set(perms);
}

/**
 * Effective permission set for a single app role (one row in `user_roles` today).
 * `super_admin` and any role listing `*` receive the full catalog.
 */
export function getPermissionsForRole(role: UserRole | null | undefined): Set<Permission> {
  if (!role) return new Set();
  if (role === 'super_admin') return new Set(ALL_SET as Iterable<Permission>);
  const row = matrix.roles[role];
  if (!row) return new Set();
  return expandWildcards(row) as Set<Permission>;
}

export function roleHasPermission(
  role: UserRole | null | undefined,
  permission: Permission | string
): boolean {
  return getPermissionsForRole(role).has(String(permission));
}

export function roleHasAnyPermission(
  role: UserRole | null | undefined,
  permissions: readonly (Permission | string)[]
): boolean {
  const mine = getPermissionsForRole(role);
  return permissions.some((p) => mine.has(String(p)));
}

export function roleHasAllPermissions(
  role: UserRole | null | undefined,
  permissions: readonly (Permission | string)[]
): boolean {
  const mine = getPermissionsForRole(role);
  return permissions.every((p) => mine.has(String(p)));
}
