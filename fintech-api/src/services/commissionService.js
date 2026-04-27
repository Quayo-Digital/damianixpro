/**
 * SaaS commission engine: derive rent/escrow commission from landlord subscription tier & plan limits.
 * Rates are in basis points (100 bps = 1%). Capped at COMMISSION_MAX_BPS (default 1000 = 10%).
 */
import { pool } from '../db/pool.js';
import { env } from '../config/env.js';

/** Fallback when plan.limits has no rent_escrow_commission_bps (0–10% tier ladder). */
export const DEFAULT_TIER_COMMISSION_BPS = Object.freeze({
  free: 1000,
  starter: 700,
  professional: 400,
  enterprise: 0,
});

const NORM_TIERS = new Set(['free', 'starter', 'professional', 'enterprise']);

/**
 * @param {number} bps
 */
export function clampCommissionBps(bps) {
  const max = env.commissionMaxBps ?? 1000;
  const n = Math.trunc(Number(bps) || 0);
  return Math.max(0, Math.min(max, n));
}

/**
 * @param {unknown} limits
 * @returns {number | null}
 */
export function readCommissionBpsFromPlanLimits(limits) {
  if (!limits || typeof limits !== 'object') return null;
  const raw = /** @type {Record<string, unknown>} */ (limits).rent_escrow_commission_bps;
  if (raw === undefined || raw === null) return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

/**
 * @param {string} tier
 */
export function tierFallbackCommissionBps(tier) {
  const t = String(tier || 'free').toLowerCase();
  const key = NORM_TIERS.has(t) ? t : 'free';
  return DEFAULT_TIER_COMMISSION_BPS[/** @type {'free'|'starter'|'professional'|'enterprise'} */ (key)];
}

/**
 * @param {import('pg').Pool | import('pg').PoolClient} executor
 * @param {string} landlordUserId
 */
export async function fetchLandlordActiveSubscription(landlordUserId, executor = pool) {
  const r = await executor.query(
    `SELECT
       us.plan_id,
       us.tier AS subscription_tier,
       us.status AS subscription_status,
       sp.tier AS plan_tier,
       sp.name AS plan_name,
       sp.limits AS plan_limits
     FROM public.user_subscriptions us
     LEFT JOIN public.subscription_plans sp ON sp.id = us.plan_id
     WHERE us.user_id = $1
       AND us.status IN ('active', 'trialing')
     ORDER BY us.created_at DESC
     LIMIT 1`,
    [landlordUserId]
  );
  return r.rows[0] ?? null;
}

/**
 * Resolve commission bps for escrow release (landlord = beneficiary).
 *
 * Priority:
 * 1. `subscription_plans.limits.rent_escrow_commission_bps` when present (clamped)
 * 2. Tier fallback map (free/starter/professional/enterprise)
 * 3. No row → treat as `free` tier
 *
 * @param {string} landlordUserId
 * @param {import('pg').PoolClient} [client] - use within same transaction as release
 * @returns {Promise<{ commissionBps: number, tier: string, planId: string | null, planName: string | null, source: 'plan_limits' | 'tier_fallback' | 'no_subscription' }>}
 */
export async function resolveCommissionForLandlord(landlordUserId, client) {
  const exec = client ?? pool;
  const row = await fetchLandlordActiveSubscription(landlordUserId, exec);

  if (!row) {
    const bps = clampCommissionBps(tierFallbackCommissionBps('free'));
    return {
      commissionBps: bps,
      tier: 'free',
      planId: null,
      planName: null,
      source: 'no_subscription',
    };
  }

  const limits = row.plan_limits;
  const fromLimits = readCommissionBpsFromPlanLimits(limits);
  if (fromLimits != null) {
    return {
      commissionBps: clampCommissionBps(fromLimits),
      tier: String(row.plan_tier || row.subscription_tier || 'free').toLowerCase(),
      planId: row.plan_id ?? null,
      planName: row.plan_name ?? null,
      source: 'plan_limits',
    };
  }

  const tier = String(row.plan_tier || row.subscription_tier || 'free').toLowerCase();
  return {
    commissionBps: clampCommissionBps(tierFallbackCommissionBps(tier)),
    tier,
    planId: row.plan_id ?? null,
    planName: row.plan_name ?? null,
    source: 'tier_fallback',
  };
}

/**
 * Split gross rent held in escrow into platform commission and landlord net (minor units, integer math).
 *
 * @param {bigint|number|string} amountMinorGross
 * @param {number} commissionBps - already clamped
 */
export function computeRentSplit(amountMinorGross, commissionBps) {
  const gross = BigInt(String(amountMinorGross));
  const bps = BigInt(clampCommissionBps(commissionBps));
  const commissionMinor = Number((gross * bps) / 10000n);
  const netToLandlordMinor = Number(gross) - commissionMinor;
  return {
    grossMinor: Number(gross),
    commissionMinor,
    netToLandlordMinor,
    commissionBps: Number(bps),
  };
}
