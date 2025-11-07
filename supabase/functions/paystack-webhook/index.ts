
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import * as crypto from "node:crypto";

const PAYSTACK_WEBHOOK_SECRET = Deno.env.get('PAYSTACK_WEBHOOK_SECRET')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  const signature = req.headers.get('x-paystack-signature')
  const body = await req.text()

  if (!PAYSTACK_WEBHOOK_SECRET) {
    console.error('PAYSTACK_WEBHOOK_SECRET is not set in environment variables.')
    return new Response('Webhook secret not configured.', { status: 500 })
  }

  const hash = crypto.createHmac('sha512', PAYSTACK_WEBHOOK_SECRET).update(body).digest('hex')

  if (hash !== signature) {
    console.warn('Invalid webhook signature received.')
    return new Response('Invalid signature', { status: 401 })
  }

  const event = JSON.parse(body)
  console.log('Received Paystack event:', event.event)

  try {
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    if (event.event === 'charge.success') {
      const { reference, metadata, customer, plan } = event.data;
      
      if (metadata?.subscription_id) { // This is a subscription payment
        console.log(`Processing subscription payment for subscription_id: ${metadata.subscription_id}`);
        
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

      } else { // This is a one-time rent payment
        const internalPaymentId = metadata?.internal_payment_id;
        console.log(`Processing rent payment for internal_payment_id: ${internalPaymentId}`);
        
        let query = supabase
          .from('rent_payments')
          .update({
            status: 'successful',
            payment_date: new Date().toISOString(),
          });

        let matchColumn, matchValue;
        if (internalPaymentId) {
          query = query.eq('id', internalPaymentId);
          matchColumn = 'id';
          matchValue = internalPaymentId;
        } else {
          query = query.eq('reference', reference);
          matchColumn = 'reference';
          matchValue = reference;
        }
        
        const { data: payment, error } = await query.select('*, property_tenants(*, properties(*))').single();

        if (error) {
          if (error.code === 'PGRST116') {
            console.error(`Payment with ${matchColumn} ${matchValue} not found.`);
            return new Response(`Payment with ${matchColumn} ${matchValue} not found.`, { status: 404 });
          }
          throw error;
        }
        
        console.log(`Payment ${payment.id} for reference ${reference} successfully updated.`);
        
        // Calculate and record payment breakdown
        const platformFeeRate = 0.05;
        const agentCommissionRate = payment.property_tenants?.properties?.agent_commission_rate ?? 0.03;
        const taxRate = 0.075;
        const platformFee = payment.amount * platformFeeRate;
        const agentCommission = payment.amount * agentCommissionRate;
        const taxAmount = payment.amount * taxRate;
        const ownerAmount = payment.amount - (platformFee + agentCommission + taxAmount);
        
        const { error: breakdownError } = await supabase
          .from('payment_breakdowns')
          .insert({
            payment_id: payment.id,
            total_amount: payment.amount,
            platform_fee: platformFee,
            agent_commission: agentCommission,
            owner_amount: ownerAmount,
            tax_amount: taxAmount,
            tax_rate: taxRate,
            paid_to_owner: false,
          });
        
        if (breakdownError) console.error(`Error recording payment breakdown:`, breakdownError);
        else console.log(`Payment breakdown for payment ${payment.id} recorded successfully.`);
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
              status: 'active'
          })
          .is('paystack_subscription_code', null);
        
        if (error) console.error(`Error adding subscription_code for customer ${customer.customer_code}:`, error);
        else console.log(`Successfully added subscription_code for customer ${customer.customer_code}`);

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
    console.error('Error processing webhook:', err.message)
    return new Response(`Webhook Error: ${err.message}`, { status: 400 })
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    status: 200,
  })
})
