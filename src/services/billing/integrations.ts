/**
 * Billing AI Tools Integration Service
 *
 * This service provides integration points for triggering billing AI tools
 * at the appropriate moments in the payment flow.
 */

import { getAccountingRates } from '@/services/payments/accounting';

// Note: These components are UI components, not directly importable here.
// The integration functions below provide the logic that can be used
// in the actual payment flow. See integrationExamples.tsx for usage examples.

// ============================================================================
// Type Definitions
// ============================================================================

export interface PaymentAttempt {
  tenantId: string;
  rentAmountDue: number;
  outstandingBalance: number;
  walletBalance: number;
  selectedPaymentMethod: string;
  dueDate: string;
  paymentAmount: number;
  penaltyAmount?: number;
  discountAmount?: number;
}

/** Webhook payload from Flutterwave (and compatible legacy shapes for interpreter) */
export interface PaymentWebhookPayload {
  event?: string;
  type?: string;
  data: {
    reference?: string;
    tx_ref?: string;
    status?: string;
    amount?: number;
    channel?: string;
    paid_at?: string;
    created_at?: string;
    gateway_response?: string;
    processor_response?: string;
    customer?: {
      email?: string;
    };
    [key: string]: unknown;
  };
}

export interface PaymentSuccessData {
  paymentId: string;
  paymentReference: string;
  paymentAmount: number;
  paymentDate: string;
  tenantId: string;
  propertyId: string;
  paymentMethod: string;
  agentId?: string;
  invoices?: Array<{
    id: string;
    invoiceNumber: string;
    amountDue: number;
    amountPaid: number;
    dueDate: string;
  }>;
}

export interface PaymentFailureData {
  reference: string;
  amount: number;
  channel: string;
  gatewayResponse: string;
  customerEmail?: string;
  customerName?: string;
  failureReason?: string;
  errorCode?: string;
}

export interface ReminderData {
  tenantName: string;
  propertyAddress: string;
  annualRent: number;
  dueDate: string;
  daysToDueDate: number;
  previousReminderCount: number;
  paymentHistory: Array<{
    period: string;
    paid: boolean;
    paidDate?: string;
    daysLate?: number;
  }>;
  paymentLink: string;
}

// ============================================================================
// Integration Functions
// ============================================================================

/**
 * TRIGGER: Pay Now click
 * TOOL: Pre-Payment Validation
 *
 * Validates payment before processing to ensure correct amounts,
 * detect overpayments/underpayments, and apply wallet balances.
 */
export async function triggerPrePaymentValidation(paymentData: PaymentAttempt): Promise<{
  isValid: boolean;
  approvedAmount: number;
  paymentType: 'full' | 'partial' | 'overpayment';
  warnings: string[];
  recommendations: string[];
}> {
  // This would call the PaymentValidator logic
  // For now, return a structured response that can be used by the payment flow
  return {
    isValid: true,
    approvedAmount: paymentData.paymentAmount,
    paymentType: 'full',
    warnings: [],
    recommendations: [],
  };
}

/**
 * TRIGGER: Payment webhook received
 * TOOL: Webhook Translator
 *
 * Interprets webhook data to determine payment status,
 * failure reasons, and required system actions.
 */
