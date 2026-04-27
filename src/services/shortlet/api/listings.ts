/**
 * Listings API Service
 * Handles CRUD operations for short-let listings
 */

import { supabase } from '@/integrations/supabase/client';
import { assertOwnerSubscriptionForPaidFeatures } from '@/services/subscription/ownerSubscriptionAccess';
import { assertRoleScreeningForMonetization } from '@/services/screening/roleScreeningAccess';
import { mapSupabaseToProperty } from '@/services/property/utils';
import { Listing, listingSchema, SearchListingsRequest, SearchListingsResponse } from '../types';

/** Real `properties` columns only — avoids invalid selects and heavy `*` embeds that can break PostgREST. */
const LISTING_PROPERTY_EMBED_FIELDS = [
  'id',
  'name',
  'address',
  'city',
  'state',
  'shortlet_details',
  'latitude',
  'longitude',
  'status',
  'tour_url',
  'owner_id',
  'agent_id',
  'amenities',
  'features',
  'organization_id',
  'is_shortlet',
  'created_at',
].join(', ');

const listingPropertySelectFragment = `property:properties (${LISTING_PROPERTY_EMBED_FIELDS})`;
const LISTINGS_SERVER_ERROR_COOLDOWN_MS = 30_000;
let listingsServerErrorCooldownUntil = 0;

const isAuthOrPermissionError = (error: unknown): boolean => {
  const status = (error as { status?: number })?.status;
  const code = String((error as { code?: string })?.code || '');
  const message = String((error as { message?: string })?.message || '').toLowerCase();
  return (
    status === 401 ||
    status === 403 ||
    code === '42501' ||
    message.includes('jwt') ||
    message.includes('not authorized') ||
    message.includes('permission denied')
  );
};

const isServerError = (error: unknown): boolean => {
  const status = (error as { status?: number })?.status;
  return typeof status === 'number' && status >= 500;
};

const isListingsServerErrorCooldownActive = () => Date.now() < listingsServerErrorCooldownUntil;
const activateListingsServerErrorCooldown = () => {
  listingsServerErrorCooldownUntil = Date.now() + LISTINGS_SERVER_ERROR_COOLDOWN_MS;
};

function mapEmbeddedPropertyForListing(raw: unknown): Listing['property'] | undefined {
  if (raw == null || typeof raw !== 'object') return undefined;
  const p = mapSupabaseToProperty(raw as Record<string, unknown>);
  return {
    id: p.id,
    name: p.name,
    address: p.address,
    location:
      p.location ||
      [p.address, (raw as { city?: string }).city, (raw as { state?: string }).state]
        .filter(Boolean)
        .join(', ')
        .trim() ||
      p.address,
    imageUrl: p.imageUrl,
  };
}

function normalizeListingRow<T extends { property?: unknown }>(row: T): Listing {
  const { property, ...rest } = row;
  return {
    ...(rest as object),
    property: mapEmbeddedPropertyForListing(property),
  } as Listing;
}

function normalizeListingRows(rows: unknown[] | null | undefined): Listing[] {
  return (rows ?? []).map((r) => normalizeListingRow(r as { property?: unknown }));
}

/**
 * Create a new listing
 */
