import { Navigate } from 'react-router-dom';
import { PageLayout } from '@/components/layout/PageLayout';
import { PageContent } from '@/components/layout/PageContent';
import { TenantAnnouncements } from '@/components/communication/TenantAnnouncements';
import { useAuthSession } from '@/contexts/auth';

export default function TenantAnnouncementsPage() {
  const { user, userRole } = useAuthSession();

  if (!user || userRole !== 'tenant') {
    return <Navigate to="/unauthorized" replace />;
  }

  return (
    <PageLayout>
      <PageContent
        title="Announcements"
        description="Building and community updates from your property manager"
      >
        <TenantAnnouncements />
      </PageContent>
    </PageLayout>
  );
}
