import { PageLayout } from '@/components/layout/PageLayout';
import { PageContent } from '@/components/layout/PageContent';
import { OwnerPayments } from '@/components/owner/OwnerPayments';

const OwnerPaymentsPage = () => {
  return (
    <PageLayout>
      <PageContent
        title="Payment management"
        description="Track and manage your property income, fees, and commissions."
      >
        <OwnerPayments />
      </PageContent>
    </PageLayout>
  );
};

export default OwnerPaymentsPage;
