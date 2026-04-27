/**
 * Landlord (user) withdrawals: ledger hold → Flutterwave bank payout → settle suspense to clearing.
 *
 * Status flow: requested → processing → completed | failed | cancelled
 * - Payout API errors: status failed, funds remain in WITHDRAWAL_SUSPENSE (retry or cancel to refund).
 * - cancelWithdrawal: posts reversal journal (wallet credited back), status cancelled.
 * - Webhook: transfer completion/failure finalizes or marks failed when FW sends terminal status.
 */
import { pool, withTransaction } from '../db/pool.js';
import { env } from '../config/env.js';
import { AppError } from '../utils/AppError.js';
import { transfer } from './ledgerService.js';
import { getOrCreateWalletForUser, getWalletBalanceMinor } from './walletService.js';
import {
  initiateBankPayout,
  getTransferById,
  ngnMinorToFlutterwaveMainAmount,
} from './payoutService.js';

const WD_REF_PREFIX = 'WD';
const MIN_WD_NGN = 100;
const MIN_WD_MINOR = 10_000n;

/**
 * @param {string} withdrawalId
 * @param {number} attemptNumber — 1-based attempt index (1 = first payout try)
 */
function payoutReferenceForAttempt(withdrawalId, attemptNumber) {
  if (attemptNumber <= 1) return `${WD_REF_PREFIX}_${withdrawalId}`;
  return `${WD_REF_PREFIX}_${withdrawalId}_a${attemptNumber}`;
}

/**
 * @param {string} ref — Flutterwave transfer reference
 * @returns {string|null} withdrawal UUID
 */
export function parseWithdrawalIdFromReference(ref) {
  if (typeof ref !== 'string' || !ref.startsWith(`${WD_REF_PREFIX}_`)) return null;
  let rest = ref.slice(WD_REF_PREFIX.length + 1);
  const m = rest.match(/^(.*)_a(\d+)$/);
  if (m) rest = m[1];
  if (!/^[0-9a-f-]{36}$/i.test(rest)) return null;
  return rest;
}

/**
 * @param {import('pg').PoolClient} client
 */
async function resolveWithdrawalSuspenseAccountId(client) {
  if (env.withdrawalSuspenseAccountId) {
    return env.withdrawalSuspenseAccountId;
  }
  const r = await client.query(
    `SELECT id FROM public.accounts WHERE code = 'WITHDRAWAL_SUSPENSE' AND status = 'active' LIMIT 1`
  );
  if (!r.rows[0]) {
    throw new AppError(
      'Withdrawal suspense missing: run fintech-api/sql/withdrawal_extensions.sql or set WITHDRAWAL_SUSPENSE_ACCOUNT_ID',
      503,
      'withdrawal_suspense_not_configured'
    );
  }
  return r.rows[0].id;
}

/**
 * @param {import('pg').PoolClient} client
 */
async function resolveClearingForSettle(client) {
  if (env.flutterwaveClearingAccountId) {
    return env.flutterwaveClearingAccountId;
  }
  const r = await client.query(
    `SELECT id FROM public.accounts WHERE code = 'FW_CLEARING' AND status = 'active' LIMIT 1`
  );
  if (!r.rows[0]) {
    throw new AppError('FW_CLEARING not configured', 503, 'clearing_not_configured');
  }
  return r.rows[0].id;
}

/**
 * @param {unknown} amountMinor
 * @returns {bigint}
 */
function assertPositiveMinor(amountMinor) {
  const b = BigInt(String(amountMinor));
  if (b <= 0n) throw new AppError('amount_minor must be positive', 400, 'validation');
  return b;
}

/**
 * @param {Record<string, unknown>} row
 */
function formatWithdrawalRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    userId: row.user_id,
    walletAccountId: row.wallet_account_id,
    amountMinor: String(row.amount_minor),
    feeMinor: String(row.fee_minor ?? 0),
    currencyCode: row.currency_code,
    status: row.status,
    destination: row.destination,
    journalId: row.journal_id,
    reversalJournalId: row.reversal_journal_id ?? null,
    provider: row.provider,
    providerTransferRef: row.provider_transfer_ref,
    idempotencyKey: row.idempotency_key,
    payoutAttemptCount: row.payout_attempt_count ?? 0,
    failureReason: row.failure_reason,
    metadata: row.metadata,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * @param {object} input
 * @param {string} input.userId
 * @param {bigint|number|string} input.amountMinor
 * @param {string} [input.currencyCode]
 * @param {object} input.destination — account_bank / account_number (snake or camel)
 * @param {string} input.clientIdempotencyKey — UNIQUE per logical withdrawal from client
 * @param {object} [input.payoutRetryOptions] — forwarded to initiateBankPayout retries
 * @param {string} [input.narration]
 */
