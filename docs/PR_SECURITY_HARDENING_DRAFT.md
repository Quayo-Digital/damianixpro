# PR Draft: Security and Reliability Hardening

## Suggested title

`harden security boundaries, ci gates, and kyc provider reliability`

## Suggested PR body

## Summary

- Hardened frontend/backend security boundaries by removing client-side provider secret usage and routing Nigerian verification calls through a new Supabase Edge Function proxy (`nigerian-verifications`).
- Strengthened repository safeguards with secret hygiene enforcement in pre-commit and CI, untracked `.env`, startup warnings for legacy frontend secret env vars, and added a formal `SECURITY_ENV_POLICY.md`.
- Improved reliability and maintainability via route deduplication, `Finance` lazy loading, safer service worker offline behavior, stricter CI/lint gates, and KYC provider-status UX improvements (setup banners, refresh action, last-checked timestamp).
- Aligned docs with the new security model and added `docs/SECURITY_HARDENING_CHANGELOG.md` for auditability and release notes.

## Key file groups changed

- Routing/perf: `src/App.routes.tsx`
- SW hardening: `public/sw-enhanced.js`
- CI/automation: `.github/workflows/ci.yml`, `.github/dependabot.yml`, `package.json`
- Secret enforcement: `.husky/pre-commit`, `scripts/check-secret-hygiene.js`, `src/utils/envWarnings.ts`, `src/main.tsx`
- Nigerian verification proxy:
  - `src/services/nigerian/nigerianApiService.ts`
  - `supabase/functions/nigerian-verifications/index.ts`
  - `supabase/functions/nigerian-verifications/README.md`
- KYC UX/observability:
  - `src/hooks/useNigerianApis.ts`
  - `src/components/kyc/KYCVerificationDashboard.tsx`
  - `src/components/kyc/*VerificationForm.tsx`
- Policy/docs:
  - `SECURITY_ENV_POLICY.md`
  - `docs/SECURITY_HARDENING_CHANGELOG.md`
  - `README.md`, `.env.example`, and related setup docs

## Operational notes

- Required before rollout:
  - `supabase secrets set YOUVERIFY_API_KEY=...`
  - `supabase secrets set APPRUVE_API_KEY=...`
  - `supabase secrets set FLUTTERWAVE_SECRET_KEY=...`
  - `supabase functions deploy nigerian-verifications`
- Rotate any credentials previously exposed in tracked env/history.

## Test plan

- [ ] Run `npm run check:secrets` and confirm pass
- [ ] Run `npm run lint:ci` and confirm pass
- [ ] Run `npm run format:check` and confirm pass
- [ ] Verify KYC dashboard shows provider status + setup warning when secrets are missing
- [ ] Verify `Refresh Provider Status` updates badges and timestamp
- [ ] Verify BVN/NIN/CAC/Bank/Phone forms show actionable setup messages when provider unavailable
- [ ] Verify Nigerian verification succeeds after configuring secrets and deploying Edge Function
- [ ] Verify service worker installs successfully without hardcoded Vite asset precache failures
- [ ] Sanity-check duplicate routes are removed and `Finance` route still works
