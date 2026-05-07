# React Native GitHub Issue Blocks

Copy one block per issue into GitHub.

---

## RN-001 - App skeleton + navigation shell

**Labels:** `mobile`, `react-native`, `sprint-1`, `priority:P0`, `type:feature`  
**Story Points:** `3`  
**Dependencies:** `none`

**Description**

- Bootstrap React Native app and navigation shell.
- Add unauthenticated/authenticated stacks.
- Add role shell placeholders for tenant/landlord.

**Acceptance Criteria**

- App boots on Android and iOS simulators.
- Navigation supports authenticated + unauthenticated routes.
- Tenant and landlord shell routes are reachable from mock role state.

---

## RN-002 - Supabase auth integration

**Labels:** `mobile`, `react-native`, `auth`, `sprint-1`, `priority:P0`, `type:feature`  
**Story Points:** `5`  
**Dependencies:** `RN-001`

**Description**

- Integrate Supabase Auth sign-in/sign-out/session restore.
- Implement minimal `SignIn` and `ForgotPassword`.

**Acceptance Criteria**

- User can sign in and sign out successfully.
- Session persists after app restart.
- Auth failures show readable error messages.

---

## RN-003 - Fintech token exchange wiring

**Labels:** `mobile`, `react-native`, `auth`, `fintech-api`, `sprint-1`, `priority:P0`, `type:feature`  
**Story Points:** `5`  
**Dependencies:** `RN-002`

**Description**

- Integrate `POST /functions/v1/fintech-token-exchange`.
- Store `fintechToken` securely and inject it in fintech API client.

**Acceptance Criteria**

- App sends `Authorization: Bearer <SUPABASE_ACCESS_TOKEN>` to token exchange.
- App securely stores and refreshes `fintechToken` when expired.
- Fintech API requests include `Authorization: Bearer <fintechToken>`.

---

## RN-004 - Tenant payment dashboard

**Labels:** `mobile`, `react-native`, `tenant`, `payments`, `sprint-1`, `priority:P0`, `type:feature`  
**Story Points:** `5`  
**Dependencies:** `RN-002`

**Description**

- Build `TenantPaymentsHome` screen.
- Integrate sidecar payment summary/list endpoints.

**API Integration**

- `GET /api/tenant/payments`
- optional `GET /api/payments/insights`

**Acceptance Criteria**

- Screen renders transaction list + summary from API.
- Loading, empty, and error states are implemented.
- Pull-to-refresh reloads data.

---

## RN-005 - Pay rent (Flutterwave init + WebView + verify)

**Labels:** `mobile`, `react-native`, `tenant`, `payments`, `sprint-1`, `priority:P0`, `type:feature`  
**Story Points:** `8`  
**Dependencies:** `RN-004`

**Description**

- Implement payment init, WebView checkout, and status verification flow.
- Add success/failure/pending timeout states.

**API Integration**

- `POST /api/payments/rent/flutterwave`
- `GET /api/payments/status/:tx_ref`

**Acceptance Criteria**

- User initializes payment and opens returned checkout link.
- Verification polling transitions to success/failure correctly.
- Pending timeout state includes retry action.
- Funnel events tracked: `payment_init_started`, `payment_webview_opened`, `payment_verify_success|failed`.

---

## RN-006 - Tenant maintenance request create

**Labels:** `mobile`, `react-native`, `tenant`, `maintenance`, `sprint-1`, `priority:P1`, `type:feature`  
**Story Points:** `3`  
**Dependencies:** `RN-002`

**Description**

- Build `CreateMaintenanceRequest` form and submit flow.

**API Integration**

- `POST /api/maintenance`

**Acceptance Criteria**

- Form validates `tenant_id`, `property_id`, `issue`.
- Success shows ticket number returned by API.
- Error state supports retry.

---

## RN-007 - Analytics baseline

