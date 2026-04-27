/**
 * Wallet operations — all balance changes go through double-entry ledger (no direct balance column updates).
 *
 * Posting convention matches ledgerService:
 * - Wallet balance (minor units) = SUM(debit_minor) - SUM(credit_minor)
 * - Credit from Flutterwave settlement: Dr user wallet, Cr clearing (FW_CLEARING)
 * - Rent payment: Dr landlord wallet, Cr tenant wallet
 */
import { pool, withTransaction } from '../db/pool.js';
import { env } from '../config/env.js';
import { AppError } from '../utils/AppError.js';
import { transfer, getNetBalanceMinor } from './ledgerService.js';

/**
 * @param {import('pg').PoolClient} client
 * @param {string} userId
 */
async function assertUserExists(client, userId) {
  const r = await client.query(`SELECT 1 FROM public.${env.fintechUserTable} WHERE id = $1`, [userId]);
  if (!r.rowCount) {
    throw new AppError(
      `User not found in public.${env.fintechUserTable} (sync from auth.users / profiles first)`,
      404,
      'user_missing'
    );
  }
}

/**
 * @param {import('pg').PoolClient} client
 */
async function resolveClearingAccountId(client) {
  if (env.flutterwaveClearingAccountId) {
    return env.flutterwaveClearingAccountId;
  }
  const r = await client.query(
    `SELECT id FROM public.accounts WHERE code = 'FW_CLEARING' AND status = 'active' LIMIT 1`
  );
  if (!r.rows[0]) {
    throw new AppError(
      'Clearing account missing: seed FW_CLEARING or set FLUTTERWAVE_CLEARING_ACCOUNT_ID',
      503,
      'clearing_not_configured'
    );
  }
  return r.rows[0].id;
}

/**
 * Serialize wallet creation per (user, currency) to avoid duplicate rows without a DB unique index.
 * @param {import('pg').PoolClient} client
 * @param {string} key
 */
async function advisoryLockWalletCreate(client, key) {
  await client.query(`SELECT pg_advisory_xact_lock(hashtext($1::text))`, [key]);
}

/**
 * Get or create primary wallet for a user. Idempotent.
 * @param {string} userId - public.fintech_auth_users.id or public.users.id (auth user UUID)
 * @param {string} [currencyCode='NGN']
 * @param {import('pg').PoolClient} [client]
 * @returns {Promise<{ accountId: string, created: boolean }>}
 */
export async function getOrCreateWalletForUser(userId, currencyCode = 'NGN', client) {
  const run = async (c) => {
    await assertUserExists(c, userId);
    const cc = String(currencyCode).trim().toUpperCase().slice(0, 3);

    await advisoryLockWalletCreate(c, `wallet:${userId}:${cc}`);

    const sel = await c.query(
      `SELECT id FROM public.accounts
       WHERE owner_user_id = $1
         AND kind = 'wallet'::account_kind
         AND currency_code = $2
         AND status = 'active'
       LIMIT 1`,
      [userId, cc]
    );
    if (sel.rows[0]) {
      return { accountId: sel.rows[0].id, created: false };
    }

    const ins = await c.query(
      `INSERT INTO public.accounts (owner_user_id, kind, currency_code, name, status)
       VALUES ($1, 'wallet', $2, $3, 'active')
       RETURNING id`,
      [userId, cc, `Wallet ${cc}`]
    );
    return { accountId: ins.rows[0].id, created: true };
  };

  if (client) {
    return run(client);
  }
  return withTransaction(run);
}

/**
 * @param {string} accountId
 * @param {import('pg').PoolClient} [client]
 */
export async function getWalletBalanceMinor(accountId, client) {
  if (client) {
    return getNetBalanceMinor(client, accountId);
  }
  const c = await pool.connect();
  try {
    return await getNetBalanceMinor(c, accountId);
  } finally {
    c.release();
  }
}

