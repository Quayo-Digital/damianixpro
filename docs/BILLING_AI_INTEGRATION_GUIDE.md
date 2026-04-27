# Billing AI Tools Integration Guide

This guide explains where and how to trigger the billing AI tools throughout the payment flow.

## Quick Reference

| Trigger          | Tool                   | Component Location                                        | Integration Function            |
| ---------------- | ---------------------- | --------------------------------------------------------- | ------------------------------- |
| Pay Now click    | Pre-Payment Validation | `src/components/billing/PaymentValidator.tsx`             | `triggerPrePaymentValidation()` |
| Paystack webhook | Webhook Translator     | `src/components/billing/PaystackWebhookInterpreter.tsx`   | `triggerWebhookTranslation()`   |
| Payment success  | Ledger Auto-Poster     | `src/components/billing/LedgerPosting.tsx`                | `triggerLedgerAutoPost()`       |
| Payment failure  | Recovery Assistant     | `src/components/billing/FailedTransactionAnalyzer.tsx`    | `triggerRecoveryAssistant()`    |
| Cron (daily)     | Reminder Generator     | `src/components/tenants/RentReminderMessageGenerator.tsx` | `triggerReminderGenerator()`    |
| Dashboard load   | Insights Generator     | `src/components/owner/RentCollectionAnalyzer.tsx`         | `triggerInsightsGenerator()`    |

## Integration Service

The integration service (`src/services/billing/integrations.ts`) provides programmatic access to all billing AI tools. Import and use these functions in your payment flow:

```typescript
import {
  triggerPrePaymentValidation,
  triggerWebhookTranslation,
  triggerLedgerAutoPost,
  triggerRecoveryAssistant,
  triggerReminderGenerator,
  triggerInsightsGenerator,
} from '@/services/billing/integrations';
```

See `src/services/billing/integrationExamples.tsx` for complete code examples.

---

## Integration Points

### 1. Pre-Payment Validation

**Trigger:** Pay Now button click  
**Tool:** `PaymentValidator`  
**Location:** `src/components/billing/PaymentValidator.tsx`  
**Route:** `/billing/validator`

**When to Use:**

- Before processing any payment
- When user clicks "Pay Now" or submits payment form
- Before redirecting to Paystack

**Integration Example:**

```typescript
import { triggerPrePaymentValidation } from '@/services/billing/integrations';

async function handlePayNow(paymentData: PaymentAttempt) {
  // Validate payment before processing
  const validation = await triggerPrePaymentValidation(paymentData);

  if (!validation.isValid) {
    // Show warnings and recommendations
    showValidationErrors(validation.warnings);
    return;
  }

  // Proceed with payment if valid
  if (validation.paymentType === 'partial') {
    // Handle partial payment
    showPartialPaymentNotice(validation);
  } else if (validation.paymentType === 'overpayment') {
    // Handle overpayment
    showOverpaymentConfirmation(validation);
  }

  // Initialize Paystack payment
  initializePaystackPayment(paymentData);
}
```

---

### 2. Webhook Translator

**Trigger:** Paystack webhook received  
**Tool:** `PaystackWebhookInterpreter`  
**Location:** `src/components/billing/PaystackWebhookInterpreter.tsx`  
**Route:** `/billing/webhook-interpreter`

**When to Use:**

- In webhook handler endpoint
- When processing Paystack webhook events
- Before updating database with webhook data

**Integration Example:**

```typescript
import { triggerWebhookTranslation } from '@/services/billing/integrations';

// In your webhook handler (e.g., Supabase Edge Function)
export async function handlePaystackWebhook(req: Request) {
  const payload: PaystackWebhookPayload = await req.json();

  // Translate webhook data
  const interpretation = await triggerWebhookTranslation(payload);

  // Execute system actions
  for (const action of interpretation.systemActions) {
    if (action.priority === 'high') {
      await executeSystemAction(action);
    }
  }

  // Send user notification
  await sendNotification(payload.data.customer?.email, interpretation.userMessage);

  // Update database based on interpretation
  if (interpretation.paymentSuccess) {
    await updatePaymentStatus(payload.data.reference, 'success');
  } else {
    await updatePaymentStatus(payload.data.reference, 'failed');
    // Trigger recovery assistant
    await triggerRecoveryAssistant({
      reference: payload.data.reference || '',
      amount: payload.data.amount || 0,
      channel: payload.data.channel || 'unknown',
      gatewayResponse: payload.data.gateway_response || '',
    });
  }
}
```

