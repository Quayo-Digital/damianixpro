import { supabase } from '@/integrations/supabase/client';

/**
 * Gets payment statistics grouped by category
 */
export const getPaymentStatsByCategory = async (
  startDate?: string,
  endDate?: string,
  propertyId?: string
): Promise<Record<string, number>> => {
  try {
    // Build query separately without chaining to avoid deep instantiation
    let query = supabase.from('rent_payments').select('*');

    // Add status filter
    query = query.eq('status', 'successful');

    // Apply additional filters
    if (startDate) {
      query = query.gte('payment_date', startDate);
    }

    if (endDate) {
      query = query.lte('payment_date', endDate);
    }

    if (propertyId) {
      query = query.eq('property_tenant_id', propertyId); // Use property_tenant_id instead
    }

    // Execute the query
    const { data, error } = await query;

    if (error) {
      throw error;
    }

    // Process the results
    const categoryTotals: Record<string, number> = {};

    if (data && Array.isArray(data)) {
      data.forEach((payment) => {
        if (payment) {
          // Access category safely through type assertion
          const paymentAny = payment as any;
          const category = paymentAny.category || 'rent';
          const amount = typeof payment.amount === 'number' ? payment.amount : 0;

          if (!categoryTotals[category]) {
            categoryTotals[category] = 0;
          }

          categoryTotals[category] += amount;
        }
      });
    }

    return categoryTotals;
  } catch (error) {
    console.error('Error getting payment stats:', error);
    return {};
  }
};
