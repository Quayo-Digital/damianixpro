import { PageLayout } from '@/components/layout/PageLayout';
import { SubscriptionDashboard } from '@/components/subscription/SubscriptionDashboard';

/**
 * Owner-facing subscription and billing (Flutterwave checkout, plan changes).
 */
export default function OwnerSubscriptionPage() {
  return (
    <PageLayout>
      <div className="container max-w-6xl py-6">
        <SubscriptionDashboard />
      </div>
    </PageLayout>
  );
}
