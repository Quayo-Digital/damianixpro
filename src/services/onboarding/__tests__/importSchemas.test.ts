import { describe, expect, it } from 'vitest';
import {
  propertyImportRowSchema,
  tenantImportRowSchema,
  validateTenantPropertyLink,
} from '../importSchemas';

describe('propertyImportRowSchema', () => {
  it('accepts a minimal valid property row', () => {
    const r = propertyImportRowSchema.parse({
      migration_external_ref: 'P-1',
      name: 'Block A',
      address: '1 Main St',
      city: 'Lagos',
      state: 'Lagos',
      status: 'AVAILABLE',
    });
    expect(r.name).toBe('Block A');
    expect(r.migration_external_ref).toBe('P-1');
  });

  it('rejects missing name', () => {
    const res = propertyImportRowSchema.safeParse({ migration_external_ref: 'X' });
    expect(res.success).toBe(false);
  });
});

describe('tenantImportRowSchema', () => {
  it('accepts a tenant with property ref', () => {
    const r = tenantImportRowSchema.parse({
      email: 'a@b.co',
      property_external_ref: 'P-1',
      rent_amount: 100000,
    });
    expect(r.email).toBe('a@b.co');
    expect(validateTenantPropertyLink(r)).toBeNull();
  });

  it('rejects invalid email', () => {
    expect(
      tenantImportRowSchema.safeParse({ email: 'bad', property_external_ref: 'x' }).success
    ).toBe(false);
  });

  it('requires property link fields', () => {
    const r = tenantImportRowSchema.parse({ email: 'ok@example.com' });
    expect(validateTenantPropertyLink(r)).not.toBeNull();
  });
});
