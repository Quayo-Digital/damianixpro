import { PageLayout } from '@/components/layout/PageLayout';
import { PageContent } from '@/components/layout/PageContent';
import { ExecutiveAnalyticsDashboard } from '@/components/analytics/ExecutiveAnalyticsDashboard';

export default function ExecutiveAnalyticsPage() {
  return (
    <PageLayout>
      <PageContent
        title="Executive analytics"
        description="Portfolio revenue, collections, occupancy, maintenance spend, and top properties."
      >
        <ExecutiveAnalyticsDashboard />
      </PageContent>
    </PageLayout>
  );
}