export async function requestWithdrawal(input) {
  const {
    userId,
    amountMinor,
    currencyCode = 'NGN',
    destination,
    clientIdempotencyKey,
    payoutRetryOptions,
    narration,
  } = input;

  if (!userId) throw new AppError('userId is required', 400, 'validation');
  if (!clientIdempotencyKey || String(clientIdempotencyKey).trim() === '') {
    throw new AppError('clientIdempotencyKey is required', 400, 'validation');
  }
  if (!destination || typeof destination !== 'object') {
    throw new AppError('destination is required', 400, 'validation');
  }

  const accBank = destination.account_bank ?? destination.accountBank;
  const accNum = destination.account_number ?? destination.accountNumber;
  if (!accBank || !accNum) {
    throw new AppError('destination.account_bank and destination.account_number are required', 400, 'validation');
  }

  const cc = String(currencyCode).trim().toUpperCase().slice(0, 3);
  if (cc !== 'NGN') {
    throw new AppError('Only NGN withdrawals are supported in this build', 400, 'unsupported_currency');
  }

  const amount = assertPositiveMinor(amountMinor);
  if (amount < MIN_WD_MINOR) {
    throw new AppError(`Minimum withdrawal is ${MIN_WD_NGN} NGN`, 400, 'below_minimum');
  }

  const fwAmount = ngnMinorToFlutterwaveMainAmount(amount);
  if (fwAmount < MIN_WD_NGN) {
    throw new AppError(`Payout amount below Flutterwave minimum (${MIN_WD_NGN} NGN)`, 400, 'below_minimum');
  }

  const destJson = {
    account_bank: String(accBank),
    account_number: String(accNum),
    ...(destination.beneficiary_name || destination.beneficiaryName
      ? { beneficiary_name: String(destination.beneficiary_name ?? destination.beneficiaryName) }
      : {}),
  };

  const outcome = await withTransaction(async (c) => {
    const prev = await c.query(
      `SELECT * FROM public.withdrawals WHERE idempotency_key = $1 FOR UPDATE`,
      [String(clientIdempotencyKey)]
    );
    if (prev.rows[0]) {
      const row = prev.rows[0];
      if (row.user_id !== userId) {
        throw new AppError('Idempotency key belongs to another user', 409, 'idempotency_conflict');
      }
      return { kind: 'existing', row };
    }

    const { accountId: walletId } = await getOrCreateWalletForUser(userId, cc, c);
    const balance = await getWalletBalanceMinor(walletId, c);
    if (balance < amount) {
      throw new AppError('Insufficient wallet balance', 400, 'insufficient_funds');
    }

    const ins = await c.query(
      `INSERT INTO public.withdrawals (
        user_id, wallet_account_id, amount_minor, currency_code, fee_minor, status, destination,
        idempotency_key, provider, metadata
      ) VALUES ($1, $2, $3, $4, 0, 'requested', $5::jsonb, $6, 'flutterwave', '{}'::jsonb)
 RETURNING *`,
      [userId, walletId, amount.toString(), cc, JSON.stringify(destJson), String(clientIdempotencyKey)]
    );
    const created = ins.rows[0];
    const wid = created.id;

    const suspenseId = await resolveWithdrawalSuspenseAccountId(c);
    const journal = await transfer(
      {
        debitAccountId: suspenseId,
        creditAccountId: walletId,
        amount: amount.toString(),
        idempotencyKey: `withdrawal-${wid}-hold`,
        currencyCode: cc,
        reference: `withdrawal-${wid}`,
        description: 'Withdrawal — hold funds in payout suspense',
        metadata: { withdrawalId: wid, userId },
      },
      c
    );

    await c.query(
      `UPDATE public.withdrawals SET status = 'processing', journal_id = $2, updated_at = now() WHERE id = $1`,
      [wid, journal.journalId]
    );

    const full = await c.query(`SELECT * FROM public.withdrawals WHERE id = $1`, [wid]);
    return { kind: 'new', row: full.rows[0] };
  });

  const row = outcome.row;
  if (outcome.kind === 'existing') {
    if (row.status === 'completed') return formatWithdrawalRow(row);
    if (row.status === 'cancelled') return formatWithdrawalRow(row);
    if (row.status === 'processing' && row.provider_transfer_ref) return formatWithdrawalRow(row);
    if (row.status === 'failed' && row.reversal_journal_id) return formatWithdrawalRow(row);
    if (row.status === 'failed' && !row.reversal_journal_id) {
      throw new AppError(
        'This withdrawal failed payout; use POST /withdrawals/:id/retry or cancel',
        409,
        'withdrawal_failed_retry_required'
      );
    }
  }

  return processPayoutForWithdrawal(row.id, { payoutRetryOptions, narration });
}

