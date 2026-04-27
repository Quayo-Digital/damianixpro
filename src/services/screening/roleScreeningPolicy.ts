import type { UserRole } from '@/contexts/auth/types';

export const ROLE_SCREENING_BLOCKED_MESSAGE =
  'Complete identity verification first. Open Verification in the sidebar to finish the required checks.';

export type KycProfileLike = {
  bvn_verified?: boolean | null;
  nin_verified?: boolean | null;
  phone_verified?: boolean | null;
  business_verified?: boolean | null;
  bank_account_verified?: boolean | null;
};

export type RoleScreeningInputs = {
  role: UserRole | null;
  kyc: KycProfileLike | null;
  waived: boolean;
  tenantScreeningStatus?: string | null;
  hasTenantRecord: boolean;
};

export type RoleScreeningEvaluation = {
  passed: boolean;
  missing: string[];
};

function identityGate(kyc: KycProfileLike | null): { ok: boolean; missing: string[] } {
  const missing: string[] = [];
  const idOk = kyc?.bvn_verified === true || kyc?.nin_verified === true;
  if (!idOk) missing.push('Verify BVN or NIN');
  if (kyc?.phone_verified !== true) missing.push('Verify phone number');
  return { ok: missing.length === 0, missing };
}

/**
 * Pure policy for role-based screening. Server/client should share this; DB row `screening_waivers` is optional bypass.
 */
export function evaluateRoleScreening(inputs: RoleScreeningInputs): RoleScreeningEvaluation {
  const { role, kyc, waived, tenantScreeningStatus, hasTenantRecord } = inputs;

  if (!role) return { passed: true, missing: [] };
  if (role === 'admin' || role === 'super_admin' || role === 'user') {
    return { passed: true, missing: [] };
  }
  if (waived) return { passed: true, missing: [] };

  const id = identityGate(kyc);
  if (!id.ok) return { passed: false, missing: id.missing };

  if (role === 'owner' || role === 'agent' || role === 'manager') {
    return { passed: true, missing: [] };
  }

  if (role === 'vendor') {
    const missing: string[] = [];
    if (kyc?.business_verified !== true) missing.push('Verify business registration (CAC)');
    if (kyc?.bank_account_verified !== true) missing.push('Verify payout bank account');
    return { passed: missing.length === 0, missing };
  }

  if (role === 'tenant') {
    if (!hasTenantRecord) return { passed: true, missing: [] };
    if (tenantScreeningStatus === 'completed') return { passed: true, missing: [] };
    if (tenantScreeningStatus === 'failed') {
      return {
        passed: false,
        missing: ['Tenant screening did not pass. Contact support or your landlord.'],
      };
    }
    return {
      passed: false,
      missing: [
        'Complete tenant screening (your landlord can initiate it from tenant management).',
      ],
    };
  }

  return { passed: true, missing: [] };
}
