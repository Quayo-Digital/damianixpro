/**
 * Billing AI Tools Integration Examples
 *
 * This file contains practical examples of how to integrate
 * billing AI tools into the existing payment flow.
 */

// ============================================================================
// Example 1: Pre-Payment Validation in Payment Button
// ============================================================================

/**
 * Example: Add validation before payment initialization
 * Location: Payment button click handler
 */
export async function examplePrePaymentValidation() {
  // In your payment component (e.g., PaymentInterface.tsx)
  /*
  import { triggerPrePaymentValidation } from '@/services/billing/integrations';

  const handlePayNow = async () => {
    const paymentData = {
      tenantId: currentTenant.id,
      rentAmountDue: annualRent,
      outstandingBalance: outstandingBalance,
      walletBalance: walletBalance,
      selectedPaymentMethod: selectedMethod,
      dueDate: dueDate,
      paymentAmount: paymentAmount,
      penaltyAmount: penaltyAmount,
      discountAmount: discountAmount,
    };

    // TRIGGER: Pre-Payment Validation
    const validation = await triggerPrePaymentValidation(paymentData);

    if (!validation.isValid) {
      // Show validation errors
      toast.error('Payment validation failed', {
        description: validation.warnings.join(', '),
      });
      return;
    }

    // Handle partial payments
    if (validation.paymentType === 'partial') {
      const confirmed = await confirmPartialPayment({
        amount: validation.approvedAmount,
        remaining: validation.paymentInstructions.remainingBalance,
      });
      if (!confirmed) return;
    }

    // Handle overpayments
    if (validation.paymentType === 'overpayment' && validation.paymentInstructions.requiresConfirmation) {
      const allocation = await selectExcessAllocation();
      if (!allocation) return;
    }

    // Proceed with payment initialization
    await initializePaystackPayment(paymentData);
  };
  */
}

// ============================================================================
// Example 2: Webhook Translation in Webhook Handler
// ============================================================================

/**
 * Example: Translate webhook in Supabase Edge Function
 * Location: supabase/functions/paystack-webhook/index.ts
 */
export async function exampleWebhookTranslation() {
  /*
  import { triggerWebhookTranslation } from '@/services/billing/integrations';

  // In your webhook handler
  serve(async (req) => {
    const signature = req.headers.get('x-paystack-signature');
    const body = await req.text();
    
    // Verify signature...
    
    const webhookPayload: PaymentWebhookPayload = JSON.parse(body);

    // TRIGGER: Webhook Translator
    const interpretation = await triggerWebhookTranslation(webhookPayload);

    // Execute high-priority system actions
    for (const action of interpretation.systemActions) {
      if (action.priority === 'high') {
        await executeAction(action);
      }
    }

    // Update database based on interpretation
    if (interpretation.paymentSuccess) {
      await updatePaymentStatus(webhookPayload.data.reference, 'success');
      
      // TRIGGER: Ledger Auto-Poster (see Example 3)
      await triggerLedgerAutoPost({
        paymentId: webhookPayload.data.reference,
        paymentReference: webhookPayload.data.reference,
        paymentAmount: (webhookPayload.data.amount || 0) / 100,
        paymentDate: webhookPayload.data.paid_at || new Date().toISOString(),
        tenantId: webhookPayload.data.metadata?.tenant_id,
        propertyId: webhookPayload.data.metadata?.property_id,
        paymentMethod: webhookPayload.data.channel || 'paystack',
      });
    } else {
      await updatePaymentStatus(webhookPayload.data.reference, 'failed');
      
      // TRIGGER: Recovery Assistant (see Example 4)
      await triggerRecoveryAssistant({
        reference: webhookPayload.data.reference || '',
        amount: webhookPayload.data.amount || 0,
        channel: webhookPayload.data.channel || 'unknown',
        gatewayResponse: webhookPayload.data.gateway_response || '',
        customerEmail: webhookPayload.data.customer?.email,
      });
    }

    // Send user notification
    await sendNotification(
      webhookPayload.data.customer?.email,
      interpretation.userMessage
    );

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  });
  */
}

