import { supabase } from '@/integrations/supabase/client';

export type TourRequestStatus = 'pending' | 'in_progress' | 'scheduled' | 'completed' | 'cancelled';

export interface TourServiceRequest {
  id: string;
  property_id: string;
  requested_by: string;
  status: TourRequestStatus;
  notes: string | null;
  admin_notes: string | null;
  scheduled_at: string | null;
  assigned_to: string | null;
  tour_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface AdminTourServiceRequest extends TourServiceRequest {
  property_name: string | null;
  requester_name: string | null;
  requester_email: string | null;
}

const ACTIVE_STATUSES: TourRequestStatus[] = ['pending', 'in_progress', 'scheduled'];

export async function createTourServiceRequest(
  propertyId: string,
  requestedBy: string,
  notes?: string
): Promise<{ request: TourServiceRequest; alreadyExists: boolean }> {
  const supabaseAny = supabase as any;

  const { data: existing, error: existingError } = await supabaseAny
    .from('property_tour_service_requests')
    .select('*')
    .eq('property_id', propertyId)
    .eq('requested_by', requestedBy)
    .in('status', ACTIVE_STATUSES)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existingError) {
    throw new Error(existingError.message);
  }

  if (existing) {
    return { request: existing as TourServiceRequest, alreadyExists: true };
  }

  const { data, error } = await supabaseAny
    .from('property_tour_service_requests')
    .insert({
      property_id: propertyId,
      requested_by: requestedBy,
      status: 'pending',
      notes: notes?.trim() ? notes.trim() : null,
    })
    .select('*')
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return { request: data as TourServiceRequest, alreadyExists: false };
}

export async function getMyLatestTourRequest(
  propertyId: string,
  requestedBy: string
): Promise<TourServiceRequest | null> {
  const supabaseAny = supabase as any;
  const { data, error } = await supabaseAny
    .from('property_tour_service_requests')
    .select('*')
    .eq('property_id', propertyId)
    .eq('requested_by', requestedBy)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  // Transient failures (503, network) should not break the property form — tour status is optional UI.
  if (error) {
    console.warn('[tourServiceRequests] getMyLatestTourRequest failed:', error.message);
    return null;
  }

  return (data as TourServiceRequest | null) ?? null;
}

export async function getAdminTourRequests(): Promise<AdminTourServiceRequest[]> {
  const supabaseAny = supabase as any;

  // No PostgREST embeds: hosted projects may lack FK metadata in the schema cache (properties / profiles).
  const { data, error } = await supabaseAny
    .from('property_tour_service_requests')
    .select(
      `
        id,
        property_id,
        requested_by,
        status,
        notes,
        admin_notes,
        scheduled_at,
        assigned_to,
        tour_url,
        created_at,
        updated_at
      `
    )
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  const rows = (data ?? []) as any[];

  const requesterIds = [...new Set(rows.map((r) => r.requested_by).filter(Boolean))] as string[];
  const propertyIds = [...new Set(rows.map((r) => r.property_id).filter(Boolean))] as string[];

  const profileById = new Map<
    string,
    { first_name: string | null; last_name: string | null; email: string }
  >();
  const propertyNameById = new Map<string, string | null>();

  if (requesterIds.length > 0) {
    const { data: profs, error: pe } = await supabaseAny
      .from('profiles')
      .select('id, first_name, last_name, email')
      .in('id', requesterIds);
    if (pe) {
      console.warn('[tourServiceRequests] profiles lookup for requesters:', pe.message);
    } else if (profs) {
      for (const p of profs as any[]) {
        profileById.set(p.id, {
          first_name: p.first_name,
          last_name: p.last_name,
          email: p.email,
        });
      }
    }
  }

  if (propertyIds.length > 0) {
    const { data: props, error: perr } = await supabaseAny
      .from('properties')
      .select('id, name')
      .in('id', propertyIds);
    if (perr) {
      console.warn('[tourServiceRequests] properties lookup:', perr.message);
    } else if (props) {
      for (const p of props as any[]) {
        propertyNameById.set(p.id, p.name ?? null);
      }
    }
  }

  return rows.map((row) => {
    const reqProfile = profileById.get(row.requested_by);
    return {
      id: row.id,
      property_id: row.property_id,
      requested_by: row.requested_by,
      status: row.status,
      notes: row.notes,
      admin_notes: row.admin_notes,
      scheduled_at: row.scheduled_at,
      assigned_to: row.assigned_to,
      tour_url: row.tour_url,
      created_at: row.created_at,
      updated_at: row.updated_at,
      property_name: propertyNameById.get(row.property_id) ?? null,
      requester_name: reqProfile
        ? [reqProfile.first_name, reqProfile.last_name].filter(Boolean).join(' ').trim() || null
        : null,
      requester_email: reqProfile?.email ?? null,
    };
  });
}

export async function updateTourRequestStatus(
  requestId: string,
  payload: {
    status: TourRequestStatus;
    admin_notes?: string | null;
    scheduled_at?: string | null;
    tour_url?: string | null;
  }
): Promise<void> {
  const supabaseAny = supabase as any;
  const { data, error } = await supabaseAny
    .from('property_tour_service_requests')
    .update({
      status: payload.status,
      admin_notes: payload.admin_notes ?? null,
      scheduled_at: payload.scheduled_at ?? null,
      tour_url: payload.tour_url ?? null,
    })
    .eq('id', requestId)
    .select('property_id, status, tour_url')
    .single();

  if (error) {
    throw new Error(error.message);
  }

  // Minimal sync bridge:
  // Once a request is completed with a URL, publish it to the property record
  // so PropertyDetail/PublicPropertyDetail can render it via property.tourUrl.
  if (data?.status === 'completed' && data?.tour_url) {
    const { error: propertyUpdateError } = await supabaseAny
      .from('properties')
      .update({ tour_url: data.tour_url })
      .eq('id', data.property_id);

    if (propertyUpdateError) {
      throw new Error(propertyUpdateError.message);
    }
  }
}
