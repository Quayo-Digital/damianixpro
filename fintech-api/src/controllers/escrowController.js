/**
 * Rent escrow HTTP API — fund, release (after hold), dispute.
 */
import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { requireRole } from '../middleware/roles.js';
import { sensitiveUserRateLimiter } from '../middleware/rateLimit.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { AppError } from '../utils/AppError.js';
import * as escrowService from '../services/escrowService.js';

function userIdFromReq(req) {
  const sub = req.auth?.sub;
  if (!sub || sub === 'dev-bypass') {
    throw new AppError('Valid authenticated user required', 401, 'unauthorized');
  }
  return sub;
}

function assertParticipant(row, userId) {
  if (row.payer_user_id !== userId && row.beneficiary_user_id !== userId) {
    throw new AppError('Forbidden', 403, 'forbidden');
  }
}

/**
 * POST / — create escrow (caller must be payer / tenant)
 */
export async function createEscrow(req, res) {
  const payerUserId = userIdFromReq(req);
  const {
    landlordUserId: beneficiaryUserId,
    amountMinor,
    currencyCode,
    holdPeriodDays,
    commissionBps,
    reference,
    metadata,
  } = req.body ?? {};

  if (!beneficiaryUserId) {
    throw new AppError('landlordUserId is required', 400, 'validation');
  }

  const row = await escrowService.createRentEscrow({
    payerUserId,
    beneficiaryUserId,
    amountMinor,
    currencyCode,
    holdPeriodDays,
    commissionBps,
    reference,
    metadata,
  });

  res.status(201).json({ escrow: serializeEscrow(row) });
}

/**
 * GET / — list my escrows
 */
export async function listMyEscrows(_req, res) {
  const userId = userIdFromReq(_req);
  const rows = await escrowService.listEscrowsForUser(userId);
  res.json({ escrows: rows.map(serializeEscrow) });
}

/**
 * GET /:id
 */
export async function getEscrowById(req, res) {
  const userId = userIdFromReq(req);
  const row = await escrowService.getEscrow(req.params.id);
  if (!row) {
    throw new AppError('Escrow not found', 404, 'not_found');
  }
  assertParticipant(row, userId);
  res.json({ escrow: serializeEscrow(row) });
}

/**
 * POST /:id/fund — tenant funds from wallet into escrow
 */
export async function fundEscrow(req, res) {
  const userId = userIdFromReq(req);
  const { idempotencyKey } = req.body ?? {};
  if (!idempotencyKey) {
    throw new AppError('idempotencyKey is required', 400, 'validation');
  }

  const row = await escrowService.getEscrow(req.params.id);
  if (!row) {
    throw new AppError('Escrow not found', 404, 'not_found');
  }
  if (row.payer_user_id !== userId) {
    throw new AppError('Only the payer may fund this escrow', 403, 'forbidden');
  }

  const result = await escrowService.fundEscrowFromTenant({
    escrowId: req.params.id,
    idempotencyKey: String(idempotencyKey),
  });

  res.status(result.duplicate ? 200 : 201).json({
    duplicate: result.duplicate,
    journalId: result.journalId,
    escrow: serializeEscrow(result.escrow),
  });
}

/**
 * POST /:id/release — landlord receives net; platform receives commission (after hold_until)
 */
export async function releaseEscrow(req, res) {
  const userId = userIdFromReq(req);
  const { commissionIdempotencyKey, netIdempotencyKey } = req.body ?? {};
  if (!commissionIdempotencyKey || !netIdempotencyKey) {
    throw new AppError('commissionIdempotencyKey and netIdempotencyKey are required', 400, 'validation');
  }

  const row = await escrowService.getEscrow(req.params.id);
  if (!row) {
    throw new AppError('Escrow not found', 404, 'not_found');
  }
  if (row.beneficiary_user_id !== userId) {
    throw new AppError('Only the beneficiary (landlord) may release', 403, 'forbidden');
  }

  const result = await escrowService.releaseEscrowToLandlord({
    escrowId: req.params.id,
    commissionIdempotencyKey: String(commissionIdempotencyKey),
    netIdempotencyKey: String(netIdempotencyKey),
  });

  res.status(result.duplicate ? 200 : 201).json({
    duplicate: result.duplicate,
    netJournalId: result.netJournalId,
    commissionJournalId: result.commissionJournalId,
    netMinor: result.netMinor,
    commissionMinor: result.commissionMinor,
    commissionBps: result.commissionBps,
    commissionPlan: result.commissionPlan,
    escrow: serializeEscrow(result.escrow),
  });
}

/**
 * POST /:id/dispute — payer or beneficiary
 */
export async function disputeEscrow(req, res) {
  const userId = userIdFromReq(req);
  const { reason } = req.body ?? {};
  if (!reason?.trim()) {
    throw new AppError('reason is required', 400, 'validation');
  }

  const row = await escrowService.getEscrow(req.params.id);
  if (!row) {
    throw new AppError('Escrow not found', 404, 'not_found');
  }
  assertParticipant(row, userId);

  const updated = await escrowService.flagEscrowDispute({
    escrowId: req.params.id,
    flaggedByUserId: userId,
    reason: String(reason),
  });

  res.status(200).json({ escrow: serializeEscrow(updated) });
}

/** @param {Record<string, unknown>} row */
function serializeEscrow(row) {
  if (!row) return null;
  return {
    id: row.id,
    reference: row.reference,
    payerUserId: row.payer_user_id,
    beneficiaryUserId: row.beneficiary_user_id,
    escrowAccountId: row.escrow_account_id,
    amountMinor: row.amount_minor != null ? String(row.amount_minor) : null,
    currencyCode: row.currency_code,
    status: row.status,
    holdPeriodDays: row.hold_period_days,
    commissionBps: row.commission_bps,
    holdUntil: row.hold_until,
    disputed: row.disputed ?? false,
    disputeReason: row.dispute_reason,
    disputedAt: row.disputed_at,
    fundedAt: row.funded_at,
    releasedAt: row.released_at,
    fundedJournalId: row.funded_journal_id,
    releaseJournalId: row.release_journal_id,
    releaseCommissionJournalId: row.release_commission_journal_id,
    metadata: row.metadata,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export const escrowControllerRouter = Router();

escrowControllerRouter.post(
  '/',
  requireAuth,
  requireRole('tenant', 'admin'),
  sensitiveUserRateLimiter,
  asyncHandler(createEscrow)
);
escrowControllerRouter.get('/', requireAuth, asyncHandler(listMyEscrows));
escrowControllerRouter.get('/:id', requireAuth, asyncHandler(getEscrowById));
escrowControllerRouter.post(
  '/:id/fund',
  requireAuth,
  requireRole('tenant', 'admin'),
  sensitiveUserRateLimiter,
  asyncHandler(fundEscrow)
);
escrowControllerRouter.post(
  '/:id/release',
  requireAuth,
  requireRole('landlord', 'admin'),
  sensitiveUserRateLimiter,
  asyncHandler(releaseEscrow)
);
escrowControllerRouter.post('/:id/dispute', requireAuth, asyncHandler(disputeEscrow));
