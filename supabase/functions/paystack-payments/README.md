# Paystack Payments Edge Function

Handles payment initialization, verification, and refunds. Keeps `PAYSTACK_SECRET_KEY` server-side only.

## Setup

1. **Set Supabase secrets** (run from project root):

   ```bash
   supabase secrets set PAYSTACK_SECRET_KEY=sk_live_your_secret_key
   supabase secrets set PAYSTACK_BASE_URL=https://api.paystack.co
   ```

2. **Frontend env** (`.env` – public keys only):
   ```
   VITE_PAYSTACK_PUBLIC_KEY=pk_live_your_public_key
   VITE_PAYSTACK_BASE_URL=https://api.paystack.co
   ```

## Actions

- **initialize** – Create transaction, returns authorization_url
- **verify** – Verify payment by reference
- **refund** – Create refund
- **create_recipient** – Create transfer recipient (for payouts)
- **transfer** – Initiate transfer (payout)
- **verify_transfer** – Verify transfer status
- **list_banks** – List Nigerian banks
- **resolve_account** – Resolve bank account (account name from account number + bank code)

Requires `Authorization: Bearer <user_jwt>` for all requests.