// ============================================================================
// Example 3: Ledger Auto-Post After Payment Success
// ============================================================================

/**
 * Example: Auto-post to ledger after successful payment
 * Location: After webhook confirms payment success
 */
export async function exampleLedgerAutoPost() {
  /*
  import { triggerLedgerAutoPost } from '@/services/billing/integrations';

  // After payment is confirmed successful
  async function handlePaymentSuccess(paymentData: PaymentSuccessData) {
    // TRIGGER: Ledger Auto-Poster
    const ledgerPost = await triggerLedgerAutoPost(paymentData);

    if (ledgerPost.success) {
      // Create journal entries in database
      await supabase.from('journal_entries').insert(
        ledgerPost.journalEntries.map(entry => ({
          account: entry.account,
          debit: entry.debit,
          credit: entry.credit,
          description: entry.description,
          reference: entry.reference,
          payment_id: paymentData.paymentId,
          created_at: new Date().toISOString(),
        }))
      );

      // Update invoice statuses
      for (const settlement of ledgerPost.invoicesSettled) {
        await supabase
          .from('invoices')
          .update({
            amount_paid: settlement.amountApplied,
            status: settlement.remainingBalance === 0 ? 'paid' : 'partial',
            updated_at: new Date().toISOString(),
          })
          .eq('id', settlement.invoice.id);
      }

      // Update wallet if credit exists
      if (ledgerPost.walletCredit > 0) {
        await supabase.rpc('credit_wallet', {
          tenant_id: paymentData.tenantId,
          amount: ledgerPost.walletCredit,
        });
      }

      // Process agent commission if applicable
      if (ledgerPost.agentCommission > 0 && paymentData.agentId) {
        await supabase.from('agent_commissions').insert({
          agent_id: paymentData.agentId,
          payment_id: paymentData.paymentId,
          amount: ledgerPost.agentCommission,
          status: 'pending',
          created_at: new Date().toISOString(),
        });
      }

      // Schedule landlord payout
      await supabase.from('payouts').insert({
        property_id: paymentData.propertyId,
        amount: ledgerPost.landlordPayout,
        status: 'pending',
        payment_id: paymentData.paymentId,
        created_at: new Date().toISOString(),
      });
    }
  }
  */
}

// ============================================================================
// Example 4: Recovery Assistant on Payment Failure
// ============================================================================

/**
 * Example: Trigger recovery assistant when payment fails
 * Location: After webhook indicates failure
 */
export async function exampleRecoveryAssistant() {
  /*
  import { triggerRecoveryAssistant } from '@/services/billing/integrations';

  // After payment failure is detected
  async function handlePaymentFailure(failureData: PaymentFailureData) {
    // TRIGGER: Recovery Assistant
    const recovery = await triggerRecoveryAssistant(failureData);

    // Get tenant information
    const tenant = await getTenantByEmail(failureData.customerEmail);

    if (tenant) {
      // Send appropriate retry message via preferred channel
      if (tenant.preferredChannel === 'sms' && tenant.phone) {
        await sendSMS(tenant.phone, recovery.retryMessage.sms);
      } else if (tenant.preferredChannel === 'whatsapp' && tenant.whatsapp) {
        await sendWhatsApp(tenant.whatsapp, recovery.retryMessage.whatsapp);
      } else if (tenant.email) {
        await sendEmail(tenant.email, recovery.retryMessage.email);
      }

      // Log failure analysis for future reference
      await supabase.from('payment_failure_logs').insert({
        reference: failureData.reference,
        tenant_id: tenant.id,
        likely_cause: recovery.likelyCause.category,
        alternative_method: recovery.alternativePaymentMethod.method,
        created_at: new Date().toISOString(),
      });

      // Show alternative payment option in UI
      showAlternativePaymentOption({
        method: recovery.alternativePaymentMethod.method,
        instructions: recovery.alternativePaymentMethod.instructions,
      });
    }
  }
  */
}

