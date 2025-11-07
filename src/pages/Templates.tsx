
import { PageLayout } from '@/components/layout/PageLayout';
import { PageContent } from '@/components/layout/PageContent';
import { TemplatesManager } from '@/components/communication/TemplatesManager';

const Templates = () => {
  return (
    <PageLayout>
      <PageContent
        title="Communication Templates"
        description="Create, edit, and manage your SMS and email templates."
      >
        <TemplatesManager />
      </PageContent>
    </PageLayout>
  );
};

export default Templates;
