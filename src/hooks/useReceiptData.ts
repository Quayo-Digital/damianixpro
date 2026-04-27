import { useState, useEffect } from 'react';
import { Payment } from '@/utils/PaymentTypes';
import { generateReceipt, ReceiptData } from '@/utils/ReceiptGenerator';
import { usePaymentDetails } from './usePaymentDetails';

export const useReceiptData = (paymentId: string | undefined) => {
  const { payment, loading, tenantName, propertyName } = usePaymentDetails(paymentId);
  const [receiptUrl, setReceiptUrl] = useState('');

  // Generate receipt when payment data is available
  useEffect(() => {
    if (payment) {
      const receiptData: ReceiptData = {
        payment,
        tenantName,
        propertyName,
        companyName: 'Property Management System',
        companyAddress: '123 Main St, Lagos, Nigeria',
      };

      const receiptDataUrl = generateReceipt(receiptData);
      setReceiptUrl(receiptDataUrl);
    }
  }, [payment, tenantName, propertyName]);

  // Helper functions for printing and downloading receipt
  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Payment Receipt</title>
          </head>
          <body style="margin: 0; padding: 0;">
            <embed width="100%" height="100%" src="${receiptUrl}" type="application/pdf" />
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
      }, 1000);
    }
  };

  const handleDownload = () => {
    if (!payment) return;

    const link = document.createElement('a');
    link.href = receiptUrl;
    link.download = `Receipt-${payment.reference || 'payment'}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return {
    payment,
    loading,
    receiptUrl,
    tenantName,
    propertyName,
    handlePrint,
    handleDownload,
  };
};
