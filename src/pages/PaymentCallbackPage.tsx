import { FlutterwaveReturnView } from '@/components/payments/FlutterwaveReturnView';

/**
 * Public return URL used by Flutterwave redirect_url (e.g. /payment/callback?tx_ref=…&status=…).
 */
export default function PaymentCallbackPage() {
  return <FlutterwaveReturnView context="payment" />;
}
