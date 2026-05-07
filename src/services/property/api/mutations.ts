import type { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { Property, PropertyFormValues } from '../types';
import { mapSupabaseToProperty } from '../utils';
import { uploadPropertyDocuments, deletePropertyDocuments } from '../documentService';
import { assertOwnerSubscriptionForPaidFeatures } from '@/services/subscription/ownerSubscriptionAccess';
import { assertWithinPropertyLimit } from '@/services/subscription/planEnforcement';
import { assertRoleScreeningForMonetization } from '@/services/screening/roleScreeningAccess';

/** Must match migration 20260320000000_fix_properties_organization_id.sql */
const DEFAULT_ORG_ID = '00000000-0000-0000-0000-000000000001';

/**
 * `properties.owner_id` references `public.profiles(id)`. Some accounts exist in auth without a
 * profiles row (e.g. failed signup trigger). Bootstrap a minimal profile so inserts succeed (RLS: auth.uid() = id).
 */
async function ensureProfileForPropertyOwner(
  ownerId: string,
  authUser?: User | null
): Promise<void> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const user = authUser ?? session?.user;
  if (!user?.id || user.id !== ownerId) {
    throw new Error('You must be signed in as the property owner to create a property.');
  }

  const { data: existing, error: selectError } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', ownerId)
    .maybeSingle();

  if (selectError) {
    console.warn('ensureProfileForPropertyOwner: profile lookup failed', selectError);
  }
  if (existing?.id) return;

  const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
  const fromFull = String(meta.full_name ?? meta.name ?? '').trim();
  let firstName: string | null = null;
  let lastName: string | null = null;
  if (fromFull) {
    const parts = fromFull.split(/\s+/).filter(Boolean);
    firstName = parts[0] ?? null;
    lastName = parts.length > 1 ? parts.slice(1).join(' ') : null;
  } else {
    const fn = String(meta.first_name ?? '').trim();
    const ln = String(meta.last_name ?? '').trim();
    firstName = fn || null;
    lastName = ln || null;
  }

  const email = (user.email && user.email.trim()) || `${ownerId}@users.noreply.placeholder`;

  const { error: upsertError } = await supabase.from('profiles').upsert(
    {
      id: ownerId,
      email,
      first_name: firstName,
      last_name: lastName,
    },
    { onConflict: 'id' }
  );

  if (upsertError) {
    console.error('ensureProfileForPropertyOwner: upsert failed', upsertError);
    throw new Error(
      upsertError.message ||
        'Could not create your profile in the database. Try signing out and back in, or contact support.'
    );
  }
}

function isOwnerProfileFkError(err: {
  code?: string;
  message?: string | null;
  details?: string | null;
}): boolean {
  const msg = (err.message ?? '').toLowerCase();
  const det = (err.details ?? '').toLowerCase();
  return (
    err.code === '23503' && (msg.includes('properties_owner_id_fkey') || det.includes('profiles'))
  );
}

function toDbStatus(status: string | null | undefined): string | null {
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
      return status;
  }
}

async function resolveOrganizationId(ownerId?: string): Promise<string> {
  // Prefer the owner's existing property org so newly created records stay visible
  // under the same org-scoped RLS policies.
  if (ownerId) {
    try {
      const { data: ownerProps } = await supabase
        .from('properties')
        .select('organization_id')
        .eq('owner_id', ownerId)
        .not('organization_id', 'is', null)
        .order('created_at', { ascending: false })
        .limit(1);
      if (ownerProps?.[0]?.organization_id) return ownerProps[0].organization_id;
    } catch {
      /* ignore and use fallbacks */
    }
  }

  try {
    const { data: orgs } = await supabase.from('organizations').select('id').limit(1);
    if (orgs?.[0]?.id) return orgs[0].id;
  } catch {
    /* ignore */
  }
  return DEFAULT_ORG_ID;
}

/**
 * Build insert/update row aligned with `Database['public']['Tables']['properties']` (regenerate types after migrations).
 * Avoids sending camelCase / legacy columns that trigger PGRST204 on stricter PostgREST caches.
 */
