/**
 * PostgREST only auto-embeds when a foreign key exists in the schema cache.
 * Some DBs define `lease_agreements` without FKs to `properties` / `tenants`,
 * which causes PGRST200 on `select=*,properties(...),tenants(...)`.
 * This module batches related rows and merges in the client.
 *
 * Some Supabase projects only have `public.leases` (no `lease_agreements`).
 * `fetchLeaseRows` falls back when `lease_agreements` is missing (42P01).
 */

import type { PostgrestError } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import type { LeaseAgreement } from '@/services/applications/types';

/** True when Postgres reports `lease_agreements` (or similar) relation missing */
export function isLeaseAgreementsRelationMissing(
  error: PostgrestError | null | undefined
): boolean {
  if (!error) return false;
  if (error.code === '42P01') return true;
  const m = (error.message || '').toLowerCase();
  return m.includes('does not exist') && m.includes('lease_agreements');
}

/** RLS denied, JWT invalid/expired, or PostgREST auth errors — try another source instead of hard-failing the UI. */
function isLeaseAccessDeniedOrAuthError(error: PostgrestError | null | undefined): boolean {
  if (!error) return false;
  const status = (error as { status?: number }).status;
  if (status === 401 || status === 403) return true;
  if (error.code === '42501' || error.code === 'PGRST301') return true;
  const m = (error.message || '').toLowerCase();
  return m.includes('jwt') || m.includes('permission denied') || m.includes('not authorized');
}

export type LeaseDataSource = 'lease_agreements' | 'leases';

/** Avoid repeated 404s to `lease_agreements` once we know the table is absent */
type LeaseAgreementsPresence = 'unknown' | 'exists' | 'missing';

const LEASE_PRESENCE_STORAGE_KEY = 'nigeria-homes.lease_agreements_presence';
const ENABLE_LEASE_AGREEMENTS_SOURCE = import.meta.env.VITE_ENABLE_LEASE_AGREEMENTS === 'true';

function readPersistedLeasePresence(): LeaseAgreementsPresence | null {
  if (typeof sessionStorage === 'undefined') return null;
  try {
    const v = sessionStorage.getItem(LEASE_PRESENCE_STORAGE_KEY);
    if (v === 'missing' || v === 'exists') return v;
  } catch {
    /* private mode / SSR */
  }
  return null;
}

function persistLeasePresence(p: 'missing' | 'exists'): void {
  if (typeof sessionStorage === 'undefined') return;
  try {
    sessionStorage.setItem(LEASE_PRESENCE_STORAGE_KEY, p);
  } catch {
    /* ignore */
  }
}

