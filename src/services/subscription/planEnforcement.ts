import { supabase } from '@/integrations/supabase/client';
import { subscriptionGrantsOwnerPaidAccess } from '@/services/subscription/subscriptionEntitlements';

export type CanonicalPlan = 'free' | 'pro' | 'business' | 'enterprise' | 'white_label';

export type SubscriptionEntitlements = {
  canonicalPlan: CanonicalPlan;
  sourceTier: string;
  propertyLimit: number | 'unlimited';
  advancedFeaturesEnabled: boolean;
  grandfathered: boolean;
};

export type OwnerPlanDiagnostic = {
  ownerId: string;
  ownerName: string;
  ownerEmail: string;
  effectivePlan: CanonicalPlan;
  sourceTier: string;
  propertyLimit: number | 'unlimited';
  currentPropertyCount: number;
  grandfathered: boolean;
};

function toCanonicalPlan(tierRaw: string | null | undefined): CanonicalPlan {
  const tier = String(tierRaw || '').toLowerCase();
  if (tier === 'free') return 'free';
  if (tier === 'starter' || tier === 'pro') return 'pro';
  if (tier === 'professional' || tier === 'business') return 'business';
  if (tier === 'enterprise') return 'enterprise';
  if (tier === 'white_label' || tier === 'white-label') return 'white_label';
  return 'free';
}

function hasAdvancedFeaturesForPlan(plan: CanonicalPlan): boolean {
  return plan === 'business' || plan === 'enterprise' || plan === 'white_label';
}

function parsePropertyLimitFromJson(limits: unknown): number | 'unlimited' {
  if (!limits || typeof limits !== 'object') return 'unlimited';
  const v = (limits as { properties?: unknown }).properties;
  if (v === 'unlimited') return 'unlimited';
  const n = Number(v);
  if (Number.isFinite(n) && n > 0) return Math.floor(n);
  return 'unlimited';
}

/**
 * Backward compatible resolver:
 * - no active row => grandfathered entitlements (no hard cap breakage)
 * - active row => enforce plan limits/features
 */
export async function resolveSubscriptionEntitlements(
  userId: string
): Promise<SubscriptionEntitlements> {
  const { data, error } = await supabase
    .from('user_subscriptions')
    .select(
      `
      status,
      trial_end,
      subscription_plans (
        tier,
        limits
      )
    `
    )
    .eq('user_id', userId)
    .in('status', ['active', 'trialing'])
    .order('created_at', { ascending: false })
    .limit(1);

  if (error) throw error;
  const row = data?.[0] as
    | {
        status?: string | null;
        trial_end?: string | null;
        subscription_plans?: { tier?: string | null; limits?: unknown } | null;
      }
    | undefined;

  if (
    !row ||
    !subscriptionGrantsOwnerPaidAccess({ status: row?.status as any, trial_end: row?.trial_end })
  ) {
    return {
      canonicalPlan: 'enterprise',
      sourceTier: 'legacy_grandfathered',
      propertyLimit: 'unlimited',
      advancedFeaturesEnabled: true,
      grandfathered: true,
    };
  }

  const sourceTier = row.subscription_plans?.tier || 'free';
  const canonicalPlan = toCanonicalPlan(sourceTier);
  const propertyLimit = parsePropertyLimitFromJson(row.subscription_plans?.limits);
  return {
    canonicalPlan,
    sourceTier,
    propertyLimit,
    advancedFeaturesEnabled: hasAdvancedFeaturesForPlan(canonicalPlan),
    grandfathered: false,
  };
}

export async function assertWithinPropertyLimit(ownerId: string): Promise<void> {
  const ent = await resolveSubscriptionEntitlements(ownerId);
  if (ent.propertyLimit === 'unlimited') return;

  const { count, error } = await supabase
    .from('properties')
    .select('id', { count: 'exact', head: true })
    .eq('owner_id', ownerId);
  if (error) throw error;

  const current = count || 0;
  if (current >= ent.propertyLimit) {
    throw new Error(
      `Plan limit reached: ${ent.canonicalPlan.toUpperCase()} allows up to ${ent.propertyLimit} properties. Upgrade to continue.`
    );
  }
}

