import { PageLayout } from '@/components/layout/PageLayout';
import { PageContent } from '@/components/layout/PageContent';
import { PaymentStatusExplainer } from '@/components/tenants/PaymentStatusExplainer';

export default function PaymentStatusPage() {
  return (
    <PageLayout>
      <PageContent
        title="Payment Status Explainer"
        description="Understand your annual rental payment status in simple, clear language"
      >
        <PaymentStatusExplainer />
      </PageContent>
    </PageLayout>
  );
}