export async function triggerWebhookTranslation(webhookPayload: PaymentWebhookPayload): Promise<{
  paymentSuccess: boolean;
  failureReason?: string;
  systemActions: Array<{
    action: string;
    priority: 'high' | 'medium' | 'low';
    description: string;
  }>;
  userMessage: {
    title: string;
    message: string;
    severity: 'success' | 'info' | 'warning' | 'error';
  };
}> {
  // Extract webhook data (Flutterwave: type/data; charge.* style: event/data)
  const eventType = webhookPayload.event ?? webhookPayload.type ?? '';
  const data = webhookPayload.data;
  const status = (data.status?.toLowerCase() || '').replace('ful', ''); // successful -> success
  const gatewayResponse =
    (data.gateway_response ?? data.processor_response ?? '')?.toString().toLowerCase() || '';

  const paymentSuccess =
    eventType === 'charge.completed' || eventType === 'charge.success' || status === 'success';

  let failureReason: string | undefined;
  if (!paymentSuccess) {
    if (gatewayResponse.includes('insufficient') || gatewayResponse.includes('balance')) {
      failureReason = 'Insufficient funds in the account';
    } else if (gatewayResponse.includes('declined')) {
      failureReason = 'Transaction declined by bank or card issuer';
    } else if (gatewayResponse.includes('network') || gatewayResponse.includes('timeout')) {
      failureReason = 'Network connectivity issue';
    } else {
      failureReason = gatewayResponse || 'Payment failed for unknown reason';
    }
  }

  const systemActions: Array<{
    action: string;
    priority: 'high' | 'medium' | 'low';
    description: string;
  }> = [];

  if (paymentSuccess) {
    systemActions.push({
      action: 'Update Transaction Status',
      priority: 'high',
      description: 'Mark transaction as successful in database',
    });
    systemActions.push({
      action: 'Confirm Booking/Order',
      priority: 'high',
      description: 'Activate the associated booking or order',
    });
  } else {
    systemActions.push({
      action: 'Update Transaction Status',
      priority: 'high',
      description: 'Mark transaction as failed in database',
    });
    systemActions.push({
      action: 'Notify Customer',
      priority: 'medium',
      description: 'Send failure notification to customer',
    });
  }

  const userMessage = {
    title: paymentSuccess ? 'Payment Successful' : 'Payment Failed',
    message: paymentSuccess
      ? `Your payment of ₦${((data.amount || 0) >= 100 ? (data.amount || 0) / 100 : data.amount || 0).toLocaleString()} has been successfully processed.`
      : `Your payment could not be processed. ${failureReason || 'Please try again.'}`,
    severity: paymentSuccess ? ('success' as const) : ('error' as const),
  };

  return {
    paymentSuccess,
    failureReason,
    systemActions,
    userMessage,
  };
}

/**
 * TRIGGER: Payment success confirmed
 * TOOL: Ledger Auto-Poster
 *
 * Automatically posts confirmed payments to the billing ledger
 * with proper invoice settlement, commission splits, and journal entries.
 */
