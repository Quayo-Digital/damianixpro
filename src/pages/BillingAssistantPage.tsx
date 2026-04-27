import { PageLayout } from '@/components/layout/PageLayout';
import { PageContent } from '@/components/layout/PageContent';
import { BillingIntelligenceAssistant } from '@/components/billing/BillingIntelligenceAssistant';

export default function BillingAssistantPage() {
  return (
    <PageLayout>
      <PageContent
        title="Billing Intelligence Assistant"
        description="Get clear explanations about payments, billing, and financial matters"
      >
        <BillingIntelligenceAssistant />
      </PageContent>
    </PageLayout>
  );
}
