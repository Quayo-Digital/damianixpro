import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import * as crypto from 'node:crypto';

const PAYSTACK_WEBHOOK_SECRET = Deno.env.get('PAYSTACK_WEBHOOK_SECRET');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const signature = req.headers.get('x-paystack-signature');
  const body = await req.text();

  if (!PAYSTACK_WEBHOOK_SECRET) {
    console.error('PAYSTACK_WEBHOOK_SECRET is not set in environment variables.');
    return new Response('Webhook secret not configured.', { status: 500 });
  }

  const hash = crypto.createHmac('sha512', PAYSTACK_WEBHOOK_SECRET).update(body).digest('hex');

  if (hash !== signature) {
    console.warn('Invalid webhook signature received.');
    return new Response('Invalid signature', { status: 401 });
  }

  const event = JSON.parse(body);
  console.log('Received Paystack event:', event.event);

  try {
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    if (event.event === 'charge.success') {
      const { reference, metadata, customer, plan } = event.data;

      if (metadata?.subscription_id) {
        // This is a subscription payment
        console.log(
          `Processing subscription payment for subscription_id: ${metadata.subscription_id}`
        );

        const newEndDate = new Date();
        if (plan?.interval === 'annually') {
          newEndDate.setFullYear(newEndDate.getFullYear() + 1);
        } else {
          newEndDate.setMonth(newEndDate.getMonth() + 1);
        }

        const { data: sub, error: subError } = await supabase
          .from('subscriptions')
          .update({
            status: 'active',
            paystack_customer_code: customer.customer_code,
            current_period_end: newEndDate.toISOString(),
          })
          .eq('id', metadata.subscription_id)
          .select()
          .single();

        if (subError) throw subError;
        console.log(`Subscription ${sub.id} successfully updated to active.`);
      } else {
        // This is a one-time rent payment
        const internalPaymentId = metadata?.internal_payment_id;
        console.log(`Processing rent payment for internal_payment_id: ${internalPaymentId}`);

        if (!reference) {
          console.warn('charge.success (rent) missing reference');
          return new Response(JSON.stringify({ error: 'missing_reference' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
          });
        }

        // Fetch configurable rates from accounting_config
        const { data: configRows } = await supabase
          .from('accounting_config')
          .select('key, value')
          .in('key', ['platform_fee_rate', 'default_agent_commission_rate', 'default_tax_rate']);
        const configMap = Object.fromEntries((configRows || []).map((r) => [r.key, r.value]));
        const platformFeeRate = Number(configMap.platform_fee_rate) || 0.05;
        const defaultAgentRate = Number(configMap.default_agent_commission_rate) || 0.03;
        const taxRate = Number(configMap.default_tax_rate) || 0.075;

        let paySelect = supabase
          .from('rent_payments')
          .select('*, property_tenants(*, properties(*), tenants(*))');

        let matchColumn: string;
        let matchValue: string;
        if (internalPaymentId) {
          paySelect = paySelect.eq('id', internalPaymentId);
          matchColumn = 'id';
          matchValue = internalPaymentId;
        } else {
          paySelect = paySelect.eq('reference', reference);
          matchColumn = 'reference';
          matchValue = reference;
        }

        const { data: payment, error } = await paySelect.maybeSingle();

        if (error) throw error;
        if (!payment) {
          console.error(`Payment with ${matchColumn} ${matchValue} not found.`);
          return new Response(`Payment with ${matchColumn} ${matchValue} not found.`, {
            status: 404,
          });
        }

        if (String(payment.status || '').toLowerCase() === 'successful') {
          return new Response(JSON.stringify({ received: true, already_successful: true }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          });
        }

        const { error: dedupeErr } = await supabase.from('payment_webhook_events').insert({
          provider: 'paystack',
          external_id: String(reference),
        });
        if (dedupeErr?.code === '23505') {
          return new Response(JSON.stringify({ received: true, duplicate: true }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          });
        }
        if (dedupeErr) throw dedupeErr;

        const paidDay = new Date().toISOString().slice(0, 10);
        const { error: updErr } = await supabase
          .from('rent_payments')
          .update({
            status: 'successful',
            payment_date: paidDay,
          })
          .eq('id', payment.id);
        if (updErr) throw updErr;

        console.log(`Payment ${payment.id} for reference ${reference} successfully updated.`);

        // Calculate and record payment breakdown (agent rate from property overrides config)
        const agentCommissionRate =
          payment.property_tenants?.properties?.agent_commission_rate ?? defaultAgentRate;
        const platformFee = payment.amount * platformFeeRate;
        const agentCommission = payment.amount * agentCommissionRate;
        const taxAmount = payment.amount * taxRate;
        const ownerAmount = payment.amount - (platformFee + agentCommission + taxAmount);

        const { error: breakdownError } = await supabase.from('payment_breakdowns').insert({
          payment_id: payment.id,
          total_amount: payment.amount,
          platform_fee: platformFee,
          agent_commission: agentCommission,
          owner_amount: ownerAmount,
          tax_amount: taxAmount,
          tax_rate: taxRate,
          paid_to_owner: false,
        });

        const duplicateBreakdown = breakdownError?.code === '23505';
        if (breakdownError && !duplicateBreakdown) {
          console.error(`Error recording payment breakdown:`, breakdownError);
        } else if (!breakdownError) {
          console.log(`Payment breakdown for payment ${payment.id} recorded successfully.`);
        } else {
          console.log(
            `Payment breakdown already exists for payment ${payment.id} (idempotent webhook).`
          );
        }

        // Create journal entries (RPC skips if batch already exists for this payment)
        if (!breakdownError || duplicateBreakdown) {
          const pt = payment.property_tenants;
          const propertyId = pt?.properties?.id ?? pt?.property_id ?? null;
          const tenantUserId = pt?.tenants?.user_id ?? null;
          const { error: journalError } = await supabase.rpc(
            'create_journal_entries_from_rent_payment',
            {
              p_payment_id: payment.id,
              p_entry_date: new Date().toISOString().slice(0, 10),
              p_property_id: propertyId,
              p_tenant_id: tenantUserId,
            }
          );
          if (journalError) console.error('Journal posting failed:', journalError);
          else console.log(`Journal entries ensured for payment ${payment.id}`);
        }
      }
    } else if (event.event === 'subscription.create') {
      const { customer, plan, subscription_code } = event.data;
      console.log(`Processing subscription.create for customer ${customer.customer_code}`);

      const { error } = await supabase
        .from('subscriptions')
        .update({ paystack_subscription_code: subscription_code })
        .match({
          paystack_customer_code: customer.customer_code,
          paystack_plan_code: plan.plan_code,
          status: 'active',
        })
        .is('paystack_subscription_code', null);

      if (error)
        console.error(
          `Error adding subscription_code for customer ${customer.customer_code}:`,
          error
        );
      else
        console.log(`Successfully added subscription_code for customer ${customer.customer_code}`);
    } else if (event.event === 'subscription.disable') {
      const { subscription_code } = event.data;
      console.log(`Processing subscription.disable for subscription_code: ${subscription_code}`);

      const { error } = await supabase
        .from('subscriptions')
        .update({ status: 'cancelled' })
        .eq('paystack_subscription_code', subscription_code);

      if (error) console.error(`Error cancelling subscription ${subscription_code}:`, error);
      else console.log(`Subscription with code ${subscription_code} marked as cancelled.`);
    }
  } catch (err) {
    console.error('Error processing webhook:', err.message);
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    status: 200,
  });
});
