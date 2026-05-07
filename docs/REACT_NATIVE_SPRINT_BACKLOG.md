# React Native Sprint Backlog (Landlord + Tenant)

Derived from `docs/REACT_NATIVE_MVP_SPEC.md`.

Priority labels:

- `P0` = must-have for first usable release
- `P1` = high-value for MVP completeness
- `P2` = important follow-up after core flows stabilize

## Sprint 1 (Foundation + first end-to-end value)

### RN-001 (`P0`) - App skeleton + navigation shell

- **Screens:** App root, role-based tab shell placeholder
- **Integration:** none (local app shell)
- **Acceptance criteria:**
  - React Native app boots on Android and iOS simulators.
  - Navigation supports authenticated and unauthenticated stacks.
  - Tenant and landlord shell routes are reachable from mock role state.

### RN-002 (`P0`) - Supabase auth integration

- **Screens:** `SignIn`, `ForgotPassword` (minimal), session restore on launch
- **Integration:** Supabase Auth SDK
- **Acceptance criteria:**
  - User can sign in and sign out successfully.
  - Session persists after app restart.
  - Auth errors are shown with user-readable messages.

### RN-003 (`P0`) - Fintech token exchange wiring

- **Screens:** background integration (used by fintech-enabled screens)
- **Integration:** `POST /functions/v1/fintech-token-exchange`
- **Acceptance criteria:**
  - App sends `Authorization: Bearer <SUPABASE_ACCESS_TOKEN>`.
  - App securely stores and refreshes `fintechToken` when expired.
  - Fintech API client automatically attaches `Authorization: Bearer <fintechToken>`.

### RN-004 (`P0`) - Tenant payment dashboard

- **Screens:** `TenantPaymentsHome`
- **Integration:** `GET /api/tenant/payments`, optional `GET /api/payments/insights`
- **Acceptance criteria:**
  - Screen renders transaction list and summary from API response.
  - Empty/loading/error states are implemented.
  - Pull-to-refresh reloads payment data.

### RN-005 (`P0`) - Pay rent (Flutterwave init + WebView + verify)

- **Screens:** `PayRentCheckout`, `PaymentWebView`, `PaymentVerificationResult`
- **Integration:** `POST /api/payments/rent/flutterwave`, `GET /api/payments/status/:tx_ref`
- **Acceptance criteria:**
  - User can initialize payment and open returned checkout URL.
  - Verification polling transitions to success/failure states correctly.
  - Pending timeout state provides retry action.
  - Funnel events tracked: `payment_init_started`, `payment_webview_opened`, `payment_verify_success|failed`.

### RN-006 (`P1`) - Tenant maintenance request create

- **Screens:** `CreateMaintenanceRequest`
- **Integration:** `POST /api/maintenance`
- **Acceptance criteria:**
  - Required fields (`tenant_id`, `property_id`, `issue`) validated before submit.
  - Successful submit shows ticket number from API.
  - Failures show actionable error and allow retry.

### RN-007 (`P1`) - Analytics baseline

- **Screens:** cross-cutting
- **Integration:** analytics provider (Firebase/Amplitude/PostHog)
- **Acceptance criteria:**
  - Auth and payment funnel events are emitted with consistent naming.
  - Event payload includes `role`, `screen`, `request_id` (when available).
  - Debug mode can verify events in development.

## Sprint 2 (Tenant MVP breadth)

### RN-008 (`P0`) - Property search

- **Screens:** `PropertySearch`, `PropertyResultList`
- **Integration:** `GET /api/properties/search`
- **Acceptance criteria:**
  - Filters (`location`, `min_price`, `max_price`, `bedrooms`, `property_type`) map to query params.
  - Results render with pagination/limit handling (first 50 from API).
  - No-results state is clear and filter-reset works.

### RN-009 (`P0`) - Viewing scheduling

- **Screens:** `ScheduleViewing`
- **Integration:** `POST /api/viewings`
- **Acceptance criteria:**
  - Valid date/time input is enforced before API call.
  - Conflict (`409`) path shows “slot already booked” message.
  - Success response displays scheduled datetime and viewing id.

### RN-010 (`P1`) - Notifications center

- **Screens:** `NotificationsCenter`
- **Integration:** Supabase `notifications` read + realtime subscription
- **Acceptance criteria:**
  - User sees latest notifications list with title/description/link metadata.
  - Realtime inserts appear without app restart.
  - Tapping a notification routes to target screen when link is recognized.

