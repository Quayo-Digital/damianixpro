import { supabase } from '@/integrations/supabase/client';
import { Payment, RecurringPaymentType } from '@/utils/PaymentTypes';
import { toast } from '@/components/ui/sonner';
import { v4 as uuidv4 } from 'uuid';

/**
 * Records a new payment in the database
 */
export const recordPayment = async (payment: Omit<Payment, 'id'>): Promise<Payment | null> => {
  try {
    const newPayment = {
      ...payment,
      id: uuidv4(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('rent_payments')
      .insert({
        id: newPayment.id,
        payment_date: payment.is_recurring ? null : payment.date,
        amount: payment.amount,
        status: payment.status,
        reference: payment.reference,
        property_tenant_id: payment.property_tenant_id,
        due_date: payment.next_payment_date || payment.date,
        category: payment.category || 'rent',
        description: payment.description || '',
        is_recurring: payment.is_recurring || false,
        recurring_type: payment.recurring_type,
        next_payment_date: payment.next_payment_date,
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    if (!payment.is_recurring && payment.status !== 'pending') {
      toast.success('Payment recorded successfully');
    }
    return { ...newPayment, ...data } as Payment;
  } catch (error) {
    console.error('Error recording payment:', error);
    toast.error('Failed to record payment');
    return null;
  }
};

/**
 * Updates the status of an existing payment
 */
export const updatePaymentStatus = async (
  id: string,
  status: 'successful' | 'pending' | 'failed' | 'active',
  silent = false
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('rent_payments')
      .update({
        status,
        updated_at: new Date().toISOString(),
        payment_date: status === 'successful' ? new Date().toISOString() : null,
      })
      .eq('id', id);

    if (error) {
      throw error;
    }

    if (!silent) {
      toast.success(`Payment status updated to ${status}`);
    }
    return true;
  } catch (error) {
    console.error('Error updating payment status:', error);
    if (!silent) {
      toast.error('Failed to update payment status');
    }
    return false;
  }
};

/**
 * Sets up a recurring payment plan
 */
export const createRecurringPayment = async (
  tenantId: string,
  amount: number,
  recurringType: RecurringPaymentType,
  category: string,
  description?: string
): Promise<Payment | null> => {
  try {
    const { data: propertyTenant, error: ptError } = await supabase
      .from('property_tenants')
      .select('id, property_id')
      .eq('tenant_id', tenantId)
      .maybeSingle();

    if (ptError) throw ptError;
    if (!propertyTenant) {
      throw new Error('No active tenancy found for this user.');
    }

    // Calculate the next payment date based on the recurring type
    const now = new Date();
    const nextPaymentDate = new Date();

    switch (recurringType) {
      case 'monthly':
        nextPaymentDate.setMonth(now.getMonth() + 1);
        break;
      case 'quarterly':
        nextPaymentDate.setMonth(now.getMonth() + 3);
        break;
      case 'annually':
        nextPaymentDate.setFullYear(now.getFullYear() + 1);
        break;
    }

    // Record the payment plan in the database
    const result = await recordPayment({
      date: new Date().toISOString().split('T')[0],
      amount,
      status: 'pending', // <--- Changed from 'active'
      reference: `RECURRING-${Math.floor(Math.random() * 1000000000)}`,
      property_tenant_id: propertyTenant.id,
      category,
      description,
      is_recurring: true,
      recurring_type: recurringType,
      next_payment_date: nextPaymentDate.toISOString().split('T')[0],
    });

    return result;
  } catch (error) {
    console.error('Error creating recurring payment:', error);
    return null;
  }
};