function clearPersistedLeasePresence(): void {
  if (typeof sessionStorage === 'undefined') return;
  try {
    sessionStorage.removeItem(LEASE_PRESENCE_STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

const initialPersisted = readPersistedLeasePresence();
let leaseAgreementsTablePresence: LeaseAgreementsPresence = ENABLE_LEASE_AGREEMENTS_SOURCE
  ? (initialPersisted ?? 'unknown')
  : 'missing';
/** Skip repeated console hint when we hydrated "missing" from sessionStorage */
let loggedLeaseAgreementsMissing = ENABLE_LEASE_AGREEMENTS_SOURCE
  ? initialPersisted === 'missing'
  : true;
/** De-duplicate concurrent probes (e.g. React StrictMode double effects). */
let leasePresenceProbePromise: Promise<LeaseAgreementsPresence> | null = null;

export function getLeaseAgreementsTablePresence(): LeaseAgreementsPresence {
  return leaseAgreementsTablePresence;
}

/**
 * Use before ad-hoc `lease_agreements` queries (e.g. PropertyDisplay) so projects
 * without that table never hit a noisy PostgREST 404.
 */
export async function resolveLeaseAgreementsTablePresence(): Promise<LeaseAgreementsPresence> {
  if (!ENABLE_LEASE_AGREEMENTS_SOURCE) {
    return 'missing';
  }
  return detectLeaseAgreementsPresence();
}

/** Call after applying migration so the next fetch probes `lease_agreements` again */
export function resetLeaseAgreementsTableCache(): void {
  clearPersistedLeasePresence();
  leaseAgreementsTablePresence = ENABLE_LEASE_AGREEMENTS_SOURCE ? 'unknown' : 'missing';
  loggedLeaseAgreementsMissing = !ENABLE_LEASE_AGREEMENTS_SOURCE;
  leasePresenceProbePromise = null;
}

async function detectLeaseAgreementsPresence(): Promise<LeaseAgreementsPresence> {
  if (!ENABLE_LEASE_AGREEMENTS_SOURCE) {
    leaseAgreementsTablePresence = 'missing';
    return leaseAgreementsTablePresence;
  }
  if (leaseAgreementsTablePresence !== 'unknown') return leaseAgreementsTablePresence;
  if (leasePresenceProbePromise) return leasePresenceProbePromise;

  leasePresenceProbePromise = (async () => {
    const probe = await supabase.from('lease_agreements').select('id').limit(1);
    if (!probe.error) {
      leaseAgreementsTablePresence = 'exists';
      persistLeasePresence('exists');
      return leaseAgreementsTablePresence;
    }

    if (isLeaseAgreementsRelationMissing(probe.error)) {
      leaseAgreementsTablePresence = 'missing';
      persistLeasePresence('missing');
      if (!loggedLeaseAgreementsMissing) {
        loggedLeaseAgreementsMissing = true;
        console.info(
          '[leases] Table public.lease_agreements is missing — using public.leases. Apply migration 20260321000000_create_lease_agreements.sql when you want the agreements workflow.'
        );
      }
      return leaseAgreementsTablePresence;
    }

    if (isLeaseAccessDeniedOrAuthError(probe.error)) {
      // Treat as fallback mode to avoid noisy repeat probes in the same session.
      leaseAgreementsTablePresence = 'missing';
      persistLeasePresence('missing');
      console.warn('[leases] lease_agreements not accessible, using public.leases');
      return leaseAgreementsTablePresence;
    }

    throw probe.error;
  })();

  try {
    return await leasePresenceProbePromise;
  } finally {
    leasePresenceProbePromise = null;
  }
}

async function loadFromLeases(options: {
  propertyId?: string;
  tenantId?: string;
}): Promise<{ source: 'leases'; rows: Record<string, unknown>[] }> {
  let q2 = supabase.from('leases').select('*').order('created_at', { ascending: false });
  if (options.propertyId) q2 = q2.eq('property_id', options.propertyId);
  if (options.tenantId) q2 = q2.eq('tenant_id', options.tenantId);

  const fallback = await q2;
  if (fallback.error) {
    if (isLeaseAccessDeniedOrAuthError(fallback.error)) {
      console.warn('[leases] public.leases not accessible:', fallback.error.message);
      return { source: 'leases', rows: [] };
    }
    throw fallback.error;
  }

  return {
    source: 'leases',
    rows: (fallback.data ?? []) as Record<string, unknown>[],
  };
}

/**
 * Load lease rows from `lease_agreements`, or from `leases` if that table does not exist.
 */
export async function fetchLeaseRows(options: {
  propertyId?: string;
  tenantId?: string;
}): Promise<{ source: LeaseDataSource; rows: Record<string, unknown>[] }> {
  if (!ENABLE_LEASE_AGREEMENTS_SOURCE) {
    return loadFromLeases(options);
  }

  if (leaseAgreementsTablePresence === 'unknown') {
    await detectLeaseAgreementsPresence();
  }

  if (leaseAgreementsTablePresence === 'missing') {
    return loadFromLeases(options);
  }

  if (leaseAgreementsTablePresence === 'exists') {
    let q = supabase.from('lease_agreements').select('*').order('created_at', { ascending: false });
    if (options.propertyId) q = q.eq('property_id', options.propertyId);
    if (options.tenantId) q = q.eq('tenant_id', options.tenantId);

    const res = await q;
    if (res.error) {
      if (isLeaseAgreementsRelationMissing(res.error)) {
        leaseAgreementsTablePresence = 'missing';
        persistLeasePresence('missing');
        return loadFromLeases(options);
      }
      if (isLeaseAccessDeniedOrAuthError(res.error)) {
        console.warn(
          '[leases] lease_agreements not accessible, trying public.leases:',
          res.error.message
        );
        return loadFromLeases(options);
      }
      throw res.error;
    }
    return {
      source: 'lease_agreements',
      rows: (res.data ?? []) as Record<string, unknown>[],
    };
  }

  return loadFromLeases(options);
}

/** Map `leases.status` (e.g. ACTIVE) and `lease_agreements.status` to UI union */
export function normalizeLeaseAgreementStatus(raw: unknown): LeaseAgreement['status'] {
  const s = String(raw ?? 'active')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_');
  if (s === 'ended' || s === 'terminated' || s === 'cancelled') return 'expired';
  if (['draft', 'sent', 'signed', 'active', 'expired'].includes(s)) {
    return s as LeaseAgreement['status'];
  }
  return 'active';
}

export function isLikelyActiveLeaseStatus(raw: unknown): boolean {
  const s = String(raw ?? '')
    .trim()
    .toLowerCase();
  return s === 'active' || s === 'signed';
}

export type LeaseLikeRow = {
  property_id?: string | null;
  tenant_id?: string | null;
};

export async function enrichRowsWithPropertiesAndTenants<T extends LeaseLikeRow>(
  rows: T[],
  options?: {
    /** Supabase `.select()` fragment for `properties` */
    propertyColumns?: string;
    /** Supabase `.select()` fragment for `tenants` */
    tenantColumns?: string;
  }
): Promise<
  Array<
    T & {
      properties?: Record<string, unknown> | null;
      tenants?: Record<string, unknown> | null;
    }
  >
> {
  if (!rows.length) {
    return rows as Array<
      T & {
        properties?: Record<string, unknown> | null;
        tenants?: Record<string, unknown> | null;
      }
    >;
  }

  const propertyColumns = options?.propertyColumns ?? 'id, name';
  const tenantColumns = options?.tenantColumns ?? 'id, first_name, last_name';

  const propertyIds = [...new Set(rows.map((r) => r.property_id).filter(Boolean))] as string[];
  const tenantIds = [...new Set(rows.map((r) => r.tenant_id).filter(Boolean))] as string[];

  const [propsRes, tenantsRes] = await Promise.all([
    propertyIds.length
      ? supabase.from('properties').select(propertyColumns).in('id', propertyIds)
      : { data: [] as Record<string, unknown>[], error: null as null },
    tenantIds.length
      ? supabase.from('tenants').select(tenantColumns).in('id', tenantIds)
      : { data: [] as Record<string, unknown>[], error: null as null },
  ]);

  if (propsRes.error) throw propsRes.error;
  if (tenantsRes.error) throw tenantsRes.error;

  const propMap = new Map(
    (propsRes.data ?? []).map((p) => [
      String((p as { id: string }).id),
      p as Record<string, unknown>,
    ])
  );
  const tenMap = new Map(
    (tenantsRes.data ?? []).map((t) => [
      String((t as { id: string }).id),
      t as Record<string, unknown>,
    ])
  );

  return rows.map((row) => ({
    ...row,
    properties: row.property_id ? (propMap.get(String(row.property_id)) ?? null) : null,
    tenants: row.tenant_id ? (tenMap.get(String(row.tenant_id)) ?? null) : null,
  })) as Array<
    T & {
      properties?: Record<string, unknown> | null;
      tenants?: Record<string, unknown> | null;
    }
  >;
}
