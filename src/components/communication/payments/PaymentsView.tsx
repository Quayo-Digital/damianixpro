import { Loader2, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Payment } from '@/utils/PaymentTypes';
import { PaymentReminder } from './PaymentReminder';
import { PaymentOverview } from './PaymentOverview';
import { PaymentHistory } from './PaymentHistory';

interface PaymentsViewProps {
  isLoading: boolean;
  error: string | null;
  upcomingPayment: Payment | null;
  payments: Payment[];
  onMakePayment: () => void;
}

export const PaymentsView = ({
  isLoading,
  error,
  upcomingPayment,
  payments,
  onMakePayment,
}: PaymentsViewProps) => {
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <div className="flex items-center space-x-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <div className="text-lg font-medium">Loading payment information...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive" className="mb-6">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <>
      {upcomingPayment && (
        <PaymentReminder
          dueDate={upcomingPayment.next_payment_date || upcomingPayment.date}
          amount={upcomingPayment.amount}
        />
      )}
      <PaymentOverview onMakePayment={onMakePayment} payments={payments} isLoading={isLoading} />
      <PaymentHistory payments={payments} isLoading={isLoading} />
    </>
  );
};
