import { PageLayout } from '@/components/layout/PageLayout';
import { PageContent } from '@/components/layout/PageContent';
import { PropertyAnalyzer } from '@/components/properties/PropertyAnalyzer';

export default function PropertyAnalyzerPage() {
  return (
    <PageLayout>
      <PageContent
        title="Property Financial Analyzer"
        description="Get rent, deposit, utility, and maintenance recommendations for your properties"
      >
        <PropertyAnalyzer />
      </PageContent>
    </PageLayout>
  );
}
