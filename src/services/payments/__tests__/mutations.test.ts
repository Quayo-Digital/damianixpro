/**
 * Unit tests for payment mutations
 * Example test file demonstrating testing patterns
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { recordPayment, updatePaymentStatus } from '../mutations';
import { supabase } from '@/integrations/supabase/client';

// Mock Supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

describe('Payment Mutations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('recordPayment', () => {
    it('should successfully record a payment', async () => {
      const mockPayment = {
        date: '2025-01-22',
        amount: 50000,
        status: 'pending' as const,
        reference: 'test-ref-123',
        property_tenant_id: 'tenant-123',
        category: 'rent',
        description: 'Monthly rent',
      };

      const mockInsert = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { id: 'payment-123', ...mockPayment },
            error: null,
          }),
        }),
      });

      (supabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
        insert: mockInsert,
      });

      const result = await recordPayment(mockPayment);

      expect(result).toBeTruthy();
      expect(result?.id).toBe('payment-123');
      expect(supabase.from).toHaveBeenCalledWith('rent_payments');
    });

    it('should handle errors when recording payment', async () => {
      const mockPayment = {
        date: '2025-01-22',
        amount: 50000,
        status: 'pending' as const,
        reference: 'test-ref-123',
        property_tenant_id: 'tenant-123',
        category: 'rent',
      };

      const mockError = new Error('Database error');
      const mockInsert = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: null,
            error: mockError,
          }),
        }),
      });

      (supabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
        insert: mockInsert,
      });

      const result = await recordPayment(mockPayment);

      expect(result).toBeNull();
    });
  });

  describe('updatePaymentStatus', () => {
    it('should successfully update payment status', async () => {
      const mockUpdate = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({
          error: null,
        }),
      });

      (supabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
        update: mockUpdate,
      });

      const result = await updatePaymentStatus('payment-123', 'successful');

      expect(result).toBe(true);
      expect(supabase.from).toHaveBeenCalledWith('rent_payments');
    });

    it('should handle errors when updating status', async () => {
      const mockError = new Error('Update failed');
      const mockUpdate = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({
          error: mockError,
        }),
      });

      (supabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
        update: mockUpdate,
      });

      const result = await updatePaymentStatus('payment-123', 'successful', true);

      expect(result).toBe(false);
    });
  });
});
