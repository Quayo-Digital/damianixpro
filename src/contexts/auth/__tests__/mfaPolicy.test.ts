import { describe, it, expect } from 'vitest';
import { roleRequiresMfa, MFA_REQUIRED_ROLES } from '../mfaPolicy';

describe('mfaPolicy', () => {
  it('lists expected privileged roles', () => {
    expect(MFA_REQUIRED_ROLES).toContain('super_admin');
    expect(MFA_REQUIRED_ROLES).toContain('admin');
    expect(MFA_REQUIRED_ROLES).toContain('owner');
    expect(MFA_REQUIRED_ROLES).toContain('manager');
  });

  it('roleRequiresMfa is true for high-privilege roles', () => {
    expect(roleRequiresMfa('super_admin')).toBe(true);
    expect(roleRequiresMfa('admin')).toBe(true);
    expect(roleRequiresMfa('owner')).toBe(true);
    expect(roleRequiresMfa('manager')).toBe(true);
  });

  it('roleRequiresMfa is false for standard roles', () => {
    expect(roleRequiresMfa('tenant')).toBe(false);
    expect(roleRequiresMfa('agent')).toBe(false);
    expect(roleRequiresMfa('vendor')).toBe(false);
    expect(roleRequiresMfa('user')).toBe(false);
    expect(roleRequiresMfa(null)).toBe(false);
  });
});
