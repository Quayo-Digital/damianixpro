import { Navigate } from 'react-router-dom';
import { PageLayout } from '@/components/layout/PageLayout';
import { PageContent } from '@/components/layout/PageContent';
import { TemplatesManager } from '@/components/communication/TemplatesManager';
import { useAuthSession } from '@/contexts/auth';

export default function TenantTemplatesPage() {
  const { user, userRole } = useAuthSession();

  if (!user || userRole !== 'tenant') {
    return <Navigate to="/unauthorized" replace />;
  }

  return (
    <PageLayout>
      <PageContent
        title="Templates"
        description="Communication templates for messages to your landlord or manager"
      >
        <TemplatesManager />
      </PageContent>
    </PageLayout>
  );
}
