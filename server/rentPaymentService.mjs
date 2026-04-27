import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { supabaseAdmin } from './supabaseClient.mjs';
import { validateVerificationToken } from './voiceAuthService.mjs';
import { resolvePropertyTenantIdFromLease } from './rentLedgerCompat.mjs';
import { claimPaymentWebhookEvent } from './paymentWebhookDedup.mjs';

const router = express.Router();

const PUBLIC_PAYMENT_BASE_URL =
  process.env.PUBLIC_PAYMENT_BASE_URL || 'https://payments.damianixpro.local';

router.post('/api/payments/rent', async (req, res) => {
  if (!supabaseAdmin) {
    return res
      .status(500)
      .json({ error: 'Rent payment service not configured. Missing Supabase credentials.' });
  }

  const { tenant_id, amount, verification_token } = req.body ?? {};
  const authToken =
    verification_token ||
    req.headers['x-verification-token'] ||
    req.headers['x-voice-verification'];

  if (!tenant_id || !amount) {
    return res.status(400).json({ error: 'tenant_id and amount are required.' });
  }

  // Sensitive operation: require voice agent verification
  const verification = await validateVerificationToken(authToken);
  if (!verification) {
    return res.status(403).json({
      error: 'Voice verification required for payments.',
      requires_verification: true,
      verification_endpoints: {
        recognize_phone: 'POST /api/voice-auth/recognize-phone',
        verify_otp: 'POST /api/voice-auth/verify-otp',
        verify_pin: 'POST /api/voice-auth/verify-pin',
      },
    });
  }

  if (verification.tenant_id !== tenant_id) {
    return res.status(403).json({ error: 'Verification does not match tenant.' });
  }

  const numericAmount = Number(amount);
  if (Number.isNaN(numericAmount) || numericAmount <= 0) {
    return res.status(400).json({ error: 'amount must be a positive number.' });
  }

  try {
    // 1. Verify tenant and current lease/balance context
    const { data: tenant, error: tenantError } = await supabaseAdmin
      .from('tenants')
      .select('id, user_id, first_name, last_name')
      .eq('id', tenant_id)
      .maybeSingle();

    if (tenantError) {
      console.error('[rent-payments] Failed to load tenant', tenantError);
      return res.status(500).json({ error: 'Failed to load tenant.' });
    }

    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found.' });
    }

    const { data: lease, error: leaseError } = await supabaseAdmin
      .from('leases')
      .select(
        `
        id,
        tenant_id,
        property_id,
        monthly_rent,
        status,
        properties ( title )
      `
      )
      .eq('tenant_id', tenant.id)
      .eq('status', 'ACTIVE')
      .order('start_date', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (leaseError) {
      console.error('[rent-payments] Failed to load lease', leaseError);
      return res.status(500).json({ error: 'Failed to load active lease.' });
    }

    if (!lease) {
      return res.status(400).json({ error: 'No active lease found for tenant.' });
    }

    const propertyTenantId = await resolvePropertyTenantIdFromLease(supabaseAdmin, lease);
    if (!propertyTenantId) {
      return res.status(400).json({
        error: 'No property_tenants row for this lease; cannot record rent payment.',
      });
    }

    // 2. Create payment reference & URL for FlutterFlow
    const paymentReference = `RENT-${uuidv4()}`;
    const callbackUrl =
      process.env.RENT_PAYMENT_WEBHOOK_URL ||
      `${PUBLIC_PAYMENT_BASE_URL}/api/payments/rent/webhook`;

    const paymentUrl = `${PUBLIC_PAYMENT_BASE_URL}/checkout?reference=${encodeURIComponent(
      paymentReference
    )}&amount=${encodeURIComponent(numericAmount)}&tenant_id=${encodeURIComponent(
      tenant_id
    )}&payment_type=rent`;

    const now = new Date().toISOString();
    const { error: paymentError } = await supabaseAdmin
      .from('rent_payments')
      .insert({
        property_tenant_id: propertyTenantId,
        amount: numericAmount,
        due_date: new Date().toISOString().slice(0, 10),
        status: 'pending',
        payment_method: 'custom_gateway',
        reference: paymentReference,
        category: 'rent',
        description: 'Voice / custom gateway rent session',
        payment_date: null,
        created_at: now,
        updated_at: now,
      })
      .select()
      .single();

    if (paymentError) {
      console.error('[rent-payments] Failed to create payment record', paymentError);
      return res.status(500).json({ error: 'Failed to create payment record.' });
    }

    // 4. Return session details compatible with FlutterFlow REST API calls
    return res.status(201).json({
      payment_url: paymentUrl,
      payment_reference: paymentReference,
      status: 'pending',
      callback_url: callbackUrl,
    });
  } catch (err) {
    console.error('[rent-payments] Unexpected error', err);
    return res.status(500).json({ error: 'Unexpected error creating rent payment.' });
  }
});

// Webhook endpoint for payment confirmation
router.post('/api/payments/rent/webhook', async (req, res) => {
  if (!supabaseAdmin) {
    return res
      .status(500)
      .json({ error: 'Rent payment service not configured. Missing Supabase credentials.' });
  }

  const { payment_reference, status } = req.body ?? {};

  if (!payment_reference) {
    return res.status(400).json({ error: 'payment_reference is required.' });
  }

  // In real integration, you would verify signature / secret here.

  try {
    const claim = await claimPaymentWebhookEvent(supabaseAdmin, {
      provider: 'rent_callback',
      externalId: payment_reference,
    });
    if (!claim.ok) {
      console.error('[rent-payments] Dedup ledger insert failed', claim.error);
      return res.status(500).json({ error: 'Failed to record webhook idempotency.' });
    }
    if (!claim.firstDelivery) {
      return res.json({
        message: 'Already processed.',
        duplicate: true,
      });
    }

    const normalizedStatus = String(status || '').toUpperCase();
    const isSuccess = normalizedStatus === 'SUCCESS' || normalizedStatus === 'COMPLETED';

    const today = new Date().toISOString().slice(0, 10);
    const updates = {
      status: isSuccess ? 'successful' : 'failed',
      payment_date: isSuccess ? today : null,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabaseAdmin
      .from('rent_payments')
      .update(updates)
      .eq('reference', payment_reference)
      .select()
      .single();

    if (error) {
      console.error('[rent-payments] Failed to update payment status', error);
      return res.status(500).json({ error: 'Failed to update payment status.' });
    }

    return res.json({
      message: 'Payment status updated.',
      payment: data,
    });
  } catch (err) {
    console.error('[rent-payments] Unexpected error updating payment', err);
    return res.status(500).json({ error: 'Unexpected error updating payment status.' });
  }
});

export function createRentPaymentRouter() {
  return router;
}

