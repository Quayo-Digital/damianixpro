
import { Property } from './types';

/**
 * Maps a property object from Supabase to the Property interface.
 * @param item - The raw item from the database.
 * @returns A formatted Property object.
 */
export const mapSupabaseToProperty = (item: any): Property => ({
  id: item.id,
  name: item.name || "",
  address: item.address || "",
  type: item.type || "residential",
  price: item.price || "",
  location: item.location || "",
  status: (item.status as Property["status"]) || "Available",
  description: item.description,
  bedrooms: item.bedrooms?.toString() || undefined,
  bathrooms: item.bathrooms?.toString() || undefined,
  squareFeet: item.squareFeet?.toString() || undefined,
  amenities: item.amenities || [],
  imageUrl: item.imageUrl,
  lease_terms: item.lease_terms,
  availability_date: item.availability_date,
  agent_id: item.agent_id,
  agent_commission_rate: item.agent_commission_rate,
  features: item.features || [],
  latitude: item.latitude,
  longitude: item.longitude,
  tourUrl: (item as any).tour_url,
  owner_id: item.owner_id,
});
