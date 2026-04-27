# Flutterwave Webhook

Handles Flutterwave `charge.completed` for:

1. **Subscriptions** — `tx_ref` starts with `SUB_`, `meta.payment_type` is `subscription`, and `meta` includes `user_id`, `plan_tier`, `billing_cycle`. Upserts `user_subscriptions` using `subscription_plans` rows matched by `tier`.
2. **Rent payments** — Existing flow: updates `rent_payments`, `payment_breakdowns`, journal entries when `reference` / `meta.internal_payment_id` matches a rent payment.

Configure **one** webhook URL in Flutterwave that points to this function.

## Setup

### 1. Deploy the function

```bash
supabase functions deploy flutterwave-webhook
```

### 2. Set the secret hash

1. In [Flutterwave Dashboard](https://dashboard.flutterwave.com) → Settings → Webhooks
2. Create a **Secret Hash** (random secure string) and save it
3. Set it in Supabase:

```bash
supabase secrets set FLUTTERWAVE_SECRET_HASH=your_secret_hash
```

### 3. Configure webhook URL in Flutterwave

1. Flutterwave Dashboard → Settings → Webhooks
2. Add webhook URL: `https://YOUR_PROJECT_REF.supabase.co/functions/v1/flutterwave-webhook`
3. Save the same **Secret Hash** you set in Supabase

## Subscription checkout

The app initializes Flutterwave via the `flutterwave-payments` edge function with:

- `tx_ref`: `SUB_*`
- `meta.user_id`, `meta.plan_tier`, `meta.billing_cycle`, `meta.payment_type`: `subscription`

Ensure `subscription_plans` is seeded (see migration `20260322130000_seed_subscription_plans.sql`) so the webhook can resolve a UUID `plan_id` by tier.

## Rent payment flow

For rent, a `rent_payment` record must exist before checkout. The `reference` on `rent_payments` should match the `tx_ref` used when initializing Flutterwave, or pass `meta.internal_payment_id` with the `rent_payments.id`.

## Event handling

- **charge.completed** (status succeeded / successful): subscription branch first, then rent branch if not a subscription charge
- Other events: Acknowledged with 200, no processing
