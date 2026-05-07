/**
 * Postgres `date` columns (e.g. rent_payments.payment_date) should be filtered with YYYY-MM-DD.
 * UI often passes ISO datetimes — strip the time portion for PostgREST.
 */
export function toPgDateOnly(s: string): string {
  if (!s) return s;
  const i = s.indexOf('T');
  if (i > 0) return s.slice(0, 10);
  return s.length > 10 ? s.slice(0, 10) : s;
}