// ============================================================================
// Example 5: Daily Reminder Generator (Cron Job)
// ============================================================================

/**
 * Example: Daily cron job for rent reminders
 * Location: Supabase Edge Function (scheduled) or server cron
 */
export async function exampleDailyReminderCron() {
  /*
  import { triggerReminderGenerator } from '@/services/billing/integrations';

  // In Supabase Edge Function or scheduled task
  Deno.serve(async (req) => {
    // Get all tenants with upcoming or overdue payments
    const { data: tenants } = await supabase
      .from('property_tenants')
      .select(`
        *,
        tenants (*),
        properties (*)
      `)
      .eq('status', 'active');

    const today = new Date();
    
    for (const tenant of tenants || []) {
      const dueDate = new Date(tenant.lease_end_date);
      const daysToDue = Math.floor((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      
      // Only send reminders for payments due within 7 days or overdue
      if (daysToDue <= 7 || daysToDue < 0) {
        // Get payment history
        const { data: payments } = await supabase
          .from('rent_payments')
          .select('*')
          .eq('tenant_id', tenant.tenant_id)
          .order('payment_date', { ascending: false });

        // Generate payment link
        const paymentLink = await generatePaystackPaymentLink({
          tenantId: tenant.tenant_id,
          amount: tenant.annual_rent,
        });

        // TRIGGER: Reminder Generator
        const reminder = await triggerReminderGenerator({
          tenantName: tenant.tenants.first_name + ' ' + tenant.tenants.last_name,
          propertyAddress: tenant.properties.address,
          annualRent: tenant.annual_rent,
          dueDate: tenant.lease_end_date,
          daysToDueDate: daysToDue,
          previousReminderCount: tenant.reminder_count || 0,
          paymentHistory: payments?.map(p => ({
            period: p.payment_period,
            paid: p.status === 'success',
            paidDate: p.payment_date,
            daysLate: p.days_late || 0,
          })) || [],
          paymentLink: paymentLink,
        });

        // Send reminder via preferred channel
        if (tenant.tenants.preferred_channel === 'sms') {
          await sendSMS(tenant.tenants.phone, reminder.sms);
        } else if (tenant.tenants.preferred_channel === 'whatsapp') {
          await sendWhatsApp(tenant.tenants.whatsapp, reminder.whatsapp);
        } else {
          await sendEmail(tenant.tenants.email, reminder.email);
        }

        // Update reminder count
        await supabase
          .from('property_tenants')
          .update({ reminder_count: (tenant.reminder_count || 0) + 1 })
          .eq('id', tenant.id);
      }
    }

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  });
  */
}

// ============================================================================
// Example 6: Insights Generator on Dashboard Load
// ============================================================================

/**
 * Example: Generate insights when dashboard loads
 * Location: Owner/Admin dashboard component
 */
export async function exampleDashboardInsights() {
  /*
  import { triggerInsightsGenerator } from '@/services/billing/integrations';
  import { useQuery } from '@tanstack/react-query';

  // In OwnerDashboard component
  export function OwnerDashboard() {
    const { user } = useAuthSession();
    
    // TRIGGER: Insights Generator
    const { data: insights, isLoading } = useQuery({
      queryKey: ['billing-insights', user?.id],
      queryFn: async () => {
        // Get user's properties
        const { data: properties } = await supabase
          .from('properties')
          .select('id')
          .eq('owner_id', user?.id);

        const propertyIds = properties?.map(p => p.id) || [];
        
        return await triggerInsightsGenerator(propertyIds);
      },
      refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
    });

    if (isLoading) return <Loading />;

    return (
      <div>
        <SummaryCards data={insights?.summary} />
        <InsightsList insights={insights?.topInsights} />
        <RecommendationsList recommendations={insights?.recommendations} />
      </div>
    );
  }
  */
}