---

### 3. Ledger Auto-Poster

**Trigger:** Payment success confirmed  
**Tool:** `LedgerPosting`  
**Location:** `src/components/billing/LedgerPosting.tsx`  
**Route:** `/billing/ledger-posting`

**When to Use:**

- After payment is confirmed successful
- After webhook confirms payment
- Before updating tenant account balance

**Integration Example:**

```typescript
import { triggerLedgerAutoPost } from '@/services/billing/integrations';

async function handlePaymentSuccess(paymentData: PaymentSuccessData) {
  // Auto-post to ledger
  const ledgerPost = await triggerLedgerAutoPost(paymentData);

  if (ledgerPost.success) {
    // Create journal entries in database
    await createJournalEntries(ledgerPost.journalEntries);

    // Update invoice statuses
    for (const settlement of ledgerPost.invoicesSettled) {
      await updateInvoice(settlement.invoiceId, {
        amountPaid: settlement.amountApplied,
        status: settlement.amountApplied >= invoice.amountDue ? 'paid' : 'partial',
      });
    }

    // Update wallet if credit exists
    if (ledgerPost.walletCredit > 0) {
      await creditWallet(paymentData.tenantId, ledgerPost.walletCredit);
    }

    // Process agent commission if applicable
    if (ledgerPost.agentCommission > 0 && paymentData.agentId) {
      await recordAgentCommission(paymentData.agentId, ledgerPost.agentCommission);
    }

    // Schedule landlord payout
    await schedulePayout(paymentData.propertyId, ledgerPost.landlordPayout);
  }
}
```

---

### 4. Recovery Assistant

**Trigger:** Payment failure detected  
**Tool:** `FailedTransactionAnalyzer`  
**Location:** `src/components/billing/FailedTransactionAnalyzer.tsx`  
**Route:** `/billing/failed-transaction`

**When to Use:**

- After webhook indicates payment failure
- When payment status is "failed"
- Before sending failure notification to customer

**Integration Example:**

```typescript
import { triggerRecoveryAssistant } from '@/services/billing/integrations';

async function handlePaymentFailure(failureData: PaymentFailureData) {
  // Analyze failure and get recovery recommendations
  const recovery = await triggerRecoveryAssistant(failureData);

  // Send appropriate retry message
  if (failureData.customerEmail) {
    await sendEmail(failureData.customerEmail, recovery.retryMessage.email);
  }

  // Send SMS if phone number available
  await sendSMS(tenantPhone, recovery.retryMessage.sms);

  // Send WhatsApp if available
  await sendWhatsApp(tenantWhatsApp, recovery.retryMessage.whatsapp);

  // Log failure analysis
  await logFailureAnalysis({
    reference: failureData.reference,
    cause: recovery.likelyCause,
    alternativeMethod: recovery.alternativePaymentMethod,
  });

  // Suggest alternative payment method in UI
  showAlternativePaymentOption(recovery.alternativePaymentMethod);
}
```

---

### 5. Reminder Generator

**Trigger:** Cron job (daily)  
**Tool:** `RentReminderMessageGenerator`  
**Location:** `src/components/tenants/RentReminderMessageGenerator.tsx`  
**Route:** `/tenants/reminder-messages`

**When to Use:**

- Daily cron job to check for due/overdue payments
- Scheduled reminder system
- Before sending rent reminders

**Integration Example:**

```typescript
import { triggerReminderGenerator } from '@/services/billing/integrations';

// In your cron job (e.g., Supabase Edge Function or scheduled task)
export async function dailyReminderCron() {
  // Get all tenants with upcoming or overdue payments
  const tenants = await getTenantsNeedingReminders();

  for (const tenant of tenants) {
    const daysToDue = calculateDaysToDue(tenant.dueDate);

    // Generate reminder message
    const reminder = await triggerReminderGenerator({
      tenantName: tenant.name,
      propertyAddress: tenant.propertyAddress,
      annualRent: tenant.annualRent,
      dueDate: tenant.dueDate,
      daysToDueDate: daysToDue,
      previousReminderCount: tenant.reminderCount,
      paymentHistory: tenant.paymentHistory,
      paystackPaymentLink: await generatePaymentLink(tenant.id, tenant.annualRent),
    });

    // Send reminders via preferred channel
    if (tenant.preferredChannel === 'sms') {
      await sendSMS(tenant.phone, reminder.sms);
    } else if (tenant.preferredChannel === 'whatsapp') {
      await sendWhatsApp(tenant.whatsapp, reminder.whatsapp);
    } else {
      await sendEmail(tenant.email, reminder.email);
    }

    // Update reminder count
    await incrementReminderCount(tenant.id);
  }
}
```

