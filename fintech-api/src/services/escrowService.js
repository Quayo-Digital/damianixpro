/**
 * Rent escrow: tenant funds a dedicated escrow account; after hold period, release net to landlord + commission to platform.
 * All movements use ledgerService.transfer — no balance column updates on accounts.
 */
import { pool, withTransaction } from '../db/pool.js';
import { env } from '../config/env.js';
import { AppError } from '../utils/AppError.js';
import { transfer, getNetBalanceMinor } from './ledgerService.js';
import { getOrCreateWalletForUser } from './walletService.js';
import * as commissionService from './commissionService.js';

/** @param {import('pg').PoolClient} c */
async function assertUserExists(c, userId) {
  const r = await c.query(`SELECT 1 FROM public.${env.fintechUserTable} WHERE id = $1`, [userId]);
  if (!r.rowCount) {
    throw new AppError(`User not found in public.${env.fintechUserTable}`, 404, 'user_missing');
  }
}

/** @param {import('pg').PoolClient} c */
async function resolvePlatformCommissionAccountId(c) {
  if (env.platformCommissionAccountId) {
    return env.platformCommissionAccountId;
  }
  const r = await c.query(
    `SELECT id FROM public.accounts WHERE code = 'PLATFORM_REVENUE' AND status = 'active' LIMIT 1`
  );
  if (!r.rows[0]) {
    throw new AppError(
      'Commission account missing: seed PLATFORM_REVENUE or set PLATFORM_COMMISSION_ACCOUNT_ID',
      503,
      'commission_account_missing'
    );
  }
  return r.rows[0].id;
}

/**
 * Create escrow record + dedicated escrow ledger account (kind escrow, owner = payer).
 *
 * @param {object} p
 * @param {string} p.payerUserId - Tenant
 * @param {string} p.beneficiaryUserId - Landlord
 * @param {bigint|number|string} p.amountMinor
 * @param {string} [p.currencyCode='NGN']
 * @param {number} [p.holdPeriodDays=7]
 * @param {number} [p.commissionBps=0] - 100 = 1%
 * @param {string} [p.reference]
 * @param {Record<string, unknown>} [p.metadata]
 * @param {import('pg').PoolClient} [outerClient]
 */
export async function createRentEscrow(p, outerClient) {
  const {
    payerUserId,
    beneficiaryUserId,
    amountMinor,
    currencyCode = 'NGN',
    holdPeriodDays: holdDaysInput,
    commissionBps = 0,
    reference,
    metadata = {},
  } = p;
  const holdPeriodDays = holdDaysInput ?? env.defaultEscrowHoldDays ?? 7;

  if (!payerUserId || !beneficiaryUserId || amountMinor === undefined) {
    throw new AppError('payerUserId, beneficiaryUserId, and amountMinor are required', 400, 'validation');
  }
  if (payerUserId === beneficiaryUserId) {
    throw new AppError('Payer and beneficiary must differ', 400, 'validation');
  }
  const amt = typeof amountMinor === 'bigint' ? Number(amountMinor) : Number(amountMinor);
  if (!Number.isFinite(amt) || amt <= 0) {
    throw new AppError('amountMinor must be positive', 400, 'validation');
  }
  if (commissionBps < 0 || commissionBps > 10000) {
    throw new AppError('commissionBps must be 0..10000', 400, 'validation');
  }

  const cc = String(currencyCode).trim().toUpperCase().slice(0, 3);
  const ref =
    reference?.trim() ||
    `escrow-${payerUserId.slice(0, 8)}-${Date.now().toString(36)}`;

  const run = async (c) => {
    await assertUserExists(c, payerUserId);
    await assertUserExists(c, beneficiaryUserId);

    const acc = await c.query(
      `INSERT INTO public.accounts (owner_user_id, kind, currency_code, name, status, metadata)
       VALUES ($1, 'escrow', $2, $3, 'active', $4::jsonb)
       RETURNING id`,
      [
        payerUserId,
        cc,
        `Rent escrow ${ref}`,
        JSON.stringify({ type: 'rent_escrow', reference: ref, beneficiaryUserId }),
      ]
    );
    const escrowAccountId = acc.rows[0].id;

    const ins = await c.query(
      `INSERT INTO public.escrow (
         reference, payer_user_id, beneficiary_user_id, escrow_account_id,
         amount_minor, currency_code, status, hold_period_days, commission_bps, metadata
       ) VALUES ($1, $2, $3, $4, $5, $6, 'awaiting_funding', $7, $8, $9::jsonb)
       RETURNING *`,
      [
        ref,
        payerUserId,
        beneficiaryUserId,
        escrowAccountId,
        amt,
        cc,
        holdPeriodDays,
        commissionBps,
        JSON.stringify({ ...metadata, reference: ref }),
      ]
    );

    return ins.rows[0];
  };

  if (outerClient) {
    return run(outerClient);
  }
  return withTransaction(run);
}

