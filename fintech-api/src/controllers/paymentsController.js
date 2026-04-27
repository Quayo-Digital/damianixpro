/**
 * Payments API — initialize hosted/card payment and verify by reference.
 */
import { Router } from 'express';
import { createFlutterwaveClient, flutterwaveRequest } from '../lib/flutterwaveClient.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { requireAuth } from '../middleware/auth.js';
import { requireAdmin } from '../middleware/roles.js';
import { sensitiveUserRateLimiter } from '../middleware/rateLimit.js';
import { AppError } from '../utils/AppError.js';
import { initiateBankPayout } from '../services/payoutService.js';
import { createVirtualAccount } from '../services/virtualAccountService.js';

/**
 * POST /api/payments/flutterwave/initialize
 * Body: { tx_ref, amount, currency?, redirect_url, customer: { email, name?, phonenumber? }, customizations?, meta? }
 */
export async function initializePayment(req, res) {
  const {
    tx_ref: txRef,
    amount,
    currency,
    redirect_url: redirectUrl,
    customer,
    customizations,
    meta,
  } = req.body ?? {};

  if (!txRef || amount === undefined || !redirectUrl || !customer?.email) {
    throw new AppError(
      'tx_ref, amount, redirect_url, and customer.email are required',
      400,
      'validation'
    );
  }

  const client = createFlutterwaveClient();

  const body = {
    tx_ref: String(txRef).trim(),
    amount: typeof amount === 'number' ? String(amount) : String(amount).trim(),
    currency: (currency || 'NGN').toString().trim(),
    redirect_url: String(redirectUrl).trim(),
    customer: {
      email: String(customer.email).trim(),
      ...(customer.name && { name: String(customer.name) }),
      ...(customer.phonenumber && { phonenumber: String(customer.phonenumber) }),
    },
    ...(customizations && { customizations }),
    ...(meta && { meta }),
  };

  const data = await flutterwaveRequest(client, 'POST', '/payments', body);

  res.status(201).json({
    ok: true,
    txRef: body.tx_ref,
    link: data?.data?.link,
    flwRef: data?.data?.flw_ref,
    raw: envSafePaymentResponse(data),
  });
}

/**
 * GET /api/payments/flutterwave/verify?tx_ref=
 * (or POST body.tx_ref)
 */
export async function verifyPayment(req, res) {
  const txRef = (req.query.tx_ref || req.body?.tx_ref || '').toString().trim();
  if (!txRef) {
    throw new AppError('tx_ref is required', 400, 'validation');
  }

  const client = createFlutterwaveClient();
  const path = `/transactions/verify_by_reference?tx_ref=${encodeURIComponent(txRef)}`;
  const data = await flutterwaveRequest(client, 'GET', path);

  res.json({
    ok: true,
    txRef,
    status: data?.data?.status,
    amount: data?.data?.amount,
    currency: data?.data?.currency,
    id: data?.data?.id,
    chargedAmount: data?.data?.charged_amount,
    raw: data?.data,
  });
}

/**
 * POST /api/payments/flutterwave/payout (authenticated — server-side only in production)
 */
export async function createPayout(req, res) {
  const { retry, ...body } = req.body ?? {};
  const result = await initiateBankPayout(body, retry);
  res.status(201).json(result);
}

/**
 * POST /api/payments/flutterwave/virtual-account
 */
export async function createDedicatedVirtualAccount(req, res) {
  const result = await createVirtualAccount(req.body ?? {});
  res.status(201).json(result);
}

/** Strip noisy fields from logs / client if you extend this */
function envSafePaymentResponse(data) {
  if (!data?.data) return data;
  const { link, flw_ref: flwRef } = data.data;
  return { link, flw_ref: flwRef };
}

export const paymentsControllerRouter = Router();

paymentsControllerRouter.post('/initialize', requireAuth, asyncHandler(initializePayment));
paymentsControllerRouter.get('/verify', requireAuth, asyncHandler(verifyPayment));
paymentsControllerRouter.post('/verify', requireAuth, asyncHandler(verifyPayment));

paymentsControllerRouter.post(
  '/payout',
  requireAuth,
  requireAdmin(),
  sensitiveUserRateLimiter,
  asyncHandler(createPayout)
);
paymentsControllerRouter.post('/virtual-account', requireAuth, asyncHandler(createDedicatedVirtualAccount));
