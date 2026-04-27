import { useState } from 'react';
import { PaymentDialog } from './payments/PaymentDialog';
import { Payment } from '@/utils/PaymentTypes';
import { toast } from '@/components/ui/sonner';
import { useTenantPayments } from './payments/hooks/useTenantPayments';
import { PaymentsView } from './payments/PaymentsView';

interface TenantPaymentsProps {
  isDialogOpen?: boolean;
  setIsDialogOpen?: (isOpen: boolean) => void;
}

export const TenantPayments = ({ isDialogOpen, setIsDialogOpen }: TenantPaymentsProps) => {
  const { tenantId, payments, isLoading, error, addPayment, upcomingPayment } = useTenantPayments();

  // Use the prop if provided, otherwise use local state
  const [localIsDialogOpen, setLocalIsDialogOpen] = useState(false);
  const isPaymentDialogOpen = isDialogOpen !== undefined ? isDialogOpen : localIsDialogOpen;
  const setIsPaymentDialogOpen = setIsDialogOpen || setLocalIsDialogOpen;

  const handlePaymentSuccess = (payment: Payment) => {
    addPayment(payment);
    toast.success('Payment recorded successfully');
  };

  return (
    <div className="space-y-6">
      <PaymentsView
        isLoading={isLoading}
        error={error}
        upcomingPayment={upcomingPayment}
        payments={payments}
        onMakePayment={() => setIsPaymentDialogOpen(true)}
      />

      {/* Payment dialog */}
      <PaymentDialog
        isOpen={isPaymentDialogOpen}
        setIsOpen={setIsPaymentDialogOpen}
        onPaymentSuccess={handlePaymentSuccess}
        tenantId={tenantId}
      />
    </div>
  );
};
