/**
 * Double-entry ledger transfers with row locking, idempotency, and non-negative balances.
 *
 * Posting convention (wallet / escrow): available balance = SUM(debit_minor) - SUM(credit_minor).
 * transfer(debitAccountId, creditAccountId, amount) moves funds TO the debit account FROM the credit account:
 *   - Line 1: debit debitAccountId  (recipient balance increases)
 *   - Line 2: credit creditAccountId (sender balance decreases)
 *
 * Schema: public.accounts, public.ledger_journals, public.ledger_entries
 * Audit: run fintech-api/sql/ledger_transfer_audit.sql (optional but recommended)
 */
import { withTransaction } from '../db/pool.js';
import { AppError } from '../utils/AppError.js';

/** @typedef {'wallet'|'escrow'|'revenue'|'platform_fee'|'payable'|'clearing'|'system'} AccountKind */

/** @type {Set<AccountKind>} */
const NON_NEGATIVE_KINDS = new Set(['wallet', 'escrow']);

/**
 * @param {object} params
 * @param {string} params.debitAccountId - Recipient ledger account (balance increases).
 * @param {string} params.creditAccountId - Source ledger account (balance decreases).
 * @param {bigint|number|string} params.amount - Minor units (e.g. kobo); integer > 0.
 * @param {string} params.idempotencyKey - Unique key per logical transfer; duplicates return the same journal.
 * @param {string} [params.currencyCode='NGN'] - Must match both accounts.
 * @param {string} [params.reference] - Stored on ledger_journals.reference
 * @param {string} [params.description] - Stored on ledger_journals.description
 * @param {Record<string, unknown>} [params.metadata] - Merged into journal + audit metadata
 * @param {import('pg').PoolClient} [outerClient] - Join an outer transaction (must not commit inside service)
 */
export async function transfer(params, outerClient) {
  const run = (client) => transferWithClient(client, params);
  if (outerClient) {
    return run(outerClient);
  }
  return withTransaction(run);
}

/**
 * Positional helper: same as transfer({ debitAccountId, creditAccountId, amount, idempotencyKey }, client).
 * @param {string} debitAccountId
 * @param {string} creditAccountId
 * @param {bigint|number|string} amount
 * @param {string} idempotencyKey
 * @param {import('pg').PoolClient} [outerClient]
 */
export async function transferDebitCredit(debitAccountId, creditAccountId, amount, idempotencyKey, outerClient) {
  return transfer({ debitAccountId, creditAccountId, amount, idempotencyKey }, outerClient);
}

/**
 * @param {import('pg').PoolClient} client
 * @param {object} params
 */
