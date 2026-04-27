/**
 * Flutterwave bank transfers (payouts) with retries on transient failures.
 * @see https://developer.flutterwave.com/docs/transfers
 */
import { createFlutterwaveClient, flutterwaveRequest } from '../lib/flutterwaveClient.js';
import { AppError } from '../utils/AppError.js';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Ledger minor units (kobo) → Flutterwave NGN main amount (2 decimal places).
 * @param {bigint|number|string} amountMinor
 * @returns {number}
 */
export function ngnMinorToFlutterwaveMainAmount(amountMinor) {
  const n = typeof amountMinor === 'bigint' ? amountMinor : BigInt(String(amountMinor));
  return Number((Number(n) / 100).toFixed(2));
}

/**
 * @param {unknown} err
 * @param {number} attempt — 1-based attempt number
 * @param {number} maxAttempts
 */
export function defaultPayoutShouldRetry(err, attempt, maxAttempts) {
  if (attempt >= maxAttempts) return false;

  const status =
    /** @type {{ flutterwaveStatus?: number; statusCode?: number }} */ (err).flutterwaveStatus ??
    (err instanceof AppError ? err.statusCode : 0);

  if (status === 429) return true;
  if (status >= 500 && status < 600) return true;

  const code = /** @type {NodeJS.ErrnoException} */ (err).code;
  if (code === 'ECONNRESET' || code === 'ETIMEDOUT' || code === 'ECONNABORTED') return true;

  if (typeof err === 'object' && err !== null && 'isAxiosError' in err && err.isAxiosError) {
    const ax = /** @type {import('axios').AxiosError} */ (err);
    if (!ax.response) return true;
  }

  return false;
}

/**
 * @template T
 * @param {() => Promise<T>} fn
 * @param {object} [opts]
 * @param {number} [opts.maxAttempts=4]
 * @param {number} [opts.baseDelayMs=600]
 * @param {number} [opts.maxDelayMs=8000]
 * @param {(err: unknown, attempt: number, max: number) => boolean} [opts.shouldRetry]
 * @returns {Promise<T>}
 */
export async function withPayoutRetries(fn, opts = {}) {
  const maxAttempts = opts.maxAttempts ?? 4;
  const baseDelayMs = opts.baseDelayMs ?? 600;
  const maxDelayMs = opts.maxDelayMs ?? 8000;
  const shouldRetry = opts.shouldRetry ?? ((e, a, m) => defaultPayoutShouldRetry(e, a, m));

  let lastErr;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (e) {
      lastErr = e;
      if (!shouldRetry(e, attempt, maxAttempts)) throw e;
      const exp = Math.min(baseDelayMs * 2 ** (attempt - 1), maxDelayMs);
      const jitter = Math.floor(Math.random() * 250);
      await sleep(exp + jitter);
    }
  }
  throw lastErr;
}

/**
 * @param {object} input
 * @param {string} input.accountBank - Nigerian bank code (e.g. "044").
 * @param {string} input.accountNumber
 * @param {number|string} input.amount - Amount in main currency unit (NGN).
 * @param {string} input.currency - Default NGN.
 * @param {string} input.reference - Unique per payout (your idempotency key).
 * @param {string} input.narration
 * @param {string} [input.callbackUrl]
 * @param {string} [input.debitCurrency]
 * @param {Record<string, unknown>} [input.meta]
 * @param {object} [retryOptions] - forwarded to withPayoutRetries
 */
function normalizeRetryOptions(retryOptions) {
  if (retryOptions == null || typeof retryOptions !== 'object') return undefined;
  const maxAttempts = Math.min(
    10,
    Math.max(1, Number(/** @type {{ maxAttempts?: number }} */ (retryOptions).maxAttempts) || 4)
  );
  const baseDelayMs = Math.min(
    30_000,
    Math.max(100, Number(/** @type {{ baseDelayMs?: number }} */ (retryOptions).baseDelayMs) || 600)
  );
  const maxDelayMs = Math.min(
    60_000,
    Math.max(baseDelayMs, Number(/** @type {{ maxDelayMs?: number }} */ (retryOptions).maxDelayMs) || 8000)
  );
  return {
    maxAttempts,
    baseDelayMs,
    maxDelayMs,
    shouldRetry: /** @type {{ shouldRetry?: typeof defaultPayoutShouldRetry }} */ (retryOptions)
      .shouldRetry,
  };
}

export async function initiateBankPayout(input, retryOptions) {
  const i = /** @type {Record<string, unknown>} */ (input);
  const accountBank = i.accountBank ?? i.account_bank;
  const accountNumber = i.accountNumber ?? i.account_number;
  const amount = i.amount;
  const currency = (i.currency ?? 'NGN').toString();
  const reference = i.reference;
  const narration = i.narration;
  const callbackUrl = i.callbackUrl ?? i.callback_url;
  const debitCurrency = i.debitCurrency ?? i.debit_currency;
  const meta = i.meta;

  if (!accountBank || !accountNumber || amount === undefined || !reference || !narration) {
    throw new AppError('Missing required payout fields', 400, 'validation');
  }

  const body = {
    account_bank: String(accountBank),
    account_number: String(accountNumber),
    amount: typeof amount === 'string' ? Number(amount) : amount,
    currency: String(currency),
    reference: String(reference),
    narration: String(narration),
    ...(callbackUrl && { callback_url: callbackUrl }),
    ...(debitCurrency && { debit_currency: debitCurrency }),
    ...(meta && Object.keys(meta).length > 0 && { meta }),
  };

  if (!Number.isFinite(body.amount) || body.amount <= 0) {
    throw new AppError('amount must be a positive number', 400, 'validation');
  }

  return withPayoutRetries(
    async () => {
      const client = createFlutterwaveClient();
      const data = await flutterwaveRequest(client, 'POST', '/transfers', body);
      return {
        ok: true,
        reference,
        raw: data,
        transferId: data?.data?.id,
        status: data?.data?.status,
      };
    },
    normalizeRetryOptions(retryOptions)
  );
}

/**
 * Verify transfer status by id (optional reconciliation).
 * @param {string|number} transferId
 */
export async function getTransferById(transferId) {
  const client = createFlutterwaveClient();
  const data = await flutterwaveRequest(client, 'GET', `/transfers/${transferId}`);
  return data;
}