function buildPropertiesUpdateRow(propertyData: PropertyFormValues): Record<string, unknown> {
  const row: Record<string, unknown> = {
    name: propertyData.name,
    address: propertyData.address || null,
    status: toDbStatus(propertyData.status),
    lease_terms: propertyData.lease_terms || null,
    availability_date: propertyData.availability_date || null,
    owner_id: propertyData.owner_id,
    latitude: propertyData.latitude ? parseFloat(propertyData.latitude) : null,
    longitude: propertyData.longitude ? parseFloat(propertyData.longitude) : null,
    agent_commission_rate: propertyData.agent_commission_rate
      ? parseFloat(propertyData.agent_commission_rate)
      : null,
    tour_url: propertyData.tourUrl || null,
  };

  if (propertyData.agent_id && propertyData.agent_id !== 'none') {
    row.agent_id = propertyData.agent_id;
  } else {
    row.agent_id = null;
  }

  if (propertyData.amenities?.length) {
    row.amenities = propertyData.amenities;
  }
  if (propertyData.features?.length) {
    row.features = propertyData.features;
  }

  const meta = {
    type: propertyData.type,
    price: propertyData.price,
    location: propertyData.location,
    description: propertyData.description,
    bedrooms: propertyData.bedrooms,
    bathrooms: propertyData.bathrooms,
    squareFeet: propertyData.squareFeet,
    imageUrl: propertyData.imageUrl,
    transaction_type: propertyData.transaction_type,
    property_category: propertyData.property_category,
    sale_price: propertyData.sale_price,
    lease_price: propertyData.lease_price,
    monthly_rent: propertyData.lease_price
      ? String(parseFloat(propertyData.lease_price) / 12)
      : undefined,
    market_value: propertyData.market_value,
    land_size_sqft: propertyData.land_size_sqft,
    land_size_acres: propertyData.land_size_acres,
    price_per_sqft: propertyData.price_per_sqft,
    development_status: propertyData.development_status,
    zoning_type: propertyData.zoning_type,
    title_document_url: propertyData.title_document_url,
    survey_plan_url: propertyData.survey_plan_url,
    c_of_o_url: propertyData.c_of_o_url,
    deed_of_assignment_url: propertyData.deed_of_assignment_url,
    land_use_permit_url: propertyData.land_use_permit_url,
  };
  const hasMeta = Object.values(meta).some((v) => v !== undefined && v !== null && v !== '');
  if (hasMeta) {
    row.shortlet_details = { form_meta: meta };
  }

  return Object.fromEntries(Object.entries(row).filter(([, v]) => v !== undefined));
}

function buildPropertiesRow(
  propertyData: PropertyFormValues,
  organizationId: string
): Record<string, unknown> {
  const row: Record<string, unknown> = {
    name: propertyData.name,
    address: propertyData.address || null,
    status: toDbStatus(propertyData.status),
    lease_terms: propertyData.lease_terms || null,
    availability_date: propertyData.availability_date || null,
    owner_id: propertyData.owner_id,
    latitude: propertyData.latitude ? parseFloat(propertyData.latitude) : null,
    longitude: propertyData.longitude ? parseFloat(propertyData.longitude) : null,
    agent_commission_rate: propertyData.agent_commission_rate
      ? parseFloat(propertyData.agent_commission_rate)
      : null,
    tour_url: propertyData.tourUrl || null,
    organization_id: organizationId,
  };

  if (propertyData.agent_id && propertyData.agent_id !== 'none') {
    row.agent_id = propertyData.agent_id;
  }

  if (propertyData.amenities?.length) {
    row.amenities = propertyData.amenities;
  }
  if (propertyData.features?.length) {
    row.features = propertyData.features;
  }

  // Preserve extra form fields the UI still collects but DB may not have as columns (optional JSON).
  const meta = {
    type: propertyData.type,
    price: propertyData.price,
    location: propertyData.location,
    description: propertyData.description,
    bedrooms: propertyData.bedrooms,
    bathrooms: propertyData.bathrooms,
    squareFeet: propertyData.squareFeet,
    imageUrl: propertyData.imageUrl,
    transaction_type: propertyData.transaction_type,
    property_category: propertyData.property_category,
    sale_price: propertyData.sale_price,
    lease_price: propertyData.lease_price,
    monthly_rent: propertyData.lease_price
      ? String(parseFloat(propertyData.lease_price) / 12)
      : undefined,
    market_value: propertyData.market_value,
    land_size_sqft: propertyData.land_size_sqft,
    land_size_acres: propertyData.land_size_acres,
    price_per_sqft: propertyData.price_per_sqft,
    development_status: propertyData.development_status,
    zoning_type: propertyData.zoning_type,
    title_document_url: propertyData.title_document_url,
    survey_plan_url: propertyData.survey_plan_url,
    c_of_o_url: propertyData.c_of_o_url,
    deed_of_assignment_url: propertyData.deed_of_assignment_url,
    land_use_permit_url: propertyData.land_use_permit_url,
  };
  const hasMeta = Object.values(meta).some((v) => v !== undefined && v !== null && v !== '');
  if (hasMeta) {
    row.shortlet_details = { form_meta: meta };
  }

  return Object.fromEntries(Object.entries(row).filter(([, v]) => v !== undefined));
}

