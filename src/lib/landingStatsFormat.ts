/** Compact Naira label for hero stats (no decimals for huge round billions when appropriate). */
export function formatCompactNGN(n: number): string {
  const x = Number(n);
  if (!Number.isFinite(x) || x <= 0) return '₦0';

  const abs = Math.abs(x);
  if (abs >= 1e9) {
    const v = abs / 1e9;
    const decimals = v >= 100 ? 0 : v >= 10 ? 1 : 2;
    return `₦${v.toFixed(decimals)}B`;
  }
  if (abs >= 1e6) {
    const v = abs / 1e6;
    const decimals = v >= 100 ? 0 : 1;
    return `₦${v.toFixed(decimals)}M`;
  }
  if (abs >= 1e3) {
    const v = abs / 1e3;
    return `₦${v.toFixed(v >= 100 ? 0 : 1)}K`;
  }
  return `₦${Math.round(abs)}`;
}

export function formatCountNG(n: number): string {
  const x = Math.round(Number(n));
  if (!Number.isFinite(x)) return '0';
  return new Intl.NumberFormat('en-NG', { maximumFractionDigits: 0 }).format(x);
}
