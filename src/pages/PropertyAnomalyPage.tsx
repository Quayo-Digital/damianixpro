import { PageLayout } from '@/components/layout/PageLayout';
import { PageContent } from '@/components/layout/PageContent';
import { PropertyAnomalyDetector } from '@/components/owner/PropertyAnomalyDetector';

export default function PropertyAnomalyPage() {
  return (
    <PageLayout>
      <PageContent
        title="Property Anomaly Detector"
        description="Scan property data to detect unusual patterns and explain why they matter"
      >
        <PropertyAnomalyDetector />
      </PageContent>
    </PageLayout>
  );
}
