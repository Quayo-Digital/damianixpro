# Security Environment Policy

This project enforces a strict separation between **public frontend config** and **server secrets**.

## Core rules

- Use `VITE_*` only for values safe to expose in browser bundles.
- Never place private keys, secret tokens, or webhook secrets in `VITE_*`.
- Keep provider/payment secrets in Supabase Edge Function runtime secrets.
- Do not commit `.env` to git.

## Allowed in frontend (`VITE_*`)

Examples of acceptable client-side variables:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_PAYSTACK_PUBLIC_KEY`
- `VITE_FLUTTERWAVE_PUBLIC_KEY`
- `VITE_MAPTILER_API_KEY`
- public base URLs and non-sensitive feature flags

## Forbidden in frontend (`VITE_*`)

Do not use these patterns in frontend env files or docs:

- `VITE_*_SECRET_KEY`
- `VITE_*_PRIVATE_KEY`
- any provider API key that authorizes privileged operations

Known legacy examples that must remain server-side:

- `VITE_PAYSTACK_SECRET_KEY`
- `VITE_FLUTTERWAVE_SECRET_KEY`
- `VITE_YOUVERIFY_API_KEY`
- `VITE_APPRUVE_API_KEY`

## Server-side secrets (Supabase)

Configure secrets in Supabase for Edge Functions:

```bash
supabase secrets set PAYSTACK_SECRET_KEY=...
supabase secrets set FLUTTERWAVE_SECRET_KEY=...
supabase secrets set YOUVERIFY_API_KEY=...
supabase secrets set APPRUVE_API_KEY=...
```

## Enforcement in this repository

- `.env` is git-ignored and should not be tracked.
- `scripts/check-secret-hygiene.js` blocks common secret leaks.
- `.husky/pre-commit` runs staged secret checks.
- CI runs `npm run check:secrets`.
- Dev startup logs warnings when legacy frontend secret env vars are present.

## Incident response

If a secret is ever exposed in git history:

1. Rotate the secret immediately at the provider.
2. Remove tracked references and update docs/examples.
3. Verify CI/pre-commit checks pass.
4. If required, coordinate history rewrite and force-push with team approval.