export async function triggerLedgerAutoPost(
  paymentData: PaymentSuccessData,
  options?: {
    platformFeeRate?: number;
    agentCommissionRate?: number;
    taxRate?: number;
  }
): Promise<{
  success: boolean;
  journalEntries: Array<{
    account: string;
    debit: number;
    credit: number;
    description: string;
    reference: string;
  }>;
  invoicesSettled: Array<{
    invoiceId: string;
    amountApplied: number;
    remainingBalance: number;
  }>;
  walletCredit: number;
  agentCommission: number;
  platformFee: number;
  taxAmount: number;
  landlordPayout: number;
  totalsBalance: boolean;
}> {
  let platformRate: number;
  let agentRate: number;
  let taxRate: number;
  if (
    options?.platformFeeRate != null ||
    options?.agentCommissionRate != null ||
    options?.taxRate != null
  ) {
    platformRate = (options.platformFeeRate ?? 5) / 100;
    agentRate = (options.agentCommissionRate ?? 3) / 100;
    taxRate = (options.taxRate ?? 7.5) / 100;
  } else {
    const rates = await getAccountingRates();
    platformRate = rates.platformFeeRate;
    agentRate = rates.agentCommissionRate;
    taxRate = rates.taxRate;
  }

  const payment = paymentData.paymentAmount;
  const invoices = paymentData.invoices || [];

  // Sort invoices by due date (FIFO)
  invoices.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

  // Determine which invoices to settle
  const invoicesSettled: Array<{
    invoiceId: string;
    amountApplied: number;
    remainingBalance: number;
  }> = [];
  let remainingPayment = payment;

  for (const invoice of invoices) {
    if (remainingPayment <= 0) break;
    const outstandingAmount = invoice.amountDue - invoice.amountPaid;
    if (outstandingAmount <= 0) continue;

    const amountToApply = Math.min(remainingPayment, outstandingAmount);
    invoicesSettled.push({
      invoiceId: invoice.id,
      amountApplied: amountToApply,
      remainingBalance: outstandingAmount - amountToApply,
    });
    remainingPayment -= amountToApply;
  }

  // Calculate wallet credit (excess payment)
  const walletCredit = remainingPayment > 0 ? remainingPayment : 0;

  // Calculate breakdown
  const totalSettled = invoicesSettled.reduce((sum, item) => sum + item.amountApplied, 0);
  const effectivePayment = totalSettled;

  const platformFee = effectivePayment * platformRate;
  const agentCommission = paymentData.agentId ? effectivePayment * agentRate : 0;
  const taxAmount = effectivePayment * taxRate;
  const landlordPayout = effectivePayment - platformFee - agentCommission - taxAmount;

  // Create journal entries
  const journalEntries: Array<{
    account: string;
    debit: number;
    credit: number;
    description: string;
    reference: string;
  }> = [];

  // Debit: Cash/Bank Account
  journalEntries.push({
    account: 'Cash/Bank Account',
    debit: payment,
    credit: 0,
    description: `Payment received via ${paymentData.paymentMethod}`,
    reference: paymentData.paymentReference,
  });

  // Credit: Accounts Receivable
  invoicesSettled.forEach((settlement) => {
    journalEntries.push({
      account: 'Accounts Receivable',
      debit: 0,
      credit: settlement.amountApplied,
      description: `Settlement of invoice`,
      reference: paymentData.paymentReference,
    });
  });

  // Credit: Tenant Wallet (if excess)
  if (walletCredit > 0) {
    journalEntries.push({
      account: 'Tenant Wallet',
      debit: 0,
      credit: walletCredit,
      description: 'Excess payment credited to tenant wallet',
      reference: paymentData.paymentReference,
    });
  }

  // Credit: Platform Revenue
  if (platformFee > 0) {
    journalEntries.push({
      account: 'Platform Revenue',
      debit: 0,
      credit: platformFee,
      description: 'Platform service fee',
      reference: paymentData.paymentReference,
    });
  }

  // Credit: Agent Commission Payable
  if (agentCommission > 0 && paymentData.agentId) {
    journalEntries.push({
      account: 'Agent Commission Payable',
      debit: 0,
      credit: agentCommission,
      description: `Agent commission (${(agentRate * 100).toFixed(1)}%)`,
      reference: paymentData.paymentReference,
    });
  }

  // Credit: Tax Payable
  if (taxAmount > 0) {
    journalEntries.push({
      account: 'Tax Payable',
      debit: 0,
      credit: taxAmount,
      description: `VAT/Tax (${(taxRate * 100).toFixed(1)}%)`,
      reference: paymentData.paymentReference,
    });
  }

  // Credit: Owner Payout Payable
  if (landlordPayout > 0) {
    journalEntries.push({
      account: 'Owner Payout Payable',
      debit: 0,
      credit: landlordPayout,
      description: 'Amount due to property owner',
      reference: paymentData.paymentReference,
    });
  }

  // Verify balance
  const totalDebits = journalEntries.reduce((sum, entry) => sum + entry.debit, 0);
  const totalCredits = journalEntries.reduce((sum, entry) => sum + entry.credit, 0);
  const totalsBalance = Math.abs(totalDebits - totalCredits) < 0.01;

  return {
    success: true,
    journalEntries,
    invoicesSettled,
    walletCredit,
    agentCommission,
    platformFee,
    taxAmount,
    landlordPayout,
    totalsBalance,
  };
}

/**
 * TRIGGER: Payment failure detected
 * TOOL: Recovery Assistant
 *
 * Analyzes failed transactions, identifies causes, suggests alternatives,
 * and generates calm retry messages.
 */