/**
 * Credit user wallet when Flutterwave funds settle (e.g. after webhook + verify).
 * Ledger: Dr wallet (increase), Cr clearing (release from suspense).
 * Treasury: fund `FW_CLEARING` via a separate settlement journal when Flutterwave credits your master balance; otherwise the clearing leg is one-sided. This function only posts wallet vs clearing.
 *
 * @param {object} p
 * @param {string} p.userId
 * @param {bigint|number|string} p.amountMinor
 * @param {string} p.idempotencyKey - e.g. `fw-charge-${transactionId}`
 * @param {string} [p.currencyCode='NGN']
 * @param {string} [p.reference]
 * @param {string} [p.description]
 * @param {Record<string, unknown>} [p.metadata]
 * @param {import('pg').PoolClient} [outerClient]
 *
 * Amount must be in ledger minor units (e.g. kobo). If Flutterwave returns major units, convert before calling.
 * Webhook flow: verify transaction server-side, read `meta.user_id` (set during payment init), then call this once per charge id.
 */
export async function creditWalletFromFlutterwaveSettlement(p, outerClient) {
  const {
    userId,
    amountMinor,
    idempotencyKey,
    currencyCode = 'NGN',
    reference,
    description,
    metadata = {},
  } = p;

  if (!userId || !idempotencyKey) {
    throw new AppError('userId and idempotencyKey are required', 400, 'validation');
  }

  const run = async (client) => {
    const { accountId: walletId } = await getOrCreateWalletForUser(userId, currencyCode, client);
    const clearingId = await resolveClearingAccountId(client);

    const meta = {
      ...metadata,
      source: 'flutterwave',
      userId,
    };

    return transfer(
      {
        debitAccountId: walletId,
        creditAccountId: clearingId,
        amount: amountMinor,
        idempotencyKey,
        currencyCode: String(currencyCode).trim().toUpperCase().slice(0, 3),
        reference: reference ?? idempotencyKey,
        description: description ?? 'Wallet credit — Flutterwave settlement',
        metadata: meta,
      },
      client
    );
  };

  if (outerClient) {
    return run(outerClient);
  }
  return withTransaction(run);
}

/**
 * Debit tenant wallet and credit landlord wallet (rent). No direct balance fields.
 *
 * @param {object} p
 * @param {string} p.tenantUserId
 * @param {string} p.landlordUserId
 * @param {bigint|number|string} p.amountMinor
 * @param {string} p.idempotencyKey
 * @param {string} [p.currencyCode='NGN']
 * @param {string} [p.reference]
 * @param {string} [p.description]
 * @param {Record<string, unknown>} [p.metadata]
 * @param {import('pg').PoolClient} [outerClient]
 */
export async function debitWalletForRentPayment(p, outerClient) {
  const {
    tenantUserId,
    landlordUserId,
    amountMinor,
    idempotencyKey,
    currencyCode = 'NGN',
    reference,
    description,
    metadata = {},
  } = p;

  if (!tenantUserId || !landlordUserId || !idempotencyKey) {
    throw new AppError('tenantUserId, landlordUserId, and idempotencyKey are required', 400, 'validation');
  }
  if (tenantUserId === landlordUserId) {
    throw new AppError('tenant and landlord must differ', 400, 'validation');
  }

  const run = async (client) => {
    const { accountId: tenantWallet } = await getOrCreateWalletForUser(tenantUserId, currencyCode, client);
    const { accountId: landlordWallet } = await getOrCreateWalletForUser(landlordUserId, currencyCode, client);

    const meta = {
      ...metadata,
      kind: 'rent_payment',
      tenantUserId,
      landlordUserId,
    };

    return transfer(
      {
        debitAccountId: landlordWallet,
        creditAccountId: tenantWallet,
        amount: amountMinor,
        idempotencyKey,
        currencyCode: String(currencyCode).trim().toUpperCase().slice(0, 3),
        reference: reference ?? idempotencyKey,
        description: description ?? 'Rent payment — wallet to wallet',
        metadata: meta,
      },
      client
    );
  };

  if (outerClient) {
    return run(outerClient);
  }
  return withTransaction(run);
}

/**
 * Resolve wallet account id for user (no create).
 * @param {string} userId
 * @param {string} [currencyCode='NGN']
 */
export async function findWalletAccountForUser(userId, currencyCode = 'NGN') {
  const cc = String(currencyCode).trim().toUpperCase().slice(0, 3);
  const r = await pool.query(
    `SELECT id FROM public.accounts
     WHERE owner_user_id = $1 AND kind = 'wallet'::account_kind AND currency_code = $2 AND status = 'active'
     LIMIT 1`,
    [userId, cc]
  );
  return r.rows[0]?.id ?? null;
}