/**
 * Move funds tenant wallet → escrow account. Idempotent via idempotencyKey.
 *
 * @param {object} p
 * @param {string} p.escrowId
 * @param {string} p.idempotencyKey
 * @param {import('pg').PoolClient} [outerClient]
 */
export async function fundEscrowFromTenant(p, outerClient) {
  const { escrowId, idempotencyKey } = p;
  if (!escrowId || !idempotencyKey) {
    throw new AppError('escrowId and idempotencyKey are required', 400, 'validation');
  }

  const run = async (c) => {
    const row = await lockEscrowRow(c, escrowId);
    if (row.disputed === true) {
      throw new AppError('Escrow is disputed', 409, 'escrow_disputed');
    }
    if (row.status === 'funded' && row.funded_journal_id) {
      const updated = await getEscrowById(c, escrowId);
      return { duplicate: true, escrow: updated, journalId: row.funded_journal_id };
    }
    if (row.status !== 'awaiting_funding' && row.status !== 'draft') {
      throw new AppError(`Cannot fund escrow in status ${row.status}`, 409, 'invalid_status');
    }

    const { accountId: tenantWallet } = await getOrCreateWalletForUser(row.payer_user_id, row.currency_code, c);

    const t = await transfer(
      {
        debitAccountId: row.escrow_account_id,
        creditAccountId: tenantWallet,
        amount: row.amount_minor,
        idempotencyKey,
        currencyCode: row.currency_code,
        reference: row.reference,
        description: `Escrow fund — ${row.reference}`,
        metadata: { escrowId, type: 'escrow_fund' },
      },
      c
    );

    const holdDays = Number(row.hold_period_days ?? env.defaultEscrowHoldDays ?? 7);
    const holdUntil = new Date();
    holdUntil.setUTCDate(holdUntil.getUTCDate() + holdDays);

    await c.query(
      `UPDATE public.escrow
       SET status = 'funded',
           funded_journal_id = $2,
           funded_at = COALESCE(funded_at, now()),
           hold_until = COALESCE(hold_until, $3::timestamptz),
           updated_at = now()
       WHERE id = $1`,
      [escrowId, t.journalId, holdUntil.toISOString()]
    );

    const updated = await getEscrowById(c, escrowId);
    return { duplicate: Boolean(t.duplicate), escrow: updated, journalId: t.journalId };
  };

  if (outerClient) {
    return run(outerClient);
  }
  return withTransaction(run);
}

/**
 * Release escrow to landlord (net) and platform (commission). Requires hold elapsed and not disputed.
 *
 * @param {object} p
 * @param {string} p.escrowId
 * @param {string} p.commissionIdempotencyKey
 * @param {string} p.netIdempotencyKey
 * @param {import('pg').PoolClient} [outerClient]
 */
