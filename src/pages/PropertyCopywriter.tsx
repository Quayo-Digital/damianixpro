import { PageLayout } from '@/components/layout/PageLayout';
import { PageContent } from '@/components/layout/PageContent';
import { PropertyCopywriter } from '@/components/properties/PropertyCopywriter';

export default function PropertyCopywriterPage() {
  return (
    <PageLayout>
      <PageContent
        title="Property Copywriter"
        description="Generate professional property descriptions for your listings"
      >
        <PropertyCopywriter />
      </PageContent>
    </PageLayout>
  );
}
