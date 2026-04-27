import { supabase } from '@/integrations/supabase/client';

export type UnitRow = {
  id: string;
  property_id: string;
  unit_number: string | null;
  rent_amount: number;
  status: string | null;
  created_at: string | null;
};

export async function fetchUnitsForProperty(propertyId: string): Promise<UnitRow[]> {
  const { data, error } = await supabase
    .from('units')
    .select('id, property_id, unit_number, rent_amount, status, created_at')
    .eq('property_id', propertyId)
    .order('unit_number', { ascending: true, nullsFirst: false });

  if (error) {
    console.error('[unitsApi] fetchUnitsForProperty', error);
    throw error;
  }
  return (data ?? []) as UnitRow[];
}

export async function createUnit(payload: {
  property_id: string;
  unit_number: string;
  rent_amount: number;
  status?: 'vacant' | 'occupied';
}): Promise<UnitRow | null> {
  const { data, error } = await supabase
    .from('units')
    .insert({
      property_id: payload.property_id,
      unit_number: payload.unit_number.trim() || null,
      rent_amount: payload.rent_amount,
      status: payload.status ?? 'vacant',
    })
    .select('id, property_id, unit_number, rent_amount, status, created_at')
    .single();

  if (error) {
    console.error('[unitsApi] createUnit', error);
    throw error;
  }
  return data as UnitRow;
}

export async function updateUnit(
  unitId: string,
  payload: Partial<Pick<UnitRow, 'unit_number' | 'rent_amount' | 'status'>>
): Promise<UnitRow | null> {
  const { data, error } = await supabase
    .from('units')
    .update({
      ...(payload.unit_number !== undefined ? { unit_number: payload.unit_number } : {}),
      ...(payload.rent_amount !== undefined ? { rent_amount: payload.rent_amount } : {}),
      ...(payload.status !== undefined ? { status: payload.status } : {}),
    })
    .eq('id', unitId)
    .select('id, property_id, unit_number, rent_amount, status, created_at')
    .single();

  if (error) {
    console.error('[unitsApi] updateUnit', error);
    throw error;
  }
  return data as UnitRow;
}

async function countActiveLeasesForUnit(unitId: string): Promise<number> {
  const { count, error } = await supabase
    .from('property_tenants')
    .select('*', { count: 'exact', head: true })
    .eq('unit_id', unitId)
    .eq('status', 'active');

  if (error) {
    if (error.code === '42P01' || error.message?.includes('property_tenants')) return 0;
    console.warn('[unitsApi] countActiveLeasesForUnit', error);
    return 0;
  }
  return count ?? 0;
}

export async function deleteUnit(unitId: string): Promise<{ ok: boolean; reason?: string }> {
  const n = await countActiveLeasesForUnit(unitId);
  if (n > 0) {
    return {
      ok: false,
      reason: 'This unit has an active tenancy. End the lease before removing the unit.',
    };
  }

  const { error } = await supabase.from('units').delete().eq('id', unitId);
  if (error) {
    console.error('[unitsApi] deleteUnit', error);
    throw error;
  }
  return { ok: true };
}
