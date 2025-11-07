import { useState, useCallback } from 'react';
import { initializePayment } from '@/utils/PaystackUtils';
import { Payment, PaymentCategory } from '@/utils/PaymentTypes';
import { recordPayment } from '@/services/payments';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/components/ui/sonner';
import { fetchTenantIdFromUser } from '@/components/communication/payments/utils/paymentUtils';
import { supabase } from '@/integrations/supabase/client';
import { v4 as uuidv4 } from 'uuid';
import { paymentService, PaymentRequest, PaymentResponse } from '@/services/paymentService';

export const usePaymentProcessing = () => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [paymentHistory, setPaymentHistory] = useState<any[]>([]);
  const [pendingPayments, setPendingPayments] = useState<any[]>([]);

  // Enhanced payment processing with multiple methods
  const processPaymentWithMethod = useCallback(async (
    amount: number,
    category: PaymentCategory,
    description: string,
    paymentMethod: 'paystack' | 'flutterwave' | 'bank_transfer' | 'ussd' = 'paystack',
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
        throw new Error('Unable to find tenant information');
      }

      // Find the active tenancy to link the payment
      const { data: propertyTenant, error: ptError } = await supabase
        .from('property_tenants')
        .select('id, property_id')
        .eq('tenant_id', effectiveTenantId)
        .maybeSingle();

      if (ptError) throw ptError;

      if (!propertyTenant) {
        toast.error("No active tenancy found.", { description: "Please contact your property manager." });
        throw new Error('No active tenancy found for this user.');
      }

      // Create payment request
      const paymentRequest: PaymentRequest = {
        tenant_id: effectiveTenantId,
        lease_id: propertyTenant.id,
        amount,
        payment_type: category as any,
        payment_method: paymentMethod === 'paystack' || paymentMethod === 'flutterwave' ? 'card' : paymentMethod,
        description,
        due_date: new Date().toISOString(),
      };

      let response: PaymentResponse;

      // Process payment based on selected method
      switch (paymentMethod) {
        case 'paystack':
          response = await paymentService.initializePaystackPayment(paymentRequest);
          break;
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
          console.error('Error refreshing payment data:', refreshError);
        }
      } else {
        throw new Error(response.error || 'Payment initialization failed');
      }
    } catch (error) {
      console.error('Payment processing error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to process payment');
    } finally {
      setIsLoading(false);
    }
  }, [user]);
  
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
        throw new Error('Unable to find tenant information');
      }

      // Find the active tenancy to link the payment
      const { data: propertyTenant, error: ptError } = await supabase
        .from('property_tenants')
        .select('id, property_id')
        .eq('tenant_id', effectiveTenantId)
        .maybeSingle();

      if (ptError) throw ptError;

      if (!propertyTenant) {
        toast.error("No active tenancy found.", { description: "Please contact your property manager." });
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
        throw new Error("Could not initiate payment record.");
      }

      // Initialize payment with Paystack
      initializePayment({
        amount: amount * 100, // Convert to kobo
        email: user?.email || "tenant@example.com",
        currency: "NGN",
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
        }
      });
    } catch (error) {
      console.error('Payment initialization error:', error);
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
      console.error('Error refreshing payment data:', error);
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
      console.error('Payment verification error:', error);
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
      console.error('Error loading payment data:', error);
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
