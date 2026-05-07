import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { getAccountingSummary, processOwnerPayout } from '@/services/payments/accounting';
import { AccountingSummary, PaymentFilter, Payment, OwnerPayout } from '@/utils/AccountingTypes';
import { profileFullName } from '@/lib/profileDisplayName';
import { toast } from '@/components/ui/sonner';
import { DateRange } from 'react-day-picker';
import { toPgDateOnly } from '@/utils/toPgDateOnly';

export const usePaymentAccounting = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [loading, setLoading] = useState(true);
  const [filterProperty, setFilterProperty] = useState('all');
  const [properties, setProperties] = useState<{ id: string; name: string }[]>([]);
  const [accounting, setAccounting] = useState<AccountingSummary>({
    totalRevenue: 0,
    platformFees: 0,
    agentCommissions: 0,
    ownerPayouts: 0,
    taxes: 0,
    pendingPayouts: 0,
  });
  const [payments, setPayments] = useState<Payment[]>([]);
  const [ownerPayouts, setOwnerPayouts] = useState<OwnerPayout[]>([]);
  const [processingPayout, setProcessingPayout] = useState(false);
  const [selectedPayments, setSelectedPayments] = useState<string[]>([]);

  const loadPaymentsData = useCallback(async (filter: PaymentFilter) => {
    try {
      let query = supabase
        .from('rent_payments')
        .select(
          `id, payment_date, reference, amount, status,
                    payment_breakdowns!inner(*),
                    property_tenants!inner(property_id, tenant_id,
                        properties!inner(name, id, owner_id),
                        tenants!inner(first_name, last_name)
                    )`
        )
        .eq('status', 'successful');

      if (filter.startDate) query = query.gte('payment_date', toPgDateOnly(filter.startDate));
      if (filter.endDate) query = query.lte('payment_date', toPgDateOnly(filter.endDate));
      if (filter.propertyId) query = query.eq('property_tenants.property_id', filter.propertyId);

      const { data, error } = await query;
      if (error) throw error;

      const processedPayments: Payment[] = (data || []).map((payment: any) => {
        const breakdown = Array.isArray(payment.payment_breakdowns)
          ? payment.payment_breakdowns[0]
          : payment.payment_breakdowns;
        return {
          ...payment,
          breakdown: breakdown
            ? {
                platform_fee: breakdown.platform_fee,
                agent_commission: breakdown.agent_commission,
                owner_amount: breakdown.owner_amount,
                tax_amount: breakdown.tax_amount,
                paid_to_owner: breakdown.paid_to_owner,
              }
            : undefined,
        };
      });
      setPayments(processedPayments);
    } catch (error) {
      console.error('Error loading payments data:', error);
      toast.error('Failed to load payments data');
    }
  }, []);

  const loadPayoutsData = useCallback(async (_filter: PaymentFilter) => {
    try {
      const { data, error } = await supabase
        .from('owner_payouts')
        .select(`id, amount, owner_id, payout_date, status, payment_ids`);

      if (error) throw error;

      if (data && Array.isArray(data)) {
        const ownerPayoutsWithNames: OwnerPayout[] = await Promise.all(
          data.map(async (payout) => {
            const { data: profileData, error: profileError } = await supabase
              .from('profiles')
              .select('first_name, last_name')
              .eq('id', payout.owner_id)
              .single();
            return {
              ...payout,
              profiles: profileError
                ? { full_name: 'Unknown Owner' }
                : { full_name: profileFullName(profileData ?? {}) || 'Unknown Owner' },
            };
          })
        );
        setOwnerPayouts(ownerPayoutsWithNames);
      } else {
        setOwnerPayouts([]);
      }
    } catch (error) {
      console.error('Error loading payouts data:', error);
      toast.error('Failed to load payouts data');
    }
  }, []);

  const loadTabData = useCallback(
    async (tab: string, filter: PaymentFilter) => {
      try {
        if (tab === 'payments') await loadPaymentsData(filter);
        else if (tab === 'payouts') await loadPayoutsData(filter);
      } catch (error) {
        console.error('Error loading tab data:', error);
      }
    },
    [loadPaymentsData, loadPayoutsData]
  );

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const filter: PaymentFilter = {};
      if (dateRange?.from) filter.startDate = dateRange.from.toISOString().split('T')[0];
      if (dateRange?.to) filter.endDate = dateRange.to.toISOString().split('T')[0];
      if (filterProperty !== 'all') filter.propertyId = filterProperty;

      const summary = await getAccountingSummary(filter.startDate, filter.endDate);
      setAccounting(summary);
      await loadTabData(activeTab, filter);
    } catch (error) {
      console.error('Error loading accounting data:', error);
      toast.error('Failed to load accounting data');
    } finally {
      setLoading(false);
    }
  }, [dateRange, filterProperty, activeTab, loadTabData]);

  const loadProperties = useCallback(async () => {
    try {
      const { data, error } = await supabase.from('properties').select('id, name').order('name');
      if (error) throw error;
      setProperties(data || []);
    } catch (error) {
      console.error('Error loading properties:', error);
    }
  }, []);

  useEffect(() => {
    loadProperties();
  }, [loadProperties]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleProcessPayout = async (ownerId: string, amount: number, paymentIds: string[]) => {
    setProcessingPayout(true);
    try {
      const success = await processOwnerPayout(ownerId, amount, paymentIds);
      if (success) {
        await loadData();
        setSelectedPayments([]);
      }
    } catch (error) {
      console.error('Error processing payout:', error);
      toast.error('Failed to process payout');
    } finally {
      setProcessingPayout(false);
    }
  };

  const handleGenerateInvoice = async (paymentId: string) => {
    toast.success(`Invoice generated for payment ${paymentId} and sent to tenant`);
  };

  const handleSelectPayment = (paymentId: string) => {
    setSelectedPayments((prev) =>
      prev.includes(paymentId) ? prev.filter((id) => id !== paymentId) : [...prev, paymentId]
    );
  };

  return {
    activeTab,
    setActiveTab,
    dateRange,
    setDateRange,
    loading,
    filterProperty,
    setFilterProperty,
    properties,
    accounting,
    payments,
    ownerPayouts,
    processingPayout,
    selectedPayments,
    setSelectedPayments,
    loadData,
    handleProcessPayout,
    handleGenerateInvoice,
    handleSelectPayment,
  };
};
