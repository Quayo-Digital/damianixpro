import { PaymentWebhookInterpreter } from '@/components/billing/PaystackWebhookInterpreter';

export default function PaymentWebhookPage() {
  return (
    <div className="container mx-auto py-6">
      <PaymentWebhookInterpreter />
    </div>
  );
}
