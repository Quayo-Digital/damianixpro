import { PageLayout } from '@/components/layout/PageLayout';
import { PageContent } from '@/components/layout/PageContent';
import { TransactionDetailScreen } from '@/components/payments/TransactionDetailScreen';

export default function TransactionDetailPage() {
  return (
    <PageLayout>
      <PageContent title="Transaction Details" description="View payment information and actions">
        <TransactionDetailScreen />
      </PageContent>
    </PageLayout>
  );
}
