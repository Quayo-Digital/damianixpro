import { useSearchParams } from 'react-router-dom';
import { PageLayout } from '@/components/layout/PageLayout';
import { PageContent } from '@/components/layout/PageContent';
import { TenantMessages } from '@/components/communication/TenantMessages';
import { TenantToLandlordMessages } from '@/components/communication/TenantToLandlordMessages';
import { useAuthSession } from '@/contexts/auth';

const Messages = () => {
  const { userRole } = useAuthSession();
  const [searchParams] = useSearchParams();
  const initialUserId = searchParams.get('userId');

  // Show tenant-specific view if user is a tenant
  const isTenant = userRole === 'tenant';

  return (
    <PageLayout>
      <PageContent
        title="Messages"
        description={
          isTenant
            ? 'Communicate with your landlord or property agent'
            : 'Communicate with your tenants directly'
        }
      >
        {isTenant ? (
          <TenantToLandlordMessages />
        ) : (
          <TenantMessages initialUserId={initialUserId ?? undefined} />
        )}
      </PageContent>
    </PageLayout>
  );
};

export default Messages;