export async function triggerRecoveryAssistant(failureData: PaymentFailureData): Promise<{
  likelyCause: {
    category:
      | 'network'
      | 'insufficient-funds'
      | 'bank-issue'
      | 'card-issue'
      | 'system-error'
      | 'unknown';
    confidence: 'high' | 'medium' | 'low';
    explanation: string;
    indicators: string[];
  };
  alternativePaymentMethod: {
    method: 'bank-transfer' | 'ussd' | 'card-retry';
    reason: string;
    instructions: string;
  };
  recommendedActions: Array<{
    action: string;
    priority: 'high' | 'medium' | 'low';
    description: string;
  }>;
  retryMessage: {
    sms: string;
    whatsapp: string;
    email: {
      subject: string;
      body: string;
    };
  };
}> {
  const formatCurrency = (amount: number) => {
    // Some payloads encode amounts in kobo
    const nairaAmount = amount / 100;
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
    }).format(nairaAmount);
  };

  const response = failureData.gatewayResponse.toLowerCase();
  const reason = failureData.failureReason?.toLowerCase() || '';
  const code = failureData.errorCode?.toLowerCase() || '';

  let likelyCause: {
    category:
      | 'network'
      | 'insufficient-funds'
      | 'bank-issue'
      | 'card-issue'
      | 'system-error'
      | 'unknown';
    confidence: 'high' | 'medium' | 'low';
    explanation: string;
    indicators: string[];
  };

  const indicators: string[] = [];

  if (
    response.includes('network') ||
    response.includes('timeout') ||
    response.includes('connection') ||
    code.includes('timeout') ||
    code.includes('network')
  ) {
    likelyCause = {
      category: 'network',
      confidence: 'high',
      explanation:
        'The transaction failed due to a network connectivity issue. This is usually temporary and can be resolved by retrying the payment.',
      indicators: ['Network timeout', 'Connection error'],
    };
  } else if (
    response.includes('insufficient') ||
    response.includes('balance') ||
    response.includes('fund') ||
    reason.includes('insufficient')
  ) {
    likelyCause = {
      category: 'insufficient-funds',
      confidence: 'high',
      explanation:
        'The transaction failed because there are insufficient funds in the account or card. The customer needs to ensure they have enough balance before retrying.',
      indicators: ['Insufficient funds', 'Low balance'],
    };
  } else if (
    response.includes('bank') ||
    response.includes('declined by bank') ||
    response.includes('bank error') ||
    reason.includes('bank')
  ) {
    likelyCause = {
      category: 'bank-issue',
      confidence: 'medium',
      explanation:
        'The transaction was declined by the bank. This could be due to bank maintenance, security restrictions, or account limitations.',
      indicators: ['Bank declined', 'Bank error'],
    };
  } else if (
    response.includes('card') ||
    response.includes('expired') ||
    response.includes('invalid card') ||
    response.includes('card declined')
  ) {
    likelyCause = {
      category: 'card-issue',
      confidence: 'high',
      explanation:
        'The transaction failed due to a card-related issue. This could be an expired card, invalid card details, or card restrictions.',
      indicators: ['Card declined', 'Invalid card'],
    };
  } else if (
    response.includes('system') ||
    response.includes('server') ||
    response.includes('internal error') ||
    code.includes('500') ||
    code.includes('503')
  ) {
    likelyCause = {
      category: 'system-error',
      confidence: 'medium',
      explanation:
        'The transaction failed due to a system error on the payment gateway. This is usually temporary and should be resolved shortly.',
      indicators: ['System error', 'Service unavailable'],
    };
  } else {
    likelyCause = {
      category: 'unknown',
      confidence: 'low',
      explanation:
        'The exact cause of the failure is unclear. It could be a temporary issue. We recommend trying an alternative payment method or contacting support.',
      indicators: ['Unknown error'],
    };
  }

  // Determine best alternative payment method
  let alternativePaymentMethod: {
    method: 'bank-transfer' | 'ussd' | 'card-retry';
    reason: string;
    instructions: string;
  };

  if (likelyCause.category === 'network') {
    alternativePaymentMethod = {
      method: 'ussd',
      reason:
        'USSD payments are more reliable during network issues as they use a different connection method.',
      instructions:
        'Dial *906*[amount]*[reference]# on your mobile phone to complete the payment via USSD.',
    };
  } else if (likelyCause.category === 'insufficient-funds') {
    alternativePaymentMethod = {
      method: 'bank-transfer',
      reason:
        'Bank transfer allows you to use a different account or add funds to your current account before paying.',
      instructions:
        'Transfer the amount directly to our bank account. Account details will be provided after selection.',
    };
  } else if (likelyCause.category === 'card-issue') {
    alternativePaymentMethod = {
      method: 'bank-transfer',
      reason:
        'Bank transfer bypasses card-related issues and is a reliable alternative payment method.',
      instructions:
        'Transfer the amount directly to our bank account. Account details will be provided after selection.',
    };
  } else {
    alternativePaymentMethod = {
      method: 'ussd',
      reason:
        'USSD payments use a different banking channel and may work when direct bank transfers fail.',
      instructions:
        'Dial *906*[amount]*[reference]# on your mobile phone to complete the payment via USSD.',
    };
  }

  // Generate recommended actions
  const recommendedActions: Array<{
    action: string;
    priority: 'high' | 'medium' | 'low';
    description: string;
  }> = [];

  if (likelyCause.category === 'network') {
    recommendedActions.push({
      action: 'Retry Payment',
      priority: 'high',
      description:
        'Wait a few minutes and try the payment again. Network issues are usually temporary.',
    });
    recommendedActions.push({
      action: 'Try Alternative Method',
      priority: 'high',
      description: `Use ${alternativePaymentMethod.method === 'ussd' ? 'USSD' : 'Bank Transfer'} as an alternative payment method.`,
    });
  } else if (likelyCause.category === 'insufficient-funds') {
    recommendedActions.push({
      action: 'Check Account Balance',
      priority: 'high',
      description: 'Verify that you have sufficient funds in your account or card before retrying.',
    });
    recommendedActions.push({
      action: 'Add Funds',
      priority: 'high',
      description: 'Add funds to your account or card, then retry the payment.',
    });
  } else if (likelyCause.category === 'card-issue') {
    recommendedActions.push({
      action: 'Verify Card Details',
      priority: 'high',
      description: 'Check that your card number, expiry date, and CVV are correct.',
    });
    recommendedActions.push({
      action: 'Use Alternative Payment Method',
      priority: 'high',
      description: `Try ${alternativePaymentMethod.method === 'bank-transfer' ? 'Bank Transfer' : 'USSD'} instead.`,
    });
  } else {
    recommendedActions.push({
      action: 'Retry Payment',
      priority: 'high',
      description: 'Try the payment again. The issue may have been temporary.',
    });
    recommendedActions.push({
      action: 'Try Alternative Method',
      priority: 'high',
      description: `Use ${alternativePaymentMethod.method === 'bank-transfer' ? 'Bank Transfer' : 'USSD'} as an alternative.`,
    });
  }

  // Generate retry messages
  const customerName = failureData.customerName || 'Valued Customer';
  const amountFormatted = formatCurrency(failureData.amount);

  const sms = `Hi ${customerName}, your payment of ${amountFormatted} (Ref: ${failureData.reference}) didn't go through. ${likelyCause.category === 'network' ? 'This looks like a temporary network issue.' : likelyCause.category === 'insufficient-funds' ? 'Please check your account balance.' : 'No worries - this happens sometimes.'} You can retry or use ${alternativePaymentMethod.method === 'bank-transfer' ? 'bank transfer' : 'USSD'}. Need help? Reply to this message.`;

  let whatsapp = `Hi ${customerName},\n\n`;
  whatsapp += `I wanted to let you know that your payment of ${amountFormatted} (Reference: ${failureData.reference}) didn't complete successfully.\n\n`;
  whatsapp += `${likelyCause.explanation}\n\n`;
  whatsapp += `Don't worry - this happens sometimes and it's usually easy to resolve.\n\n`;
  whatsapp += `Here's what you can do:\n\n`;
  recommendedActions
    .filter((a) => a.priority === 'high')
    .slice(0, 2)
    .forEach((action, index) => {
      whatsapp += `${index + 1}. ${action.action}: ${action.description}\n\n`;
    });
  whatsapp += `Alternatively, you can use ${alternativePaymentMethod.method === 'bank-transfer' ? 'bank transfer' : 'USSD'} to complete your payment.\n\n`;
  whatsapp += `If you need any assistance or have questions, please don't hesitate to reach out. We're here to help!\n\n`;
  whatsapp += `Best regards,\nProperty Management Team`;

  const emailSubject = `Payment Issue - Reference ${failureData.reference}`;
  let emailBody = `Dear ${customerName},\n\n`;
  emailBody += `We wanted to inform you that your payment of ${amountFormatted} (Reference: ${failureData.reference}) was not completed successfully.\n\n`;
  emailBody += `**What happened?**\n`;
  emailBody += `${likelyCause.explanation}\n\n`;
  emailBody += `**No need to worry** - payment issues are common and usually easy to resolve. Your payment attempt has been recorded, and you can easily retry or use an alternative method.\n\n`;
  emailBody += `**Recommended Next Steps:**\n\n`;
  recommendedActions
    .filter((a) => a.priority === 'high')
    .forEach((action, index) => {
      emailBody += `${index + 1}. **${action.action}**\n`;
      emailBody += `   ${action.description}\n\n`;
    });
  emailBody += `**Alternative Payment Method:**\n`;
  emailBody += `We recommend using ${alternativePaymentMethod.method === 'bank-transfer' ? 'Bank Transfer' : 'USSD'} as an alternative:\n`;
  emailBody += `${alternativePaymentMethod.reason}\n`;
  emailBody += `${alternativePaymentMethod.instructions}\n\n`;
  emailBody += `If you have any questions or need assistance, please don't hesitate to contact us. We're here to help make this process as smooth as possible.\n\n`;
  emailBody += `Thank you for your patience.\n\n`;
  emailBody += `Best regards,\n`;
  emailBody += `Property Management Team`;

  return {
    likelyCause,
    alternativePaymentMethod,
    recommendedActions,
    retryMessage: {
      sms,
      whatsapp,
      email: {
        subject: emailSubject,
        body: emailBody,
      },
    },
  };
}

