import { supabase } from '@/integrations/supabase/client';
import { fetchLeaseSummaryForProperty } from '@/services/property/leaseSummary';
import { updateUnit } from '@/services/property/unitsApi';

/**
 * After an active tenancy is recorded (property_tenants + lease):
 * - Marks the unit occupied when `unitId` is set.
 * - When the property is fully leased (RPC summary), sets `properties.status` to `rented`
 *   and deactivates all shortlet `listings` for that property so availability stays accurate.
 */
export async function syncPublicListingAfterLeaseExecuted(
  propertyId: string,
  unitId?: string | null
): Promise<void> {
  if (!propertyId) return;

  try {
    if (unitId) {
      await updateUnit(unitId, { status: 'occupied' });
    }

    const summary = await fetchLeaseSummaryForProperty(propertyId);
    if (!summary?.fullyLeased) {
      return;
    }

    const { error: propErr } = await supabase
      .from('properties')
      .update({ status: 'rented' })
      .eq('id', propertyId);

    if (propErr && import.meta.env.DEV) {
      console.warn('[leaseListingSync] property status update', propErr);
    }

    const { error: listErr } = await supabase
      .from('listings')
      .update({ active: false })
      .eq('property_id', propertyId);

    if (listErr && import.meta.env.DEV) {
      console.warn('[leaseListingSync] listings deactivate', listErr);
    }
  } catch (e) {
    if (import.meta.env.DEV) {
      console.warn('[leaseListingSync]', e);
    }
  }
}