async function transferWithClient(client, params) {
  const started = Date.now();
  const {
    debitAccountId,
    creditAccountId,
    amount: amountInput,
    idempotencyKey,
    currencyCode = 'NGN',
    reference,
    description,
    metadata = {},
  } = params;

  if (!idempotencyKey || typeof idempotencyKey !== 'string' || idempotencyKey.trim() === '') {
    throw new AppError('idempotencyKey is required', 400, 'idempotency_required');
  }

  if (debitAccountId === creditAccountId) {
    throw new AppError('debitAccountId and creditAccountId must differ', 400, 'invalid_accounts');
  }

  const amountMinor = normalizeAmountMinor(amountInput);

  const logPayload = {
    op: 'ledger.transfer',
    idempotencyKey,
    debitAccountId,
    creditAccountId,
    amountMinor: amountMinor.toString(),
    currencyCode,
  };

  try {
    const journalId = await resolveOrCreateJournal(client, {
      idempotencyKey,
      reference,
      description,
      metadata,
    });

    const existingCount = await countJournalEntries(client, journalId);
    if (existingCount >= 2) {
      logStructured('info', { ...logPayload, duplicate: true, journalId, ms: Date.now() - started });
      return {
        ok: true,
        duplicate: true,
        journalId,
        ledgerEntryIds: await listEntryIdsForJournal(client, journalId),
      };
    }

    if (existingCount === 1) {
      throw new AppError(
        'Journal exists but has only one ledger line (data integrity). Fix manually.',
        409,
        'ledger_corrupt'
      );
    }

    const [firstId, secondId] = [debitAccountId, creditAccountId].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));

    const a1 = await lockAccountRow(client, firstId);
    const a2 = await lockAccountRow(client, secondId);

    const debitAcc = a1.id === debitAccountId ? a1 : a2;
    const creditAcc = a1.id === creditAccountId ? a1 : a2;

    assertActiveAccount(debitAcc);
    assertActiveAccount(creditAcc);

    const cc = (s) => String(s ?? '').trim();
    if (cc(debitAcc.currency_code) !== cc(currencyCode)) {
      throw new AppError('Debit account currency mismatch', 400, 'currency_mismatch');
    }
    if (cc(creditAcc.currency_code) !== cc(currencyCode)) {
      throw new AppError('Credit account currency mismatch', 400, 'currency_mismatch');
    }

    await assertNonNegativeAfterCredit(client, creditAcc, amountMinor);

    const memo = description || `Transfer ${amountMinor} ${currencyCode}`;
    const lineMeta = { ...metadata, idempotencyKey };

    const amt = Number(amountMinor);

    const insDebit = await client.query(
      `INSERT INTO public.ledger_entries (
         journal_id, account_id, debit_minor, credit_minor, currency_code, memo, metadata
       ) VALUES ($1, $2, $3, 0, $4, $5, $6::jsonb)
       RETURNING id`,
      [journalId, debitAccountId, amt, currencyCode, `${memo} (debit)`, JSON.stringify(lineMeta)]
    );

    const insCredit = await client.query(
      `INSERT INTO public.ledger_entries (
         journal_id, account_id, debit_minor, credit_minor, currency_code, memo, metadata
       ) VALUES ($1, $2, 0, $3, $4, $5, $6::jsonb)
       RETURNING id`,
      [journalId, creditAccountId, amt, currencyCode, `${memo} (credit)`, JSON.stringify(lineMeta)]
    );

    await insertAuditSafe(client, {
      journalId,
      idempotencyKey,
      debitAccountId,
      creditAccountId,
      amountMinor: amt,
      currencyCode,
      metadata,
    });

    const ledgerEntryIds = [insDebit.rows[0].id, insCredit.rows[0].id];

    logStructured('info', { ...logPayload, duplicate: false, journalId, ledgerEntryIds, ms: Date.now() - started });

    return {
      ok: true,
      duplicate: false,
      journalId,
      ledgerEntryIds,
    };
  } catch (err) {
    logStructured('error', { ...logPayload, err: err instanceof Error ? err.message : String(err) });
    throw err;
  }
}

/**
 * @param {import('pg').PoolClient} client
 * @param {object} opts
 */
async function resolveOrCreateJournal(client, opts) {
  const { idempotencyKey, reference, description, metadata } = opts;

  const meta = {
    ...metadata,
    idempotencyKey,
  };

  await client.query(
    `INSERT INTO public.ledger_journals (
       idempotency_key, reference, description, source, metadata
     ) VALUES ($1, $2, $3, 'ledger.transfer', $4::jsonb)
     ON CONFLICT (idempotency_key) DO NOTHING`,
    [idempotencyKey, reference ?? null, description ?? null, JSON.stringify(meta)]
  );

  const locked = await client.query(
    `SELECT id FROM public.ledger_journals
     WHERE idempotency_key = $1
     FOR UPDATE`,
    [idempotencyKey]
  );

  if (locked.rows.length === 0) {
    throw new AppError('Journal row missing after insert', 500, 'journal_missing');
  }

  return locked.rows[0].id;
}

async function countJournalEntries(client, journalId) {
  const r = await client.query(
    `SELECT COUNT(*)::int AS c FROM public.ledger_entries WHERE journal_id = $1`,
    [journalId]
  );
  return r.rows[0].c;
}

async function listEntryIdsForJournal(client, journalId) {
  const r = await client.query(
    `SELECT id FROM public.ledger_entries WHERE journal_id = $1 ORDER BY created_at ASC`,
    [journalId]
  );
  return r.rows.map((row) => row.id);
}

/**
 * @param {import('pg').PoolClient} client
 * @param {string} accountId
 */
