import { useState, useEffect } from 'react';
import { fetchPayments, recordPayment, updatePaymentStatus } from '@/services/payments';
import { Payment } from '@/utils/PaymentTypes';
import { useAuth } from '@/contexts/AuthContext';

export const usePayments = (tenantId?: string) => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    const loadPayments = async () => {
      setLoading(true);
      try {
        const data = await fetchPayments(tenantId);
        setPayments(data);
        setError(null);
      } catch (err) {
        console.error('Error in usePayments hook:', err);
        setError('Failed to load payment data');
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      loadPayments();
    }
  }, [user, tenantId]);

  const addPayment = async (payment: Omit<Payment, 'id'>) => {
    const newPayment = await recordPayment(payment);
    if (newPayment) {
      setPayments(prevPayments => [newPayment, ...prevPayments]);
      return true;
    }
    return false;
  };

  const updateStatus = async (id: string, status: 'successful' | 'pending' | 'failed' | 'active') => {
    const success = await updatePaymentStatus(id, status);
    if (success) {
      setPayments(prevPayments =>
        prevPayments.map(payment =>
          payment.id === id ? { ...payment, status } : payment
        )
      );
    }
    return success;
  };

  const getPendingPayments = () => payments.filter(p => p.status === 'pending');
  
  const getSuccessfulPayments = () => payments.filter(p => p.status === 'successful');
  
  const getFailedPayments = () => payments.filter(p => p.status === 'failed');
  
  const getTotalReceived = () => 
    payments
      .filter(p => p.status === 'successful')
      .reduce((sum, payment) => sum + payment.amount, 0);

  return {
    payments,
    loading,
    error,
    addPayment,
    updateStatus,
    getPendingPayments,
    getSuccessfulPayments,
    getFailedPayments,
    getTotalReceived
  };
};
