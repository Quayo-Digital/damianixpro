import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';

export type TotpEnrollmentInitResult =
  | {
      kind: 'enroll';
      factorId: string;
      qrCode: string;
      secret: string;
    }
  | { kind: 'already_verified' };

/**
 * Serializes TOTP enrollment so React Strict Mode / double effects cannot
 * POST /auth/v1/factors twice and get 422 from a duplicate unverified factor.
 */
let totpEnrollChain: Promise<unknown> = Promise.resolve();

function getTotpIssuer(): string {
  if (typeof window === 'undefined') return 'App';
  return window.location.hostname || 'App';
}

function newTotpFriendlyName(): string {
  if (typeof globalThis.crypto !== 'undefined' && 'randomUUID' in globalThis.crypto) {
    return `Authenticator (${globalThis.crypto.randomUUID().slice(0, 8)})`;
  }
  return `Authenticator (${Date.now().toString(36)})`;
}

async function listFactorsOrThrow(): Promise<
  NonNullable<Awaited<ReturnType<typeof supabase.auth.mfa.listFactors>>['data']>
> {
  const listed = await supabase.auth.mfa.listFactors();
  if (listed.error) throw listed.error;
  return listed.data ?? { totp: [], phone: [] };
}

async function unenrollUnverifiedFactors(): Promise<void> {
  const data = await listFactorsOrThrow();
  const stale = [
    ...(data.totp ?? []).filter((f) => f.status !== 'verified'),
    ...(data.phone ?? []).filter((f) => f.status !== 'verified'),
  ];
  for (const f of stale) {
    const { error } = await supabase.auth.mfa.unenroll({ factorId: f.id });
    if (error) logger.warn('MFA unenroll unverified factor', { factorId: f.id, error });
  }
}

async function enrollTotpOnce(): Promise<Extract<TotpEnrollmentInitResult, { kind: 'enroll' }>> {
  await unenrollUnverifiedFactors();

  const { data, error: enrollError } = await supabase.auth.mfa.enroll({
    factorType: 'totp',
    friendlyName: newTotpFriendlyName(),
    issuer: getTotpIssuer(),
  });

  if (enrollError) throw enrollError;
  if (!data?.id || !data.totp) {
    throw new Error('Unexpected MFA enroll response');
  }

  return {
    kind: 'enroll',
    factorId: data.id,
    qrCode: data.totp.qr_code ?? '',
    secret: data.totp.secret ?? '',
  };
}

function isRetriableEnrollError(e: unknown): boolean {
  const err = e as { status?: number; message?: string };
  const status = err.status;
  if (status === 422 || status === 409) return true;
  if (status === 500) return true;
  const msg = String(err.message ?? '').toLowerCase();
  return (
    msg.includes('already') ||
    msg.includes('duplicate') ||
    msg.includes('unprocessable') ||
    msg.includes('factor')
  );
}

/**
 * Starts TOTP enrollment (QR + secret). Safe under concurrent callers.
 */
export function prepareTotpEnrollment(): Promise<TotpEnrollmentInitResult> {
  const next = totpEnrollChain.then(async () => {
    const initial = await listFactorsOrThrow();
    if ((initial.totp ?? []).some((f) => f.status === 'verified')) {
      return { kind: 'already_verified' as const };
    }

    try {
      return await enrollTotpOnce();
    } catch (first) {
      if (!isRetriableEnrollError(first)) throw first;
      logger.warn('MFA enroll retry after cleanup', first);
      await unenrollUnverifiedFactors();

      const relisted = await listFactorsOrThrow();
      if ((relisted.totp ?? []).some((f) => f.status === 'verified')) {
        return { kind: 'already_verified' as const };
      }

      return await enrollTotpOnce();
    }
  });
  totpEnrollChain = next.then(
    () => undefined,
    () => undefined
  );
  return next;
}

export function formatMfaSetupError(e: unknown): string {
  const err = e as { status?: number; message?: string; code?: string };
  const base = err.message || 'Could not start MFA setup';
  if (err.status === 422 || err.status === 400) {
    return `${base} If this persists, confirm TOTP is enabled in Supabase → Authentication → Multi-factor, then try again.`;
  }
  if (err.status === 500) {
    return `${base} The auth server returned an error. Wait a moment and try again.`;
  }
  return base;
}
