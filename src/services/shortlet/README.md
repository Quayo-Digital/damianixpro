# Short-Let System - Paystack Integration

## Overview

This directory contains the Paystack payment integration for the short-let booking system. It handles payment initialization, verification, refunds, and payouts.

## Configuration

Add the following environment variables to your `.env` file:

```env
VITE_PAYSTACK_PUBLIC_KEY=pk_test_your_public_key
VITE_PAYSTACK_BASE_URL=https://api.paystack.co  # Optional, defaults to this
```

`VITE_*` values are public in browser bundles. Keep Paystack secret keys in server-side runtime only (for example, Supabase Edge Function secrets), not in frontend env files.

## Usage

### Initialize Payment for Booking

```typescript
import { initializeBookingPayment } from '@/services/shortlet/api/transactions';

const result = await initializeBookingPayment(
  bookingId,
  'guest@example.com',
  50000, // Amount in Naira
  'https://yourapp.com/payment/callback'
);

if (result.payment_url) {
  // Redirect user to payment_url
  window.location.href = result.payment_url;
}
```

### Verify Payment

```typescript
import { verifyBookingPayment } from '@/services/shortlet/api/transactions';

const result = await verifyBookingPayment(reference);

if (result.success) {
  // Payment verified, booking confirmed
  console.log('Booking:', result.booking);
}
```

### Using React Hook

```typescript
import { useShortletPayment } from '@/hooks/useShortletPayment';

function BookingComponent() {
  const { initializePayment, verifyPayment, isLoading } = useShortletPayment();

  const handlePay = async () => {
    const result = await initializePayment(bookingId, amount);
    if (result.payment_url) {
      window.location.href = result.payment_url;
    }
  };

  // After redirect from Paystack
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const reference = urlParams.get('reference');
    if (reference) {
      verifyPayment(reference);
    }
  }, []);
}
```

## Webhook Setup

### Paystack Webhook Configuration

1. Go to Paystack Dashboard → Settings → Webhooks
2. Add webhook URL: `https://yourdomain.com/api/webhooks/paystack`
3. Select events:
   - `charge.success`
   - `charge.failed`
   - `transfer.success`
   - `transfer.failed`
   - `refund.success`

### Webhook Handler

```typescript
import { handlePaystackWebhook } from '@/services/shortlet/api/webhooks';

// In your API route handler
export async function POST(request: Request) {
  const payload = await request.json();
  const signature = request.headers.get('x-paystack-signature');

  // Verify signature (implement proper verification)
  const result = await handlePaystackWebhook(payload);

  return Response.json(result);
}
```

## Features

### Payment Initialization

- Creates payment intent with Paystack
- Stores transaction record in database
- Returns payment URL for redirect

### Payment Verification

- Verifies payment status with Paystack
- Updates transaction and booking status
- Handles automatic booking confirmation

### Refunds

- Processes full or partial refunds
- Updates booking status to 'refunded'
- Creates refund transaction record

### Payouts (Owner Wallets)

- Creates transfer recipients
- Initiates transfers to owner bank accounts
- Verifies transfer status

## Security Notes

1. **Never expose secret keys** in client-side code
2. **Verify webhook signatures** in production
3. **Use HTTPS** for all payment endpoints
4. **Implement rate limiting** on payment endpoints
5. **Log all payment events** for audit trail

## Testing

### Test Keys

- Use Paystack test keys for development
- Test with Paystack test cards
- Verify webhook events in Paystack dashboard

### Test Cards

- Success: `4084084084084081`
- Insufficient Funds: `5060666666666666669`
- Declined: `5060666666666666667`

## Error Handling

All payment functions return structured responses:

```typescript
{
  success: boolean;
  error?: string;
  // ... other fields
}
```

Always check `success` before proceeding with payment flow.

## Next Steps

1. Implement webhook endpoint in your API
2. Add payment status polling for pending payments
3. Implement retry logic for failed payments
4. Add payment analytics and reporting
5. Set up payout approval workflow
