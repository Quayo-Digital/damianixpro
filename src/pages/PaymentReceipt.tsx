
import { useParams } from 'react-router-dom';
import { PageContent } from '@/components/layout/PageContent';
import { Card, CardContent } from '@/components/ui/card';
import { ReceiptViewer } from '@/components/payments/receipt/ReceiptViewer';
import { ReceiptActions } from '@/components/payments/receipt/ReceiptActions';
import { useReceiptData } from '@/hooks/useReceiptData';

const PaymentReceipt = () => {
  const { paymentId } = useParams<{ paymentId: string }>();
  const {
    payment,
    loading,
    receiptUrl,
    handlePrint,
    handleDownload
  } = useReceiptData(paymentId);
  
  return (
    <PageContent
      title="Payment Receipt"
      description="View and download your payment receipt"
    >
      <ReceiptActions 
        onPrint={handlePrint}
        onDownload={handleDownload}
      />
      
      <Card>
        <CardContent className="p-6">
          <ReceiptViewer 
            payment={payment}
            receiptUrl={receiptUrl}
            loading={loading}
          />
        </CardContent>
      </Card>
    </PageContent>
  );
};

export default PaymentReceipt;
