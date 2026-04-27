import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Calendar, Bell } from 'lucide-react';
import { format } from 'date-fns';

interface PaymentReminderProps {
  dueDate: string;
  amount: number;
}

export const PaymentReminder = ({ dueDate, amount }: PaymentReminderProps) => {
  const today = new Date();
  const paymentDue = new Date(dueDate);
  const daysUntilDue = Math.ceil((paymentDue.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  // Only show reminder if payment is due within the next week
  if (daysUntilDue <= 0 || daysUntilDue > 7) {
    return null;
  }

  return (
    <Alert className="border-amber-200 bg-amber-50 text-amber-800">
      <Bell className="h-4 w-4" />
      <AlertTitle>Upcoming Rent Payment</AlertTitle>
      <AlertDescription className="flex flex-col space-y-2">
        <p>
          Your rent payment of ₦{amount.toLocaleString()} is due on{' '}
          {format(paymentDue, 'MMMM d, yyyy')}.
        </p>
        <p className="text-sm">Please ensure you make your payment on time to avoid late fees.</p>
        <div className="mt-2 flex items-center">
          <Calendar className="mr-1 h-4 w-4" />
          <span className="text-sm font-medium">
            {daysUntilDue} {daysUntilDue === 1 ? 'day' : 'days'} remaining
          </span>
        </div>
      </AlertDescription>
    </Alert>
  );
};