export async function createListing(
  listing: Omit<Listing, 'id' | 'created_at' | 'updated_at'> & { imageUrl?: string }
): Promise<Listing> {
  // Convert amenities from object to array if needed (form sends object, API expects array)
  const processedListing = {
    ...listing,
    amenities: Array.isArray(listing.amenities)
      ? listing.amenities
      : listing.amenities && typeof listing.amenities === 'object'
        ? Object.entries(listing.amenities)
            .filter(([_, value]) => value === true)
            .map(([key]) => key)
        : [],
  };

  const validated = listingSchema.parse(processedListing);

  const { data: propertyRow, error: propertyLookupError } = await supabase
    .from('properties')
    .select('owner_id')
    .eq('id', validated.property_id)
    .maybeSingle();

  if (propertyLookupError) throw propertyLookupError;
  if (!propertyRow?.owner_id) {
    throw new Error('Property not found or has no owner.');
  }

  await assertOwnerSubscriptionForPaidFeatures(propertyRow.owner_id as string);
  await assertRoleScreeningForMonetization(propertyRow.owner_id as string, 'owner');

  const insertData: any = {
    property_id: validated.property_id,
    title: validated.title,
    description: validated.description,
    capacity: validated.capacity,
    amenities: validated.amenities,
    base_price: validated.base_price,
    cleaning_fee: validated.cleaning_fee,
    security_deposit: validated.security_deposit,
    timezone: validated.timezone,
    instant_book: validated.instant_book,
    active: validated.active,
    cancellation_policy: validated.cancellation_policy,
  };

  // Note: imageUrl column may not exist in listings table, so we don't include it
  // Images should be stored in the property table instead

  const { data, error } = await supabase.from('listings').insert([insertData]).select().single();

  if (error) throw error;
  return data as Listing;
}

/**
 * Get listing by ID
 */
export async function getListingById(listingId: string): Promise<Listing | null> {
  const { data, error } = await supabase
    .from('listings')
    .select(`*, ${listingPropertySelectFragment}`)
    .eq('id', listingId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // Not found
    throw error;
  }

  return normalizeListingRow(data as { property?: unknown });
}

/**
 * Update listing
 */
export async function updateListing(
  listingId: string,
  updates: Partial<Listing> & { imageUrl?: string }
): Promise<Listing> {
  // Convert amenities from object to array if needed (form sends object, API expects array)
  const processedUpdates = {
    ...updates,
    ...(updates.amenities &&
    typeof updates.amenities === 'object' &&
    !Array.isArray(updates.amenities)
      ? {
          amenities: Object.entries(updates.amenities)
            .filter(([_, value]) => value === true)
            .map(([key]) => key),
        }
      : {}),
  };

  const validated = listingSchema.partial().parse(processedUpdates);

  const updateData: any = {
    ...validated,
    updated_at: new Date().toISOString(),
  };

  // Note: imageUrl column may not exist in listings table, so we don't include it
  // Images should be stored in the property table instead

  const { data, error } = await supabase
    .from('listings')
    .update(updateData)
    .eq('id', listingId)
    .select()
    .single();

  if (error) throw error;
  return data as Listing;
}

/**
 * Delete listing (soft delete by setting active = false)
 */
export async function deleteListing(listingId: string): Promise<void> {
  const { error } = await supabase.from('listings').update({ active: false }).eq('id', listingId);

  if (error) throw error;
}

/**
 * Get listings for a property
 */
export async function getListingsByProperty(propertyId: string): Promise<Listing[]> {
  const { data, error } = await supabase
    .from('listings')
    .select('*')
    .eq('property_id', propertyId)
    .eq('active', true)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as Listing[];
}

/**
 * Search listings with filters
 */
