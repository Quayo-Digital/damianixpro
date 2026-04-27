import React from 'react';
import { Receipt } from 'lucide-react';
import { Payment } from '@/utils/PaymentTypes';
import { Skeleton } from '@/components/ui/skeleton';

interface ReceiptViewerProps {
  payment: Payment | null;
  receiptUrl: string;
  loading: boolean;
}

export const ReceiptViewer: React.FC<ReceiptViewerProps> = ({ payment, receiptUrl, loading }) => {
  if (loading) {
    return <Skeleton className="h-[600px] w-full" />;
  }

  if (!payment) {
    return (
      <div className="p-6 text-center">
        <p className="text-muted-foreground">Receipt not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-xl font-semibold">
          <Receipt className="h-5 w-5" /> Receipt #{payment.reference}
        </h2>
      </div>

      {receiptUrl ? (
        <iframe
          src={receiptUrl}
          width="100%"
          height="600px"
          style={{ border: '1px solid #e2e8f0', borderRadius: '0.5rem' }}
          title="Payment Receipt"
        />
      ) : (
        <div className="flex h-[600px] items-center justify-center rounded-md border">
          <p>Loading receipt...</p>
        </div>
      )}
    </div>
  );
};
