import type { Location, NavigateFunction } from 'react-router-dom';
import type { UserRole } from '@/contexts/auth/types';

/** sessionStorage key for OAuth / flows that lose React Router location state */
export const AUTH_RETURN_TO_STORAGE_KEY = 'authReturnTo';

export type SerializedLocation = Pick<Location, 'pathname' | 'search' | 'hash'>;

/** Roles that may access `/properties` and `/properties/:id` (see App.routes ProtectedRoute). */
const PROPERTY_MANAGEMENT_ROLES: UserRole[] = ['owner', 'agent', 'manager', 'admin', 'super_admin'];

export function canAccessPropertyManagementRoutes(userRole: UserRole | null | undefined): boolean {
  if (!userRole) return false;
  return PROPERTY_MANAGEMENT_ROLES.includes(userRole);
}

export function isSafeInternalPath(pathname: string): boolean {
  return pathname.startsWith('/') && !pathname.startsWith('//') && !pathname.includes('://');
}

/**
 * Owner/agent property management URLs — tenants (and vendors) should not be sent here after auth.
 * Public browse URLs use /public/properties/:id.
 */
export function isProtectedPropertyManagementPath(pathname: string): boolean {
  return pathname.startsWith('/properties/') && !pathname.startsWith('/public/properties/');
}

/**
 * Default home route per role (sidebar, post-auth fallbacks, 404).
 */
export function getDefaultDashboardPathForRole(userRole: UserRole | null | undefined): string {
  if (!userRole) return '/dashboard';
  switch (userRole) {
    case 'tenant':
      return '/tenant/dashboard';
    case 'super_admin':
    case 'admin':
      return '/admin/dashboard';
    case 'owner':
      return '/owner/dashboard';
    case 'agent':
    case 'manager':
      return '/agent/dashboard';
    case 'vendor':
      return '/vendor/dashboard';
    default:
      return '/dashboard';
  }
}

export function serializeLocation(loc: Location | SerializedLocation): SerializedLocation {
  return {
    pathname: loc.pathname,
    search: loc.search ?? '',
    hash: loc.hash ?? '',
  };
}

/** Merge query param into a location's search (e.g. apply=1 after sign-in). */
export function withSearchParam(loc: Location, key: string, value: string): SerializedLocation {
  const params = new URLSearchParams(loc.search.replace(/^\?/, ''));
  params.set(key, value);
  const qs = params.toString();
  return {
    pathname: loc.pathname,
    search: qs ? `?${qs}` : '',
    hash: loc.hash ?? '',
  };
}

/**
 * Where to go after login when `location.state.from` is set.
 * Property management URLs are only returned for roles that may access them.
 */
export function getPostLoginRedirect(
  fromState: Location | SerializedLocation | undefined,
  userRole?: UserRole | null
): SerializedLocation | '/dashboard' {
  if (!fromState || !isSafeInternalPath(fromState.pathname)) {
    return '/dashboard';
  }
  if (isProtectedPropertyManagementPath(fromState.pathname)) {
    if (!canAccessPropertyManagementRoutes(userRole)) {
      return '/dashboard';
    }
  }
  return serializeLocation(fromState as Location);
}

export function persistAuthReturnTo(loc: Location | SerializedLocation | null | undefined): void {
  if (!loc || !isSafeInternalPath(loc.pathname)) return;
  try {
    sessionStorage.setItem(AUTH_RETURN_TO_STORAGE_KEY, JSON.stringify(serializeLocation(loc)));
  } catch {
    // ignore quota / private mode
  }
}

export function consumeAuthReturnTo(): SerializedLocation | null {
  try {
    const raw = sessionStorage.getItem(AUTH_RETURN_TO_STORAGE_KEY);
    if (!raw) return null;
    sessionStorage.removeItem(AUTH_RETURN_TO_STORAGE_KEY);
    const parsed = JSON.parse(raw) as SerializedLocation;
    if (!parsed?.pathname || !isSafeInternalPath(parsed.pathname)) return null;
    return {
      pathname: parsed.pathname,
      search: typeof parsed.search === 'string' ? parsed.search : '',
      hash: typeof parsed.hash === 'string' ? parsed.hash : '',
    };
  } catch {
    return null;
  }
}

/** Read stored return URL without removing (e.g. to decide whether to clear). */
export function peekAuthReturnTo(): SerializedLocation | null {
  try {
    const raw = sessionStorage.getItem(AUTH_RETURN_TO_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SerializedLocation;
    if (!parsed?.pathname || !isSafeInternalPath(parsed.pathname)) return null;
    return {
      pathname: parsed.pathname,
      search: typeof parsed.search === 'string' ? parsed.search : '',
      hash: typeof parsed.hash === 'string' ? parsed.hash : '',
    };
  } catch {
    return null;
  }
}

export function clearAuthReturnTo(): void {
  try {
    sessionStorage.removeItem(AUTH_RETURN_TO_STORAGE_KEY);
  } catch {
    // ignore
  }
}

export function navigateToPostLoginTarget(
  navigate: NavigateFunction,
  target: SerializedLocation | '/dashboard',
  options?: { replace?: boolean }
): void {
  const navOpts = options?.replace ? { replace: true } : undefined;
  if (target === '/dashboard') {
    navigate('/dashboard', navOpts);
    return;
  }
  navigate(
    {
      pathname: target.pathname,
      search: target.search,
      hash: target.hash,
    },
    navOpts
  );
}

/**
 * After successful sign-in: prefer `location.state.from`, else sessionStorage (signup refresh).
 * Only call when authentication succeeded so a failed login attempt does not consume the stored URL.
 */
export function completePostAuthRedirect(
  navigate: NavigateFunction,
  location: Pick<Location, 'state'>,
  userRole: UserRole | null | undefined,
  options?: { replace?: boolean }
): void {
  const fromState = location.state?.from as Location | undefined;
  if (fromState && isSafeInternalPath(fromState.pathname)) {
    clearAuthReturnTo();
    navigateToPostLoginTarget(
      navigate,
      getPostLoginRedirect(serializeLocation(fromState), userRole),
      options
    );
    return;
  }
  const stored = consumeAuthReturnTo();
  navigateToPostLoginTarget(navigate, getPostLoginRedirect(stored ?? undefined, userRole), options);
}