function isMissingColumnError(err: { code?: string; message?: string | null }): boolean {
  const msg = err.message ?? '';
  return (
    err.code === 'PGRST204' ||
    err.code === '42703' ||
    (msg.includes('schema cache') && msg.includes('column'))
  );
}

function isConflictError(err: { code?: string; message?: string | null }): boolean {
  const msg = (err.message ?? '').toLowerCase();
  return err.code === '23505' || msg.includes('duplicate key') || msg.includes('unique constraint');
}

/**
 * Create a new property
 */
export const createProperty = async (
  propertyData: PropertyFormValues,
  documents: File[] = []
): Promise<Property> => {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const ownerId = propertyData.owner_id ?? session?.user?.id;
    if (!ownerId) {
      throw new Error('Missing owner. Sign in and try again.');
    }
    await assertOwnerSubscriptionForPaidFeatures(ownerId);
    await assertWithinPropertyLimit(ownerId);
    await assertRoleScreeningForMonetization(ownerId, 'owner');
    await ensureProfileForPropertyOwner(ownerId, session?.user ?? null);

    const organizationId = await resolveOrganizationId(ownerId);
    const cleanedData = buildPropertiesRow({ ...propertyData, owner_id: ownerId }, organizationId);

    // First, create the property record
    const { data, error } = await supabase.from('properties').insert([cleanedData]).select();

    if (error) {
      console.error('Supabase create error:', error);
      console.error('Data being sent:', cleanedData);

      // Never spin on duplicates / conflicts
      if (isConflictError(error)) {
        throw error;
      }

      // One more attempt if profile row was missing (e.g. race or stale client state)
      if (isOwnerProfileFkError(error)) {
        await ensureProfileForPropertyOwner(ownerId, session?.user ?? null);
        const { data: afterProfile, error: afterProfileErr } = await supabase
          .from('properties')
          .insert([cleanedData])
          .select();
        if (!afterProfileErr && afterProfile?.length) {
          const property = mapSupabaseToProperty(afterProfile[0]);
          if (documents.length > 0) {
            await uploadPropertyDocuments(property.id, documents);
          }
          return property;
        }
      }

      const isOrgIdError = error.code === '23502' && error.message?.includes('organization_id');
      const isOrgFkError = error.code === '23503' && error.message?.includes('organization');

      // Last-resort: strip unknown columns or fix org (older DBs / stale cache). Bounded loop.
      if (isMissingColumnError(error) || isOrgIdError || isOrgFkError) {
        const strippedColumns = new Set<string>();
        const retryData: Record<string, unknown> = { ...cleanedData };
        let lastError = error;
        const maxAttempts = 40;
        let orgFlipUsed = false;

        for (let attempt = 0; attempt < maxAttempts; attempt++) {
          if (isConflictError(lastError)) {
            throw lastError;
          }

          let columnName: string | undefined;
          if (isMissingColumnError(lastError)) {
            columnName = lastError.message?.match(/'([a-zA-Z_][a-zA-Z0-9_]*)'/)?.[1];
          }

          if (columnName && !strippedColumns.has(columnName)) {
            strippedColumns.add(columnName);
            delete retryData[columnName];
            console.warn(`Column ${columnName} not in schema, retrying without it`);
          } else if (
            (lastError.code === '23502' || lastError.code === '23503') &&
            lastError.message?.includes('organization')
          ) {
            if (orgFlipUsed && retryData.organization_id === DEFAULT_ORG_ID) {
              throw lastError;
            }
            orgFlipUsed = true;
            retryData.organization_id =
              lastError.code === '23503' || retryData.organization_id !== DEFAULT_ORG_ID
                ? DEFAULT_ORG_ID
                : organizationId;
          } else if (
            !isMissingColumnError(lastError) &&
            lastError.code !== '23502' &&
            lastError.code !== '23503'
          ) {
            throw lastError;
          } else if (
            isMissingColumnError(lastError) &&
            (!columnName || strippedColumns.has(columnName))
          ) {
            throw lastError;
          }

          const { data: retryResult, error: retryError } = await supabase
            .from('properties')
            .insert([retryData])
            .select();

          if (!retryError && retryResult?.length) {
            if (documents.length > 0) await uploadPropertyDocuments(retryResult[0].id, documents);
            return mapSupabaseToProperty(retryResult[0]);
          }
          if (!retryError) break;
          if (
            retryError.code !== 'PGRST204' &&
            retryError.code !== '42703' &&
            retryError.code !== '23502' &&
            retryError.code !== '23503'
          ) {
            throw retryError;
          }
          lastError = retryError;
        }

        throw lastError;
      }

      throw error;
    }
    if (!data || data.length === 0) throw new Error('Failed to create property');

    const property = mapSupabaseToProperty(data[0]);

    // Then upload any documents if provided
    if (documents.length > 0) {
      await uploadPropertyDocuments(property.id, documents);
    }

    return property;
  } catch (error) {
    console.error('Error creating property:', error);
    throw error;
  }
};

