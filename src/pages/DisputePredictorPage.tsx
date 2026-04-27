import { PageLayout } from '@/components/layout/PageLayout';
import { PageContent } from '@/components/layout/PageContent';
import { DisputePredictor } from '@/components/tenants/DisputePredictor';

export default function DisputePredictorPage() {
  return (
    <PageLayout>
      <PageContent
        title="Dispute Predictor"
        description="Analyze tenant patterns to predict potential disputes and get preventive recommendations"
      >
        <DisputePredictor />
      </PageContent>
    </PageLayout>
  );
}
