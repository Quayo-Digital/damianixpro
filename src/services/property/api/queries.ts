
import { supabase } from '@/integrations/supabase/client';
import { Property } from '../types';
import { mapSupabaseToProperty } from '../utils';

/**
 * Fetch properties from the database. Can be filtered by owner.
 * If no ownerId is provided, fetches all properties.
 * @param ownerId - Optional ID of the property owner.
 */
export const fetchProperties = async (ownerId?: string): Promise<Property[]> => {
  try {
    let query = supabase
      .from('properties')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (ownerId) {
      query = query.eq('owner_id', ownerId);
    }

    const { data, error } = await query;
    
    if (error) throw error;
    
    const properties: Property[] = data?.map(mapSupabaseToProperty) || [];
    
    return properties;
  } catch (error) {
    console.error('Error fetching properties:', error);
    return [];
  }
};

/**
 * Get a property by ID
 */
export const getPropertyById = async (id: string): Promise<Property | null> => {
  try {
    const { data, error } = await supabase
      .from('properties')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    
    if (!data) return null;
    
    return mapSupabaseToProperty(data);
  } catch (error) {
    console.error('Error fetching property by ID:', error);
    return null;
  }
};
