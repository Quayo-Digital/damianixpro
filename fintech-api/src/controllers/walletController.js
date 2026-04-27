/**
 * Wallet HTTP API — balances and rent debits; Flutterwave credits should be triggered from webhook code calling walletService.
 */
import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { requireRole } from '../middleware/roles.js';
import { sensitiveUserRateLimiter } from '../middleware/rateLimit.js';
import { validateBody, debitRentBodySchema } from '../middleware/validate.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { AppError } from '../utils/AppError.js';
import * as walletService from '../services/walletService.js';

function userIdFromReq(req) {
  const sub = req.auth?.sub;
  if (!sub || sub === 'dev-bypass') {
    throw new AppError('Valid authenticated user id required', 401, 'unauthorized');
  }
  return sub;
}

/**
 * POST /ensure — create wallet if missing
 * Body: { currencyCode?: string }
 */
export async function ensureWallet(req, res) {
  const userId = userIdFromReq(req);
  const currencyCode = (req.body?.currencyCode || 'NGN').toString();
  const { accountId, created } = await walletService.getOrCreateWalletForUser(userId, currencyCode);
  res.status(created ? 201 : 200).json({ accountId, currencyCode: currencyCode.toUpperCase().slice(0, 3), created });
}

/**
 * GET /me — wallet id + balance (minor units)
 */
export async function getMyWallet(req, res) {
  const userId = userIdFromReq(req);
  const currencyCode = (req.query.currency || req.query.currencyCode || 'NGN').toString();
  const { accountId, created } = await walletService.getOrCreateWalletForUser(userId, currencyCode);
  const balanceMinor = await walletService.getWalletBalanceMinor(accountId);
  res.json({
    userId,
    accountId,
    currencyCode: currencyCode.toUpperCase().slice(0, 3),
    balanceMinor: balanceMinor.toString(),
    created,
  });
}

/**
 * POST /debit-rent — tenant wallet → landlord wallet (ledger transfer)
 * Body: { landlordUserId, amountMinor, idempotencyKey, currencyCode?, leaseId?, reference? }
 */
export async function debitRent(req, res) {
  const tenantUserId = userIdFromReq(req);
  const {
    landlordUserId,
    amountMinor,
    idempotencyKey,
    currencyCode,
    leaseId,
    reference,
    description,
  } = req.body ?? {};

  if (!landlordUserId || amountMinor === undefined || !idempotencyKey) {
    throw new AppError(
      'landlordUserId, amountMinor, and idempotencyKey are required',
      400,
      'validation'
    );
  }

  const result = await walletService.debitWalletForRentPayment({
    tenantUserId,
    landlordUserId,
    amountMinor,
    idempotencyKey: String(idempotencyKey),
    currencyCode: currencyCode || 'NGN',
    reference,
    description,
    metadata: leaseId ? { leaseId } : {},
  });

  res.status(result.duplicate ? 200 : 201).json({
    ok: true,
    duplicate: result.duplicate,
    journalId: result.journalId,
    ledgerEntryIds: result.ledgerEntryIds,
  });
}

export const walletControllerRouter = Router();

walletControllerRouter.post('/ensure', requireAuth, asyncHandler(ensureWallet));
walletControllerRouter.get('/me', requireAuth, asyncHandler(getMyWallet));
walletControllerRouter.post(
  '/debit-rent',
  requireAuth,
  requireRole('tenant', 'admin'),
  sensitiveUserRateLimiter,
  validateBody(debitRentBodySchema),
  asyncHandler(debitRent)
);