/**
 * Retry Flutterwave payout after a failed attempt (funds still in suspense).
 *
 * @param {object} input
 * @param {string} input.userId
 * @param {string} input.withdrawalId
 * @param {object} [input.payoutRetryOptions]
 * @param {string} [input.narration]
 */
export async function retryWithdrawal(input) {
  const { userId, withdrawalId, payoutRetryOptions, narration } = input;
  if (!userId || !withdrawalId) {
    throw new AppError('userId and withdrawalId are required', 400, 'validation');
  }

  await withTransaction(async (c) => {
    const { rows } = await c.query(
      `SELECT * FROM public.withdrawals WHERE id = $1 AND user_id = $2 FOR UPDATE`,
      [withdrawalId, userId]
    );
    const row = rows[0];
    if (!row) throw new AppError('Withdrawal not found', 404, 'not_found');
    if (row.status !== 'failed') {
      throw new AppError('Only failed withdrawals can be retried', 400, 'invalid_status');
    }
    if (row.reversal_journal_id) {
      throw new AppError('Withdrawal was refunded to wallet; create a new withdrawal', 400, 'already_refunded');
    }
    await c.query(
      `UPDATE public.withdrawals SET status = 'processing', failure_reason = NULL, updated_at = now() WHERE id = $1`,
      [withdrawalId]
    );
  });

  return processPayoutForWithdrawal(withdrawalId, { payoutRetryOptions, narration });
}

/**
 * Refund wallet from suspense (user-initiated cancel). Cannot cancel completed payouts.
 *
 * @param {object} input
 * @param {string} input.userId
 * @param {string} input.withdrawalId
 */
export async function cancelWithdrawal(input) {
  const { userId, withdrawalId } = input;
  if (!userId || !withdrawalId) {
    throw new AppError('userId and withdrawalId are required', 400, 'validation');
  }

  const row = await withTransaction(async (c) => {
    const { rows } = await c.query(
      `SELECT * FROM public.withdrawals WHERE id = $1 AND user_id = $2 FOR UPDATE`,
      [withdrawalId, userId]
    );
    const w = rows[0];
    if (!w) throw new AppError('Withdrawal not found', 404, 'not_found');
    if (w.status === 'completed') {
      throw new AppError('Cannot cancel a completed withdrawal', 400, 'invalid_status');
    }
    if (w.status === 'cancelled') {
      return w;
    }
    if (w.reversal_journal_id) {
      await c.query(
        `UPDATE public.withdrawals SET status = 'cancelled', updated_at = now() WHERE id = $1`,
        [withdrawalId]
      );
      const r2 = await c.query(`SELECT * FROM public.withdrawals WHERE id = $1`, [withdrawalId]);
      return r2.rows[0];
    }

    if (!w.journal_id) {
      await c.query(
        `UPDATE public.withdrawals SET status = 'cancelled', failure_reason = COALESCE(failure_reason, 'cancelled'), updated_at = now() WHERE id = $1`,
        [withdrawalId]
      );
      const r2 = await c.query(`SELECT * FROM public.withdrawals WHERE id = $1`, [withdrawalId]);
      return r2.rows[0];
    }

    const suspenseId = await resolveWithdrawalSuspenseAccountId(c);
    const walletId = w.wallet_account_id;
    const amount = BigInt(String(w.amount_minor));
    const rev = await transfer(
      {
        debitAccountId: walletId,
        creditAccountId: suspenseId,
        amount: amount.toString(),
        idempotencyKey: `withdrawal-${withdrawalId}-reversal`,
        currencyCode: w.currency_code,
        reference: `withdrawal-reversal-${withdrawalId}`,
        description: 'Withdrawal cancelled — refund to wallet',
        metadata: { withdrawalId },
      },
      c
    );

    await c.query(
      `UPDATE public.withdrawals SET
        status = 'cancelled',
        reversal_journal_id = $2,
        failure_reason = COALESCE(failure_reason, 'cancelled_by_user'),
        updated_at = now()
      WHERE id = $1`,
      [withdrawalId, rev.journalId]
    );
    const r2 = await c.query(`SELECT * FROM public.withdrawals WHERE id = $1`, [withdrawalId]);
    return r2.rows[0];
  });

  return formatWithdrawalRow(row);
}