**Labels:** `mobile`, `react-native`, `analytics`, `sprint-1`, `priority:P1`, `type:chore`  
**Story Points:** `3`  
**Dependencies:** `RN-001`

**Description**

- Integrate analytics SDK and baseline event wrapper.

**Acceptance Criteria**

- Auth + payment funnel events emit with consistent naming.
- Event payload includes `role`, `screen`, `request_id` (when available).
- Debug mode confirms event emission in development.

---

## RN-008 - Property search

**Labels:** `mobile`, `react-native`, `tenant`, `search`, `sprint-2`, `priority:P0`, `type:feature`  
**Story Points:** `5`  
**Dependencies:** `RN-002`

**Description**

- Build `PropertySearch` and results list with filters.

**API Integration**

- `GET /api/properties/search`

**Acceptance Criteria**

- Filters map to query params (`location`, `min_price`, `max_price`, `bedrooms`, `property_type`).
- Results render correctly (up to backend limit).
- No-results + reset filters UX works.

---

## RN-009 - Viewing scheduling

**Labels:** `mobile`, `react-native`, `tenant`, `viewings`, `sprint-2`, `priority:P0`, `type:feature`  
**Story Points:** `5`  
**Dependencies:** `RN-008`

**Description**

- Build `ScheduleViewing` submission flow.

**API Integration**

- `POST /api/viewings`

**Acceptance Criteria**

- Valid date/time required before submit.
- `409` conflict shows “slot already booked” message.
- Success displays viewing id and scheduled datetime.

---

## RN-010 - Notifications center

**Labels:** `mobile`, `react-native`, `tenant`, `landlord`, `notifications`, `sprint-2`, `priority:P1`, `type:feature`  
**Story Points:** `5`  
**Dependencies:** `RN-002`

**Description**

- Build in-app notifications list and realtime updates.

**API Integration**

- Supabase `notifications` read + realtime subscription

**Acceptance Criteria**

- Latest notifications load with title/description/link metadata.
- Realtime inserts appear without app restart.
- Tapping notification deep-links to recognized target route.

---

## RN-011 - Documents upload/list (lean)

**Labels:** `mobile`, `react-native`, `tenant`, `landlord`, `documents`, `sprint-2`, `priority:P1`, `type:feature`  
**Story Points:** `8`  
**Dependencies:** `RN-002`

**Description**

- Implement upload and list via property-media edge function flow.

**API Integration**

- `POST /functions/v1/property-media/init-upload`
- upload to signed URL
- `POST /functions/v1/property-media/complete-upload`
- `POST /functions/v1/property-media/list`

**Acceptance Criteria**

- User can complete end-to-end upload.
- Uploaded media appears in list.
- Token/auth/upload errors handled with retry.

---

## RN-012 - Support chat

**Labels:** `mobile`, `react-native`, `tenant`, `support`, `chat`, `sprint-2`, `priority:P1`, `type:feature`  
**Story Points:** `5`  
**Dependencies:** `RN-002`

**Description**

- Build `SupportChat` UI and message loop.

**API Integration**

- `POST /api/support/chat`

**Acceptance Criteria**

- Chat sends/receives messages with loading state.
- AI fallback response handled gracefully.
- API errors and rate limits do not crash UI.

---

## RN-013 - OCR assist (optional in MVP)

**Labels:** `mobile`, `react-native`, `tenant`, `documents`, `ocr`, `sprint-2`, `priority:P2`, `type:feature`  
**Story Points:** `3`  
**Dependencies:** `RN-011`

**Description**

- Add optional OCR extraction flow for document files.

**API Integration**

- `POST /api/documents/ocr`

**Acceptance Criteria**

- Supported files return extracted text in UI.
- Unsupported/oversized files show clear errors.

---

## RN-014 - Landlord wallet overview

**Labels:** `mobile`, `react-native`, `landlord`, `fintech-api`, `wallet`, `sprint-3`, `priority:P0`, `type:feature`  
**Story Points:** `5`  
**Dependencies:** `RN-003`

