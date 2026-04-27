/**
 * Flutterwave Webhook Handler
 * - Subscription: charge.completed with tx_ref SUB_* + meta (plan_tier, user_id, payment_type) → user_subscriptions
 * - Rent: charge.completed with rent payment reference → rent_payments, breakdowns, journal entries
 * Configure this URL in Flutterwave Dashboard → Settings → Webhooks.
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';
import * as crypto from 'node:crypto';

const FLUTTERWAVE_SECRET_HASH = Deno.env.get('FLUTTERWAVE_SECRET_HASH');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, flutterwave-signature',
};

const VALID_TIERS = new Set(['free', 'starter', 'professional', 'enterprise', 'white_label']);

type ParsedMeta = {
  user_id?: string;
  plan_tier?: string;
  billing_cycle?: string;
  payment_type?: string;
  app_plan_id?: string;
  internal_payment_id?: string;
};

function parseFwChargeMeta(meta: unknown): ParsedMeta | null {
  if (meta == null) return null;
  if (typeof meta === 'object' && !Array.isArray(meta)) {
    const o = meta as Record<string, unknown>;
    const str = (k: string) => (o[k] != null ? String(o[k]) : undefined);
    return {
      user_id: str('user_id'),
      plan_tier: str('plan_tier'),
      billing_cycle: str('billing_cycle'),
      payment_type: str('payment_type'),
      app_plan_id: str('app_plan_id'),
      internal_payment_id: str('internal_payment_id'),
    };
  }
  if (Array.isArray(meta)) {
    const map: Record<string, string> = {};
    for (const item of meta) {
      if (item && typeof item === 'object' && 'metaname' in item && 'metavalue' in item) {
        const row = item as { metaname: string; metavalue: string };
        map[String(row.metaname)] = String(row.metavalue);
      }
    }
    return {
      user_id: map.user_id,
      plan_tier: map.plan_tier,
      billing_cycle: map.billing_cycle,
      payment_type: map.payment_type,
      app_plan_id: map.app_plan_id,
      internal_payment_id: map.internal_payment_id,
    };
  }
  return null;
}

async function activateSubscriptionFromFlutterwave(
  supabase: SupabaseClient,
  params: {
    userId: string;
    planTier: string;
    billingCycle: string;
    txRef: string;
    flwId: string;
  }
): Promise<void> {
  if (!VALID_TIERS.has(params.planTier)) {
    console.error('Subscription webhook: invalid plan_tier', params.planTier);
    return;
  }

  const cycle =
    params.billingCycle === 'yearly' || params.billingCycle === 'quarterly'
      ? params.billingCycle
      : 'monthly';

  const { data: planRow, error: planErr } = await supabase
    .from('subscription_plans')
    .select('id,tier')
    .eq('tier', params.planTier)
    .eq('is_active', true)
    .maybeSingle();

  if (planErr || !planRow) {
    console.error(
      'Subscription webhook: subscription_plans row not found for tier',
      params.planTier,
      planErr
    );
    return;
  }

  const now = new Date();
  const periodEnd = new Date(now);
  if (cycle === 'yearly') periodEnd.setFullYear(periodEnd.getFullYear() + 1);
  else if (cycle === 'quarterly') periodEnd.setMonth(periodEnd.getMonth() + 3);
  else periodEnd.setMonth(periodEnd.getMonth() + 1);

  const usageTracking = {
    current_period: {
      properties_used: 0,
      tenants_managed: 0,
      documents_processed: 0,
      ai_recommendations_generated: 0,
      maintenance_alerts_sent: 0,
      storage_used_gb: 0,
      api_calls_made: 0,
    },
    historical: [] as unknown[],
    last_updated: now.toISOString(),
  };

  const row = {
    plan_id: planRow.id,
    tier: planRow.tier,
    status: 'active',
    billing_cycle: cycle,
    current_period_start: now.toISOString(),
    current_period_end: periodEnd.toISOString(),
    trial_start: null as string | null,
    trial_end: null as string | null,
    cancel_at_period_end: false,
    canceled_at: null as string | null,
    updated_at: now.toISOString(),
    usage_tracking: usageTracking,
    payment_method: {
      gateway: 'flutterwave',
      tx_ref: params.txRef,
      transaction_id: params.flwId,
    },
  };

  const { data: existingRows } = await supabase
    .from('user_subscriptions')
    .select('id')
    .eq('user_id', params.userId)
    .in('status', ['active', 'trialing'])
    .order('created_at', { ascending: false })
    .limit(1);

  const existing = existingRows?.[0];

  if (existing?.id) {
    const { error } = await supabase.from('user_subscriptions').update(row).eq('id', existing.id);
    if (error) console.error('Subscription webhook: failed to update user_subscriptions', error);
    else console.log('Subscription webhook: updated subscription for user', params.userId);
  } else {
    const { error } = await supabase.from('user_subscriptions').insert({
      user_id: params.userId,
      ...row,
    });
    if (error) console.error('Subscription webhook: failed to insert user_subscriptions', error);
    else console.log('Subscription webhook: created subscription for user', params.userId);
  }
}

function verifyFlutterwaveSignature(
  rawBody: string,
  signature: string | null,
  secretHash: string
): boolean {
  if (!secretHash || !signature) return false;
  const hash = crypto.createHmac('sha256', secretHash).update(rawBody).digest('base64');
  return hash === signature;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const body = await req.text();
  const signature = req.headers.get('flutterwave-signature');

  if (!FLUTTERWAVE_SECRET_HASH) {
    console.error('FLUTTERWAVE_SECRET_HASH is not set.');
    return new Response('Webhook secret not configured.', { status: 500 });
  }

  if (!verifyFlutterwaveSignature(body, signature, FLUTTERWAVE_SECRET_HASH)) {
    console.warn('Invalid Flutterwave webhook signature.');
    return new Response('Invalid signature', { status: 401 });
  }

  let event: { type?: string; data?: Record<string, unknown> };
  try {
    event = JSON.parse(body);
  } catch {
    return new Response('Invalid JSON', { status: 400 });
  }

  console.log('Received Flutterwave event:', event.type);

  if (event.type !== 'charge.completed') {
    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  }

  const raw = event.data as Record<string, unknown> | undefined;
  if (!raw) {
    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  }

  const payStatus = String(raw.status || '').toLowerCase();
  if (payStatus !== 'succeeded' && payStatus !== 'successful') {
    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  }

  const txRef = String(raw.tx_ref || '');
  const chargeMeta = parseFwChargeMeta(raw.meta);
  const isSubscriptionCharge =
    txRef.startsWith('SUB_') &&
    chargeMeta?.user_id &&
    chargeMeta?.plan_tier &&
    chargeMeta.payment_type === 'subscription';

  if (isSubscriptionCharge) {
    try {
      const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!, {
        auth: { autoRefreshToken: false, persistSession: false },
      });
      const flwDedupeId = String(raw.id ?? '');
      if (flwDedupeId) {
        const { error: dedupeErr } = await supabase.from('payment_webhook_events').insert({
          provider: 'flutterwave',
          external_id: flwDedupeId,
        });
        if (dedupeErr?.code === '23505') {
          return new Response(JSON.stringify({ received: true, duplicate: true }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          });
        }
        if (dedupeErr) {
          console.error('Subscription webhook: dedup insert failed', dedupeErr);
          return new Response(JSON.stringify({ error: 'dedup_failed' }), { status: 500 });
        }
      }
      await activateSubscriptionFromFlutterwave(supabase, {
        userId: chargeMeta.user_id!,
        planTier: chargeMeta.plan_tier!,
        billingCycle: chargeMeta.billing_cycle || 'monthly',
        txRef,
        flwId: String(raw.id ?? raw.flw_ref ?? raw.reference ?? ''),
      });
    } catch (err) {
      console.error('Subscription webhook error:', err);
    }
    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  }

  const reference = typeof raw.reference === 'string' ? raw.reference : undefined;
  const internalPaymentId = chargeMeta?.internal_payment_id;

  try {
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Fetch configurable rates
    const { data: configRows } = await supabase
      .from('accounting_config')
      .select('key, value')
      .in('key', ['platform_fee_rate', 'default_agent_commission_rate', 'default_tax_rate']);
    const configMap = Object.fromEntries(
      (configRows || []).map((r: { key: string; value: unknown }) => [r.key, r.value])
    );
    const platformFeeRate = Number(configMap.platform_fee_rate) || 0.05;
    const defaultAgentRate = Number(configMap.default_agent_commission_rate) || 0.03;
    const taxRate = Number(configMap.default_tax_rate) || 0.075;

    let paySelect = supabase
      .from('rent_payments')
      .select('*, property_tenants(*, properties(*), tenants(*))');

    if (internalPaymentId) {
      paySelect = paySelect.eq('id', internalPaymentId);
    } else if (reference) {
      paySelect = paySelect.eq('reference', reference);
    } else {
      console.error('No reference or internal_payment_id in webhook data.');
      return new Response(JSON.stringify({ received: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    const { data: payment, error } = await paySelect.maybeSingle();

    if (error || !payment) {
      console.error('Rent payment not found:', reference || internalPaymentId);
      return new Response(JSON.stringify({ received: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    if (String(payment.status || '').toLowerCase() === 'successful') {
      return new Response(JSON.stringify({ received: true, already_successful: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    const flwRentDedupeId = String(raw.id ?? '');
    if (flwRentDedupeId) {
      const { error: rentDedupeErr } = await supabase.from('payment_webhook_events').insert({
        provider: 'flutterwave',
        external_id: flwRentDedupeId,
      });
      if (rentDedupeErr?.code === '23505') {
        return new Response(JSON.stringify({ received: true, duplicate: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        });
      }
      if (rentDedupeErr) {
        console.error('Rent webhook: dedup insert failed', rentDedupeErr);
        return new Response(JSON.stringify({ error: 'dedup_failed' }), { status: 500 });
      }
    }

    const paidDay = new Date().toISOString().slice(0, 10);
    const { error: updErr } = await supabase
      .from('rent_payments')
      .update({
        status: 'successful',
        payment_date: paidDay,
      })
      .eq('id', payment.id);
    if (updErr) {
      console.error('Rent webhook: failed to finalize rent_payment', updErr);
      return new Response(JSON.stringify({ error: 'update_failed' }), { status: 500 });
    }

    const amount = Number(raw.amount ?? payment.amount);
    const agentCommissionRate =
      (payment.property_tenants as { properties?: { agent_commission_rate?: number } })?.properties
        ?.agent_commission_rate ?? defaultAgentRate;
    const platformFee = amount * platformFeeRate;
    const agentCommission = amount * agentCommissionRate;
    const taxAmount = amount * taxRate;
    const ownerAmount = amount - (platformFee + agentCommission + taxAmount);

    const { error: breakdownError } = await supabase.from('payment_breakdowns').insert({
      payment_id: payment.id,
      total_amount: amount,
      platform_fee: platformFee,
      agent_commission: agentCommission,
      owner_amount: ownerAmount,
      tax_amount: taxAmount,
      tax_rate: taxRate,
      paid_to_owner: false,
    });

    const duplicateBreakdown = breakdownError?.code === '23505';
    if (breakdownError && !duplicateBreakdown) {
      console.error('Error recording payment breakdown:', breakdownError);
    } else if (!breakdownError) {
      console.log(`Payment breakdown for payment ${payment.id} recorded.`);
    } else {
      console.log(
        `Payment breakdown already exists for payment ${payment.id} (idempotent webhook).`
      );
    }

    if (!breakdownError || duplicateBreakdown) {
      const pt = payment.property_tenants as
        | { properties?: { id?: string }; property_id?: string; tenants?: { user_id?: string } }
        | undefined;
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

      if (journalError) {
        console.error('Journal posting failed:', journalError);
      } else {
        console.log(`Journal entries ensured for payment ${payment.id}`);
      }
    }
  } catch (err) {
    console.error('Error processing webhook:', err);
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    status: 200,
  });
});
