import { Navigate } from 'react-router-dom';
import { PageLayout } from '@/components/layout/PageLayout';
import { PageContent } from '@/components/layout/PageContent';
import { ResidentCommunityBoard } from '@/components/resident/ResidentCommunityBoard';
import { useAuthSession } from '@/contexts/auth';
import { useTenantPrimaryPropertyId } from '@/hooks/useTenantPrimaryPropertyId';

export default function TenantCommunityPage() {
  const { user, userRole } = useAuthSession();
  const tenantPropertyId = useTenantPrimaryPropertyId();

  if (!user || userRole !== 'tenant') {
    return <Navigate to="/unauthorized" replace />;
  }

  return (
    <PageLayout>
      <PageContent
        title="Community board"
        description="Building-scoped posts shared with neighbors at your property"
      >
        <ResidentCommunityBoard propertyId={tenantPropertyId} />
      </PageContent>
    </PageLayout>
  );
}