/**
 * Poll Flutterwave for a processing withdrawal (optional reconciliation).
 *
 * @param {object} input
 * @param {string} input.userId
 * @param {string} input.withdrawalId
 */
export async function syncWithdrawalFromProvider(input) {
  const { userId, withdrawalId } = input;
  const { rows } = await pool.query(`SELECT * FROM public.withdrawals WHERE id = $1 AND user_id = $2`, [
    withdrawalId,
    userId,
  ]);
  const row = rows[0];
  if (!row) throw new AppError('Withdrawal not found', 404, 'not_found');
  if (!row.provider_transfer_ref) return formatWithdrawalRow(row);

  const data = await getTransferById(row.provider_transfer_ref);
  const st = String(data?.data?.status ?? '').toUpperCase();
  if (st === 'SUCCESS' || st === 'COMPLETED') {
    await finalizeWithdrawalSuccess(withdrawalId);
  } else if (st === 'FAILED') {
    await markWithdrawalPayoutFailed(
      withdrawalId,
      data?.data?.complete_message || data?.message || 'transfer failed'
    );
  }

  const r2 = await pool.query(`SELECT * FROM public.withdrawals WHERE id = $1`, [withdrawalId]);
  return formatWithdrawalRow(r2.rows[0]);
}

/**
 * @param {string} userId
 * @param {string} withdrawalId
 */
export async function getWithdrawalForUser(userId, withdrawalId) {
  const { rows } = await pool.query(`SELECT * FROM public.withdrawals WHERE id = $1 AND user_id = $2`, [
    withdrawalId,
    userId,
  ]);
  if (!rows[0]) throw new AppError('Withdrawal not found', 404, 'not_found');
  return formatWithdrawalRow(rows[0]);
}

/**
 * @param {string} userId
 * @param {number} [limit=50]
 */
export async function listWithdrawalsForUser(userId, limit = 50) {
  const lim = Math.min(200, Math.max(1, Number(limit) || 50));
  const { rows } = await pool.query(
    `SELECT * FROM public.withdrawals WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2`,
    [userId, lim]
  );
  return rows.map(formatWithdrawalRow);
}

/**
 * Run Flutterwave transfer for a row already in `processing`.
 *
 * @param {string} withdrawalId
 * @param {object} [opts]
 * @param {object} [opts.payoutRetryOptions]
 * @param {string} [opts.narration]
 */
export async function processPayoutForWithdrawal(withdrawalId, opts = {}) {
  const { payoutRetryOptions, narration } = opts;

  const base = await pool.query(`SELECT * FROM public.withdrawals WHERE id = $1`, [withdrawalId]);
  const row0 = base.rows[0];
  if (!row0) throw new AppError('Withdrawal not found', 404, 'not_found');
  if (row0.status === 'completed') return formatWithdrawalRow(row0);
  if (row0.status === 'cancelled') {
    throw new AppError('Withdrawal was cancelled', 400, 'withdrawal_cancelled');
  }
  if (row0.status === 'failed') {
    throw new AppError('Withdrawal is failed; call retryWithdrawal first', 400, 'invalid_status');
  }
  if (row0.status !== 'processing') {
    throw new AppError(`Cannot payout from status ${row0.status}`, 400, 'invalid_status');
  }

  const amount = BigInt(String(row0.amount_minor));
  const fwAmount = ngnMinorToFlutterwaveMainAmount(amount);
  const attemptNumber = Number(row0.payout_attempt_count ?? 0) + 1;
  const ref = payoutReferenceForAttempt(withdrawalId, attemptNumber);

  const dest = row0.destination || {};
  const accountBank = dest.account_bank;
  const accountNumber = dest.account_number;
  if (!accountBank || !accountNumber) {
    throw new AppError('Withdrawal destination missing bank details', 400, 'validation');
  }

  try {
    const payout = await initiateBankPayout(
      {
        account_bank: String(accountBank),
        account_number: String(accountNumber),
        amount: fwAmount,
        currency: String(row0.currency_code || 'NGN'),
        reference: ref,
        narration: narration || `Withdrawal ${withdrawalId}`,
        meta: { withdrawal_id: withdrawalId },
      },
      payoutRetryOptions
    );

    const st = String(payout.status ?? payout.raw?.data?.status ?? '').toUpperCase();
    const transferId = payout.transferId ?? payout.raw?.data?.id;

    await pool.query(
      `UPDATE public.withdrawals SET
        payout_attempt_count = $2,
        provider = 'flutterwave',
        provider_transfer_ref = COALESCE($3::text, provider_transfer_ref),
        metadata = COALESCE(metadata, '{}'::jsonb) || $4::jsonb,
        failure_reason = NULL,
        updated_at = now()
      WHERE id = $1`,
      [
        withdrawalId,
        attemptNumber,
        transferId != null ? String(transferId) : null,
        JSON.stringify({ last_payout_status: st, last_reference: ref }),
      ]
    );

    const terminalOk = ['SUCCESS', 'COMPLETED'];
    const terminalBad = ['FAILED'];

    if (terminalOk.includes(st)) {
      await finalizeWithdrawalSuccess(withdrawalId);
    } else if (terminalBad.includes(st)) {
      await markWithdrawalPayoutFailed(
        withdrawalId,
        String(payout.raw?.data?.complete_message || payout.raw?.message || 'Flutterwave reported failure')
      );
    }

    const r2 = await pool.query(`SELECT * FROM public.withdrawals WHERE id = $1`, [withdrawalId]);
    return formatWithdrawalRow(r2.rows[0]);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    await pool.query(
      `UPDATE public.withdrawals SET
        payout_attempt_count = $2,
        status = 'failed',
        failure_reason = $3,
        updated_at = now()
      WHERE id = $1 AND status NOT IN ('completed', 'cancelled')`,
      [withdrawalId, attemptNumber, msg.slice(0, 2000)]
    );
    const r2 = await pool.query(`SELECT * FROM public.withdrawals WHERE id = $1`, [withdrawalId]);
    return formatWithdrawalRow(r2.rows[0]);
  }
}

