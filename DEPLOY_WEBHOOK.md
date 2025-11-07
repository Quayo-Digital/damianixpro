# Quick Deploy Guide: Paystack Short-Let Webhook

## 🚀 Quick Start (5 minutes)

### Step 1: Deploy Function

```bash
# Make sure you're in the project root
cd /path/to/damianixpro-nigeria-homes-main

# Deploy the function
supabase functions deploy paystack-shortlet-webhook
```

### Step 2: Get Your Webhook URL

After deployment, your webhook URL is:
```
https://[your-project-ref].supabase.co/functions/v1/paystack-shortlet-webhook
```

Find your project ref in: Supabase Dashboard → Settings → API → Project URL

### Step 3: Configure in Paystack

1. Go to https://dashboard.paystack.com → Settings → Webhooks
2. Click "Add Webhook URL"
3. Paste your webhook URL
4. Select these events:
   - ✅ charge.success
   - ✅ charge.failed
   - ✅ transfer.success
   - ✅ transfer.failed
   - ✅ refund.success
5. Click "Save"
6. **Copy the webhook secret** (shown after saving)

### Step 4: Set Webhook Secret

```bash
supabase secrets set PAYSTACK_WEBHOOK_SECRET=your_copied_secret_here
```

### Step 5: Test It

1. Make a test payment in your app
2. Check Paystack Dashboard → Webhooks → Your Webhook → Events
3. Verify event shows "Delivered" with status 200
4. Check your database - booking should be confirmed!

## ✅ Done!

Your webhook is now live and processing Paystack events automatically.

## 🔍 Verify It's Working

Check the function logs:
```bash
supabase functions logs paystack-shortlet-webhook
```

Or in Supabase Dashboard:
- Edge Functions → paystack-shortlet-webhook → Logs

## 🐛 Troubleshooting

**Webhook not receiving events?**
- Check webhook URL is correct
- Verify function is deployed
- Check Paystack webhook is active

**Signature verification failing?**
- Ensure `PAYSTACK_WEBHOOK_SECRET` matches Paystack dashboard
- Check secret was set correctly: `supabase secrets list`

**Database not updating?**
- Check function logs for errors
- Verify service role key is set
- Check RLS policies allow service role

## 📚 Full Documentation

See `WEBHOOK_SETUP_GUIDE.md` for detailed setup and troubleshooting.