export async function fetchOwnerPlanDiagnostics(): Promise<OwnerPlanDiagnostic[]> {
  const { data: ownerRoles, error: ownerErr } = await supabase
    .from('user_roles')
    .select('user_id')
    .eq('role', 'owner');
  if (ownerErr) throw ownerErr;

  const ownerIds = [...new Set((ownerRoles || []).map((r) => String(r.user_id)).filter(Boolean))];
  if (!ownerIds.length) return [];

  const { data: profiles, error: profileErr } = await supabase
    .from('profiles')
    .select('id,email,first_name,last_name')
    .in('id', ownerIds);
  if (profileErr) throw profileErr;

  const { data: properties, error: propErr } = await supabase
    .from('properties')
    .select('owner_id')
    .in('owner_id', ownerIds);
  if (propErr) throw propErr;

  const { data: subs, error: subErr } = await supabase
    .from('user_subscriptions')
    .select(
      `
      user_id,
      status,
      trial_end,
      created_at,
      subscription_plans (
        tier,
        limits
      )
    `
    )
    .in('user_id', ownerIds)
    .in('status', ['active', 'trialing'])
    .order('created_at', { ascending: false });
  if (subErr) throw subErr;

  const profileById = new Map(
    (profiles || []).map((p) => [
      String(p.id),
      {
        email: String(p.email || ''),
        name: `${String(p.first_name || '').trim()} ${String(p.last_name || '').trim()}`.trim(),
      },
    ])
  );

  const propertyCountByOwner = new Map<string, number>();
  for (const p of properties || []) {
    const oid = String(p.owner_id || '');
    if (!oid) continue;
    propertyCountByOwner.set(oid, (propertyCountByOwner.get(oid) || 0) + 1);
  }

  const latestSubByOwner = new Map<string, (typeof subs)[number]>();
  for (const s of subs || []) {
    const oid = String(s.user_id || '');
    if (!oid) continue;
    if (!latestSubByOwner.has(oid)) latestSubByOwner.set(oid, s);
  }

  const out: OwnerPlanDiagnostic[] = ownerIds.map((ownerId) => {
    const profile = profileById.get(ownerId);
    const row = latestSubByOwner.get(ownerId) as
      | {
          status?: string | null;
          trial_end?: string | null;
          subscription_plans?: { tier?: string | null; limits?: unknown } | null;
        }
      | undefined;

    let ent: SubscriptionEntitlements;
    if (
      !row ||
      !subscriptionGrantsOwnerPaidAccess({ status: row.status as any, trial_end: row.trial_end })
    ) {
      ent = {
        canonicalPlan: 'enterprise',
        sourceTier: 'legacy_grandfathered',
        propertyLimit: 'unlimited',
        advancedFeaturesEnabled: true,
        grandfathered: true,
      };
    } else {
      const sourceTier = row.subscription_plans?.tier || 'free';
      const canonicalPlan = toCanonicalPlan(sourceTier);
      ent = {
        canonicalPlan,
        sourceTier,
        propertyLimit: parsePropertyLimitFromJson(row.subscription_plans?.limits),
        advancedFeaturesEnabled: hasAdvancedFeaturesForPlan(canonicalPlan),
        grandfathered: false,
      };
    }

    return {
      ownerId,
      ownerName: profile?.name || 'Owner',
      ownerEmail: profile?.email || '—',
      effectivePlan: ent.canonicalPlan,
      sourceTier: ent.sourceTier,
      propertyLimit: ent.propertyLimit,
      currentPropertyCount: propertyCountByOwner.get(ownerId) || 0,
      grandfathered: ent.grandfathered,
    };
  });

  out.sort((a, b) => b.currentPropertyCount - a.currentPropertyCount);
  return out;
}
