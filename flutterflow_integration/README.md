# DamianixPro FlutterFlow Integration

Rent payments, Payment Dashboard, and Accounting Dashboard for DamianixPro.

## Accounting Dashboard

See **[ACCOUNTING_DASHBOARD_UI.md](ACCOUNTING_DASHBOARD_UI.md)** for full UI build guide.

- **Summary Cards:** Total Income, Total Expenses, Net Profit
- **Charts:** Income vs Expenses, Monthly trends
- **Tables:** Recent transactions, Expenses
- **Filters:** Date range, Property
- **Design:** Clean fintech style, mobile responsive

**APIs:** `GET /api/reports/profit-loss`, `/api/reports/cash-flow`, `/api/accounting/transactions`, `/api/expenses`, `/api/properties/:id/financials`

---

## Payment Dashboard

See **[PAYMENT_DASHBOARD_UI.md](PAYMENT_DASHBOARD_UI.md)** for full UI build guide.

- **Summary Cards:** Total Revenue, Pending Payments, Completed Payments
- **Pay Rent** button → Flutterwave payment flow
- **Transactions List** with filters (date range, status)
- **Custom Widgets:** `PaymentSummaryCard`, `PaymentTransactionTile` in `payment_dashboard_widget.dart`

**API:** `GET /api/tenant/payments` (auth required)

---

## Rent Payment (Standalone)

## API Endpoints

| Method | Endpoint                       | Description                                             |
| ------ | ------------------------------ | ------------------------------------------------------- |
| POST   | `/api/payments/rent`           | Initialize payment, returns `payment_link` and `tx_ref` |
| GET    | `/api/payments/status/:tx_ref` | Verify payment status                                   |
| GET    | `/api/payments/callback`       | Redirect page (success/failure) after Flutterwave       |

## Setup

### 1. Add Custom Actions in FlutterFlow

1. Go to **Custom Code** > **Actions** > **+ Add Action**
2. Create two actions from `rent_payment_actions.dart`:

**Action 1: Init Rent Payment**

- Name: `initRentPayment`
- Inputs: `apiBaseUrl` (String), `tenantId` (String), `amount` (double), `redirectUrl` (String, optional)
- Return: `Map<String, dynamic>?` (or create a Struct with `payment_link`, `tx_ref`)

**Action 2: Verify Payment Status**

- Name: `verifyPaymentStatus`
- Inputs: `apiBaseUrl` (String), `txRef` (String)
- Return: `String`

### 2. Add Dependencies

In your FlutterFlow project's `pubspec.yaml` (or via FlutterFlow Dependencies):

```yaml
dependencies:
  http: ^1.1.0
  url_launcher: ^6.2.0
  webview_flutter: ^4.4.0 # For in-app WebView
```

### 3. Configure Backend

Set `PAYMENT_REDIRECT_URL` to your callback URL, e.g.:

```
https://your-api-domain.com/api/payments/callback
```

For FlutterFlow, pass this as `redirect_url` when calling init (optional - uses env default).

---

## UI Flow

### Page 1: Rent Payment (with Pay Button)

```
┌─────────────────────────────────────┐
│  Rent Due: ₦120,000                 │
│                                     │
│  [ Pay Rent ]  ← Button              │
│                                     │
│  (Loading indicator when processing)│
└─────────────────────────────────────┘
```

### Page 2: WebView (Payment Page)

Opens `payment_link` in WebView. User completes payment on Flutterwave.

### Page 3: Success / Failure Screen

```
┌─────────────────────────────────────┐
│  ✓ Payment Successful                │
│                                     │
│  Your rent payment has been received │
│                                     │
│  [ Done ]                            │
└─────────────────────────────────────┘
```

---

## FlutterFlow Action Flow

### On "Pay Rent" Button Pressed

1. **Set loading** = true
2. **Call** `initRentPayment`:
   - `apiBaseUrl`: your API base (e.g. `https://api.damianixpro.com`)
   - `tenantId`: from auth/tenant state
   - `amount`: rent amount
   - `redirectUrl`: `{apiBaseUrl}/api/payments/callback` (optional)
3. **If result is null**: Show error toast, set loading = false
4. **If result exists**:
   - Store `payment_link` and `tx_ref` in page state
   - Navigate to WebView page with `payment_link` and `tx_ref` as parameters
   - Set loading = false

### On WebView Page Load

1. Load `payment_link` in WebView
2. Use **Navigation Delegate** to detect when URL matches callback:
   - Pattern: `*payment/callback*` or `*your-domain*`
   - When matched: extract `tx_ref` from URL query, then navigate to verification

### After Redirect (or when WebView closes)

1. **Poll** `verifyPaymentStatus` with `tx_ref`:
   - Retry every 2–3 seconds (webhook may be delayed)
   - Max 10 attempts
2. **If status = "PAID"**: Navigate to Success screen
3. **If status = "CANCELLED"** or **"error"**: Navigate to Failure screen
4. **If "PENDING"** after max retries: Show "Verifying..." or retry

---

## Simplified Flow (Without WebView URL Detection)

If you don't intercept the redirect URL:

1. User taps "Pay Rent" → Call `initRentPayment` → Get `payment_link`
2. Open `payment_link` in **WebView** (or `url_launcher` for external browser)
3. Show a "Return to App" or "I've completed payment" button
4. When user taps it → Call `verifyPaymentStatus(tx_ref)` → Show result

The backend serves a callback page at `/api/payments/callback` with a "Return to App" button that uses a deep link: `damianixpro://payment/callback?tx_ref=XXX`

Configure your app's deep link scheme in the backend: `APP_DEEP_LINK_SCHEME=yourapp`

---

## Example: Single-Page Flow with WebView

1. **Pay Rent** button → `initRentPayment` → store `paymentLink`, `txRef`
2. Show **WebView** with `paymentLink`
3. Add **"I've completed payment"** button (or detect redirect via Navigation Delegate)
4. On button press: **verifyPaymentStatus** (with retry) → show Success or Failure dialog

---

## Response Examples

### POST /api/payments/rent (Success)

```json
{
  "payment_link": "https://checkout.flutterwave.com/...",
  "tx_ref": "DMX-abc123-uuid",
  "status": "pending"
}
```

### GET /api/payments/status/:tx_ref

```json
{
  "status": "PAID",
  "amount": 120000,
  "paid_date": "2025-03-17",
  "transaction_id": "DMX-abc123-uuid"
}
```

---

## Error Handling

- **initRentPayment returns null**: Check tenant_id, amount, API URL, network
- **verifyPaymentStatus returns "error"**: Payment not found or API error
- **"PENDING" for long time**: Webhook may be delayed; retry or ask user to check later
