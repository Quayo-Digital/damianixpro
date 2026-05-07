import { supabase } from '@/integrations/supabase/client';

/** Default org from migrations when no scoped org exists yet. */
export const DEFAULT_ORG_ID = '00000000-0000-0000-0000-000000000001';

/** Match `services/property/api/mutations.ts` — keeps imports under same RLS-visible org. */
export async function resolveOrganizationIdForPortfolio(ownerId: string): Promise<string> {
  try {
    const { data: ownerProps } = await supabase
      .from('properties')
      .select('organization_id')
      .eq('owner_id', ownerId)
      .not('organization_id', 'is', null)
      .order('created_at', { ascending: false })
      .limit(1);

    const firstOrg = ownerProps?.[0]?.organization_id as string | undefined;
    if (firstOrg) return firstOrg;
  } catch {
    /* ignore */
  }

  try {
    const { data: orgs } = await supabase.from('organizations').select('id').limit(1);
    const oid = orgs?.[0]?.id as string | undefined;
    if (oid) return oid;
  } catch {
    /* ignore */
  }

  return DEFAULT_ORG_ID;
}

export function toDbPropertyStatus(status: string | null | undefined): string | null {
  if (!status) return null;
  const normalized = status.trim().toUpperCase().replace(/\s+/g, '_');
  switch (normalized) {
    case 'AVAILABLE':
    case 'RENTED':
    case 'SOLD':
    case 'UNDER_MAINTENANCE':
    case 'UNDER_CONTRACT':
      return normalized;
    default:
      return status.trim() || null;
  }
}