---

### 6. Insights Generator

**Trigger:** Dashboard load  
**Tool:** `RentCollectionAnalyzer` or `BillingHealthScanner`  
**Location:**

- `src/components/owner/RentCollectionAnalyzer.tsx` (Route: `/portfolio/rent-collection`)
- `src/components/billing/BillingHealthScanner.tsx` (Route: `/billing/health-scan`)

**When to Use:**

- When landlord/owner dashboard loads
- When admin dashboard loads
- For periodic health reports

**Integration Example:**

```typescript
import { triggerInsightsGenerator } from '@/services/billing/integrations';

// In dashboard component
export function OwnerDashboard() {
  const [insights, setInsights] = useState(null);

  useEffect(() => {
    async function loadInsights() {
      const propertyIds = await getUserPropertyIds();
      const dashboardInsights = await triggerInsightsGenerator(propertyIds);
      setInsights(dashboardInsights);
    }

    loadInsights();
  }, []);

  return (
    <div>
      {/* Display summary metrics */}
      <SummaryCards data={insights?.summary} />

      {/* Display top insights */}
      <InsightsList insights={insights?.topInsights} />

      {/* Display recommendations */}
      <RecommendationsList recommendations={insights?.recommendations} />
    </div>
  );
}
```

---

## Complete Payment Flow Integration

Here's how all tools work together in a complete payment flow:

```typescript
// 1. User clicks "Pay Now"
async function handlePayNow(paymentData: PaymentAttempt) {
  // Pre-Payment Validation
  const validation = await triggerPrePaymentValidation(paymentData);
  if (!validation.isValid) {
    return showErrors(validation);
  }

  // Initialize Paystack payment
  const paystackResponse = await initializePaystack(paymentData);
  redirectToPaystack(paystackResponse.authorization_url);
}

// 2. Paystack webhook received
async function handleWebhook(webhookPayload: PaystackWebhookPayload) {
  // Webhook Translator
  const interpretation = await triggerWebhookTranslation(webhookPayload);

  if (interpretation.paymentSuccess) {
    // 3. Payment Success - Ledger Auto-Poster
    const paymentData = extractPaymentData(webhookPayload);
    await triggerLedgerAutoPost(paymentData);

    // Update UI, send confirmation
    await sendSuccessNotification(interpretation.userMessage);
  } else {
    // 4. Payment Failure - Recovery Assistant
    const failureData = extractFailureData(webhookPayload);
    const recovery = await triggerRecoveryAssistant(failureData);

    // Send retry messages
    await sendRecoveryMessages(recovery.retryMessage);
  }
}

// 5. Daily Cron - Reminder Generator
async function dailyReminderJob() {
  const tenants = await getTenantsNeedingReminders();
  for (const tenant of tenants) {
    const reminder = await triggerReminderGenerator(tenant);
    await sendReminder(tenant, reminder);
  }
}

// 6. Dashboard Load - Insights Generator
async function loadDashboard() {
  const insights = await triggerInsightsGenerator();
  displayDashboardInsights(insights);
}
```

---

## Best Practices

1. **Always validate before processing** - Use Pre-Payment Validation to catch issues early
2. **Translate webhooks immediately** - Use Webhook Translator to understand what happened
3. **Auto-post successful payments** - Use Ledger Auto-Poster to maintain accurate records
4. **Recover failed payments quickly** - Use Recovery Assistant to help customers retry
5. **Send reminders proactively** - Use Reminder Generator to prevent overdue payments
6. **Monitor system health** - Use Insights Generator to identify issues early

---

## Error Handling

All integration functions should handle errors gracefully:

```typescript
try {
  const result = await triggerPrePaymentValidation(paymentData);
  // Process result
} catch (error) {
  console.error('Validation error:', error);
  // Fallback to basic validation or show error to user
  showError('Payment validation failed. Please try again.');
}
```

---

## Testing

Test each integration point:

1. **Pre-Payment Validation**: Test with various payment amounts (exact, partial, overpayment)
2. **Webhook Translator**: Test with different webhook event types
3. **Ledger Auto-Poster**: Verify journal entries balance
4. **Recovery Assistant**: Test with different failure reasons
5. **Reminder Generator**: Test for due and overdue scenarios
6. **Insights Generator**: Test with various property/tenant data sets
