import { Navigate } from 'react-router-dom';
import { PageLayout } from '@/components/layout/PageLayout';
import { PageContent } from '@/components/layout/PageContent';
import { FinancialOverview } from '@/components/communication/financial/FinancialOverview';
import { useAuthSession } from '@/contexts/auth';

export default function TenantFinancialPage() {
  const { user, userRole } = useAuthSession();

  if (!user || userRole !== 'tenant') {
    return <Navigate to="/unauthorized" replace />;
  }

  return (
    <PageLayout>
      <PageContent title="Financial overview" description="Track rental payments and expenses">
        <FinancialOverview />
      </PageContent>
    </PageLayout>
  );
}
