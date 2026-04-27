import { PageLayout } from '@/components/layout/PageLayout';
import { PageContent } from '@/components/layout/PageContent';
import { PaymentValidator } from '@/components/billing/PaymentValidator';

export default function PaymentValidatorPage() {
  return (
    <PageLayout>
      <PageContent
        title="Payment Validator"
        description="Validate payment attempts and get detailed breakdowns before processing"
      >
        <PaymentValidator />
      </PageContent>
    </PageLayout>
  );
}
