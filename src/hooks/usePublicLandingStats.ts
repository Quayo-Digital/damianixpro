import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type PublicLandingStats = {
  properties_count: number;
  successful_rent_volume_ngn: number;
  landlords_managers_count: number;
};

/** Matches legacy static hero copy when RPC fails or DB is empty in dev. */
export const FALLBACK_LANDING_STATS: PublicLandingStats = {
  properties_count: 10_000,
  successful_rent_volume_ngn: 2_000_000_000,
  landlords_managers_count: 500,
};

async function fetchPublicLandingStats(): Promise<PublicLandingStats> {
  const { data, error } = await supabase.rpc('get_public_landing_stats');

  if (error) throw new Error(error.message);

  const row = Array.isArray(data) ? data[0] : data;
  if (!row || typeof row !== 'object') {
    throw new Error('Empty landing stats response');
  }

  const rec = row as Record<string, unknown>;

  return {
    properties_count: Number(rec.properties_count ?? 0),
    successful_rent_volume_ngn: Number(rec.successful_rent_volume_ngn ?? 0),
    landlords_managers_count: Number(rec.landlords_managers_count ?? 0),
  };
}

export function usePublicLandingStats() {
  return useQuery({
    queryKey: ['public-landing-stats'],
    queryFn: fetchPublicLandingStats,
    staleTime: 5 * 60_000,
    gcTime: 30 * 60_000,
    retry: 1,
  });
}
