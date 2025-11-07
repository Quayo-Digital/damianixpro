
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/contexts/auth';
import { supabase } from '@/integrations/supabase/client';
import { Payment, RecurringPaymentType } from '@/utils/PaymentTypes';
import { fetchTenantIdFromUser } from '../utils/paymentUtils';

export const useTenantPayments = () => {
    const { user } = useAuth();
    const [tenantId, setTenantId] = useState<string | undefined>(undefined);
    const [error, setError] = useState<string | null>(null);
    const [payments, setPayments] = useState<Payment[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchPayments = useCallback(async (currentTenantId: string) => {
        try {
            const { data: ptData, error: ptError } = await supabase
                .from('property_tenants')
                .select('id')
                .eq('tenant_id', currentTenantId);

            if (ptError) throw ptError;

            const propertyTenantIds = ptData.map(pt => pt.id);
            if (propertyTenantIds.length === 0) {
                setPayments([]);
                return;
            }

            const { data: paymentsData, error: paymentsError } = await supabase
                .from('rent_payments')
                .select('*')
                .in('property_tenant_id', propertyTenantIds)
                .order('due_date', { ascending: false });

            if (paymentsError) throw paymentsError;
            if (!paymentsData) {
                setPayments([]);
                return;
            }

            const typedPayments: Payment[] = paymentsData.map(p => ({
                id: p.id,
                date: p.payment_date || p.due_date,
                amount: Number(p.amount),
                status: p.status as 'successful' | 'pending' | 'failed' | 'active',
                reference: p.reference || `REF-${p.id.substring(0, 8).toUpperCase()}`,
                property_tenant_id: p.property_tenant_id,
                description: p.description || undefined,
                category: p.category || undefined,
                is_recurring: p.is_recurring || false,
                recurring_type: p.recurring_type as RecurringPaymentType | undefined,
                next_payment_date: p.next_payment_date || undefined,
            }));
            
            setPayments(typedPayments);
        } catch (err) {
            console.error('Error fetching payments:', err);
            setError('Could not fetch payment history.');
        }
    }, []);

    useEffect(() => {
        const getTenantData = async () => {
            if (!user) {
                setIsLoading(false);
                return;
            }

            setIsLoading(true);
            setError(null);
            
            try {
                const id = await fetchTenantIdFromUser(user.id);
                if (id) {
                    setTenantId(id);
                    await fetchPayments(id);
                } else {
                    setError("No tenant profile found. Please contact your property manager to set up your tenant profile.");
                }
            } catch (err) {
                console.error("Error in tenant data fetch:", err);
                setError("Failed to retrieve tenant information. Please try again later.");
            } finally {
                setIsLoading(false);
            }
        };
        
        getTenantData();
    }, [user, fetchPayments]);

    const addPayment = (payment: Payment) => {
        setPayments(prevPayments => [payment, ...prevPayments].sort((a, b) => {
            const dateA = new Date(a.next_payment_date || a.date || 0).getTime();
            const dateB = new Date(b.next_payment_date || b.date || 0).getTime();
            return dateB - dateA;
        }));
    };

    const upcomingPayment = useMemo(() => {
        const futurePayments = payments
            .filter(p => (p.status === 'pending' || p.status === 'active') && (p.next_payment_date || p.date))
            .filter(p => {
                const paymentDate = p.next_payment_date || p.date;
                if (!paymentDate) return false;
                // Compare dates without time part
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                return new Date(paymentDate) >= today;
            });

        if (futurePayments.length === 0) {
            return null;
        }

        // Sort by the soonest date
        futurePayments.sort((a, b) => {
            const dateA = new Date(a.next_payment_date || a.date);
            const dateB = new Date(b.next_payment_date || b.date);
            return dateA.getTime() - dateB.getTime();
        });

        return futurePayments[0];
    }, [payments]);

    return {
        tenantId,
        payments,
        isLoading,
        error,
        addPayment,
        upcomingPayment,
    };
};
