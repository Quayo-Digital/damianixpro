# Paystack Webhook Setup Guide for Short-Lets

Complete guide to setting up Paystack webhooks for the short-let booking system.

## Overview

The webhook endpoint receives real-time events from Paystack when payments are processed, transfers are completed, or refunds are issued. This ensures your database stays in sync with payment statuses.

## Prerequisites

- Supabase project with Edge Functions enabled
- Paystack account (test or live)
- Supabase CLI installed (for local development)

## Step 1: Deploy the Webhook Function

### Using Supabase CLI

```bash
# Navigate to your project root
cd /path/to/your/project

# Deploy the function
supabase functions deploy paystack-shortlet-webhook

# Set the webhook secret
supabase secrets set PAYSTACK_WEBHOOK_SECRET=your_webhook_secret_here
```

### Using Supabase Dashboard

1. Go to your Supabase project dashboard
2. Navigate to Edge Functions
3. Click "Create a new function"
4. Name it: `paystack-shortlet-webhook`
5. Copy the code from `supabase/functions/paystack-shortlet-webhook/index.ts`
6. Deploy the function

## Step 2: Get Your Webhook URL

After deployment, your webhook URL will be:

```
https://[your-project-ref].supabase.co/functions/v1/paystack-shortlet-webhook
```

Replace `[your-project-ref]` with your actual Supabase project reference.

You can find this in:
- Supabase Dashboard → Settings → API → Project URL

## Step 3: Configure Paystack Webhook

1. **Log in to Paystack Dashboard**
   - Go to https://dashboard.paystack.com
   - Navigate to Settings → Webhooks

2. **Add New Webhook**
   - Click "Add Webhook URL"
   - Enter your webhook URL from Step 2
   - Click "Save"

3. **Select Events**
   Enable the following events:
   - ✅ `charge.success` - Payment successful
   - ✅ `charge.failed` - Payment failed
   - ✅ `transfer.success` - Payout successful
   - ✅ `transfer.failed` - Payout failed
   - ✅ `refund.success` - Refund processed

4. **Get Webhook Secret**
   - After saving, click on your webhook
   - Copy the "Secret" value
   - This is your `PAYSTACK_WEBHOOK_SECRET`

5. **Set the Secret in Supabase**
   ```bash
   supabase secrets set PAYSTACK_WEBHOOK_SECRET=your_copied_secret
   ```

## Step 4: Test the Webhook

### Test with Paystack Test Mode

1. Use test keys in your application
2. Make a test payment using Paystack test card: `4084084084084081`
3. Check Paystack Dashboard → Webhooks → Your Webhook → Events
4. Verify the event was delivered successfully
5. Check your database to confirm updates

### Verify Database Updates

After a successful payment:

```sql
-- Check transaction was updated
SELECT * FROM transactions 
WHERE provider_ref = 'your_payment_reference' 
AND status = 'success';

-- Check booking was confirmed
SELECT * FROM bookings 
WHERE payment_reference = 'your_payment_reference' 
AND status = 'confirmed';

-- Check wallet was updated
SELECT * FROM wallets 
WHERE user_id = 'owner_user_id';
```

## Step 5: Monitor Webhook Events

### In Paystack Dashboard

1. Go to Settings → Webhooks
2. Click on your webhook
3. View "Recent Events" tab
4. Check delivery status and response codes

### In Supabase Dashboard

1. Go to Edge Functions
2. Click on `paystack-shortlet-webhook`
3. View "Logs" tab
4. Check for any errors or warnings

## Webhook Event Flow

### Payment Success Flow

```
1. Guest makes payment → Paystack processes
2. Paystack sends charge.success webhook
3. Webhook function receives event
4. Verifies signature
5. Updates transaction status
6. Confirms booking (if pending)
7. Updates owner wallet (pending balance)
8. Returns success response
```

### Payout Success Flow

```
1. Owner requests payout → System initiates transfer
2. Paystack processes transfer
3. Paystack sends transfer.success webhook
4. Webhook function receives event
5. Verifies signature
6. Updates transaction status
7. Moves funds from balance to paid_out
8. Returns success response
```

## Security Best Practices

### ✅ Do's

- Always verify webhook signatures
- Use HTTPS for webhook URLs
- Store webhook secret securely (Supabase secrets)
- Log all webhook events for audit
- Implement idempotency (handle duplicate events)
- Rate limit webhook endpoint (if exposed publicly)

### ❌ Don'ts

- Don't expose webhook secret in code
- Don't skip signature verification
- Don't process webhooks without authentication
- Don't trust webhook data without verification

## Troubleshooting

### Webhook Not Receiving Events

**Problem:** Paystack shows webhook as not delivered

**Solutions:**
1. Check webhook URL is correct and accessible
2. Verify function is deployed and active
3. Check Supabase function logs for errors
4. Ensure webhook secret is set correctly
5. Test with Paystack's "Send Test Event" feature

### Signature Verification Failing

**Problem:** Webhook returns 401 Invalid signature

**Solutions:**
1. Verify `PAYSTACK_WEBHOOK_SECRET` matches Paystack dashboard
2. Ensure raw request body is used for verification (not parsed JSON)
3. Check that signature header is present: `x-paystack-signature`
4. Verify HMAC SHA512 algorithm is used

### Database Updates Not Happening

**Problem:** Webhook receives events but database doesn't update

**Solutions:**
1. Check Supabase service role key is set correctly
2. Verify RLS policies allow service role access
3. Check function logs for database errors
4. Verify transaction references match
5. Check for foreign key constraints

### Duplicate Events

**Problem:** Same event processed multiple times

**Solutions:**
1. Implement idempotency checks
2. Check transaction status before updating
3. Use database transactions for atomic updates
4. Log processed event IDs to prevent duplicates

## Local Development

### Testing Locally

1. **Start Supabase locally:**
   ```bash
   supabase start
   ```

2. **Serve function locally:**
   ```bash
   supabase functions serve paystack-shortlet-webhook
   ```

3. **Use ngrok or similar to expose local endpoint:**
   ```bash
   ngrok http 54321
   ```

4. **Update Paystack webhook URL to ngrok URL** (for testing only)

5. **Test with Paystack test events**

### Environment Variables

For local development, create `.env.local`:

```env
PAYSTACK_WEBHOOK_SECRET=your_test_webhook_secret
SUPABASE_URL=http://localhost:54321
SUPABASE_SERVICE_ROLE_KEY=your_local_service_role_key
```

## Production Checklist

Before going live:

- [ ] Deploy function to production Supabase project
- [ ] Set production webhook secret
- [ ] Configure Paystack production webhook URL
- [ ] Test with small real payment
- [ ] Monitor logs for 24 hours
- [ ] Set up alerts for webhook failures
- [ ] Document webhook URL for team
- [ ] Backup webhook secret securely

## Support

For issues:
1. Check Supabase function logs
2. Check Paystack webhook delivery logs
3. Review database for transaction records
4. Contact support with webhook event IDs

## Additional Resources

- [Paystack Webhook Documentation](https://paystack.com/docs/payments/webhooks/)
- [Supabase Edge Functions Docs](https://supabase.com/docs/guides/functions)
- [Webhook Security Best Practices](https://paystack.com/docs/payments/webhooks/#security)