export async function releaseEscrowToLandlord(p, outerClient) {
  const { escrowId, commissionIdempotencyKey, netIdempotencyKey } = p;
  if (!escrowId || !commissionIdempotencyKey || !netIdempotencyKey) {
    throw new AppError('escrowId, commissionIdempotencyKey, and netIdempotencyKey are required', 400, 'validation');
  }

  const run = async (c) => {
    const row = await lockEscrowRow(c, escrowId);

    if (row.status === 'disputed' || row.disputed === true) {
      throw new AppError('Escrow is disputed — release blocked', 409, 'escrow_disputed');
    }
    if (row.status === 'released') {
      const latest = await getEscrowById(c, escrowId);
      return {
        duplicate: true,
        escrow: latest,
        netJournalId: row.release_journal_id,
        commissionJournalId: row.release_commission_journal_id,
      };
    }
    if (row.status !== 'funded') {
      throw new AppError(`Release requires status funded (got ${row.status})`, 409, 'invalid_status');
    }

    const holdUntil = row.hold_until ? new Date(row.hold_until) : null;
    if (holdUntil && Date.now() < holdUntil.getTime()) {
      throw new AppError(
        `Hold period active until ${holdUntil.toISOString()}`,
        409,
        'hold_active',
        { holdUntil: holdUntil.toISOString() }
      );
    }

    const balance = await getNetBalanceMinor(c, row.escrow_account_id);
    const expected = BigInt(String(row.amount_minor));
    if (balance !== expected) {
      throw new AppError(
        `Escrow balance mismatch: ledger ${balance}, expected ${expected}`,
        409,
        'escrow_balance_mismatch',
        { balance: balance.toString(), expected: expected.toString() }
      );
    }

    const meta =
      row.metadata && typeof row.metadata === 'object' && !Array.isArray(row.metadata)
        ? /** @type {Record<string, unknown>} */ (row.metadata)
        : {};

    const overrideRaw = meta.platform_commission_bps_override;
    const useStoredEscrowBps = meta.use_stored_commission_bps === true;

    let planResolution = null;
    let commissionBps;
    if (overrideRaw != null && Number.isFinite(Number(overrideRaw))) {
      commissionBps = commissionService.clampCommissionBps(Number(overrideRaw));
      planResolution = {
        commissionBps,
        tier: 'override',
        planId: null,
        planName: null,
        source: 'metadata_override',
      };
    } else if (useStoredEscrowBps) {
      commissionBps = commissionService.clampCommissionBps(Number(row.commission_bps ?? 0));
      planResolution = {
        commissionBps,
        tier: 'stored_escrow',
        planId: null,
        planName: null,
        source: 'escrow_row',
      };
    } else {
      planResolution = await commissionService.resolveCommissionForLandlord(row.beneficiary_user_id, c);
      commissionBps = planResolution.commissionBps;
    }

    const split = commissionService.computeRentSplit(row.amount_minor, commissionBps);
    const commissionMinor = split.commissionMinor;
    const netMinor = split.netToLandlordMinor;
    if (netMinor < 0) {
      throw new AppError('Commission exceeds gross amount', 400, 'commission_too_high');
    }

    await c.query(`UPDATE public.escrow SET status = 'releasing', updated_at = now() WHERE id = $1`, [escrowId]);

    const platformAccountId = await resolvePlatformCommissionAccountId(c);
    const { accountId: landlordWallet } = await getOrCreateWalletForUser(
      row.beneficiary_user_id,
      row.currency_code,
      c
    );

    let commissionJournalId = null;
    if (commissionMinor > 0) {
      const cRes = await transfer(
        {
          debitAccountId: platformAccountId,
          creditAccountId: row.escrow_account_id,
          amount: commissionMinor,
          idempotencyKey: commissionIdempotencyKey,
          currencyCode: row.currency_code,
          reference: row.reference,
          description: `Escrow commission — ${row.reference}`,
          metadata: {
            escrowId,
            type: 'escrow_commission',
            commissionBps,
            ...(planResolution && {
              commissionTier: planResolution.tier,
              commissionPlanId: planResolution.planId,
              commissionSource: planResolution.source,
            }),
          },
        },
        c
      );
      commissionJournalId = cRes.journalId;
    }

    const nRes = await transfer(
      {
        debitAccountId: landlordWallet,
        creditAccountId: row.escrow_account_id,
        amount: netMinor,
        idempotencyKey: netIdempotencyKey,
        currencyCode: row.currency_code,
        reference: row.reference,
        description: `Escrow release — ${row.reference}`,
          metadata: {
            escrowId,
            type: 'escrow_release_net',
            commissionBps,
            netToLandlordMinor: netMinor,
          },
      },
      c
    );

    await c.query(
      `UPDATE public.escrow
       SET status = 'released',
           release_journal_id = $2,
           release_commission_journal_id = $3,
           released_at = now(),
           updated_at = now()
       WHERE id = $1`,
      [escrowId, nRes.journalId, commissionJournalId]
    );

    const updated = await getEscrowById(c, escrowId);
    return {
      duplicate: Boolean(nRes.duplicate),
      escrow: updated,
      netJournalId: nRes.journalId,
      commissionJournalId,
      netMinor,
      commissionMinor,
      commissionBps,
      commissionPlan: planResolution,
    };
  };

  if (outerClient) {
    return run(outerClient);
  }
  return withTransaction(run);
}