/**
 * After Flutterwave confirms success: Cr suspense / Dr clearing (release hold to clearing rail).
 *
 * @param {string} withdrawalId
 */
export async function finalizeWithdrawalSuccess(withdrawalId) {
  await withTransaction(async (c) => {
    const { rows } = await c.query(`SELECT * FROM public.withdrawals WHERE id = $1 FOR UPDATE`, [withdrawalId]);
    const row = rows[0];
    if (!row) throw new AppError('Withdrawal not found', 404, 'not_found');
    if (row.status === 'completed') return;
    if (row.status === 'cancelled') return;

    const amount = BigInt(String(row.amount_minor));
    const suspenseId = await resolveWithdrawalSuspenseAccountId(c);
    const clearingId = await resolveClearingForSettle(c);

    await transfer(
      {
        debitAccountId: clearingId,
        creditAccountId: suspenseId,
        amount: amount.toString(),
        idempotencyKey: `withdrawal-${withdrawalId}-settle`,
        currencyCode: row.currency_code,
        reference: `withdrawal-settle-${withdrawalId}`,
        description: 'Withdrawal — settle suspense to clearing after payout',
        metadata: { withdrawalId },
      },
      c
    );

    await c.query(
      `UPDATE public.withdrawals SET status = 'completed', failure_reason = NULL, updated_at = now() WHERE id = $1`,
      [withdrawalId]
    );
  });
}

/**
 * Payout failed (API or webhook); funds stay in suspense unless user cancels.
 *
 * @param {string} withdrawalId
 * @param {string} reason
 */
export async function markWithdrawalPayoutFailed(withdrawalId, reason) {
  await pool.query(
    `UPDATE public.withdrawals
 SET status = 'failed', failure_reason = $2, updated_at = now()
     WHERE id = $1 AND status NOT IN ('completed', 'cancelled')`,
    [withdrawalId, String(reason || 'payout_failed').slice(0, 2000)]
  );
}

/**
 * Flutterwave webhook subscriber: completes or fails withdrawals by transfer reference.
 *
 * @param {{ event: string, payload: object }} ctx
 */
export async function handleTransferWebhookEvent(ctx) {
  const event = (ctx.event || '').toLowerCase();
  if (!event.includes('transfer')) return;

  const data = ctx.payload?.data ?? ctx.payload;
  const ref = data?.reference ?? data?.tx_ref ?? data?.transfer?.reference;
  if (!ref || typeof ref !== 'string') return;

  const withdrawalId = parseWithdrawalIdFromReference(ref);
  if (!withdrawalId) return;

  const status = String(data?.status ?? data?.transfer?.status ?? '').toUpperCase();

  if (status === 'SUCCESS' || status === 'COMPLETED') {
    await finalizeWithdrawalSuccess(withdrawalId);
    return;
  }

  if (status === 'FAILED') {
    await markWithdrawalPayoutFailed(
      withdrawalId,
      data?.complete_message || data?.reason || 'transfer.failed webhook'
    );
  }
}
