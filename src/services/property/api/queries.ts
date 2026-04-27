import { supabase } from '@/integrations/supabase/client';
import { Property } from '../types';
import { mapSupabaseToProperty } from '../utils';
import { demoProperties } from '@/data/demoProperties';
import { fetchPropertyLeaseSummaries, mergeLeaseSummariesIntoProperties } from '../leaseSummary';

/**
 * Fetch properties from the database. Can be filtered by owner.
 * If no ownerId is provided, fetches all properties.
 * @param ownerId - Optional ID of the property owner.
 */
export const fetchProperties = async (ownerId?: string): Promise<Property[]> => {
  try {
    let query = supabase.from('properties').select('*').order('created_at', { ascending: false });

    if (ownerId) {
      query = query.eq('owner_id', ownerId);
    }

    const { data, error } = await query;

    if (error) {
      const status = (error as { status?: number }).status;
      const code = String((error as { code?: string }).code || '');
      const message = String((error as { message?: string }).message || '').toLowerCase();

      // Public routes may be anonymous. Treat auth/RLS denials as empty results.
      if (
        status === 401 ||
        status === 403 ||
        code === '42501' ||
        message.includes('jwt') ||
        message.includes('not authorized') ||
        message.includes('permission denied')
      ) {
        if (import.meta.env.DEV) {
          console.warn('Properties not readable for anonymous user; using fallback data.');
        }
        return [];
      }
      throw error;
    }

    const properties: Property[] = data?.map(mapSupabaseToProperty) || [];
    const summaries = await fetchPropertyLeaseSummaries(properties.map((p) => p.id));
    return mergeLeaseSummariesIntoProperties(properties, summaries);
  } catch (error) {
    // Check if it's a network/DNS error
    if (
      error instanceof Error &&
      (error.message.includes('ERR_NAME_NOT_RESOLVED') ||
        error.message.includes('Failed to fetch') ||
        error.message.includes('network'))
    ) {
      console.warn(
        'Network error fetching properties - this may be due to incorrect Supabase URL in .env file. Check VITE_SUPABASE_URL.'
      );
    } else {
      console.error('Error fetching properties:', error);
    }
    return [];
  }
};

/**
 * Get a property by ID.
 * Demo property IDs (e.g. demo-prop-abuja-1) are resolved from local data only to avoid Supabase 400.
 */
export const getPropertyById = async (id: string): Promise<Property | null> => {
  const demo = demoProperties.find((p) => p.id === id);
  if (demo) {
    return demo;
  }

  try {
    const { data, error } = await supabase.from('properties').select('*').eq('id', id).single();

    if (error) throw error;

    if (!data) return null;

    const property = mapSupabaseToProperty(data);
    const summaries = await fetchPropertyLeaseSummaries([property.id]);
    return mergeLeaseSummariesIntoProperties([property], summaries)[0];
  } catch (error) {
    if (
      error instanceof Error &&
      (error.message.includes('ERR_NAME_NOT_RESOLVED') ||
        error.message.includes('Failed to fetch') ||
        error.message.includes('network'))
    ) {
      console.warn(
        `Network error fetching property ${id} - this may be due to incorrect Supabase URL in .env file. Check VITE_SUPABASE_URL.`
      );
    } else {
      console.error('Error fetching property by ID:', error);
    }
    return null;
  }
};
