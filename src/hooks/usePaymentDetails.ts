import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';
import { useNavigate } from 'react-router-dom';
import { Payment, RecurringPaymentType } from '@/utils/PaymentTypes';

export const usePaymentDetails = (paymentId: string | undefined) => {
  const [payment, setPayment] = useState<Payment | null>(null);
  const [loading, setLoading] = useState(true);
  const [tenantName, setTenantName] = useState('');
  const [propertyName, setPropertyName] = useState('');
  const navigate = useNavigate();
  
  // Load payment details when payment ID changes
  useEffect(() => {
    const loadPaymentDetails = async () => {
      if (!paymentId) return;
      
      try {
        setLoading(true);
        
        // Fetch payment by ID
        const { data: paymentData, error: paymentError } = await supabase
          .from('rent_payments')
          .select('*')
          .eq('id', paymentId)
          .single();
        
        if (paymentError || !paymentData) {
          throw new Error('Payment not found');
        }
        
        // Format payment data
        const formattedPayment: Payment = {
          id: paymentData.id,
          date: paymentData.payment_date || paymentData.due_date,
          amount: paymentData.amount,
          status: paymentData.status as 'successful' | 'pending' | 'failed' | 'active',
          reference: paymentData.reference || `REF-${Date.now()}`,
          property_tenant_id: paymentData.property_tenant_id,
          description: paymentData.description || '',
          category: paymentData.category || 'rent',
          is_recurring: paymentData.is_recurring || false,
          recurring_type: paymentData.recurring_type as RecurringPaymentType,
          next_payment_date: paymentData.next_payment_date,
        };
        
        // Fetch tenant and property details
        if (paymentData.property_tenant_id) {
          const { data: propertyTenantData, error: ptError } = await supabase
            .from('property_tenants')
            .select('tenant_id, property_id')
            .eq('id', paymentData.property_tenant_id)
            .single();

          if (ptError) {
            console.warn('Could not fetch tenancy details for payment', ptError);
          } else if (propertyTenantData) {
            if (propertyTenantData.tenant_id) {
              const { data: tenantData } = await supabase
                .from('tenants')
                .select('first_name, last_name')
                .eq('id', propertyTenantData.tenant_id)
                .single();
                
              if (tenantData) {
                setTenantName(`${tenantData.first_name} ${tenantData.last_name}`);
              }
            }
            
            if (propertyTenantData.property_id) {
              const { data: propertyData } = await supabase
                .from('properties')
                .select('name')
                .eq('id', propertyTenantData.property_id)
                .single();
                
              if (propertyData) {
                setPropertyName(propertyData.name);
              }
            }
          }
        }
        
        setPayment(formattedPayment);
        setLoading(false);
      } catch (error) {
        console.error('Error loading payment details:', error);
        toast.error('Could not load payment receipt');
        setLoading(false);
        navigate('/payments');
      }
    };
    
    if (paymentId) {
      loadPaymentDetails();
    }
  }, [paymentId, navigate]);
  
  return {
    payment,
    loading,
    tenantName,
    propertyName
  };
};
