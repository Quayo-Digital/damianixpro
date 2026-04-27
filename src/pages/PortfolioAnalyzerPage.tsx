import { PageLayout } from '@/components/layout/PageLayout';
import { PageContent } from '@/components/layout/PageContent';
import { PortfolioAnalyzer } from '@/components/owner/PortfolioAnalyzer';

export default function PortfolioAnalyzerPage() {
  return (
    <PageLayout>
      <PageContent
        title="Portfolio Analyzer"
        description="Analyze your property portfolio and get actionable insights"
      >
        <PortfolioAnalyzer />
      </PageContent>
    </PageLayout>
  );
}