/**
 * Flag dispute — blocks release until resolved (manual process outside this service).
 *
 * @param {object} p
 * @param {string} p.escrowId
 * @param {string} p.flaggedByUserId
 * @param {string} p.reason
 * @param {import('pg').PoolClient} [outerClient]
 */
export async function flagEscrowDispute(p, outerClient) {
  const { escrowId, flaggedByUserId, reason } = p;
  if (!escrowId || !flaggedByUserId || !reason?.trim()) {
    throw new AppError('escrowId, flaggedByUserId, and reason are required', 400, 'validation');
  }

  const run = async (c) => {
    const row = await lockEscrowRow(c, escrowId);
    if (row.status === 'released' || row.status === 'cancelled') {
      throw new AppError('Cannot dispute a completed escrow', 409, 'invalid_status');
    }
    if (row.payer_user_id !== flaggedByUserId && row.beneficiary_user_id !== flaggedByUserId) {
      throw new AppError('Only payer or beneficiary may flag a dispute', 403, 'forbidden');
    }

    await c.query(
      `UPDATE public.escrow
       SET disputed = TRUE,
           status = 'disputed',
           dispute_reason = $2,
           disputed_at = now(),
           disputed_by = $3,
           updated_at = now()
       WHERE id = $1`,
      [escrowId, reason.trim(), flaggedByUserId]
    );

    return getEscrowById(c, escrowId);
  };

  if (outerClient) {
    return run(outerClient);
  }
  return withTransaction(run);
}

/**
 * @param {import('pg').PoolClient} c
 * @param {string} escrowId
 */
async function lockEscrowRow(c, escrowId) {
  const r = await c.query(`SELECT * FROM public.escrow WHERE id = $1 FOR UPDATE`, [escrowId]);
  if (!r.rows[0]) {
    throw new AppError('Escrow not found', 404, 'not_found');
  }
  return r.rows[0];
}

/**
 * @param {import('pg').PoolClient} c
 * @param {string} escrowId
 */
async function getEscrowById(c, escrowId) {
  const r = await c.query(`SELECT * FROM public.escrow WHERE id = $1`, [escrowId]);
  return r.rows[0] ?? null;
}

/**
 * Read-only escrow for API (no lock).
 * @param {string} escrowId
 */
export async function getEscrow(escrowId) {
  const r = await pool.query(`SELECT * FROM public.escrow WHERE id = $1`, [escrowId]);
  return r.rows[0] ?? null;
}

/**
 * List escrows for user as payer or beneficiary.
 * @param {string} userId
 */
export async function listEscrowsForUser(userId) {
  const r = await pool.query(
    `SELECT * FROM public.escrow
     WHERE payer_user_id = $1 OR beneficiary_user_id = $1
     ORDER BY created_at DESC
     LIMIT 100`,
    [userId]
  );
  return r.rows;
}
