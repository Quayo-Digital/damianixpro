import { supabaseAdmin } from '../supabaseClient.mjs';

function toCanonicalPlan(tierRaw) {
  const tier = String(tierRaw || '').toLowerCase();
  if (tier === 'free') return 'free';
  if (tier === 'starter' || tier === 'pro') return 'pro';
  if (tier === 'professional' || tier === 'business') return 'business';
  if (tier === 'enterprise') return 'enterprise';
  if (tier === 'white_label' || tier === 'white-label') return 'white_label';
  return 'free';
}

function planLevel(plan) {
  if (plan === 'free') return 0;
  if (plan === 'pro') return 1;
  if (plan === 'business') return 2;
  if (plan === 'enterprise') return 3;
  if (plan === 'white_label') return 4;
  return 0;
}

function grantsPaidAccess(sub) {
  if (!sub) return false;
  if (sub.status === 'active') return true;
  if (sub.status !== 'trialing') return false;
  if (!sub.trial_end) return true;
  return new Date(sub.trial_end).getTime() > Date.now();
}

async function resolveUserPlan(userId) {
  const { data, error } = await supabaseAdmin
    .from('user_subscriptions')
    .select(
      `
      status,
      trial_end,
      subscription_plans (
        tier
      )
    `
    )
    .eq('user_id', userId)
    .in('status', ['active', 'trialing'])
    .order('created_at', { ascending: false })
    .limit(1);

  if (error) throw error;
  const row = data?.[0];

  // Backward compatibility: users without a row are grandfathered (do not break existing users).
  if (!row || !grantsPaidAccess(row)) {
    return { plan: 'white_label', source: 'legacy_grandfathered' };
  }
  return {
    plan: toCanonicalPlan(row.subscription_plans?.tier),
    source: String(row.subscription_plans?.tier || 'free'),
  };
}

/**
 * Middleware to enforce a minimum subscription plan on server routes.
 * Requires `requireSupabaseJwt` first.
 */
export function createRequireMinimumPlan(minPlan = 'pro') {
  return async function requireMinimumPlan(req, res, next) {
    try {
      if (!req.auth?.sub) return res.status(401).json({ error: 'UNAUTHORIZED' });
      const resolved = await resolveUserPlan(req.auth.sub);
      req.subscriptionPlan = resolved.plan;
      req.subscriptionPlanSource = resolved.source;
      if (planLevel(resolved.plan) < planLevel(minPlan)) {
        return res.status(402).json({
          error: 'PLAN_UPGRADE_REQUIRED',
          message: `This feature requires at least ${minPlan.toUpperCase()} plan.`,
          current_plan: resolved.plan,
          required_plan: minPlan,
        });
      }
      return next();
    } catch (e) {
      console.warn('[subscription entitlement middleware]', e?.message || e);
      // Fail-open to avoid regressions from transient DB issues.
      return next();
    }
  };
}

