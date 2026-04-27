import { Navigate } from 'react-router-dom';
import { PageLayout } from '@/components/layout/PageLayout';
import { PageContent } from '@/components/layout/PageContent';
import { TenantInspections } from '@/components/communication/TenantInspections';
import { useAuthSession } from '@/contexts/auth';

export default function TenantInspectionsPage() {
  const { user, userRole } = useAuthSession();

  if (!user || userRole !== 'tenant') {
    return <Navigate to="/unauthorized" replace />;
  }

  return (
    <PageLayout>
      <PageContent title="Inspections" description="Scheduled and completed unit inspections">
        <TenantInspections />
      </PageContent>
    </PageLayout>
  );
}
