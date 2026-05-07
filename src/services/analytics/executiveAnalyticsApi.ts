import { supabase } from '@/integrations/supabase/client';

/**
 * Prefer a dedicated analytics base URL so this surface can be deployed
 * independently from the voice/payment sidecar. Falls back to the voice
 * server URL for existing single-host deployments, then to localhost.
 */
function resolveAnalyticsApiBase(): string {
  const env = import.meta.env as Record<string, string | undefined>;
  return env.VITE_ANALYTICS_API_URL || env.VITE_VOICE_SERVER_URL || 'http://localhost:4000';
}

export type ExecutiveMonthlyPoint = {
  month: string;
  collected: number;
  /**
   * Per-month outstanding amount. Currently unused by the dashboard and not
   * emitted by the server (snapshot arrears live on `kpis.arrears_ngn`).
   * Kept optional so older clients/builds don't fail type-checking.
   */
  outstanding?: number;
  maintenance_ngn: number;
};

export type ExecutiveTopProperty = {
  property_id: string;
  name: string;
  revenue_ngn: number;
};

export type ExecutiveFilterProperty = {
  id: string;
  name: string;
};

export type ExecutiveAnalyticsPayload = {
  range: { from: string; to: string };
  kpis: {
    total_revenue_ngn: number;
    rent_collected_ngn: number;
    rent_outstanding_ngn: number;
    arrears_ngn: number | null;
    occupancy_rate: number;
    maintenance_costs_ngn: number;
    maintenance_breakdown?: {
      tickets_ngn: number;
      expenses_ngn: number;
      combined_ngn: number;
    };
  };
  occupancy: {
    rate: number;
    occupied_properties: number;
    total_properties: number;
  };
  series: { monthly: ExecutiveMonthlyPoint[] };
  top_properties: ExecutiveTopProperty[];
  filter_options?: { properties: ExecutiveFilterProperty[] };
  meta?: {
    scoped_empty?: boolean;
    payment_rows_used?: number;
    scope?: string;
    property_filter?: string | null;
    revenue_basis?: string;
    arrears_available?: boolean;
  };
};

async function authHeaders(): Promise<HeadersInit> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error('Sign in to view executive analytics.');
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
}

export async function fetchExecutiveAnalytics(params?: {
  dateFrom?: string;
  dateTo?: string;
  propertyId?: string | null;
}): Promise<ExecutiveAnalyticsPayload> {
  const qs = new URLSearchParams();
  if (params?.dateFrom) qs.set('date_from', params.dateFrom);
  if (params?.dateTo) qs.set('date_to', params.dateTo);
  if (params?.propertyId) qs.set('property_id', params.propertyId);
  const suffix = qs.toString() ? `?${qs.toString()}` : '';

  const res = await fetch(`${resolveAnalyticsApiBase()}/api/analytics/executive${suffix}`, {
    headers: await authHeaders(),
  });

  const body = (await res.json().catch(() => ({}))) as ExecutiveAnalyticsPayload & {
    error?: string;
  };
  if (!res.ok) {
    throw new Error(body.error || res.statusText || 'Failed to load analytics.');
  }
  return body;
}
