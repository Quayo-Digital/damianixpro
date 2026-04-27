# DamianixPro Nigeria Homes – Deployment Readiness Audit

**Date:** February 16, 2025  
**Scope:** Codebase scan for improvements and live server deployment readiness

---

## Executive Summary

| Category                | Status      | Notes                                              |
| ----------------------- | ----------- | -------------------------------------------------- |
| **Build**               | ✅ Fixed    | Syntax errors resolved (see Fixes Applied)         |
| **Security**            | ⚠️ Critical | Payment secret keys exposed in frontend – must fix |
| **Environment**         | ✅ Good     | .env in .gitignore, example provided               |
| **Error Handling**      | ✅ Good     | ErrorBoundary in place                             |
| **Third-party Scripts** | ⚠️ Review   | gptengineer.js in index.html                       |
| **Production Config**   | ⚠️ Minor    | Browserslist outdated, vite env vars               |
| **Deployment Ready**    | ❌ Blocked  | Fix security before deploying                      |

---

## Fixes Applied During Audit

### 1. Build-breaking syntax errors

- **PropertyAnomalyDetector.tsx**: Apostrophes in contractions (`they're`, `you're`, `it's`) inside single-quoted strings caused parser errors. Switched to double-quoted strings.
- **PropertyDisplay.tsx**: Resolved operator precedence error by wrapping the right-hand side of `??` in parentheses:  
  `lease?.lease_price ?? (((lease?.monthly_rent || 0) * 12) || property.lease_price || 0)`

---

## Critical: Security Issues

### 1. Payment secret keys in frontend (high risk)

**Files affected:**  
`paymentService.ts`, `PaystackProvider.ts`, `FlutterwaveProvider.ts`, `nigerianApiService.ts`, `shortlet/integrations/paystack.ts`

**Issue:** `VITE_PAYSTACK_SECRET_KEY` and `VITE_FLUTTERWAVE_SECRET_KEY` are used in client-side code. All `VITE_*` variables are bundled and exposed to users.

**Required fix:**

- Move payment initialization to a backend (Supabase Edge Functions or your API).
- Use only public keys in the frontend.
- Store secret keys in Supabase secrets / server env, never in client-side env.

### 2. .env.example lists secret keys

**File:** `.env.example`

**Issue:** `VITE_PAYSTACK_SECRET_KEY` and `VITE_FLUTTERWAVE_SECRET_KEY` appear in the example, implying they should be in the frontend.

**Fix:** Remove secret keys from `.env.example` and add a note that secret keys belong in backend env only.

---

## High: Production Best Practices

### 1. Third-party script in `index.html`

```html
<script src="https://cdn.gpteng.co/gptengineer.js" type="module"></script>
```

**Issue:** External script loads on every page. Not ideal for production unless needed.

**Action:** Remove if not required, or load only in development.

### 2. Vite config env vars

**File:** `vite.config.ts`

**Issue:** Uses `process.env.NEXT_PUBLIC_API_BASE_URL` (Next.js style) and `process.env.NODE_ENV`. Vite uses `import.meta.env.VITE_*`.

**Action:**

- Use `import.meta.env.VITE_API_BASE_URL` or equivalent.
- Or add `VITE_API_BASE_URL` to `.env` and wire it through Vite.

### 3. Browserslist data outdated

**Action:**

```bash
npx update-browserslist-db@latest
```

### 4. Console usage

**Finding:** ~200+ uses of `console.log/warn/error` across the project.

**Status:** `logger.ts` is already production-friendly (dev-only for debug/info). Still, many components use raw `console.*`.

**Action:** Gradually replace direct `console.*` with `logger.*` in important flows.

---

## Medium: Code Quality & Maintenance

### 1. TODO/FIXME items

- `shortlet/api/listings.ts`: Filter by availability dates
- `shortlet/api/channelManager.ts`: Implement channel API calls
- `Tenants.tsx`: Tenant detail view, communication, application/screening detail views
- `ShortletListingsPage.tsx`: Delete functionality

### 2. Duplicate/unused hooks

- `usePropertiesWithRoleFiltering.ts` – not imported anywhere (only defines itself). Consider removing or integrating with `useProperties.ts`.

### 3. Backup file in repo

- `useEnhancedVendorData.backup.ts` – likely should not be tracked.

---

## Low: Nice-to-Have

### 1. PWA / favicon

- `og:image` and `twitter:image` point to `/favicon.ico`. Consider dedicated OG/social images (e.g. 1200×630).
- PWA icons use favicon for multiple sizes; dedicated assets would improve UX.

### 2. Version / metadata

- `package.json` has `"version": "0.0.0"`. Updating and exposing it in the UI/API can help support and debugging.

### 3. Test coverage

- Tests exist (`vitest` configured). Run `npm run test:coverage` and aim for higher coverage on critical flows.

---

## Pre-deployment Checklist

### Must do

- [ ] Move payment secret keys to backend (Edge Functions / API).
- [ ] Remove secret keys from `.env.example` and frontend env.
- [ ] Confirm production build succeeds: `npm run build`
- [ ] Configure production Supabase URL and keys in deployment environment.
- [ ] Run and apply migrations on production DB.

### Should do

- [ ] Remove or conditionally load `gptengineer.js` in production.
- [ ] Run `npx update-browserslist-db@latest`.
- [ ] Add/configure Sentry or similar for production error monitoring.

### Nice to have

- [ ] Replace `console.*` with `logger.*` in critical paths.
- [ ] Fix or remove unused `usePropertiesWithRoleFiltering` and `.backup` files.
- [ ] Add `robots.txt` and `sitemap.xml` if SEO matters.
- [ ] Ensure `Content-Security-Policy` and other security headers on hosting.

---

## Environment Variables for Production

Ensure these are set in the deployment environment (and never committed):

| Variable                      | Required             | Notes                                |
| ----------------------------- | -------------------- | ------------------------------------ |
| `VITE_SUPABASE_URL`           | ✅                   | Production Supabase project URL      |
| `VITE_SUPABASE_ANON_KEY`      | ✅                   | Supabase anon key                    |
| `VITE_PAYSTACK_PUBLIC_KEY`    | ✅                   | Public only – keep secret on backend |
| `VITE_FLUTTERWAVE_PUBLIC_KEY` | If using Flutterwave | Public only                          |
| `VITE_MAPTILER_API_KEY`       | If using maps        |                                      |
| `VITE_SENTRY_DSN`             | Recommended          | Error monitoring                     |
| `VITE_LOGROCKET_APP_ID`       | Optional             | Session replay                       |

---

## Summary

- **Build:** Fixed; should be passing.
- **Deployment readiness:** Do not go live until payment secret keys are moved to a backend.
- **Next steps:** Implement backend payment initialization (Supabase Edge Functions are a natural fit), remove frontend usage of secret keys, then re-run this checklist.
