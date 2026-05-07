# Mobile App (Sprint 1 Starter)

This is a lean Expo/React Native starter to begin Sprint 1 execution with minimal setup overhead.

## Included now

- Sign-in screen (Supabase Auth)
- Proper React Navigation setup (auth stack + tenant tabs + payment stack)
- Fintech token exchange wiring (`/functions/v1/fintech-token-exchange`)
- Tenant payments home (`GET /api/tenant/payments`)
- Pay rent flow:
  - init (`POST /api/payments/rent/flutterwave`)
  - WebView checkout
  - verify (`GET /api/payments/status/:tx_ref`)
- Payment funnel instrumentation events:
  - `payment_init_started`
  - `payment_webview_opened`
  - `payment_verify_success`
  - `payment_verify_failed`

## Setup

1. Copy env template:

```bash
cp .env.example .env
```

2. Fill required values:

- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- `EXPO_PUBLIC_VOICE_API_BASE_URL`
- `EXPO_PUBLIC_FINTECH_API_BASE_URL`
- `EXPO_PUBLIC_FINTECH_EXCHANGE_URL`

3. Install dependencies and run:

```bash
npm install
npm run start
```

## Current implementation notes

- Navigation is intentionally lightweight (screen state switching in `App.tsx`) to reduce upfront wiring.
- Next increment should replace this with `@react-navigation/native` stacks/tabs after Sprint 1 flows are stable.
- Secure token storage uses `expo-secure-store`.
