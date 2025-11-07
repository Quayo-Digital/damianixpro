# Paystack Short-Let Webhook Handler

Supabase Edge Function to handle Paystack webhook events for short-let bookings.

## Setup

### 1. Deploy the Function

```bash
# Using Supabase CLI
supabase functions deploy paystack-shortlet-webhook
```

### 2. Configure Environment Variables

Set the following secrets in your Supabase project:

```bash
supabase secrets set PAYSTACK_WEBHOOK_SECRET=your_webhook_secret
```

You can find your webhook secret in:
- Paystack Dashboard → Settings → Webhooks → Your Webhook → Secret

### 3. Configure Paystack Webhook

1. Go to Paystack Dashboard → Settings → Webhooks
2. Click "Add Webhook URL"
3. Enter: `https://your-project-ref.supabase.co/functions/v1/paystack-shortlet-webhook`
4. Select events:
   - ✅ `charge.success`
   - ✅ `charge.failed`
   - ✅ `transfer.success`
   - ✅ `transfer.failed`
   - ✅ `refund.success`
5. Copy the webhook secret and set it as `PAYSTACK_WEBHOOK_SECRET`

## Events Handled

### charge.success
- Verifies payment transaction
- Updates transaction status to 'success'
- Confirms pending bookings
- Updates owner wallet (pending balance)

### charge.failed
- Updates transaction status to 'failed'
- Logs failure for debugging

### transfer.success
- Updates payout transaction status
- Moves funds from wallet balance to paid_out
- Records successful payout

### transfer.failed
- Updates payout transaction status to 'failed'
- Keeps funds in wallet for retry

### refund.success
- Updates refund transaction status
- Updates booking status to 'refunded'
- Records refund completion

## Testing

### Using Paystack Test Mode

1. Use test keys in your environment
2. Make a test payment
3. Check Paystack dashboard for webhook delivery status
4. Verify database updates

### Manual Testing with curl

```bash
curl -X POST https://your-project-ref.supabase.co/functions/v1/paystack-shortlet-webhook \
  -H "Content-Type: application/json" \
  -H "x-paystack-signature: your_signature" \
  -d '{
    "event": "charge.success",
    "data": {
      "reference": "test_ref_123",
      "status": "success",
      "amount": 5000000,
      "metadata": {
        "booking_id": "booking-uuid"
      }
    }
  }'
```

## Monitoring

Check function logs in Supabase Dashboard:
- Dashboard → Edge Functions → paystack-shortlet-webhook → Logs

## Security

- ✅ Signature verification using HMAC SHA512
- ✅ Service role key for database access
- ✅ CORS headers configured
- ✅ Error handling and logging

## Troubleshooting

### Webhook not receiving events
1. Check Paystack webhook configuration
2. Verify webhook URL is correct
3. Check function logs for errors
4. Verify `PAYSTACK_WEBHOOK_SECRET` is set correctly

### Signature verification failing
1. Ensure webhook secret matches Paystack dashboard
2. Check that raw body is used for signature verification
3. Verify signature header is present

### Database updates not happening
1. Check Supabase service role key is set
2. Verify RLS policies allow service role access
3. Check function logs for database errors

