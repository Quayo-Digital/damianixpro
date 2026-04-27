# Security Hardening Changelog

This changelog summarizes the hardening and reliability improvements implemented in the latest improvement pass.

## 1) Routing and app startup improvements

- Deduplicated conflicting routes in `src/App.routes.tsx`:
  - `/testing`
  - `/payment-testing`
  - `/platform-optimization`
  - `/analytics`
  - `/analytics-testing`
- Switched `Finance` page to lazy loading and wrapped finance routes with `Suspense` + `PageLoader`.

## 2) CI and quality gate hardening

- Updated `.github/workflows/ci.yml`:
  - Added workflow `concurrency` and `cancel-in-progress`.
  - Added least-privilege `permissions: contents: read`.
  - Added per-job `timeout-minutes`.
  - Upgraded:
    - `codecov/codecov-action` to `v5`
    - `actions/upload-artifact` to `v4`
  - Wired lint step to strict mode via `npm run lint:ci`.
- Updated `package.json`:
  - Added `lint:ci` (`eslint . --max-warnings=0`).
  - Expanded format scope to full repo:
    - `format`: `prettier --write .`
    - `format:check`: `prettier --check .`
- Added dependency automation:
  - `.github/dependabot.yml` for weekly npm and GitHub Actions updates.

## 3) Service worker safety fixes

- Updated `public/sw-enhanced.js`:
  - Bumped cache version.
  - Removed brittle hardcoded precache assets (`/static/js/main.js`, `/static/css/main.css`).
  - Made precache resilient with per-resource caching and non-fatal failures.
  - Standardized offline API fallback responses with explicit payload shape and headers.
  - Avoided silent fake-success semantics where possible and marked offline/stale responses explicitly.

## 4) Secret hygiene enforcement

- Removed `.env` from git tracking (`git rm --cached .env`) while preserving local file.
- Added `scripts/check-secret-hygiene.js`:
  - Blocks tracked/staged `.env`.
  - Blocks forbidden frontend secret env patterns (e.g. `VITE_*SECRET*`) in tracked code/config files.
- Added npm script:
  - `check:secrets`
- Wired checks into:
  - `.husky/pre-commit` (staged check)
  - CI workflow (`npm run check:secrets`)
- Added dev startup warning:
  - `src/utils/envWarnings.ts`
  - called from `src/main.tsx`
  - warns when legacy frontend secret vars are present in local dev env.

## 5) Frontend-to-backend secret boundary migration

- Refactored `src/services/nigerian/nigerianApiService.ts`:
  - Removed direct client-side third-party secret usage.
  - Routed provider calls through Supabase Edge Function proxy.
- Added new Edge Function:
  - `supabase/functions/nigerian-verifications/index.ts`
  - Validates provider and endpoint allowlists.
  - Injects provider credentials from server-side secrets only.
- Added function documentation:
  - `supabase/functions/nigerian-verifications/README.md`

## 6) KYC UX and provider observability improvements

- Improved verification failure messaging in `src/hooks/useNigerianApis.ts`:
  - Added friendly admin-actionable setup messages.
- Corrected bank verification provider gating to Flutterwave.
- Enhanced provider status checks:
  - `getProviderStatus()` now verifies real server-side provider readiness.
- Added UI visibility and recovery controls in `src/components/kyc/KYCVerificationDashboard.tsx`:
  - provider setup warning banners
  - manual `Refresh Provider Status` action
  - `Last checked` timestamp
- Updated KYC forms to show specific unavailable reasons:
  - `BVNVerificationForm`
  - `NINVerificationForm`
  - `CACVerificationForm`
  - `BankVerificationForm`
  - `PhoneVerificationForm`

## 7) Logging consistency pass

- Replaced `console.error` calls with shared `logger.error` in:
  - `src/hooks/useNigerianApis.ts`
  - all KYC form components listed above

## 8) Documentation policy alignment

- Updated docs to remove outdated frontend-secret guidance and align with server-side secret handling:
  - `README.md`
  - `.env.example`
  - `src/services/shortlet/README.md`
  - `CODEBASE_IMPROVEMENTS.md`
  - `UNIFIED_PAYMENT_SERVICE.md`
- Added policy document:
  - `SECURITY_ENV_POLICY.md`

## Operational follow-up (required)

Before production rollout of Nigerian verification flows:

```bash
supabase secrets set YOUVERIFY_API_KEY=...
supabase secrets set APPRUVE_API_KEY=...
supabase secrets set FLUTTERWAVE_SECRET_KEY=...
supabase functions deploy nigerian-verifications
```

Rotate any credentials that may have previously been exposed through tracked env files or historical commits.
