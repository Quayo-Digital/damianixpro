function getStatus(err: unknown): number | null {
  if (!err || typeof err !== 'object') return null;
  const anyErr = err as { status?: unknown; response?: { status?: unknown } };
  const s = anyErr.status ?? anyErr.response?.status;
  const n = typeof s === 'number' ? s : Number(s);
  return Number.isFinite(n) ? n : null;
}

function isNetworkLikeError(err: unknown): boolean {
  const msg =
    err instanceof Error ? err.message : typeof err === 'string' ? err : JSON.stringify(err);
  const m = String(msg || '').toLowerCase();
  return (
    m.includes('failed to fetch') ||
    m.includes('networkerror') ||
    m.includes('load failed') ||
    m.includes('err_connection') ||
    m.includes('timeout') ||
    m.includes('econnreset')
  );
}

export function defaultShouldRetry(failureCount: number, err: unknown): boolean {
  const status = getStatus(err);
  if (status == null) {
    // Supabase/postgrest can omit status in some thrown shapes; still retry once on likely network.
    return isNetworkLikeError(err) && failureCount <= 2;
  }

  // Never retry auth / validation / permission errors.
  if (status === 400 || status === 401 || status === 403 || status === 404) return false;

  // Retry on timeouts / throttling / server errors.
  if (status === 408 || status === 409 || status === 425 || status === 429)
    return failureCount <= 2;
  if (status >= 500) return failureCount <= 2;

  return false;
}

export function defaultRetryDelay(attemptIndex: number): number {
  // Exponential backoff with jitter, capped.
  const base = Math.min(1000 * 2 ** attemptIndex, 15_000);
  const jitter = Math.floor(Math.random() * 250);
  return base + jitter;
}