/**
 * TRIGGER: Cron job (daily)
 * TOOL: Reminder Generator
 *
 * Generates rent reminder messages for tenants based on payment status,
 * due dates, and payment history.
 */
export async function triggerReminderGenerator(reminderData: ReminderData): Promise<{
  sms: string;
  whatsapp: string;
  email: {
    subject: string;
    body: string;
  };
}> {
  // This would call the RentReminderMessageGenerator logic
  const isOverdue = reminderData.daysToDueDate < 0;
  const daysOverdue = isOverdue ? Math.abs(reminderData.daysToDueDate) : 0;
  const daysUntilDue = isOverdue ? 0 : reminderData.daysToDueDate;

  const amountFormatted = `₦${reminderData.annualRent.toLocaleString()}`;

  let sms = '';
  let whatsapp = '';
  let emailSubject = '';
  let emailBody = '';

  if (isOverdue) {
    sms = `Hi ${reminderData.tenantName}, your rent of ${amountFormatted} for ${reminderData.propertyAddress} was due and is ${daysOverdue} day${daysOverdue !== 1 ? 's' : ''} overdue. Pay: ${reminderData.paymentLink}`;

    whatsapp = `Hi ${reminderData.tenantName},\n\nThis is a reminder that your annual rent payment of ${amountFormatted} for ${reminderData.propertyAddress} was due and is now ${daysOverdue} day${daysOverdue !== 1 ? 's' : ''} overdue.\n\nPlease make payment as soon as possible.\n\nPay Now: ${reminderData.paymentLink}\n\nThank you,\nProperty Management Team`;

    emailSubject = `Rent Payment Reminder - ${daysOverdue} Day${daysOverdue !== 1 ? 's' : ''} Overdue`;
    emailBody = `Dear ${reminderData.tenantName},\n\nThis is a reminder that your annual rent payment of ${amountFormatted} for ${reminderData.propertyAddress} was due and is now ${daysOverdue} day${daysOverdue !== 1 ? 's' : ''} overdue.\n\nPlease make payment as soon as possible to avoid any complications.\n\nPay Now: ${reminderData.paymentLink}\n\nThank you,\nProperty Management Team`;
  } else {
    sms = `Hi ${reminderData.tenantName}, rent reminder: ${amountFormatted} due in ${daysUntilDue} days. Pay: ${reminderData.paymentLink}`;

    whatsapp = `Hi ${reminderData.tenantName},\n\nThis is a friendly reminder that your annual rent payment of ${amountFormatted} for ${reminderData.propertyAddress} is due in ${daysUntilDue} day${daysUntilDue !== 1 ? 's' : ''}.\n\nPlease arrange for payment at your earliest convenience.\n\nPay Now: ${reminderData.paymentLink}\n\nThank you,\nProperty Management Team`;

    emailSubject = `Rent Payment Reminder - Due in ${daysUntilDue} Day${daysUntilDue !== 1 ? 's' : ''}`;
    emailBody = `Dear ${reminderData.tenantName},\n\nThis is a friendly reminder that your annual rent payment of ${amountFormatted} for ${reminderData.propertyAddress} is due in ${daysUntilDue} day${daysUntilDue !== 1 ? 's' : ''}.\n\nPlease arrange for payment at your earliest convenience.\n\nPay Now: ${reminderData.paymentLink}\n\nThank you,\nProperty Management Team`;
  }

  return {
    sms,
    whatsapp,
    email: {
      subject: emailSubject,
      body: emailBody,
    },
  };
}

