import { PageLayout } from '@/components/layout/PageLayout';
import { PageContent } from '@/components/layout/PageContent';
import { MaintenanceRequestClassifier } from '@/components/maintenance/MaintenanceRequestClassifier';

export default function MaintenanceClassifierPage() {
  return (
    <PageLayout>
      <PageContent
        title="Maintenance Request Classifier"
        description="Classify maintenance requests and get recommendations for resolution"
      >
        <MaintenanceRequestClassifier />
      </PageContent>
    </PageLayout>
  );
}