export async function searchListings(
  params: SearchListingsRequest
): Promise<SearchListingsResponse> {
  if (isListingsServerErrorCooldownActive()) {
    return {
      listings: [],
      total: 0,
      page: params.page || 1,
      limit: params.page_size || 20,
    };
  }

  const {
    query,
    location,
    checkin_date,
    checkout_date,
    guests = 1,
    min_price,
    max_price,
    amenities = [],
    instant_book,
    page = 1,
    limit = params.page_size || 20,
  } = params;

  let dbQuery = supabase
    .from('listings')
    .select(`*, ${listingPropertySelectFragment}`, { count: 'exact' })
    .eq('active', true)
    .gte('capacity', guests);

  // Text search (query)
  if (query) {
    dbQuery = dbQuery.or(`title.ilike.%${query}%,description.ilike.%${query}%`);
  }

  // Location filter on embedded `properties` (there is no `properties.location` column)
  if (location?.trim()) {
    // PostgREST `or` syntax: escape reserved chars in patterns (see postgrest.org reserved characters)
    const safe = location
      .trim()
      .replace(/\\/g, '\\\\')
      .replace(/\*/g, '\\*')
      .replace(/\(/g, '\\(')
      .replace(/\)/g, '\\)')
      .replace(/,/g, '\\,');
    const pat = `*${safe}*`;
    dbQuery = dbQuery.or(`address.ilike.${pat},city.ilike.${pat},state.ilike.${pat}`, {
      referencedTable: 'properties',
    });
  }

  // Price filters
  if (min_price !== undefined) {
    dbQuery = dbQuery.gte('base_price', min_price);
  }
  if (max_price !== undefined) {
    dbQuery = dbQuery.lte('base_price', max_price);
  }

  // Instant book filter
  if (instant_book !== undefined) {
    dbQuery = dbQuery.eq('instant_book', instant_book);
  }

  // Sorting
  const sortBy = params.sort_by || 'popular';
  switch (sortBy) {
    case 'price_low':
      dbQuery = dbQuery.order('base_price', { ascending: true });
      break;
    case 'price_high':
      dbQuery = dbQuery.order('base_price', { ascending: false });
      break;
    case 'newest':
      dbQuery = dbQuery.order('created_at', { ascending: false });
      break;
    case 'popular':
    default:
      // For now, order by created_at. In future, can order by booking count
      dbQuery = dbQuery.order('created_at', { ascending: false });
      break;
  }

  // Pagination
  const from = (page - 1) * limit;
  const to = from + limit - 1;
  dbQuery = dbQuery.range(from, to);

  const dbResult = await dbQuery;
  let data = dbResult.data;
  const error = dbResult.error;
  let count = dbResult.count;

  if (error) {
    // Provide more context for network errors
    if (error.message?.includes('fetch') || error.message?.includes('network')) {
      throw new Error(
        `Network error: Unable to fetch listings. Please check your internet connection. ${error.message}`
      );
    }

    // Some deployments have schema-cache/embed issues on property joins; degrade gracefully.
    const fallbackQuery = supabase
      .from('listings')
      .select('*', { count: 'exact' })
      .eq('active', true)
      .gte('capacity', guests);

    if (query) {
      fallbackQuery.or(`title.ilike.%${query}%,description.ilike.%${query}%`);
    }
    if (min_price !== undefined) {
      fallbackQuery.gte('base_price', min_price);
    }
    if (max_price !== undefined) {
      fallbackQuery.lte('base_price', max_price);
    }
    if (instant_book !== undefined) {
      fallbackQuery.eq('instant_book', instant_book);
    }

    switch (sortBy) {
      case 'price_low':
        fallbackQuery.order('base_price', { ascending: true });
        break;
      case 'price_high':
        fallbackQuery.order('base_price', { ascending: false });
        break;
      case 'newest':
      case 'popular':
      default:
        fallbackQuery.order('created_at', { ascending: false });
        break;
    }
    fallbackQuery.range(from, to);

    const fallbackResult = await fallbackQuery;
    if (fallbackResult.error) {
      if (isAuthOrPermissionError(fallbackResult.error) || isServerError(fallbackResult.error)) {
        if (isServerError(fallbackResult.error)) {
          activateListingsServerErrorCooldown();
        }
        if (import.meta.env.DEV) {
          console.warn(
            'Shortlet listings unavailable (permission/server issue); returning empty result set.'
          );
        }
        return { listings: [], total: 0, page, limit };
      }
      throw fallbackResult.error;
    }
    data = fallbackResult.data;
    count = fallbackResult.count;
  }

  // Filter by amenities (client-side for now, can be optimized with DB query)
  let filteredListings = data || [];
  if (amenities.length > 0) {
    filteredListings = filteredListings.filter((listing: Listing) => {
      const listingAmenities = listing.amenities || [];
      return amenities.every((amenity) => listingAmenities.includes(amenity));
    });
  }

  // TODO: Filter by availability dates (checkin_date, checkout_date)
  // This requires checking booking conflicts

  return {
    listings: normalizeListingRows(filteredListings),
    total: count || 0,
    page,
    limit,
  };
}

