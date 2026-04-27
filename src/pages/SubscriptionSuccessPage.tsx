import { FlutterwaveReturnView } from '@/components/payments/FlutterwaveReturnView';

/**
 * Return URL after Flutterwave subscription checkout.
 * Query params: status, tx_ref, transaction_id (Flutterwave default redirect)
 */
export default function SubscriptionSuccessPage() {
  return <FlutterwaveReturnView context="subscription" />;
}
