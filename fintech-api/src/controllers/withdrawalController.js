/**
 * Withdrawal HTTP API — ledger hold, Flutterwave payout, retry, cancel, sync.
 */
import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { requireRole } from '../middleware/roles.js';
import { sensitiveUserRateLimiter } from '../middleware/rateLimit.js';
import { validateBody, withdrawalRequestSchema } from '../middleware/validate.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { AppError } from '../utils/AppError.js';
import * as withdrawalService from '../services/withdrawalService.js';

function userIdFromReq(req) {
  const sub = req.auth?.sub;
  if (!sub || sub === 'dev-bypass') {
    throw new AppError('Valid authenticated user id required', 401, 'unauthorized');
  }
  return sub;
}

/**
 * POST / — request withdrawal
 * Body: { amountMinor, currencyCode?, destination: { account_bank, account_number, beneficiary_name? }, clientIdempotencyKey, narration? }
 */
export async function postWithdrawal(req, res) {
  const userId = userIdFromReq(req);
  const { amountMinor, currencyCode, destination, clientIdempotencyKey, narration } = req.body ?? {};
  if (amountMinor === undefined || amountMinor === null) {
    throw new AppError('amountMinor is required', 400, 'validation');
  }
  const row = await withdrawalService.requestWithdrawal({
    userId,
    amountMinor,
    currencyCode,
    destination,
    clientIdempotencyKey,
    narration,
  });
  res.status(200).json(row);
}

/**
 * GET / — list my withdrawals
 */
export async function listWithdrawals(req, res) {
  const userId = userIdFromReq(req);
  const limit = req.query.limit;
  const rows = await withdrawalService.listWithdrawalsForUser(userId, limit ? Number(limit) : 50);
  res.json({ withdrawals: rows });
}

/**
 * GET /:id
 */
export async function getWithdrawal(req, res) {
  const userId = userIdFromReq(req);
  const row = await withdrawalService.getWithdrawalForUser(userId, req.params.id);
  res.json(row);
}

/**
 * POST /:id/retry
 */
export async function postRetry(req, res) {
  const userId = userIdFromReq(req);
  const row = await withdrawalService.retryWithdrawal({
    userId,
    withdrawalId: req.params.id,
    narration: req.body?.narration,
  });
  res.status(200).json(row);
}

/**
 * POST /:id/cancel
 */
export async function postCancel(req, res) {
  const userId = userIdFromReq(req);
  const row = await withdrawalService.cancelWithdrawal({ userId, withdrawalId: req.params.id });
  res.json(row);
}

/**
 * POST /:id/sync — poll Flutterwave transfer status
 */
export async function postSync(req, res) {
  const userId = userIdFromReq(req);
  const row = await withdrawalService.syncWithdrawalFromProvider({ userId, withdrawalId: req.params.id });
  res.json(row);
}

export const withdrawalControllerRouter = Router();

withdrawalControllerRouter.post(
  '/',
  requireAuth,
  requireRole('landlord', 'admin'),
  sensitiveUserRateLimiter,
  validateBody(withdrawalRequestSchema),
  asyncHandler(postWithdrawal)
);
withdrawalControllerRouter.get('/', requireAuth, requireRole('landlord', 'admin'), asyncHandler(listWithdrawals));
withdrawalControllerRouter.get('/:id', requireAuth, requireRole('landlord', 'admin'), asyncHandler(getWithdrawal));
withdrawalControllerRouter.post(
  '/:id/retry',
  requireAuth,
  requireRole('landlord', 'admin'),
  sensitiveUserRateLimiter,
  asyncHandler(postRetry)
);
withdrawalControllerRouter.post(
  '/:id/cancel',
  requireAuth,
  requireRole('landlord', 'admin'),
  sensitiveUserRateLimiter,
  asyncHandler(postCancel)
);
withdrawalControllerRouter.post('/:id/sync', requireAuth, requireRole('landlord', 'admin'), asyncHandler(postSync));
