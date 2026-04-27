# Flutterwave Payments Edge Function

Handles payment initialization, verification, and refunds. Keeps `FLUTTERWAVE_SECRET_KEY` server-side only.

## Setup

1. **Set Supabase secrets** (run from project root):

   ```bash
   supabase secrets set FLUTTERWAVE_SECRET_KEY=FLWSECK_your_secret_key
   supabase secrets set FLUTTERWAVE_BASE_URL=https://api.flutterwave.com/v3
   ```

2. **Frontend env** (`.env` – public keys only):
   ```
   VITE_FLUTTERWAVE_PUBLIC_KEY=FLWPUBK_your_public_key
   VITE_FLUTTERWAVE_BASE_URL=https://api.flutterwave.com/v3
   ```

## Actions

- **initialize** – Create payment, returns link
- **verify** – Verify payment by tx_ref
- **refund** – Create refund

Requires `Authorization: Bearer <user_jwt>` for all requests.
