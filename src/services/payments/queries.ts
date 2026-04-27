import { supabase } from '@/integrations/supabase/client';
import { Payment } from '@/utils/PaymentTypes';
import { toast } from '@/components/ui/sonner';

/**
 * Fetches payments from the database with optional tenant filtering
 */
export const fetchPayments = async (tenantId?: string): Promise<Payment[]> => {
  try {
    let paymentQuery = supabase.from('rent_payments').select('*');

    if (tenantId) {
      const { data: propertyTenants, error: ptError } = await supabase
        .from('property_tenants')
        .select('id')
        .eq('tenant_id', tenantId);

      if (ptError) throw ptError;
      if (!propertyTenants || propertyTenants.length === 0) {
        return [];
      }

      const propertyTenantIds = propertyTenants.map((pt) => pt.id);
      paymentQuery = paymentQuery.in('property_tenant_id', propertyTenantIds);
    }

    const { data: payments, error: paymentsError } = await paymentQuery.order('due_date', {
      ascending: false,
    });

    if (paymentsError) {
      throw paymentsError;
    }

    if (!payments || payments.length === 0) {
      return [];
    }

    const allPropertyTenantIds = [
      ...new Set(payments.map((p) => p.property_tenant_id).filter(Boolean)),
    ];

    let ptMap = new Map();
    if (allPropertyTenantIds.length > 0) {
      const { data: ptDetails, error: ptDetailsError } = await supabase
        .from('property_tenants')
        .select('id, tenant_id, property_id')
        .in('id', allPropertyTenantIds);

      if (ptDetailsError) throw ptDetailsError;
      if (ptDetails) {
        ptMap = new Map(ptDetails.map((pt) => [pt.id, pt]));
      }
    }

    return payments.map((payment: any) => {
      return {
        id: payment.id,
        date: payment.payment_date || payment.due_date,
        amount: payment.amount,
        status: payment.status as 'successful' | 'pending' | 'failed' | 'active',
        reference: payment.reference || `T${Math.floor(Math.random() * 1000000000)}`,
        property_tenant_id: payment.property_tenant_id,
        category: payment.category || 'rent',
        description: payment.description || '',
        is_recurring: payment.is_recurring || false,
        recurring_type: payment.recurring_type,
        next_payment_date: payment.next_payment_date,
      };
    });
  } catch (error) {
    console.error('Error fetching payments:', error);
    toast.error('Failed to load payment history');
    return [];
  }
};
