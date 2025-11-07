
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/components/ui/sonner';
import { DateRange } from 'react-day-picker';
import { OwnerPayment, UseOwnerPaymentsReturn } from '@/components/owner/payments/types';

export const useOwnerPayments = (): UseOwnerPaymentsReturn => {
  const [activeTab, setActiveTab] = useState('received');
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [payments, setPayments] = useState<OwnerPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  
  const loadPayments = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      const { data: properties, error: propError } = await supabase
        .from('properties')
        .select('id, name')
        .eq('owner_id', user.id);
        
      if (propError) throw propError;
      
      if (!properties || properties.length === 0) {
        setPayments([]);
        setLoading(false);
        return;
      }
      
      const propertyIds = properties.map(p => p.id);
      
      let query = supabase
        .from('rent_payments')
        .select(`
          id, 
          payment_date, 
          reference, 
          amount, 
          status,
          payment_breakdowns!inner(*),
          property_tenants!inner(
            property_id,
            tenant_id,
            properties!inner(name, id),
            tenants!inner(first_name, last_name)
          )
        `)
        .eq('status', 'successful')
        .in('property_tenants.property_id', propertyIds);
        
      if (dateRange?.from) {
        query = query.gte('payment_date', dateRange.from.toISOString().split('T')[0]);
      }
      
      if (dateRange?.to) {
        query = query.lte('payment_date', dateRange.to.toISOString().split('T')[0]);
      }
      
      const { data: allPayments, error } = await query;
      
      if (error) throw error;
      
      if (!allPayments || allPayments.length === 0) {
        setPayments([]);
        setLoading(false);
        return;
      }
      
      const filteredPayments = allPayments.filter((p: any) => {
        const breakdown = Array.isArray(p.payment_breakdowns) ? p.payment_breakdowns[0] : p.payment_breakdowns;
        if (!breakdown) return false;
        
        if (activeTab === 'received') {
          return breakdown.paid_to_owner === true;
        } else { // 'pending' tab
          return breakdown.paid_to_owner === false;
        }
      });
      
      const processedPayments: OwnerPayment[] = filteredPayments.map((payment: any) => {
        const breakdown = Array.isArray(payment.payment_breakdowns) ? payment.payment_breakdowns[0] : payment.payment_breakdowns;
        
        return {
          id: payment.id,
          date: payment.payment_date,
          property_name: payment.property_tenants?.properties?.name || 'Unknown',
          tenant_name: `${payment.property_tenants?.tenants?.first_name || 'Unknown'} ${payment.property_tenants?.tenants?.last_name || ''}`,
          total_amount: breakdown.total_amount,
          platform_fee: breakdown.platform_fee,
          agent_commission: breakdown.agent_commission,
          owner_amount: breakdown.owner_amount,
          tax_amount: breakdown.tax_amount,
          status: breakdown.paid_to_owner ? 'Received' : 'Pending',
          reference: payment.reference
        };
      });
      
      setPayments(processedPayments);
    } catch (error) {
      console.error('Error loading owner payments:', error);
      toast.error('Failed to load payment data');
    } finally {
      setLoading(false);
    }
  }, [user, activeTab, dateRange]);

  useEffect(() => {
    loadPayments();
  }, [loadPayments]);

  const getTotalAmount = () => {
    return payments.reduce((sum, payment) => sum + payment.owner_amount, 0);
  };

  const getTotalPlatformFees = () => {
    return payments.reduce((sum, p) => sum + p.platform_fee, 0);
  };

  const getTotalAgentCommissions = () => {
    return payments.reduce((sum, p) => sum + p.agent_commission, 0);
  };
  
  return { 
    payments, 
    loading, 
    activeTab, 
    setActiveTab, 
    dateRange, 
    setDateRange, 
    loadPayments,
    getTotalAmount,
    getTotalPlatformFees,
    getTotalAgentCommissions
  };
};
