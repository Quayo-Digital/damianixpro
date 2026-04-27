# Deployment checklist

Use this before pointing production traffic here. This is **not** a legal/compliance sign-off — it is an engineering checklist.

## Automated checks (run locally or rely on CI)

From the repo root:

```bash
npm ci
npm run check:secrets
npm run lint:node
npm run lint:ci
npm run type-check
npm run format:check   # may warn: CI uses continue-on-error until full-tree Prettier cleanup
npm run test:ci
npm run build
```

CI runs `format:check` with `continue-on-error` because much of the repo predates strict Prettier enforcement; run `npm run format` in a focused PR when you want full conformance.

`fintech-api/` (if you deploy it):

```bash
cd fintech-api && npm ci && npm run verify
```

## Configuration you must set

| Area                         | Notes                                                                                                                                                                           |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Supabase**                 | `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` in the SPA build; `SUPABASE_SERVICE_ROLE_KEY` (and `SUPABASE_URL`) only on servers / CI secrets — never `VITE_` for service role. |
| **Voice / property sidecar** | Deploy `server/index.mjs`; set `VITE_VOICE_SERVER_URL` in the SPA to that public URL; configure `VOICE_SERVER_CORS_ORIGIN` (or `CORS_ORIGIN`) in production.                    |
| **Flutterwave**              | One webhook target per charge type — see [ARCHITECTURE_RUNTIMES.md](./ARCHITECTURE_RUNTIMES.md) (`server/` vs `fintech-api/`).                                                  |
| **fintech-api**              | `DATABASE_URL`, `JWT_SECRET`, Flutterwave secrets, `CORS_ORIGIN`; never expose `JWT_SECRET` to the browser.                                                                     |
| **Optional market API**      | Set `VITE_API_BASE_URL` only if you run that backend; there is no baked-in production default.                                                                                  |

## What “ready” means here

- **Ready for deploy attempt**: automated commands above pass; production env vars and secrets are set; you have chosen webhook URLs and CORS intentionally.
- **Not covered by this repo alone**: penetration test, load test, backup/restore drill, Flutterwave/Supabase dashboard configuration, and legal terms for your jurisdiction.

## After deploy

- Smoke-test auth, one payment path, and one critical role dashboard.
- Confirm `server/` `GET /healthz` and `fintech-api` `/api/health` if applicable.
- Optional: run through **[LEASING_WORKFLOW.md](./LEASING_WORKFLOW.md)** (apply → approve → create lease) in staging.

## Related docs

- [ARCHITECTURE_RUNTIMES.md](./ARCHITECTURE_RUNTIMES.md) — SPA vs `server/` vs `fintech-api/`
- [LEASING_WORKFLOW.md](./LEASING_WORKFLOW.md) — rental application and lease execution
