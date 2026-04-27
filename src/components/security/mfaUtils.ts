/** Minimal factor shape from `supabase.auth.mfa.listFactors()`. */
export type MfaFactorRow = {
  id: string;
  status: 'verified' | 'unverified';
  factor_type: 'totp' | 'phone';
  friendly_name?: string;
  phone?: string;
};

export function pickVerifiedMfaFactor(factors: {
  totp: MfaFactorRow[];
  phone: MfaFactorRow[];
}): MfaFactorRow | null {
  const totp = factors.totp.find((f) => f.status === 'verified');
  if (totp) return totp;
  return factors.phone.find((f) => f.status === 'verified') ?? null;
}

export function qrCodeToImgSrc(qr: string): string {
  if (!qr) return '';
  if (qr.startsWith('data:') || qr.startsWith('http')) return qr;
  if (qr.trimStart().startsWith('<svg')) {
    return `data:image/svg+xml;utf8,${encodeURIComponent(qr)}`;
  }
  return qr;
}