/**
 * Get listings with optional filters
 */
export async function getListings(params?: {
  ownerId?: string;
  propertyId?: string;
  active?: boolean;
}): Promise<Listing[]> {
  if (isListingsServerErrorCooldownActive()) {
    return [];
  }

  let query = supabase.from('listings').select(`*, ${listingPropertySelectFragment}`);

  // Filter by property if specified
  if (params?.propertyId) {
    query = query.eq('property_id', params.propertyId);
  }

  // Filter by owner if specified (via properties)
  if (params?.ownerId) {
    // First get properties owned by the user
    const { data: properties, error: propertiesError } = await supabase
      .from('properties')
      .select('id')
      .eq('owner_id', params.ownerId);

    if (propertiesError) throw propertiesError;

    if (!properties || properties.length === 0) {
      return [];
    }

    const propertyIds = properties.map((p) => p.id);
    query = query.in('property_id', propertyIds);
  }

  // Filter by active status (default to true if not specified)
  if (params?.active !== undefined) {
    query = query.eq('active', params.active);
  } else {
    query = query.eq('active', true);
  }

  query = query.order('created_at', { ascending: false });

  const queryResult = await query;
  let data = queryResult.data;
  const error = queryResult.error;

  if (error) {
    // Provide more context for network errors
    if (error.message?.includes('fetch') || error.message?.includes('network')) {
      throw new Error(
        `Network error: Unable to fetch listings. Please check your internet connection. ${error.message}`
      );
    }

    // Fallback to plain listings without embedded property to survive schema-cache mismatches.
    let fallbackQuery = supabase.from('listings').select('*');

    if (params?.propertyId) {
      fallbackQuery = fallbackQuery.eq('property_id', params.propertyId);
    }
    if (params?.ownerId) {
      const { data: properties, error: propertiesError } = await supabase
        .from('properties')
        .select('id')
        .eq('owner_id', params.ownerId);
      if (propertiesError) throw propertiesError;
      const propertyIds = (properties || []).map((p) => p.id);
      if (!propertyIds.length) return [];
      fallbackQuery = fallbackQuery.in('property_id', propertyIds);
    }
    if (params?.active !== undefined) {
      fallbackQuery = fallbackQuery.eq('active', params.active);
    } else {
      fallbackQuery = fallbackQuery.eq('active', true);
    }

    const fallbackResult = await fallbackQuery.order('created_at', { ascending: false });
    if (fallbackResult.error) {
      if (isAuthOrPermissionError(fallbackResult.error) || isServerError(fallbackResult.error)) {
        if (isServerError(fallbackResult.error)) {
          activateListingsServerErrorCooldown();
        }
        if (import.meta.env.DEV) {
          console.warn(
            'Shortlet listings unavailable (permission/server issue); returning empty list.'
          );
        }
        return [];
      }
      throw fallbackResult.error;
    }
    data = fallbackResult.data;
  }
  return normalizeListingRows(data);
}

/**
 * Get listings for owner
 */
export async function getOwnerListings(ownerId: string): Promise<Listing[]> {
  // First get properties owned by the user
  const { data: properties, error: propertiesError } = await supabase
    .from('properties')
    .select('id')
    .eq('owner_id', ownerId);

  if (propertiesError) throw propertiesError;

  if (!properties || properties.length === 0) {
    return [];
  }

  const propertyIds = properties.map((p) => p.id);

  // Then get listings for those properties
  const { data, error } = await supabase
    .from('listings')
    .select(`*, ${listingPropertySelectFragment}`)
    .in('property_id', propertyIds)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return normalizeListingRows(data);
}
