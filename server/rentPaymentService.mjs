import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import { supabaseAdmin } from './supabaseClient.mjs';
import { validateVerificationToken } from './voiceAuthService.mjs';
import { resolvePropertyTenantIdFromLease } from './rentLedgerCompat.mjs';
import { claimPaymentWebhookEvent } from './paymentWebhookDedup.mjs';
import {
  enqueuePaymentFailed,
  enqueuePaymentReceived,
  drainNotificationOutbox,
} from './notifications/outboxTriggers.mjs';
import { apiError, logger } from './observability.mjs';

const router = express.Router();

async function notifyRentCallbackOutbox(paymentRow, paymentReference, isSuccess) {
  if (!supabaseAdmin || !paymentRow?.property_tenant_id) return;
  const { data: pt } = await supabaseAdmin
    .from('property_tenants')
    .select('tenant_id')
    .eq('id', paymentRow.property_tenant_id)
    .maybeSingle();
  if (!pt?.tenant_id) return;
  const { data: tenant } = await supabaseAdmin
    .from('tenants')
    .select('user_id, phone, email, first_name, last_name')
    .eq('id', pt.tenant_id)
    .maybeSingle();
  if (!tenant) return;
  const t = { ...tenant, first_name: tenant.first_name || 'Tenant' };
  const channels = ['in_app', 'email', 'sms', 'whatsapp'];
  if (isSuccess) {
    await enqueuePaymentReceived({
      tenant: t,
      amount: Number(paymentRow.amount) || 0,
      txRef: paymentReference,
      channels,
    });
  } else {
    await enqueuePaymentFailed({
      tenant: t,
      txRef: paymentReference,
      channels,
    });
  }
  await drainNotificationOutbox(25);
}

const PUBLIC_PAYMENT_BASE_URL =
  process.env.PUBLIC_PAYMENT_BASE_URL || 'https://payments.damianixpro.local';
const RENT_WEBHOOK_SECRET = (process.env.RENT_PAYMENT_WEBHOOK_SECRET || '').trim();
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
function isUuid(s) {
  return typeof s === 'string' && UUID_RE.test(s);
}

function computeRentWebhookSignature(rawBody) {
  return crypto
    .createHmac('sha256', RENT_WEBHOOK_SECRET)
    .update(String(rawBody || ''), 'utf8')
    .digest('hex');
}

function safeEqualHex(a, b) {
  const left = Buffer.from(String(a || ''), 'utf8');
  const right = Buffer.from(String(b || ''), 'utf8');
  if (left.length !== right.length) return false;
  return crypto.timingSafeEqual(left, right);
}

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
  if (!isUuid(String(tenant_id))) {
    return res.status(400).json({ error: 'tenant_id must be a valid UUID.' });
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
  if (numericAmount > 50_000_000) {
    return res.status(400).json({ error: 'amount is too large.' });
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
    return apiError(
      res,
      500,
      'SERVICE_NOT_CONFIGURED',
      'Rent payment service not configured.',
      null,
      req.requestId
    );
  }

  const { payment_reference, status } = req.body ?? {};

  if (!payment_reference) {
    return apiError(res, 400, 'VALIDATION_ERROR', 'payment_reference is required.', null, req.requestId);
  }
  if (String(payment_reference).length > 220) {
    return apiError(res, 400, 'VALIDATION_ERROR', 'payment_reference is invalid.', null, req.requestId);
  }

  if (!RENT_WEBHOOK_SECRET) {
    return apiError(
      res,
      503,
      'WEBHOOK_SECRET_MISSING',
      'RENT_PAYMENT_WEBHOOK_SECRET is not configured.',
      null,
      req.requestId
    );
  }
  const sentSig = req.headers['x-rent-signature'];
  const expectedSig = computeRentWebhookSignature(req.rawBody || '');
  if (!sentSig || !safeEqualHex(sentSig, expectedSig)) {
    logger.warn('rent_webhook_signature_invalid', { request_id: req.requestId });
    return apiError(res, 401, 'INVALID_SIGNATURE', 'Invalid webhook signature.', null, req.requestId);
  }

  try {
    const claim = await claimPaymentWebhookEvent(supabaseAdmin, {
      provider: 'rent_callback',
      externalId: payment_reference,
    });
    if (!claim.ok) {
      logger.error('rent_webhook_dedup_failed', { request_id: req.requestId, error: claim.error });
      return apiError(
        res,
        500,
        'WEBHOOK_IDEMPOTENCY_FAILED',
        'Failed to record webhook idempotency.',
        null,
        req.requestId
      );
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
      logger.error('rent_webhook_update_failed', {
        request_id: req.requestId,
        error: error?.message || String(error),
      });
      return apiError(
        res,
        500,
        'PAYMENT_UPDATE_FAILED',
        'Failed to update payment status.',
        null,
        req.requestId
      );
    }

    if (data) {
      void notifyRentCallbackOutbox(data, payment_reference, isSuccess).catch((e) =>
        console.warn('[rent-payments] notification outbox', e?.message)
      );
    }

    return res.json({
      message: 'Payment status updated.',
      payment: data,
    });
  } catch (err) {
    logger.error('rent_webhook_unexpected', {
      request_id: req.requestId,
      error: err instanceof Error ? err.message : String(err),
    });
    return apiError(
      res,
      500,
      'INTERNAL_ERROR',
      'Unexpected error updating payment status.',
      null,
      req.requestId
    );
  }
});

export function createRentPaymentRouter() {
  return router;
}

