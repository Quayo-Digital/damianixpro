import { describe, expect, it } from 'vitest';
import { evaluateRoleScreening } from '../roleScreeningPolicy';

const baseKyc = {
  bvn_verified: true as const,
  nin_verified: false as const,
  phone_verified: true as const,
};

describe('evaluateRoleScreening', () => {
  it('waives all checks when waived flag is set', () => {
    expect(
      evaluateRoleScreening({
        role: 'vendor',
        kyc: null,
        waived: true,
        hasTenantRecord: false,
      }).passed
    ).toBe(true);
  });

  it('requires identity for owner after waiver false', () => {
    const r = evaluateRoleScreening({
      role: 'owner',
      kyc: { ...baseKyc, bvn_verified: false, nin_verified: false },
      waived: false,
      hasTenantRecord: false,
    });
    expect(r.passed).toBe(false);
    expect(r.missing.some((m) => m.includes('BVN') || m.includes('NIN'))).toBe(true);
  });

  it('passes owner with BVN + phone', () => {
    expect(
      evaluateRoleScreening({
        role: 'owner',
        kyc: baseKyc,
        waived: false,
        hasTenantRecord: false,
      }).passed
    ).toBe(true);
  });

  it('requires CAC and bank for vendor', () => {
    const r = evaluateRoleScreening({
      role: 'vendor',
      kyc: { ...baseKyc, business_verified: false, bank_account_verified: false },
      waived: false,
      hasTenantRecord: false,
    });
    expect(r.passed).toBe(false);
    expect(r.missing.length).toBeGreaterThanOrEqual(2);
  });

  it('ignores tenant pipeline when no tenant record', () => {
    expect(
      evaluateRoleScreening({
        role: 'tenant',
        kyc: baseKyc,
        waived: false,
        tenantScreeningStatus: null,
        hasTenantRecord: false,
      }).passed
    ).toBe(true);
  });

  it('requires completed tenant screening when tenant record exists', () => {
    const r = evaluateRoleScreening({
      role: 'tenant',
      kyc: baseKyc,
      waived: false,
      tenantScreeningStatus: 'pending',
      hasTenantRecord: true,
    });
    expect(r.passed).toBe(false);
  });
});