async function lockAccountRow(client, accountId) {
  const r = await client.query(
    `SELECT id, kind::text AS kind, currency_code, status
     FROM public.accounts
     WHERE id = $1
     FOR UPDATE`,
    [accountId]
  );
  if (r.rows.length === 0) {
    throw new AppError(`Account not found: ${accountId}`, 404, 'account_not_found');
  }
  return r.rows[0];
}

function assertActiveAccount(row) {
  if (row.status !== 'active') {
    throw new AppError(`Account ${row.id} is not active (${row.status})`, 409, 'account_inactive');
  }
}

/**
 * @param {import('pg').PoolClient} client
 * @param {{ id: string, kind: string }} account
 * @param {bigint} amountMinor
 */
async function assertNonNegativeAfterCredit(client, account, amountMinor) {
  if (!NON_NEGATIVE_KINDS.has(/** @type {AccountKind} */ (account.kind))) {
    return;
  }

  const bal = await getNetBalanceMinor(client, account.id);
  if (bal < amountMinor) {
    throw new AppError(
      `Insufficient funds on account ${account.id}: balance ${bal}, required ${amountMinor}`,
      409,
      'insufficient_funds',
      { balance: bal.toString(), required: amountMinor.toString() }
    );
  }
}

/**
 * Asset-style balance: debits − credits.
 * @param {import('pg').PoolClient} client
 * @param {string} accountId
 */
export async function getNetBalanceMinor(client, accountId) {
  const r = await client.query(
    `SELECT
 COALESCE(SUM(debit_minor), 0)::bigint AS d,
       COALESCE(SUM(credit_minor), 0)::bigint AS c
     FROM public.ledger_entries
     WHERE account_id = $1`,
    [accountId]
  );
  const d = BigInt(r.rows[0].d);
  const c = BigInt(r.rows[0].c);
  return d - c;
}

/**
 * @param {bigint|number|string} amount
 * @returns {bigint}
 */
function normalizeAmountMinor(amount) {
  let n;
  if (typeof amount === 'bigint') {
    n = amount;
  } else if (typeof amount === 'number') {
    if (!Number.isFinite(amount) || !Number.isInteger(amount)) {
      throw new AppError('amount must be a finite integer in minor units', 400, 'invalid_amount');
    }
    n = BigInt(amount);
  } else if (typeof amount === 'string') {
    if (!/^-?\d+$/.test(amount.trim())) {
      throw new AppError('amount string must be integer minor units', 400, 'invalid_amount');
    }
    n = BigInt(amount.trim());
  } else {
    throw new AppError('amount is required', 400, 'invalid_amount');
  }

  if (n <= 0n) {
    throw new AppError('amount must be > 0', 400, 'invalid_amount');
  }

  if (n > BigInt(Number.MAX_SAFE_INTEGER)) {
    throw new AppError('amount exceeds safe processing range', 400, 'invalid_amount');
  }

  return n;
}

/**
 * Best-effort audit row; skips if table missing (dev) — check logs.
 * @param {import('pg').PoolClient} client
 */
async function insertAuditSafe(client, row) {
  try {
    await client.query(
      `INSERT INTO public.ledger_transfer_audit (
         journal_id, idempotency_key, debit_account_id, credit_account_id,
         amount_minor, currency_code, metadata
       ) VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb)`,
      [
        row.journalId,
        row.idempotencyKey,
        row.debitAccountId,
        row.creditAccountId,
        row.amountMinor,
        row.currencyCode,
        JSON.stringify(row.metadata ?? {}),
      ]
    );
  } catch (e) {
    if (e && typeof e === 'object' && /** @type {{ code?: string }} */ (e).code === '42P01') {
      logStructured('warn', { op: 'ledger.audit_skip', reason: 'table_missing', idempotencyKey: row.idempotencyKey });
      return;
    }
    throw e;
  }
}

function logStructured(level, obj) {
  const line = JSON.stringify({ ts: new Date().toISOString(), level, ...obj });
  if (level === 'error') {
    console.error(line);
  } else if (level === 'warn') {
    console.warn(line);
  } else {
    console.info(line);
  }
}
