/**
 * Idempotent webhook handling: first successful insert wins (Postgres unique violation = duplicate delivery).
 * Used by Node payment routes; Edge Functions mirror the same table/constraint.
 *
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 * @param {{ provider: string; externalId: string }} opts
 * @returns {Promise<{ ok: true; firstDelivery: boolean } | { ok: false; error: unknown }>}
 */
export async function claimPaymentWebhookEvent(supabase, { provider, externalId }) {
  if (!supabase || !provider || externalId == null || String(externalId).trim() === "") {
    return { ok: false, error: new Error("claimPaymentWebhookEvent: missing supabase, provider, or externalId") };
  }

  const { error } = await supabase.from("payment_webhook_events").insert({
    provider,
    external_id: String(externalId).trim(),
  });

  if (!error) {
    return { ok: true, firstDelivery: true };
  }

  if (error.code === "23505") {
    return { ok: true, firstDelivery: false };
  }

  return { ok: false, error };
}