/**
 * Update an existing property
 */
export const updateProperty = async (
  id: string,
  propertyData: PropertyFormValues,
  documents: File[] = []
): Promise<Property> => {
  try {
    const cleanedData = buildPropertiesUpdateRow(propertyData);

    // Merge JSON so we don't replace entire `shortlet_details` and drop non-form fields.
    if (cleanedData.shortlet_details) {
      const { data: existing } = await supabase
        .from('properties')
        .select('shortlet_details')
        .eq('id', id)
        .maybeSingle();
      const prev = (existing?.shortlet_details as Record<string, unknown> | null) ?? {};
      const incoming = cleanedData.shortlet_details as Record<string, unknown>;
      const prevForm = (prev.form_meta as Record<string, unknown> | undefined) ?? {};
      const newForm = (incoming.form_meta as Record<string, unknown> | undefined) ?? {};
      cleanedData.shortlet_details = {
        ...prev,
        ...incoming,
        form_meta: { ...prevForm, ...newForm },
      };
    }

    const { data, error } = await supabase
      .from('properties')
      .update(cleanedData)
      .eq('id', id)
      .select();

    if (error) {
      console.error('Supabase update error:', error);
      console.error('Data being sent:', cleanedData);

      if (isConflictError(error)) {
        throw error;
      }

      if (isMissingColumnError(error)) {
        const strippedColumns = new Set<string>();
        const retryData: Record<string, unknown> = { ...cleanedData };
        let lastError = error;
        const maxAttempts = 40;

        for (let attempt = 0; attempt < maxAttempts; attempt++) {
          if (isConflictError(lastError)) {
            throw lastError;
          }

          const columnName = lastError.message?.match(/'([a-zA-Z_][a-zA-Z0-9_]*)'/)?.[1];

          if (columnName && !strippedColumns.has(columnName)) {
            strippedColumns.add(columnName);
            delete retryData[columnName];
            console.warn(`Column ${columnName} not in schema, update retrying without it`);
          } else if (!isMissingColumnError(lastError)) {
            throw lastError;
          } else if (!columnName || strippedColumns.has(columnName)) {
            throw lastError;
          }

          const { data: retryResult, error: retryError } = await supabase
            .from('properties')
            .update(retryData)
            .eq('id', id)
            .select();

          if (!retryError && retryResult?.length) {
            if (documents.length > 0) await uploadPropertyDocuments(id, documents);
            return mapSupabaseToProperty(retryResult[0]);
          }
          if (!retryError) break;
          if (!isMissingColumnError(retryError)) {
            throw retryError;
          }
          lastError = retryError;
        }

        throw lastError;
      }

      throw error;
    }
    if (!data || data.length === 0) throw new Error('Failed to update property');

    if (documents.length > 0) {
      await uploadPropertyDocuments(id, documents);
    }

    return mapSupabaseToProperty(data[0]);
  } catch (error) {
    console.error('Error updating property:', error);
    throw error;
  }
};

/**
 * Delete a property by ID
 */
export const deleteProperty = async (id: string): Promise<boolean> => {
  try {
    // First delete any associated documents
    await deletePropertyDocuments(id);

    // Then delete the property
    const { error } = await supabase.from('properties').delete().eq('id', id);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error deleting property:', error);
    throw error;
  }
};
