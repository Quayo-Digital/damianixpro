/**
 * Listings API Service
 * Handles CRUD operations for short-let listings
 */

import { supabase } from '@/integrations/supabase/client';
import { Listing, listingSchema, SearchListingsRequest, SearchListingsResponse } from '../types';

/**
 * Create a new listing
 */
export async function createListing(listing: Omit<Listing, 'id' | 'created_at' | 'updated_at'>): Promise<Listing> {
  const validated = listingSchema.parse(listing);
  
  const { data, error } = await supabase
    .from('listings')
    .insert([{
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
      cancellation_policy: validated.cancellation_policy
    }])
    .select()
    .single();

  if (error) throw error;
  return data as Listing;
}

/**
 * Get listing by ID
 */
export async function getListingById(listingId: string): Promise<Listing | null> {
  const { data, error } = await supabase
    .from('listings')
    .select(`
      *,
      property:properties (
        id,
        name,
        address,
        location
      )
    `)
    .eq('id', listingId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // Not found
    throw error;
  }

  return data as Listing;
}

/**
 * Update listing
 */
export async function updateListing(
  listingId: string,
  updates: Partial<Listing>
): Promise<Listing> {
  const { data, error } = await supabase
    .from('listings')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
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
  const { error } = await supabase
    .from('listings')
    .update({ active: false })
    .eq('id', listingId);

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
    limit = params.page_size || 20
  } = params;

  let dbQuery = supabase
    .from('listings')
    .select('*, property:properties (*)', { count: 'exact' })
    .eq('active', true)
    .gte('capacity', guests);

  // Text search (query)
  if (query) {
    dbQuery = dbQuery.or(`title.ilike.%${query}%,description.ilike.%${query}%`);
  }

  // Location filter (if provided)
  if (location) {
    dbQuery = dbQuery.ilike('property.location', `%${location}%`);
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

  const { data, error, count } = await dbQuery;

  if (error) throw error;

  // Filter by amenities (client-side for now, can be optimized with DB query)
  let filteredListings = data || [];
  if (amenities.length > 0) {
    filteredListings = filteredListings.filter((listing: Listing) => {
      const listingAmenities = listing.amenities || [];
      return amenities.every(amenity => listingAmenities.includes(amenity));
    });
  }

  // TODO: Filter by availability dates (checkin_date, checkout_date)
  // This requires checking booking conflicts

  return {
    listings: filteredListings as Listing[],
    total: count || 0,
    page,
    limit
  };
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

  const propertyIds = properties.map(p => p.id);

  // Then get listings for those properties
  const { data, error } = await supabase
    .from('listings')
    .select(`
      *,
      property:properties (
        id,
        name,
        address,
        location,
        imageUrl
      )
    `)
    .in('property_id', propertyIds)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as Listing[];
}

