import dotenv from 'dotenv';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
// Repo root .env (shared with Vite app), then fintech-api/.env overrides.
dotenv.config({ path: resolve(__dirname, '../../../.env') });
dotenv.config({ path: resolve(__dirname, '../../.env'), override: true });

function required(name, value) {
  if (value === undefined || value === '') {
    throw new Error(`Missing required env: ${name}`);
  }
  return value;
}

const nodeEnv = process.env.NODE_ENV || 'development';
const isProd = nodeEnv === 'production';

/** Ledger user FK table: must match a real table (SQL identifier allowlist only). */
const FINTECH_USER_TABLES = new Set(['fintech_auth_users', 'users']);
function resolveFintechUserTable(raw) {
  const t = (raw || 'fintech_auth_users').trim();
  return FINTECH_USER_TABLES.has(t) ? t : 'fintech_auth_users';
}

export const env = {
  nodeEnv,
  isProd,
  port: Number(process.env.PORT) || 4101,
  corsOrigin: process.env.CORS_ORIGIN || '*',

  databaseUrl: process.env.DATABASE_URL || '',
  /**
   * Table storing auth-aligned user ids for wallet/escrow FK checks.
   * Property app: use `fintech_auth_users` (see supabase migration fintech_auth_users_and_rent_payment_link).
   * Greenfield fintech schema: can use `users` from fintech_wallet_ledger_schema.sql.
   */
  fintechUserTable: resolveFintechUserTable(process.env.FINTECH_USER_TABLE),
  pg: {
    host: process.env.PGHOST,
    port: process.env.PGPORT ? Number(process.env.PGPORT) : undefined,
    user: process.env.PGUSER,
    password: process.env.PGPASSWORD,
    database: process.env.PGDATABASE,
  },

  jwtSecret: required('JWT_SECRET', process.env.JWT_SECRET),
  jwtIssuer: process.env.JWT_ISSUER || 'damianixpro-fintech',
  /** When set, JWT `aud` must match */
  jwtAudience: process.env.JWT_AUDIENCE || '',
  /** Seconds of clock skew accepted for `iat` / `exp` (jsonwebtoken clockTolerance) */
  jwtClockToleranceSec: Math.min(300, Math.max(0, Number(process.env.JWT_CLOCK_TOLERANCE_SEC) || 30)),

  /** Only for local dev — must be false in production */
  authDevBypass: !isProd && process.env.AUTH_DEV_BYPASS === 'true',
  /** Optional real UUID used as `sub` when AUTH_DEV_BYPASS is on (for DB FK tests) */
  authDevUserId: process.env.AUTH_DEV_USER_ID || '',

  rateLimitWindowMs: Math.min(3_600_000, Math.max(1000, Number(process.env.RATE_LIMIT_WINDOW_MS) || 60_000)),
  rateLimitIpMax: Math.min(50_000, Math.max(10, Number(process.env.RATE_LIMIT_IP_MAX) || 200)),
  rateLimitWebhookMax: Math.min(100_000, Math.max(50, Number(process.env.RATE_LIMIT_WEBHOOK_MAX) || 3000)),
  rateLimitSensitiveMax: Math.min(10_000, Math.max(5, Number(process.env.RATE_LIMIT_SENSITIVE_MAX) || 30)),

  flutterwaveSecretKey:
    process.env.FLUTTERWAVE_SECRET_KEY || process.env.FLW_SECRET_KEY || '',
  flutterwaveSecretHash:
    process.env.FLUTTERWAVE_SECRET_HASH || process.env.FLW_SECRET_HASH || '',
  flutterwavePublicKey:
    process.env.FLUTTERWAVE_PUBLIC_KEY || process.env.FLW_PUBLIC_KEY || '',
  flutterwaveBaseUrl:
    process.env.FLUTTERWAVE_BASE_URL || 'https://api.flutterwave.com/v3',

  /** Ledger account UUID for Flutterwave inflow (overrides lookup of code FW_CLEARING) */
  flutterwaveClearingAccountId: process.env.FLUTTERWAVE_CLEARING_ACCOUNT_ID || '',

  /** Overrides lookup of accounts.code = WITHDRAWAL_SUSPENSE */
  withdrawalSuspenseAccountId: process.env.WITHDRAWAL_SUSPENSE_ACCOUNT_ID || '',

  defaultEscrowHoldDays: Math.min(365, Math.max(0, Number(process.env.DEFAULT_ESCROW_HOLD_DAYS) || 7)),

  /** Ledger UUID for rent commission (overrides PLATFORM_REVENUE by code) */
  platformCommissionAccountId: process.env.PLATFORM_COMMISSION_ACCOUNT_ID || '',

  /** Max rent/escrow commission in bps (1000 = 10%) */
  commissionMaxBps: Math.min(10_000, Math.max(0, Number(process.env.COMMISSION_MAX_BPS) || 1000)),
};
