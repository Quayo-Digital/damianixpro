# DamianixPro Payment Dashboard - FlutterFlow UI Guide

Modern, card-based Payment Dashboard for DamianixPro tenant app.

---

## API Endpoints

| Method | Endpoint                         | Description                                                                      |
| ------ | -------------------------------- | -------------------------------------------------------------------------------- |
| GET    | `/api/tenant/payments`           | Dashboard data (summary + transactions). Query: `status`, `date_from`, `date_to` |
| POST   | `/api/payments/rent/flutterwave` | Init rent payment                                                                |
| GET    | `/api/payments/status/:tx_ref`   | Verify payment                                                                   |

**GET /api/tenant/payments** requires `Authorization: Bearer <token>`.

**Response:**

```json
{
  "summary": {
    "total_revenue": 240000,
    "pending_payments": 120000,
    "completed_payments": 2
  },
  "transactions": [
    {
      "id": "uuid",
      "tenant_name": "John Doe",
      "amount": 120000,
      "status": "PAID",
      "date": "2025-03-15",
      "due_date": "2025-03-01",
      "paid_date": "2025-03-15",
      "transaction_id": "DMX-xxx",
      "created_at": "2025-03-01T..."
    }
  ]
}
```

---

## Page Structure

### 1. Page State Variables

| Variable              | Type          | Default                       |
| --------------------- | ------------- | ----------------------------- |
| `isLoading`           | bool          | false                         |
| `summary`             | Map / Struct  | {}                            |
| `transactions`        | List          | []                            |
| `statusFilter`        | String        | ""                            |
| `dateFrom`            | String        | ""                            |
| `dateTo`              | String        | ""                            |
| `selectedTransaction` | Map / Struct? | null                          |
| `tenantId`            | String        | ""                            |
| `rentAmount`          | double        | 0                             |
| `authToken`           | String        | ""                            |
| `apiBaseUrl`          | String        | "https://api.damianixpro.com" |

---

## 2. Layout (Mobile Responsive)

```
┌─────────────────────────────────────────┐
│  Payments Dashboard                      │  ← AppBar / Header
├─────────────────────────────────────────┤
│ ┌─────────┐ ┌─────────┐ ┌─────────┐     │
│ │ Total   │ │ Pending │ │Completed│     │  ← Summary Cards (Row)
│ │ Revenue │ │ Payments│ │ Payments│     │
│ │ ₦240,000│ │ ₦120,000│ │    2    │     │
│ └─────────┘ └─────────┘ └─────────┘     │
├─────────────────────────────────────────┤
│ [ Pay Rent ]                             │  ← Primary Action Button
├─────────────────────────────────────────┤
│ Filters: [Status ▼] [From] [To] [Apply]  │  ← Filter Row
├─────────────────────────────────────────┤
│ Transactions                             │
│ ┌─────────────────────────────────────┐ │
│ │ John Doe    ₦120,000  Paid   Mar 15 │ │  ← Transaction List
│ │ Jane Smith  ₦120,000  Pending Mar 1  │ │    (ListView/ListTile)
│ │ ...                                 │ │
│ └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

---

## 3. Component Specifications

### Header

- **Title:** "Payments Dashboard"
- **Style:** Bold, 24sp, primary color
- **Padding:** 16px horizontal, 12px vertical

### Summary Cards (3 cards in a Row)

- **Card 1 - Total Revenue**
  - Label: "Total Revenue"
  - Value: `₦${summary['total_revenue']?.toStringAsFixed(0) ?? '0'}`
  - Color: Green accent
  - Padding: 16px, rounded corners 12px, shadow

- **Card 2 - Pending Payments**
  - Label: "Pending Payments"
  - Value: `₦${summary['pending_payments']?.toStringAsFixed(0) ?? '0'}`
  - Color: Amber/orange accent

- **Card 3 - Completed Payments**
  - Label: "Completed Payments"
  - Value: `summary['completed_payments'] ?? 0` (count)
  - Color: Blue accent

**Spacing:** 8px gap between cards. Use `Expanded` or `Flexible` for equal width.

### Pay Rent Button

- **Text:** "Pay Rent"
- **Style:** Primary/filled, full width or centered
- **On pressed:** Call `initRentPayment` → Navigate to WebView or open URL
- **Loading state:** Show CircularProgressIndicator when processing

### Filters

- **Status Dropdown:** Options: All, Pending, Paid, Overdue, Cancelled
- **Date From:** DatePicker or TextField (YYYY-MM-DD)
- **Date To:** DatePicker or TextField (YYYY-MM-DD)
- **Apply Button:** Triggers `fetchPaymentDashboard` with filters

### Transactions List

- **Item layout:**
  - Left: Tenant Name (bold), Amount (₦X,XXX)
  - Right: Status badge (colored), Date
- **Status colors:**
  - Paid: Green
  - Pending: Amber
  - Overdue: Orange
  - Cancelled: Grey
- **On tap:** Set `selectedTransaction`, show detail bottom sheet or navigate to detail page

---

## 4. Action Flows

### On Page Load

1. Get `authToken` from auth state
2. Call `fetchPaymentDashboard(apiBaseUrl, authToken)`
3. Set `summary` = result['summary'], `transactions` = result['transactions']
4. Set `isLoading` = false

### On "Pay Rent" Pressed

1. Set `isLoading` = true
2. Get `tenantId` and `rentAmount` (from rent balance or page state)
3. Call `initRentPayment(apiBaseUrl, tenantId, rentAmount, redirectUrl)`
4. If result != null: Open `payment_link` in WebView or url_launcher
5. Set `isLoading` = false
6. On return: Refresh dashboard (call fetchPaymentDashboard again)

### On Transaction Tap

1. Set `selectedTransaction` = tapped item
2. Show bottom sheet or navigate to TransactionDetailPage with transaction data

### On Filter Apply

1. Call `fetchPaymentDashboard(apiBaseUrl, authToken, statusFilter, dateFrom, dateTo)`
2. Update `transactions` and `summary`

---

## 5. Custom Actions (from payment_dashboard_actions.dart)

| Action                  | Inputs                                                   | Returns |
| ----------------------- | -------------------------------------------------------- | ------- |
| `fetchPaymentDashboard` | apiBaseUrl, authToken, statusFilter?, dateFrom?, dateTo? | Map?    |
| `initRentPayment`       | apiBaseUrl, tenantId, amount, redirectUrl?               | Map?    |
| `verifyPaymentStatus`   | apiBaseUrl, txRef                                        | String  |

---

## 6. Styling (Tailwind-style)

- **Spacing:** p-4 (16px), p-6 (24px), gap-2 (8px), gap-4 (16px)
- **Rounded:** rounded-xl (12px), rounded-lg (8px)
- **Shadow:** shadow-sm, shadow-md for cards
- **Colors:** Primary blue, success green, warning amber, muted grey
- **Typography:** Title 24sp bold, body 16sp, caption 12sp

---

## 7. Transaction Detail (Optional)

When user taps a transaction:

- Show: Tenant Name, Amount, Status, Due Date, Paid Date, Transaction ID
- If Pending: Show "Pay Now" button that triggers initRentPayment
