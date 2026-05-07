import { supabase } from '@/integrations/supabase/client';
import type { MaintenanceTicketBundle } from '@/types/maintenanceTickets';

const API_BASE = import.meta.env.VITE_VOICE_SERVER_URL || 'http://localhost:4000';

async function authHeaders(): Promise<HeadersInit> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error('Not authenticated');
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
}

async function parseJson(res: Response) {
  const text = await res.text();
  let body: unknown = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = { raw: text };
  }
  if (!res.ok) {
    const err = (body as { error?: string })?.error || res.statusText;
    throw new Error(typeof err === 'string' ? err : 'Request failed');
  }
  return body;
}

export async function listMaintenanceTickets(
  query?: Record<string, string | undefined>
): Promise<{ tickets: MaintenanceTicketBundle['ticket'][]; count: number }> {
  const q = new URLSearchParams();
  if (query) {
    for (const [k, v] of Object.entries(query)) {
      if (v) q.set(k, v);
    }
  }
  const qs = q.toString();
  const url = `${API_BASE}/api/maintenance/tickets${qs ? `?${qs}` : ''}`;
  const res = await fetch(url, { headers: await authHeaders() });
  return parseJson(res) as { tickets: MaintenanceTicketBundle['ticket'][]; count: number };
}

export async function getMaintenanceTicket(id: string): Promise<MaintenanceTicketBundle> {
  const res = await fetch(`${API_BASE}/api/maintenance/tickets/${id}`, {
    headers: await authHeaders(),
  });
  return parseJson(res) as MaintenanceTicketBundle;
}

export async function createMaintenanceTicket(body: {
  property_id: string;
  unit_id?: string | null;
  title: string;
  description?: string;
  priority?: string;
  /** Required when admin/owner/agent/manager opens a ticket for a tenant (public.tenants.id). */
  tenant_id?: string;
}): Promise<MaintenanceTicketBundle> {
  const res = await fetch(`${API_BASE}/api/maintenance/tickets`, {
    method: 'POST',
    headers: await authHeaders(),
    body: JSON.stringify(body),
  });
  return parseJson(res) as MaintenanceTicketBundle;
}

export async function patchMaintenanceTicket(
  id: string,
  body: Partial<{
    status: string;
    assigned_to: string | null;
    cost_estimate: number;
    actual_cost: number | null;
  }>
): Promise<MaintenanceTicketBundle> {
  const res = await fetch(`${API_BASE}/api/maintenance/tickets/${id}`, {
    method: 'PATCH',
    headers: await authHeaders(),
    body: JSON.stringify(body),
  });
  return parseJson(res) as MaintenanceTicketBundle;
}

export async function postTicketComment(
  id: string,
  comment: string
): Promise<MaintenanceTicketBundle> {
  const res = await fetch(`${API_BASE}/api/maintenance/tickets/${id}/comments`, {
    method: 'POST',
    headers: await authHeaders(),
    body: JSON.stringify({ comment }),
  });
  return parseJson(res) as MaintenanceTicketBundle;
}

export async function postTicketAttachment(
  id: string,
  payload: { file_url: string; file_type?: string | null }
): Promise<MaintenanceTicketBundle> {
  const res = await fetch(`${API_BASE}/api/maintenance/tickets/${id}/attachments`, {
    method: 'POST',
    headers: await authHeaders(),
    body: JSON.stringify(payload),
  });
  return parseJson(res) as MaintenanceTicketBundle;
}

export async function assignMaintenanceTicket(
  id: string,
  assigned_to: string
): Promise<MaintenanceTicketBundle> {
  const res = await fetch(`${API_BASE}/api/maintenance/tickets/${id}/assign`, {
    method: 'POST',
    headers: await authHeaders(),
    body: JSON.stringify({ assigned_to }),
  });
  return parseJson(res) as MaintenanceTicketBundle;
}

export async function resolveMaintenanceTicket(
  id: string,
  body?: { actual_cost?: number | null }
): Promise<MaintenanceTicketBundle> {
  const res = await fetch(`${API_BASE}/api/maintenance/tickets/${id}/resolve`, {
    method: 'POST',
    headers: await authHeaders(),
    body: JSON.stringify(body ?? {}),
  });
  return parseJson(res) as MaintenanceTicketBundle;
}
