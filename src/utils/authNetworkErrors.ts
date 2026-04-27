/**
 * Maps low-level browser fetch failures (QUIC / HTTP3, offline, corporate proxies)
 * to user-facing guidance. Supabase auth uses the same fetch stack as the rest of the app.
 */
export function getAuthNetworkFailureMessage(error: unknown): string | null {
  const err = error as { message?: string; cause?: unknown };
  const msg = String(err?.message ?? error ?? '');
  const causeMsg =
    err?.cause && typeof err.cause === 'object' && 'message' in err.cause
      ? String((err.cause as { message?: string }).message)
      : '';
  const combined = `${msg} ${causeMsg}`.toLowerCase();

  const isFailedFetch =
    error instanceof TypeError &&
    (msg.includes('Failed to fetch') || msg.includes('fetch') || msg.includes('Load failed'));

  if (combined.includes('quic') || combined.includes('err_quic')) {
    return (
      'Sign-in could not complete: HTTP/3 (QUIC) failed between your browser and Supabase. ' +
      'Try another network, turn VPN off/on, use a different browser, or disable QUIC ' +
      '(Chrome: chrome://flags → search “QUIC” → Disabled) then reload and sign in again.'
    );
  }

  if (isFailedFetch || combined.includes('network') || combined.includes('load failed')) {
    return (
      'Could not reach the authentication service. Check your internet connection, VPN, ' +
      'firewall, or try again from mobile data. If it persists, disable HTTP/3 (QUIC) in your browser.'
    );
  }

  return null;
}
