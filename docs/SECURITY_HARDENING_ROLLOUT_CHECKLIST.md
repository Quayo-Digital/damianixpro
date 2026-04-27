# Security Hardening Rollout Checklist

Use this checklist to deploy the security/reliability hardening changes safely.

## 1) Pre-deploy preparation

- [ ] Confirm `.env` is not tracked in git.
- [ ] Confirm `npm run check:secrets` passes locally.
- [ ] Confirm `npm run test:smoke` passes locally.
- [ ] Confirm CI config updates are present in `.github/workflows/ci.yml`.
- [ ] Confirm `SECURITY_ENV_POLICY.md` and changelog docs are available to the team.
- [ ] Apply branch protection based on `docs/BRANCH_PROTECTION_POLICY.md`.

## 2) Configure server-side secrets (required)

Set these in Supabase project secrets:

```bash
supabase secrets set YOUVERIFY_API_KEY=...
supabase secrets set APPRUVE_API_KEY=...
supabase secrets set FLUTTERWAVE_SECRET_KEY=...
```

Optional provider base URL overrides:

```bash
supabase secrets set YOUVERIFY_BASE_URL=https://api.youverify.co/v2
supabase secrets set APPRUVE_BASE_URL=https://api.appruve.co/v1
supabase secrets set FLUTTERWAVE_BASE_URL=https://api.flutterwave.com/v3
```

## 3) Deploy edge function

- [ ] Deploy Nigerian verification proxy:

```bash
supabase functions deploy nigerian-verifications
```

- [ ] Verify function health with an authenticated app session from frontend.

## 4) Frontend validation (post-deploy)

- [ ] Open KYC dashboard and check provider status card.
- [ ] Verify provider status refresh button updates status and timestamp.
- [ ] With a provider secret missing, confirm warning banner appears with actionable guidance.
- [ ] With all secrets configured, confirm provider badges show connected.
- [ ] Run BVN/NIN/CAC/Bank/Phone verification happy-path tests.

## 5) Platform validation

- [ ] Confirm service worker registers and installs without precache failures.
- [ ] Validate offline behavior shows explicit fallback semantics (not silent fake-success).
- [ ] Confirm deduplicated routes resolve correctly and `Finance` route loads via lazy import.
- [ ] Confirm pre-commit secret check works on staged changes.
- [ ] Confirm CI passes lint/type/test/build jobs with updated action versions.

## 6) Security follow-up

- [ ] Rotate any keys that were ever exposed in tracked `.env` or previous history.
- [ ] Audit local/team environment files for legacy frontend secret variables:
  - `VITE_PAYSTACK_SECRET_KEY`
  - `VITE_FLUTTERWAVE_SECRET_KEY`
  - `VITE_YOUVERIFY_API_KEY`
  - `VITE_APPRUVE_API_KEY`
- [ ] Remove legacy values from developer `.env` files after migration.

## 7) Rollback notes

If issues occur after deploy:

1. Disable Nigerian verification features temporarily in UI or feature flags.
2. Revert frontend calls to previous stable behavior only if strictly necessary.
3. Fix server secret/function config and redeploy `nigerian-verifications`.
4. Re-run provider status checks from dashboard before reopening features.