### RN-011 (`P1`) - Documents upload/list (lean)

- **Screens:** `DocumentsUpload`, `DocumentsList`
- **Integration:** `POST /functions/v1/property-media/init-upload`, upload to signed URL, `POST /functions/v1/property-media/complete-upload`, `POST /functions/v1/property-media/list`
- **Acceptance criteria:**
  - User can select file/image and complete upload flow end-to-end.
  - Uploaded items appear in list after completion.
  - Upload errors and token/auth errors are handled and recoverable.

### RN-012 (`P1`) - Support chat

- **Screens:** `SupportChat`
- **Integration:** `POST /api/support/chat`
- **Acceptance criteria:**
  - Chat sends and renders message history with loading state.
  - API fallback response is handled gracefully when AI is unavailable.
  - Rate-limit/error responses are surfaced without app crash.

### RN-013 (`P2`) - OCR assist (optional in MVP)

- **Screens:** `DocumentOCR`
- **Integration:** `POST /api/documents/ocr`
- **Acceptance criteria:**
  - User can upload supported files and receive extracted text.
  - Unsupported types and large file errors are handled in UI.

## Sprint 3 (Landlord financial workflows + beta hardening)

### RN-014 (`P0`) - Landlord wallet overview

- **Screens:** `LandlordWallet`
- **Integration:** `POST /api/wallets/ensure`, `GET /api/wallets/me` (fintech-api)
- **Acceptance criteria:**
  - Wallet auto-ensure is idempotent and safe on repeated app opens.
  - Balance and currency render correctly from API response.
  - Unauthorized token state triggers token refresh and retry once.

### RN-015 (`P0`) - Escrow list + detail

- **Screens:** `EscrowList`, `EscrowDetail`
- **Integration:** `GET /api/escrow`, `GET /api/escrow/:id` (fintech-api)
- **Acceptance criteria:**
  - List shows active/history escrow records with status.
  - Detail screen displays amount, hold period, dispute/release metadata.
  - Forbidden escrow access is handled with role-safe messaging.

### RN-016 (`P0`) - Escrow release/dispute actions

- **Screens:** `EscrowDetail` actions
- **Integration:** `POST /api/escrow/:id/release`, `POST /api/escrow/:id/dispute` (fintech-api)
- **Acceptance criteria:**
  - Release requires both idempotency keys and handles duplicate responses.
  - Dispute requires non-empty reason and confirms submission result.
  - Action outcomes refresh escrow detail state immediately.

### RN-017 (`P0`) - Withdrawals workflow

- **Screens:** `WithdrawalsList`, `RequestWithdrawal`, `WithdrawalDetail`
- **Integration:** `POST /api/withdrawals`, `GET /api/withdrawals`, `GET /api/withdrawals/:id`, `POST /api/withdrawals/:id/retry`, `POST /api/withdrawals/:id/cancel`, `POST /api/withdrawals/:id/sync` (fintech-api)
- **Acceptance criteria:**
  - Request form validates required fields and bank destination payload.
  - List and detail screens reflect status transitions.
  - Retry/cancel/sync actions work and update UI without reload.

### RN-018 (`P1`) - Landlord maintenance board (initial)

- **Screens:** `LandlordMaintenanceBoard`
- **Integration:** existing Supabase-backed read model used in web app
- **Acceptance criteria:**
  - Landlord can view open/pending maintenance records.
  - Filtering by status/date is available.
  - Empty/error states implemented.

### RN-019 (`P1`) - Beta quality gate + KPI dashboard

- **Screens:** internal QA/admin report (can be web-based)
- **Integration:** analytics warehouse + API logs
- **Acceptance criteria:**
  - KPI dashboard shows: payment completion, maintenance success, viewing conversion, notification CTR, withdrawal success.
  - Critical drop-off alert exists for payment flow abandonment.
  - Go-live checklist signed off for auth, payment, and fintech role paths.

## Cross-sprint Definition of Done

- API integration ticket is done only when:
  - Contract tested against staging backend.
  - Auth headers are correct for that backend (`Supabase` vs `fintechToken`).
  - Loading/empty/error/retry states exist.
  - Instrumentation events are emitted.
  - QA checklist includes role-based authorization coverage.
