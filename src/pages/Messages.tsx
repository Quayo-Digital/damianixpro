
import { PageLayout } from '@/components/layout/PageLayout';
import { PageContent } from '@/components/layout/PageContent';
import { TenantMessages } from '@/components/communication/TenantMessages';

const Messages = () => {
  return (
    <PageLayout>
      <PageContent
        title="Messages"
        description="Communicate with your tenants directly"
      >
        <TenantMessages />
      </PageContent>
    </PageLayout>
  );
};

export default Messages;