/**
 * TRIGGER: Dashboard load
 * TOOL: Insights Generator
 *
 * Generates billing insights for dashboard display including
 * collection rates, arrears, and actionable recommendations.
 */
export async function triggerInsightsGenerator(
  propertyIds?: string[],
  tenantData?: Array<{
    tenantId: string;
    totalPayments: number;
    successfulPayments: number;
    failedPayments: number;
    averageDaysLate: number;
    totalArrears: number;
  }>,
  propertyData?: Array<{
    propertyId: string;
    totalExpectedRent: number;
    totalCollectedRent: number;
    totalArrears: number;
    collectionRate: number;
  }>
): Promise<{
  summary: {
    totalRevenue: number;
    totalArrears: number;
    collectionRate: number;
    failureRate: number;
    propertiesCount: number;
    tenantsCount: number;
  };
  topInsights: Array<{
    type: 'positive' | 'warning' | 'action';
    title: string;
    description: string;
    priority: 'high' | 'medium' | 'low';
  }>;
  recommendations: string[];
}> {
  const properties = propertyData || [];
  const tenants = tenantData || [];

  // Calculate summary
  const totalRevenue = properties.reduce((sum, p) => sum + p.totalCollectedRent, 0);
  const totalArrears = properties.reduce((sum, p) => sum + p.totalArrears, 0);
  const totalExpected = properties.reduce((sum, p) => sum + p.totalExpectedRent, 0);
  const collectionRate = totalExpected > 0 ? (totalRevenue / totalExpected) * 100 : 0;

  const totalPaymentAttempts = tenants.reduce((sum, t) => sum + t.totalPayments, 0);
  const totalFailedPayments = tenants.reduce((sum, t) => sum + t.failedPayments, 0);
  const failureRate =
    totalPaymentAttempts > 0 ? (totalFailedPayments / totalPaymentAttempts) * 100 : 0;

  // Generate insights
  const topInsights: Array<{
    type: 'positive' | 'warning' | 'action';
    title: string;
    description: string;
    priority: 'high' | 'medium' | 'low';
  }> = [];

  // Positive insights
  if (collectionRate >= 90) {
    topInsights.push({
      type: 'positive',
      title: 'Excellent Collection Rate',
      description: `You're collecting ${collectionRate.toFixed(1)}% of expected rent. This is above the industry average.`,
      priority: 'low',
    });
  }

  // Warning insights
  if (collectionRate < 70) {
    topInsights.push({
      type: 'warning',
      title: 'Collection Rate Below Target',
      description: `Your collection rate of ${collectionRate.toFixed(1)}% is below the recommended 80% target.`,
      priority: 'high',
    });
  }

  if (totalArrears > totalExpected * 0.2) {
    topInsights.push({
      type: 'warning',
      title: 'Significant Arrears',
      description: `You have significant arrears that need attention.`,
      priority: 'high',
    });
  }

  if (failureRate > 15) {
    topInsights.push({
      type: 'warning',
      title: 'High Payment Failure Rate',
      description: `Payment failure rate of ${failureRate.toFixed(1)}% is high and may indicate payment processing issues.`,
      priority: 'high',
    });
  }

  // Action insights
  if (collectionRate < 80) {
    topInsights.push({
      type: 'action',
      title: 'Improve Collection Rate',
      description: `Focus on properties with low collection rates and send payment reminders to tenants with outstanding balances.`,
      priority: 'high',
    });
  }

  if (totalArrears > 0) {
    topInsights.push({
      type: 'action',
      title: 'Recover Outstanding Amounts',
      description: `With significant arrears, consider implementing payment plans and sending reminders to tenants.`,
      priority: 'medium',
    });
  }

  // Generate recommendations
  const recommendations: string[] = [];

  if (collectionRate < 80) {
    recommendations.push('Send payment reminders to tenants with upcoming or overdue payments');
    recommendations.push(
      'Review payment terms and consider offering payment plans for struggling tenants'
    );
  }

  if (failureRate > 15) {
    recommendations.push('Investigate payment channel issues and verify integration status');
    recommendations.push('Contact tenants with high failure rates to update payment methods');
  }

  if (totalArrears > 0) {
    recommendations.push('Prioritize collection from tenants with the highest arrears');
    recommendations.push('Consider early intervention for tenants showing payment delays');
  }

  return {
    summary: {
      totalRevenue,
      totalArrears,
      collectionRate,
      failureRate,
      propertiesCount: properties.length,
      tenantsCount: tenants.length,
    },
    topInsights,
    recommendations,
  };
}

// ============================================================================
// Hook for React Components
// ============================================================================

/**
 * React hook to use billing AI tools integration
 */
export function useBillingAITools() {
  return {
    validatePayment: triggerPrePaymentValidation,
    translateWebhook: triggerWebhookTranslation,
    postToLedger: triggerLedgerAutoPost,
    recoverPayment: triggerRecoveryAssistant,
    generateReminder: triggerReminderGenerator,
    generateInsights: triggerInsightsGenerator,
  };
}
