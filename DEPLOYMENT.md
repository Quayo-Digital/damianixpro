# Deployment (Docker)

This repo contains multiple services that must be configured with environment variables. The keys below are the ones the code reads.

## Docker Compose services

### `web` (Vite SPA served by Nginx)

These are provided as Docker `build-args` to bake values into the frontend bundle:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_VOICE_SERVER_URL`
- `VITE_VAPID_PUBLIC_KEY`
- `VITE_APP_NAME` (optional)
- `VITE_APP_VERSION` (optional)

Nigerian verification/payment integration (commonly used in the SPA):

- `VITE_YOUVERIFY_BASE_URL`
- `VITE_APPRUVE_BASE_URL`
- `VITE_FLUTTERWAVE_PUBLIC_KEY`
- `VITE_FLUTTERWAVE_BASE_URL`

Optional extras (only needed if enabled/used by features):

- `VITE_MAPTILER_API_KEY`
- `VITE_ENABLE_SUPPORT_CHAT`
- `VITE_ENABLE_RUNTIME_CSP`
- `VITE_CSP_ALLOW_UNSAFE_EVAL`

### `voice-server` (Express sidecar; `server/index.mjs`)

Loaded from the root `.env` via `env_file`:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `OPENAI_API_KEY`
- `SUPABASE_JWT_SECRET` (used to validate voice-agent bearer tokens; optional but required for protected voice flows)

Voice sidecar networking / limits:

- `VOICE_SERVER_CORS_ORIGIN` (or `CORS_ORIGIN`)
- `VOICE_SERVER_RATE_LIMIT_WINDOW_MS`
- `VOICE_SERVER_RATE_LIMIT_MAX`
- `VOICE_SERVER_PORT` (optional; default `4000`)
- `TRUST_PROXY` (optional)
- `VOICE_PIN_SALT` (optional)
- `VOICE_OTP_SMS_ENABLED` (optional)

WhatsApp voice assistant:

- `WHATSAPP_ACCESS_TOKEN`
- `WHATSAPP_PHONE_NUMBER_ID`
- `WHATSAPP_VERIFY_TOKEN` (optional)
- `VOICE_SERVER_URL` (set to the public/internal URL of `voice-server`)
- `TTS_URL` (set to the URL of the TTS service, e.g. `http://tts-server:4010`)

Payments (Flutterwave + payment link behavior):

- `FLUTTERWAVE_SECRET_KEY` (or `FLW_SECRET_KEY`)
- `FLUTTERWAVE_SECRET_HASH` (or `FLW_SECRET_HASH`)
- `PAYMENT_REDIRECT_URL` (optional but recommended)
- `PAYMENT_LOGO_URL` (optional but recommended)
- `APP_DEEP_LINK_SCHEME` (optional)
- `PUBLIC_PAYMENT_BASE_URL` (optional)
- `RENT_PAYMENT_WEBHOOK_URL` (optional)

Notifications:

- Web push: `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY` (optional, disables web-push if missing)
- Web push webhook: `PUSH_WEBHOOK_SECRET` (optional; required to use `/api/push/webhook`)
- Email (Resend): `RESEND_API_KEY`, `RESEND_FROM_EMAIL` (optional)
- SMS + Twilio calls: `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER` (optional)

Rent reminders (Paystack + Twilio + internal TTS):

- `PAYSTACK_SECRET_KEY` (optional; reminders won’t generate Paystack links if missing)
- `PUBLIC_BASE_URL` (used for callback/call URLs)
- `RENT_REMINDER_DAYS_AHEAD` (optional)

### `tts-server` (Express sidecar; `server/ttsServer.mjs`)

Loaded from the root `.env` via `env_file`:

- `ELEVENLABS_API_KEY` (required for TTS to work; otherwise requests fail)
- `ELEVENLABS_VOICE_ID` (optional; default fallback voice is used)
- `TTS_SERVER_PORT` (optional; default `4010`)

### `fintech-api` (Express; `fintech-api/server.js`)

Loaded from `fintech-api/.env` (and Docker env overrides from root `.env` via `env_file` in compose):

- `JWT_SECRET` (required to start; used by API auth)
- `DATABASE_URL` (preferred) **or** `PGHOST`, `PGUSER`, `PGDATABASE` (and `PGPASSWORD` if needed)
- `CORS_ORIGIN` (optional)
- `PORT` (optional; default `4101`)

Flutterwave integration (optional unless you use those endpoints):

- `FLUTTERWAVE_SECRET_KEY` (or `FLW_SECRET_KEY`)
- `FLUTTERWAVE_SECRET_HASH` (or `FLW_SECRET_HASH`)
- `FLUTTERWAVE_PUBLIC_KEY` (optional)
- `FLUTTERWAVE_BASE_URL` (optional; default is Flutterwave v3)

## Supabase Edge Function (token exchange)

### `fintech-token-exchange`

Purpose: exchange a Supabase access token for a `fintech-api` JWT so mobile apps / frontends can call `fintech-api` with:

- `Authorization: Bearer <fintech_jwt>`

Function URL shape (after deploy):

- `https://YOUR_PROJECT_REF.supabase.co/functions/v1/fintech-token-exchange`

Request:

- `POST` with header `Authorization: Bearer <SUPABASE_ACCESS_TOKEN>`

Response:

- `200`: `{ "fintechToken": "..." }`

Secrets / env vars required by the function:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `JWT_SECRET` (must match `fintech-api` `JWT_SECRET`)
- `JWT_ISSUER` (optional, must match if you changed `fintech-api` from default)
- `JWT_AUDIENCE` (optional; if set in `fintech-api`, also set here so tokens validate)

Deploy:

```bash
supabase functions deploy fintech-token-exchange
```
