import { supabase } from '@/integrations/supabase/client';
import type { UserRole } from '@/contexts/auth/types';
import {
  evaluateRoleScreening,
  ROLE_SCREENING_BLOCKED_MESSAGE,
  type KycProfileLike,
  type RoleScreeningEvaluation,
} from './roleScreeningPolicy';

export { ROLE_SCREENING_BLOCKED_MESSAGE };

export type RoleScreeningContext = {
  kyc: KycProfileLike | null;
  waived: boolean;
  tenantScreeningStatus: string | null;
  hasTenantRecord: boolean;
};

async function loadScreeningContext(
  userId: string,
  role: UserRole | null
): Promise<RoleScreeningContext> {
  const [kycRes, waiverRes] = await Promise.all([
    supabase.from('kyc_profiles').select('*').eq('user_id', userId).maybeSingle(),
    supabase.from('screening_waivers').select('active').eq('user_id', userId).maybeSingle(),
  ]);

  let tenantScreeningStatus: string | null = null;
  let hasTenantRecord = false;

  if (role === 'tenant') {
    const { data: tenantRows, error: tenantErr } = await supabase
      .from('tenants')
      .select('id')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1);

    if (!tenantErr && tenantRows?.[0]?.id) {
      hasTenantRecord = true;
      const { data: scr } = await supabase
        .from('tenant_screenings')
        .select('status')
        .eq('tenant_id', tenantRows[0].id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      tenantScreeningStatus = scr?.status ?? null;
    }
  }

  return {
    kyc: (kycRes.data as KycProfileLike) ?? null,
    waived: waiverRes.data?.active === true,
    tenantScreeningStatus,
    hasTenantRecord,
  };
}

export async function getRoleScreeningEvaluation(
  userId: string,
  role: UserRole | null
): Promise<RoleScreeningEvaluation & RoleScreeningContext & { role: UserRole | null }> {
  const ctx = await loadScreeningContext(userId, role);
  const { passed, missing } = evaluateRoleScreening({
    role,
    ...ctx,
  });
  return { passed, missing, ...ctx, role };
}

/** True when the signed-in user is exempt from screening gates (platform staff). */
function actorIsPlatformAdmin(metadataRole: string | undefined): boolean {
  return metadataRole === 'admin' || metadataRole === 'super_admin';
}

/**
 * Enforce screening for monetization / trust-sensitive actions. Skips when the **current session** is admin.
 * @param subjectUserId User the check applies to (e.g. property owner when creating a property).
 * @param subjectRole Role to evaluate (e.g. `'owner'` for that user).
 */
export async function assertRoleScreeningForMonetization(
  subjectUserId: string,
  subjectRole: UserRole | null
): Promise<void> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const actorRole = session?.user?.user_metadata?.role as string | undefined;
  if (actorIsPlatformAdmin(actorRole)) return;

  if (
    !subjectRole ||
    subjectRole === 'admin' ||
    subjectRole === 'super_admin' ||
    subjectRole === 'user'
  ) {
    return;
  }

  const ctx = await loadScreeningContext(subjectUserId, subjectRole);
  const { passed } = evaluateRoleScreening({ role: subjectRole, ...ctx });
  if (!passed) {
    throw new Error(ROLE_SCREENING_BLOCKED_MESSAGE);
  }
}
