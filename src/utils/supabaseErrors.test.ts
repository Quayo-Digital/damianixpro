import { describe, expect, it } from 'vitest';
import { formatSupabaseAuthSignUpError, isMissingSupabaseRelationError } from './supabaseErrors';

describe('isMissingSupabaseRelationError', () => {
  it('detects PGRST205 schema cache message', () => {
    expect(
      isMissingSupabaseRelationError({
        code: 'PGRST205',
        message: "Could not find the table 'public.property_tenants' in the schema cache",
      })
    ).toBe(true);
  });

  it('returns false for generic permission errors', () => {
    expect(
      isMissingSupabaseRelationError({
        code: '42501',
        message: 'permission denied for table tenants',
      })
    ).toBe(false);
  });
});

describe('formatSupabaseAuthSignUpError', () => {
  it('maps weak password style messages', () => {
    expect(
      formatSupabaseAuthSignUpError({
        status: 422,
        message: 'Password should be at least 6 characters',
      })
    ).toMatch(/password|requirements/i);
  });
});