**Description**

- Build `LandlordWallet` with balance and ensure-wallet behavior.

**API Integration**

- `POST /api/wallets/ensure` (fintech-api)
- `GET /api/wallets/me` (fintech-api)

**Acceptance Criteria**

- Wallet ensure is idempotent on repeated opens.
- Balance and currency render correctly.
- Unauthorized token state retries once after refresh.

---

## RN-015 - Escrow list + detail

**Labels:** `mobile`, `react-native`, `landlord`, `fintech-api`, `escrow`, `sprint-3`, `priority:P0`, `type:feature`  
**Story Points:** `5`  
**Dependencies:** `RN-003`

**Description**

- Build escrow listing and detail screens.

**API Integration**

- `GET /api/escrow` (fintech-api)
- `GET /api/escrow/:id` (fintech-api)

**Acceptance Criteria**

- List shows active/history escrow states.
- Detail shows amount, hold, dispute/release metadata.
- Forbidden access handled with role-safe messaging.

---

## RN-016 - Escrow release/dispute actions

**Labels:** `mobile`, `react-native`, `landlord`, `fintech-api`, `escrow`, `sprint-3`, `priority:P0`, `type:feature`  
**Story Points:** `5`  
**Dependencies:** `RN-015`

**Description**

- Add release/dispute action flows on escrow detail.

**API Integration**

- `POST /api/escrow/:id/release` (fintech-api)
- `POST /api/escrow/:id/dispute` (fintech-api)

**Acceptance Criteria**

- Release requires both idempotency keys; duplicate handled gracefully.
- Dispute requires non-empty reason.
- Detail refreshes immediately after action.

---

## RN-017 - Withdrawals workflow

**Labels:** `mobile`, `react-native`, `landlord`, `fintech-api`, `withdrawals`, `sprint-3`, `priority:P0`, `type:feature`  
**Story Points:** `8`  
**Dependencies:** `RN-003`

**Description**

- Build withdrawals list, request, detail, and action flows.

**API Integration**

- `POST /api/withdrawals` (fintech-api)
- `GET /api/withdrawals`
- `GET /api/withdrawals/:id`
- `POST /api/withdrawals/:id/retry`
- `POST /api/withdrawals/:id/cancel`
- `POST /api/withdrawals/:id/sync`

**Acceptance Criteria**

- Request form validates required payload and destination details.
- List/detail reflect status transitions.
- Retry/cancel/sync actions update UI without full reload.

---

## RN-018 - Landlord maintenance board (initial)

**Labels:** `mobile`, `react-native`, `landlord`, `maintenance`, `sprint-3`, `priority:P1`, `type:feature`  
**Story Points:** `5`  
**Dependencies:** `RN-002`

**Description**

- Build initial landlord maintenance overview from current read model.

**API Integration**

- Supabase-backed read model used by existing web dashboard

**Acceptance Criteria**

- Landlord sees open/pending maintenance records.
- Filtering by status/date works.
- Empty and error states are implemented.

---

## RN-019 - Beta quality gate + KPI dashboard

**Labels:** `mobile`, `react-native`, `qa`, `analytics`, `sprint-3`, `priority:P1`, `type:chore`  
**Story Points:** `3`  
**Dependencies:** `RN-007`, `RN-005`, `RN-017`

**Description**

- Create beta readiness checklist and KPI dashboard.

**Acceptance Criteria**

- Dashboard reports payment completion, maintenance success, viewing conversion, notification CTR, withdrawal success.
- Critical drop-off alert for payment abandonment exists.
- Go-live checklist signed for auth/payment/fintech role paths.

---

## Global Definition of Done (apply to all API tickets)

- Contract validated against staging backend.
- Correct auth header used (`Supabase` vs `fintechToken` path).
- Loading/empty/error/retry states implemented.
- Instrumentation events emitted and verified.
- Role-based authorization QA coverage included.
