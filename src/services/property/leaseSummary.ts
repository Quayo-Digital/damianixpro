import { supabase } from '@/integrations/supabase/client';
import type { Property, PropertyLeaseSummary, PropertyUnitOption } from './types';

export type { PropertyLeaseSummary, PropertyUnitOption };

/**
 * Batch lease occupancy for listing cards (RPC `get_property_lease_summaries`).
 */
export async function fetchPropertyLeaseSummaries(
  propertyIds: string[]
): Promise<Map<string, PropertyLeaseSummary>> {
  const map = new Map<string, PropertyLeaseSummary>();
  const ids = propertyIds.filter(Boolean);
  if (ids.length === 0) return map;

  try {
    const { data, error } = await supabase.rpc('get_property_lease_summaries', {
      p_property_ids: ids,
    });
    if (error) {
      if (import.meta.env.DEV) {
        console.warn('[leaseSummary] get_property_lease_summaries:', error.message);
      }
      return map;
    }
    const rows = (data ?? []) as Array<{
      property_id: string;
      total_units: number;
      leased_units: number;
      fully_leased: boolean;
    }>;
    for (const r of rows) {
      map.set(r.property_id, {
        totalUnits: Number(r.total_units) || 0,
        leasedUnits: Number(r.leased_units) || 0,
        fullyLeased: Boolean(r.fully_leased),
      });
    }
  } catch (e) {
    if (import.meta.env.DEV) {
      console.warn('[leaseSummary] fetchPropertyLeaseSummaries', e);
    }
  }
  return map;
}

export function mergeLeaseSummariesIntoProperties(
  properties: Property[],
  summaries: Map<string, PropertyLeaseSummary>
): Property[] {
  return properties.map((p) => {
    const s = summaries.get(p.id);
    if (!s) return p;
    return { ...p, leaseSummary: s };
  });
}

/** Units for a property with lease flags (RPC `get_property_units_lease_status`). */
export async function fetchPropertyUnitsLeaseStatus(
  propertyId: string
): Promise<PropertyUnitOption[]> {
  try {
    const { data, error } = await supabase.rpc('get_property_units_lease_status', {
      p_property_id: propertyId,
    });
    if (error) {
      if (import.meta.env.DEV) {
        console.warn('[leaseSummary] get_property_units_lease_status:', error.message);
      }
      return [];
    }
    return (data ?? []).map(
      (row: {
        unit_id: string;
        unit_number: string | null;
        rent_amount: number;
        is_leased: boolean;
      }) => ({
        unitId: row.unit_id,
        unitNumber: row.unit_number,
        rentAmount: Number(row.rent_amount) || 0,
        isLeased: Boolean(row.is_leased),
      })
    );
  } catch {
    return [];
  }
}

export async function fetchLeaseSummaryForProperty(
  propertyId: string
): Promise<PropertyLeaseSummary | null> {
  const m = await fetchPropertyLeaseSummaries([propertyId]);
  return m.get(propertyId) ?? null;
}

/**
 * Whether a new rental application can proceed (whole property or specific unit).
 */
export async function canSubmitRentalApplication(
  propertyId: string,
  unitId: string | null
): Promise<{ ok: boolean; message?: string }> {
  const summary = await fetchLeaseSummaryForProperty(propertyId);
  if (!summary) {
    return { ok: true };
  }

  if (summary.totalUnits <= 1) {
    if (summary.fullyLeased) {
      return {
        ok: false,
        message: 'This property is already leased. Browse other listings.',
      };
    }
    return { ok: true };
  }

  if (!unitId) {
    return {
      ok: false,
      message: 'This listing has multiple units. Select an available unit to apply.',
    };
  }

  const units = await fetchPropertyUnitsLeaseStatus(propertyId);
  const u = units.find((x) => x.unitId === unitId);
  if (!u) {
    return { ok: false, message: 'Selected unit was not found.' };
  }
  if (u.isLeased) {
    return { ok: false, message: 'That unit is already leased. Pick another unit.' };
  }
  return { ok: true };
}

/**
 * Owner approval: block double-leasing.
 */
export async function canApproveRentalApplication(
  propertyId: string,
  applicationUnitId: string | null
): Promise<{ ok: boolean; message?: string }> {
  return canSubmitRentalApplication(propertyId, applicationUnitId);
}
