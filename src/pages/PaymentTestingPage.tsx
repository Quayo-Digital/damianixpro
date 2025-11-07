import React from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import { PageContent } from '@/components/layout/PageContent';
import { PaymentFunctionalityTest } from '@/components/testing/PaymentFunctionalityTest';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CreditCard, AlertTriangle } from 'lucide-react';

const PaymentTestingPage: React.FC = () => {
  return (
    <PageLayout>
      <PageContent 
        title="Payment System Testing" 
        description="Comprehensive testing suite for payment functionality"
      >
        <div className="space-y-6">
          <Alert>
            <CreditCard className="h-4 w-4" />
            <AlertDescription>
              This page provides comprehensive testing for the payment system including Paystack, Flutterwave, bank transfers, and USSD codes.
              Test all payment functionality to ensure everything works correctly.
            </AlertDescription>
          </Alert>

          <PaymentFunctionalityTest />
        </div>
      </PageContent>
    </PageLayout>
  );
};

export default PaymentTestingPage;
