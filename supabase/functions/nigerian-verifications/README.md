# Nigerian Verifications Edge Function

Proxy for Nigerian verification providers used by frontend KYC flows.  
This function keeps provider credentials server-side and prevents exposing secrets in browser code.

## Required Supabase secrets

```bash
supabase secrets set YOUVERIFY_API_KEY=your_youverify_key
supabase secrets set APPRUVE_API_KEY=your_appruve_key
supabase secrets set FLUTTERWAVE_SECRET_KEY=your_flutterwave_secret
```

Optional provider base URLs:

```bash
supabase secrets set YOUVERIFY_BASE_URL=https://api.youverify.co/v2
supabase secrets set APPRUVE_BASE_URL=https://api.appruve.co/v1
supabase secrets set FLUTTERWAVE_BASE_URL=https://api.flutterwave.com/v3
```

## Deploy

```bash
supabase functions deploy nigerian-verifications
```

## Security model

- Frontend calls `supabase.functions.invoke('nigerian-verifications', ...)`.
- Function validates provider and endpoint allowlists.
- Function injects provider `Authorization` headers from Supabase secrets.
- Frontend must never store these provider secrets in `VITE_*` variables.
