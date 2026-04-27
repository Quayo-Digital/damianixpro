import { PageLayout } from '@/components/layout/PageLayout';
import { PageContent } from '@/components/layout/PageContent';
import { UsageAnalytics } from '@/components/analytics/UsageAnalytics';

export default function UsageAnalyticsPage() {
  return (
    <PageLayout>
      <PageContent
        title="Usage Analytics"
        description="Analyze platform usage data to identify UX issues and improvement opportunities"
      >
        <UsageAnalytics />
      </PageContent>
    </PageLayout>
  );
}
