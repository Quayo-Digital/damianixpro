/**
 * Client-side rate limiting for sensitive operations (login, signup, password reset, etc.)
 */

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

/** Default: 5 attempts per 15 minutes for auth-related actions */
const DEFAULT_LIMIT = 5;
const DEFAULT_WINDOW_MS = 15 * 60 * 1000;

/**
 * Check if an action is rate-limited. Returns true if allowed, false if throttled.
 * Call before performing sensitive operations.
 */
export function checkRateLimit(
  key: string,
  options: { limit?: number; windowMs?: number } = {}
): { allowed: boolean; remaining: number; retryAfterMs?: number } {
  const { limit = DEFAULT_LIMIT, windowMs = DEFAULT_WINDOW_MS } = options;
  const now = Date.now();
  let bucket = buckets.get(key);

  if (!bucket || now >= bucket.resetAt) {
    bucket = { count: 0, resetAt: now + windowMs };
    buckets.set(key, bucket);
  }

  bucket.count += 1;
  const remaining = Math.max(0, limit - bucket.count);
  const allowed = bucket.count <= limit;

  return {
    allowed,
    remaining,
    retryAfterMs: allowed ? undefined : bucket.resetAt - now,
  };
}

/**
 * Reset rate limit for a key (e.g., after successful login).
 */
export function resetRateLimit(key: string): void {
  buckets.delete(key);
}

/**
 * Build a rate-limit key for a given action and identifier (e.g., email, IP).
 */
export function rateLimitKey(action: string, identifier: string): string {
  return `ratelimit:${action}:${identifier.toLowerCase().trim()}`;
}
