# FlutterFlow Rent Payment - Example Action Flow

## Step-by-Step Setup

### 1. Page State Variables

Create a page with these variables:

- `isLoading` (bool) - default false
- `paymentLink` (String) - default ""
- `txRef` (String) - default ""
- `paymentStatus` (String) - default ""

### 2. "Pay Rent" Button - On Pressed

```
Action Flow:
├─ Update Page State: isLoading = true
├─ Custom Action: initRentPayment
│   ├─ apiBaseUrl: "https://your-api.com"  (or from App State)
│   ├─ tenantId: [your tenant id from auth]
│   └─ amount: [rent amount, e.g. 120000]
├─ Conditional: if result != null
│   ├─ TRUE:
│   │   ├─ Update: paymentLink = result['payment_link']
│   │   ├─ Update: txRef = result['tx_ref']
│   │   └─ Navigate to: PaymentWebViewPage
│   │       └─ Pass: paymentLink, txRef
│   └─ FALSE:
│       └─ Show Snackbar: "Failed to initialize payment"
└─ Update Page State: isLoading = false
```

### 3. Payment WebView Page

- **WebView** widget: initialUrl = `paymentLink` (from route param)
- **AppBar** with "Cancel" to go back
- **Floating "I've completed payment"** button at bottom:
  - On pressed → Navigate to Verification (pass txRef)

### 4. Verification Logic (or on WebView navigation callback)

```
Action Flow: verifyAndShowResult
├─ Loop: 10 times (or use Timer)
│   ├─ Custom Action: verifyPaymentStatus
│   │   ├─ apiBaseUrl: "https://your-api.com"
│   │   └─ txRef: [from state]
│   ├─ Conditional: status
│   │   ├─ "PAID" → Navigate to SuccessPage, break
│   │   ├─ "CANCELLED" or "error" → Navigate to FailurePage, break
│   │   └─ "PENDING" → Wait 2 seconds, retry
└─ If loop ends with PENDING → Show "Still verifying..."
```

### 5. Success Page

- Title: "Payment Successful"
- Subtitle: "Your rent payment has been received."
- Button: "Done" → Navigate back to home/rent page

### 6. Failure Page

- Title: "Payment Incomplete"
- Subtitle: "The payment was not completed. Please try again."
- Button: "Try Again" → Navigate back to rent page

---

## Alternative: Inline WebView with URL Detection

If your WebView supports `onNavigationStateChange` or similar:

1. When URL contains `/api/payments/callback` or `status=successful`:
2. Extract `tx_ref` from URL
3. Auto-trigger verification (no "I've completed" button needed)
