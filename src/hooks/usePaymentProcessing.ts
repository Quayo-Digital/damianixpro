import { useState, useCallback } from 'react';
import { initializePayment } from '@/utils/FlutterwaveUtils';
import { Payment, PaymentCategory } from '@/utils/PaymentTypes';
import { recordPayment } from '@/services/payments';
import { useAuthSession } from '@/contexts/AuthContext';
import { toast } from '@/components/ui/sonner';
import { fetchTenantIdFromUser } from '@/components/communication/payments/utils/paymentUtils';
import { supabase } from '@/integrations/supabase/client';
import { v4 as uuidv4 } from 'uuid';
import { paymentService, PaymentRequest, PaymentResponse } from '@/services/paymentService';
import { logger } from '@/utils/logger';
import {
  clearPropertyTenantsRelationMissingCache,
  isMissingSupabaseRelationError,
  isPropertyTenantsRelationMissing,
  markPropertyTenantsRelationMissing,
} from '@/utils/supabaseErrors';

export const usePaymentProcessing = () => {
  const { user } = useAuthSession();
  const [isLoading, setIsLoading] = useState(false);
  const [paymentHistory, setPaymentHistory] = useState<any[]>([]);
  const [pendingPayments, setPendingPayments] = useState<any[]>([]);

  /**
   * Resolve the active property_tenants row for payment.
   * If missing, attempt to derive/create it from an existing lease row.
   */
  const resolvePropertyTenantForPayment = useCallback(
    async (effectiveTenantId: string, selectedPropertyId?: string) => {
      if (isPropertyTenantsRelationMissing()) {
        // Re-probe once: after migrations/HMR the in-memory/session hint may be stale.
        const probe = await supabase.from('property_tenants').select('id').limit(1);
        if (probe.error) {
          if ((probe.error as { code?: string }).code === '42501') {
            throw new Error('property_tenants access denied');
          }
          if (isMissingSupabaseRelationError(probe.error)) {
            markPropertyTenantsRelationMissing();
            throw new Error('property_tenants table not available');
          }
          throw probe.error;
        }
        clearPropertyTenantsRelationMissingCache();
      }

      let ptQuery = supabase
        .from('property_tenants')
        .select('id, property_id')
        .eq('tenant_id', effectiveTenantId);
      if (selectedPropertyId) {
        ptQuery = ptQuery.eq('property_id', selectedPropertyId);
      }

      const { data: ptRows, error: ptError } = await ptQuery
        .order('start_date', { ascending: false })
        .limit(1);

      if (ptError) {
        if ((ptError as { code?: string }).code === '42501') {
          throw new Error('property_tenants access denied');
        }
        if (isMissingSupabaseRelationError(ptError)) {
          markPropertyTenantsRelationMissing();
          throw new Error('property_tenants table not available');
        }
        throw ptError;
      }
      clearPropertyTenantsRelationMissingCache();

      const propertyTenant = (ptRows ?? [])[0] as { id: string; property_id: string } | undefined;
      if (propertyTenant) return propertyTenant;

      // Self-heal: if a lease exists, create/refresh property_tenants link.
      let leaseQuery = supabase
        .from('leases')
        .select('id, property_id, start_date, end_date, monthly_rent, security_deposit, status')
        .eq('tenant_id', effectiveTenantId);
      if (selectedPropertyId) {
        leaseQuery = leaseQuery.eq('property_id', selectedPropertyId);
      }

      const { data: leaseRows, error: leaseError } = await leaseQuery
        .order('created_at', { ascending: false })
        .limit(1);

      if (leaseError) {
        // RLS/auth issues may block leases; keep existing UX path.
        console.warn('Could not load lease while resolving payment tenancy:', leaseError);
        return null;
      }

      const lease = (leaseRows ?? [])[0] as
        | {
            property_id?: string | null;
            start_date?: string | null;
            end_date?: string | null;
            monthly_rent?: number | null;
            security_deposit?: number | null;
            status?: string | null;
          }
        | undefined;
      let resolvedPropertyId = lease?.property_id ?? null;

      // Final self-heal path: derive property from latest approved rental application.
      if (!resolvedPropertyId && user?.id) {
        const { data: approvedApps, error: appError } = await supabase
          .from('rental_applications')
          .select('property_id')
          .eq('user_id', user.id)
          .eq('status', 'approved')
          .order('updated_at', { ascending: false })
          .limit(1);
        if (!appError) {
          resolvedPropertyId =
            ((approvedApps ?? [])[0] as { property_id?: string } | undefined)?.property_id ?? null;
        }
      }

      if (!resolvedPropertyId) return null;

      const payload = {
        property_id: resolvedPropertyId,
        tenant_id: effectiveTenantId,
        rent_amount: lease?.monthly_rent ?? null,
        deposit_amount: lease?.security_deposit ?? null,
        start_date: lease?.start_date ?? new Date().toISOString().split('T')[0],
        end_date: lease?.end_date ?? null,
        status:
          String(lease?.status ?? 'active').toLowerCase() === 'active' ? 'active' : 'inactive',
      };

      const { data: upserted, error: upsertError } = await supabase
        .from('property_tenants')
        .upsert(payload, { onConflict: 'property_id,tenant_id' })
        .select('id, property_id')
        .maybeSingle();

      if (upsertError) {
        if ((upsertError as { code?: string }).code === '42501') {
          // Tenant may not have insert/update rights. Try SECURITY DEFINER RPC fallback.
          const { data: rpcRow, error: rpcErr } = await supabase.rpc(
            'ensure_current_user_property_tenant_link',
            {
              p_tenant_id: effectiveTenantId,
              p_property_id: resolvedPropertyId,
            }
          );
          if (rpcErr) {
            throw new Error('property_tenants access denied');
          }
          const normalized = Array.isArray(rpcRow) ? rpcRow[0] : rpcRow;
          if (normalized?.id && normalized?.property_id) {
            return normalized as { id: string; property_id: string };
          }
          return null;
        }
        if (isMissingSupabaseRelationError(upsertError)) {
          markPropertyTenantsRelationMissing();
          throw new Error('property_tenants table not available');
        }
        throw upsertError;
      }

      return upserted ?? null;
    },
    [user?.id]
  );

  // Enhanced payment processing with multiple methods
  const processPaymentWithMethod = useCallback(
    async (
      amount: number,
      category: PaymentCategory,
      description: string,
      paymentMethod: 'flutterwave' | 'bank_transfer' | 'ussd' = 'flutterwave',
      tenantId?: string,
      propertyId?: string,
      options?: { recurringOptIn?: boolean }
    ) => {
      setIsLoading(true);

      try {
        // If tenantId is not provided, try to fetch it using the current user
        let effectiveTenantId = tenantId;

        if (!effectiveTenantId && user) {
          effectiveTenantId = await fetchTenantIdFromUser(user.id);
        }

        if (!effectiveTenantId) {
          const {
            data: { session },
          } = await supabase.auth.getSession();
          if (!session) {
            throw new Error('auth session expired');
          }
          throw new Error('Unable to find tenant information');
        }

        const propertyTenant = await resolvePropertyTenantForPayment(effectiveTenantId, propertyId);

        if (!propertyTenant) {
          toast.error('No Active Lease Found', {
            description:
              'You need an active lease to make payments. Please contact your property manager to set up your lease agreement.',
            duration: 5000,
          });
          throw new Error('No active tenancy found for this user.');
        }

        // Create payment request
        const paymentRequest: PaymentRequest = {
          tenant_id: effectiveTenantId,
          lease_id: propertyTenant.id,
          amount,
          payment_type: category as any,
          payment_method: paymentMethod === 'flutterwave' ? 'card' : paymentMethod,
          description,
          due_date: new Date().toISOString(),
          recurring_opt_in:
            paymentMethod === 'flutterwave' && options?.recurringOptIn === true ? true : undefined,
        };

        let response: PaymentResponse;

        // Process payment based on selected method
        switch (paymentMethod) {
          case 'flutterwave':
            response = await paymentService.initializeFlutterwavePayment(paymentRequest);
            break;
          case 'bank_transfer':
            response = await paymentService.initializeBankTransferPayment(paymentRequest);
            break;
          case 'ussd':
            response = await paymentService.initializeUSSDPayment(paymentRequest);
            break;
          default:
            throw new Error('Unsupported payment method');
        }

        if (response.success) {
          if (response.authorization_url) {
            // Redirect to payment gateway
            window.open(response.authorization_url, '_blank');
          }

          toast.success('Payment initiated successfully!', {
            description: response.message || 'Please complete the payment process.',
          });

          // Refresh payment data after successful payment
          try {
            const [history, pending] = await Promise.all([
              paymentService.getPaymentHistory(effectiveTenantId),
              paymentService.getPendingPayments(effectiveTenantId),
            ]);
            setPaymentHistory(history);
            setPendingPayments(pending);
          } catch (refreshError) {
            logger.error('Error refreshing payment data:', refreshError);
          }
        } else {
          throw new Error(response.error || 'Payment initialization failed');
        }
      } catch (error) {
        const msg = error instanceof Error ? error.message : '';
        if (msg === 'property_tenants table not available') {
          toast.error('Payments unavailable', {
            description:
              'Your lease is not linked in the system yet. Ensure the property_tenants table exists and you have an active lease, or contact your property manager.',
          });
          return;
        }
        if (msg === 'property_tenants access denied') {
          toast.error('Payments unavailable', {
            description:
              'Your account cannot read tenancy links yet (property_tenants permission denied). Ask an admin to apply the latest database migration.',
          });
          return;
        }
        if (msg === 'auth session expired') {
          toast.error('Session expired', {
            description:
              'Your sign-in session has expired. Please log in again, then retry payment.',
          });
          return;
        }
        logger.error('Payment processing error:', error);
        toast.error(error instanceof Error ? error.message : 'Failed to process payment');
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [resolvePropertyTenantForPayment, user]
  );

  // Legacy method for backward compatibility
  const processPayment = async (
    amount: number,
    category: PaymentCategory,
    description: string,
    tenantId?: string,
    propertyId?: string
  ) => {
    setIsLoading(true);

    try {
      // If tenantId is not provided, try to fetch it using the current user
      let effectiveTenantId = tenantId;

      if (!effectiveTenantId && user) {
        effectiveTenantId = await fetchTenantIdFromUser(user.id);
      }

      if (!effectiveTenantId) {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!session) {
          throw new Error('auth session expired');
        }
        throw new Error('Unable to find tenant information');
      }

      const propertyTenant = await resolvePropertyTenantForPayment(effectiveTenantId, propertyId);

      if (!propertyTenant) {
        toast.error('No Active Lease Found', {
          description:
            'You need an active lease to verify payments. Please contact your property manager.',
          duration: 5000,
        });
        throw new Error('No active tenancy found for this user.');
      }

      const reference = uuidv4();

      const pendingPayment: Omit<Payment, 'id'> = {
        date: new Date().toISOString().split('T')[0],
        amount,
        status: 'pending',
        reference,
        property_tenant_id: propertyTenant.id,
        category,
        description,
      };

      const newPayment = await recordPayment(pendingPayment);
      if (!newPayment) {
        throw new Error('Could not initiate payment record.');
      }

      // Initialize payment with Flutterwave (amount in Naira)
      initializePayment({
        amount,
        email: user?.email || 'tenant@example.com',
        currency: 'NGN',
        ref: reference,
        metadata: {
          tenantId: effectiveTenantId,
          propertyId: propertyTenant.property_id,
          category,
          description,
          internal_payment_id: newPayment.id,
        },
        onSuccess: () => {
          setIsLoading(false);
          toast.success('Payment submitted!', {
            description: "We are confirming your payment. You will be notified once it's complete.",
          });
        },
        onCancel: () => {
          setIsLoading(false);
          toast.error('Payment was cancelled');
        },
      });
    } catch (error) {
      const msg = error instanceof Error ? error.message : '';
      if (msg === 'property_tenants table not available') {
        toast.error('Payments unavailable', {
          description:
            'The tenancy table is not available on this project yet. Apply database migrations or contact support.',
          duration: 8000,
        });
        setIsLoading(false);
        return;
      }
      if (msg === 'property_tenants access denied') {
        toast.error('Payments unavailable', {
          description:
            'Your account cannot read tenancy links yet (property_tenants permission denied). Ask an admin to apply the latest database migration.',
          duration: 8000,
        });
        setIsLoading(false);
        return;
      }
      if (msg === 'auth session expired') {
        toast.error('Session expired', {
          description: 'Your sign-in session has expired. Please log in again, then retry payment.',
          duration: 8000,
        });
        setIsLoading(false);
        return;
      }
      logger.error('Payment initialization error:', error);
      setIsLoading(false);
      toast.error(error instanceof Error ? error.message : 'Failed to process payment');
    }
  };

  // Refresh payment data
  const refreshPaymentData = useCallback(async (tenantId: string) => {
    try {
      const [history, pending] = await Promise.all([
        paymentService.getPaymentHistory(tenantId),
        paymentService.getPendingPayments(tenantId),
      ]);

      setPaymentHistory(history);
      setPendingPayments(pending);
    } catch (error) {
      logger.error('Error refreshing payment data:', error);
    }
  }, []);

  // Verify payment status
  const verifyPayment = useCallback(async (reference: string, gateway: string) => {
    try {
      setIsLoading(true);
      const verification = await paymentService.verifyPayment(reference, gateway);

      if (verification.success && verification.status === 'completed') {
        toast.success('Payment verified successfully!', {
          description: `Payment of ₦${verification.amount.toLocaleString()} has been confirmed.`,
        });
      } else {
        toast.error('Payment verification failed', {
          description: verification.gateway_response || 'Please try again or contact support.',
        });
      }

      return verification;
    } catch (error) {
      logger.error('Payment verification error:', error);
      toast.error('Failed to verify payment');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load payment data on hook initialization
  const loadPaymentData = useCallback(async () => {
    if (!user) return;

    try {
      const tenantId = await fetchTenantIdFromUser(user.id);
      if (tenantId) {
        await refreshPaymentData(tenantId);
      }
    } catch (error) {
      logger.error('Error loading payment data:', error);
    }
  }, [user, refreshPaymentData]);

  return {
    // Legacy method
    processPayment,
    // Enhanced methods
    processPaymentWithMethod,
    verifyPayment,
    refreshPaymentData,
    loadPaymentData,
    // State
    isLoading,
    paymentHistory,
    pendingPayments,
  };
};
