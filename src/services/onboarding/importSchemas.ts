import { z } from 'zod';

const emptyToUndef = (v: unknown) => (typeof v === 'string' && v.trim() === '' ? undefined : v);

/** Row after header normalization (underscore keys, lower case). */
export const propertyImportRowSchema = z.preprocess(
  (row) => row,
  z.object({
    migration_external_ref: z.preprocess(emptyToUndef, z.string().trim().min(1).optional()),
    name: z.string().trim().min(1, 'Property name is required'),
    address: z.preprocess(emptyToUndef, z.string().trim().optional()),
    city: z.preprocess(emptyToUndef, z.string().trim().optional()),
    state: z.preprocess(emptyToUndef, z.string().trim().optional()),
    status: z.preprocess(emptyToUndef, z.string().trim().optional()),
  })
);

export type PropertyImportRow = z.infer<typeof propertyImportRowSchema>;

export const tenantImportRowSchema = z.preprocess(
  (row) => row,
  z.object({
    email: z.string().trim().toLowerCase().email('Valid email is required'),
    first_name: z.preprocess(emptyToUndef, z.string().trim().optional()),
    last_name: z.preprocess(emptyToUndef, z.string().trim().optional()),
    phone: z.preprocess(emptyToUndef, z.string().trim().optional()),
    property_external_ref: z.preprocess(emptyToUndef, z.string().trim().optional()),
    property_name: z.preprocess(emptyToUndef, z.string().trim().optional()),
    rent_amount: z.preprocess(emptyToUndef, z.coerce.number().nonnegative().optional()),
    deposit_amount: z.preprocess(emptyToUndef, z.coerce.number().nonnegative().optional()),
    start_date: z.preprocess(emptyToUndef, z.string().trim().optional()),
    end_date: z.preprocess(emptyToUndef, z.string().trim().optional()),
  })
);

export type TenantImportRow = z.infer<typeof tenantImportRowSchema>;

export function validateTenantPropertyLink(row: TenantImportRow): string | null {
  if (row.property_external_ref?.trim()) return null;
  if (row.property_name?.trim()) return null;
  return 'Provide property_external_ref or property_name to link the tenant';
}
