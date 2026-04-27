import { describe, expect, it, vi } from 'vitest';
import { claimPaymentWebhookEvent } from './paymentWebhookDedup.mjs';

function mockSupabase(insertResult) {
  return {
    from: vi.fn(() => ({
      insert: vi.fn().mockResolvedValue(insertResult),
    })),
  };
}

describe('claimPaymentWebhookEvent', () => {
  it('returns firstDelivery true when insert succeeds', async () => {
    const supabase = mockSupabase({ error: null });
    const r = await claimPaymentWebhookEvent(supabase, { provider: 'paystack', externalId: 'ref-abc' });
    expect(r).toEqual({ ok: true, firstDelivery: true });
    expect(supabase.from).toHaveBeenCalledWith('payment_webhook_events');
  });

  it('returns firstDelivery false on unique violation (23505)', async () => {
    const supabase = mockSupabase({ error: { code: '23505' } });
    const r = await claimPaymentWebhookEvent(supabase, { provider: 'flutterwave', externalId: '999' });
    expect(r).toEqual({ ok: true, firstDelivery: false });
  });

  it('returns ok false on other errors', async () => {
    const err = { code: '57014', message: 'canceling statement due to statement timeout' };
    const supabase = mockSupabase({ error: err });
    const r = await claimPaymentWebhookEvent(supabase, { provider: 'paystack', externalId: 'x' });
    expect(r.ok).toBe(false);
    expect(r.error).toBe(err);
  });

  it('rejects empty externalId', async () => {
    const supabase = mockSupabase({ error: null });
    const r = await claimPaymentWebhookEvent(supabase, { provider: 'paystack', externalId: '   ' });
    expect(r.ok).toBe(false);
  });
});
