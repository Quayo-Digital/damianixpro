/**
 * User-facing copy for Supabase Auth signup failures (e.g. HTTP 422 validation).
 */
export function formatSupabaseAuthSignUpError(error: unknown): string {
  const e = error as { message?: string; status?: number; code?: string };
  const msg = String(e.message ?? '').trim();
  const status = e.status;

  if (status === 422 || /422/.test(msg)) {
    if (/password/i.test(msg) && /(short|weak|least|characters|6|8)/i.test(msg)) {
      return 'Password does not meet the minimum requirements. Use a stronger password.';
    }
    if (/already|registered|exists|duplicate/i.test(msg)) {
      return 'An account with this email already exists. Try signing in instead.';
    }
    if (/email|invalid|format/i.test(msg)) {
      return 'Please enter a valid email address.';
    }
    return msg || 'Invalid signup. Check your email and password.';
  }

  return msg || 'Failed to sign up';
}

/**
 * User-facing copy for Supabase Auth password sign-in failures (often HTTP 400).
 */
export function formatSupabaseAuthSignInError(error: unknown): string {
  const e = error as { message?: string; status?: number; code?: string };
  const msg = String(e.message ?? '').trim();
  const lower = msg.toLowerCase();
  const status = e.status;

  if (status === 400 || /400/.test(msg)) {
    if (/invalid login|invalid credentials|wrong password|email or password/i.test(msg)) {
      return 'Incorrect email or password. Reset your password if you forgot it.';
    }
    if (/email not confirmed|confirm your email|verify your email/i.test(msg)) {
      return 'Confirm your email before signing in. Check your inbox or request a new link from the sign-up flow.';
    }
    if (/user (not found|does not exist)|no user/i.test(msg)) {
      return 'No account found for this email. Sign up first or check the address.';
    }
  }

  if (e.code === 'email_not_confirmed' || lower.includes('email not confirmed')) {
    return 'Confirm your email before signing in.';
  }

  if (e.code === 'invalid_credentials' || lower.includes('invalid login credentials')) {
    return 'Incorrect email or password.';
  }

  return msg || 'Could not sign in. Check your details and try again.';
}

/**
 * Hint when `property_tenants` is missing from PostgREST (404). In-memory is fast; sessionStorage
 * survives full page reload so we do not repeat the same failing request every refresh.
 * TTL re-checks periodically so a later migration can be picked up without manual storage clears.
 */
const PROPERTY_TENANTS_MISSING_UNTIL_KEY = 'nh_property_tenants_missing_until';
const PROPERTY_TENANTS_MISSING_TTL_MS = 24 * 60 * 60 * 1000;

let propertyTenantsRelationMissing = false;

function safeGetMissingUntil(): number | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(PROPERTY_TENANTS_MISSING_UNTIL_KEY);
    if (!raw) return null;
    const n = parseInt(raw, 10);
    return Number.isFinite(n) ? n : null;
  } catch {
    return null;
  }
}

function safeSetMissingUntil(until: number): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(PROPERTY_TENANTS_MISSING_UNTIL_KEY, String(until));
  } catch {
    /* quota / private mode */
  }
}

function safeRemoveMissingUntil(): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.removeItem(PROPERTY_TENANTS_MISSING_UNTIL_KEY);
  } catch {
    /* ignore */
  }
}

export function isPropertyTenantsRelationMissing(): boolean {
  const until = safeGetMissingUntil();
  if (until != null && Date.now() >= until) {
    propertyTenantsRelationMissing = false;
    safeRemoveMissingUntil();
  }
  if (propertyTenantsRelationMissing) return true;
  const active = safeGetMissingUntil();
  return active != null && Date.now() < active;
}

/** Mark after a failed property_tenants query when the table is not deployed (reduces 404 spam). */
export function markPropertyTenantsRelationMissing(): void {
  propertyTenantsRelationMissing = true;
  safeSetMissingUntil(Date.now() + PROPERTY_TENANTS_MISSING_TTL_MS);
}

/** After migrations or when any property_tenants query succeeds (table exists). */
export function clearPropertyTenantsRelationMissingCache(): void {
  propertyTenantsRelationMissing = false;
  safeRemoveMissingUntil();
}

/**
 * Detect PostgREST / Supabase errors when a relation is missing or not exposed (404 / schema cache).
 * Avoid treating these as application bugs or spamming ERROR logs in dev when migrations are pending.
 */
export function isMissingSupabaseRelationError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const e = error as {
    code?: string;
    message?: string;
    details?: string;
    hint?: string;
    status?: number;
  };
  const code = String(e.code ?? '');
  const msg = String(e.message ?? e.details ?? e.hint ?? '').toLowerCase();
  // PostgREST returns HTTP 404 when the table is not in the schema cache / not exposed to REST.
  if (e.status === 404) return true;
  return (
    code === '42P01' ||
    code === 'PGRST205' ||
    code === 'PGRST301' ||
    msg.includes('schema cache') ||
    (msg.includes('could not find') && msg.includes('table')) ||
    (msg.includes('relation') && msg.includes('does not exist')) ||
    (msg.includes('not found') && (msg.includes('table') || msg.includes('relation')))
  );
}
