/**
 * Unit tests for payment Edge Function API
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    functions: {
      invoke: vi.fn(),
    },
  },
}));

describe('Payment Edge Function API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Flutterwave initialize', () => {
    it('calls flutterwave-payments with correct action', async () => {
      const { supabase } = await import('@/integrations/supabase/client');
      const { flutterwaveInitialize } = await import('../edgeFunctionApi');

      const mockInvoke = vi.fn().mockResolvedValue({
        data: { status: 'success', data: { link: 'https://pay.flutterwave.com/x', tx_ref: 'ref' } },
        error: null,
      });

      (supabase.functions.invoke as ReturnType<typeof vi.fn>).mockImplementation(mockInvoke);

      const result = await flutterwaveInitialize({
        email: 'test@example.com',
        amount: 1000,
      });

      expect(mockInvoke).toHaveBeenCalledWith('flutterwave-payments', {
        body: expect.objectContaining({
          action: 'initialize',
          email: 'test@example.com',
          amount: 1000,
        }),
      });
      expect(result.status).toBe('success');
    });
  });
});
