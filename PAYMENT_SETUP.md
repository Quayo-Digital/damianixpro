# Payment Setup – Flutterwave

The app uses **Flutterwave** as the payment provider. Secret keys are stored server-side only.

## 1. Set Supabase secrets

Run from project root:

```bash
# Flutterwave (required)
supabase secrets set FLUTTERWAVE_SECRET_KEY=FLWSECK_your_secret_key
supabase secrets set FLUTTERWAVE_SECRET_HASH=your_webhook_secret_hash
supabase secrets set FLUTTERWAVE_BASE_URL=https://api.flutterwave.com/v3
```

## 2. Frontend env (public keys only)

In `.env`:

```
# Flutterwave
VITE_FLUTTERWAVE_PUBLIC_KEY=FLWPUBK_your_public_key
VITE_FLUTTERWAVE_BASE_URL=https://api.flutterwave.com/v3
```

**Do not** put secret keys (`VITE_*_SECRET_KEY`) in the frontend.

## 3. Deploy Edge Functions

```bash
supabase functions deploy flutterwave-payments
supabase functions deploy flutterwave-webhook
supabase functions deploy flutterwave-shortlet-webhook
```

## 4. Configure Flutterwave webhooks

In Flutterwave Dashboard → Settings → Webhooks, add:

- Rent payments: `https://YOUR_PROJECT_REF.supabase.co/functions/v1/flutterwave-webhook`
- Shortlet: `https://YOUR_PROJECT_REF.supabase.co/functions/v1/flutterwave-shortlet-webhook`

## 5. Configuration summary

- **Rent/maintenance payments** – Flutterwave
- **Shortlet booking payments** – Flutterwave
- **Payment verification** – Flutterwave
- **Bank account resolution** – Flutterwave
- **Shortlet owner payouts** – Flutterwave
