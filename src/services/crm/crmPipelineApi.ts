import type {
  CrmAgentOption,
  CrmDeal,
  CrmInspection,
  CrmLead,
  CrmLeadDetailResponse,
  CrmReminder,
} from '@/types/crmPipeline';
import { apiFetchJson } from '@/services/http/apiClient';

const API_BASE = import.meta.env.VITE_VOICE_SERVER_URL || 'http://localhost:4000';

export async function listCrmDeals(stage?: string): Promise<{ deals: CrmDeal[] }> {
  const qs = stage ? `?stage=${encodeURIComponent(stage)}` : '';
  return apiFetchJson(`${API_BASE}/api/crm/deals${qs}`);
}

export async function listCrmLeads(): Promise<{ leads: CrmLead[] }> {
  return apiFetchJson(`${API_BASE}/api/crm/leads`);
}

export async function getCrmLead(leadId: string): Promise<CrmLeadDetailResponse> {
  return apiFetchJson(`${API_BASE}/api/crm/leads/${encodeURIComponent(leadId)}`);
}

export async function patchCrmLead(
  leadId: string,
  patch: Partial<{
    full_name: string;
    email: string | null;
    phone: string | null;
    source: string | null;
    notes: string | null;
    property_id: string | null;
  }>
): Promise<{ lead: CrmLead }> {
  return apiFetchJson(`${API_BASE}/api/crm/leads/${encodeURIComponent(leadId)}`, {
    method: 'PATCH',
    body: JSON.stringify(patch),
  });
}

export async function listCrmAgentOptions(): Promise<{ agents: CrmAgentOption[] }> {
  return apiFetchJson(`${API_BASE}/api/crm/agent-options`);
}

export async function getCrmDealDetail(
  dealId: string
): Promise<{ deal: CrmDeal; inspections: CrmInspection[]; reminders: CrmReminder[] }> {
  return apiFetchJson(`${API_BASE}/api/crm/deals/${encodeURIComponent(dealId)}`);
}

export async function createCrmLead(payload: {
  full_name: string;
  email?: string;
  phone?: string;
  source?: string;
  notes?: string;
  property_id?: string | null;
}): Promise<{ lead: CrmLead }> {
  return apiFetchJson(`${API_BASE}/api/crm/leads`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function createCrmDeal(payload: {
  title?: string;
  lead_id?: string | null;
  property_id?: string | null;
  assigned_agent_id?: string | null;
  budget_min?: number | null;
  budget_max?: number | null;
  next_follow_up_at?: string | null;
}): Promise<{ deal: CrmDeal }> {
  return apiFetchJson(`${API_BASE}/api/crm/deals`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function patchCrmDeal(
  dealId: string,
  patch: Partial<{
    title: string;
    stage: string;
    outcome: string;
    property_id: string | null;
    assigned_agent_id: string | null;
    budget_min: number | null;
    budget_max: number | null;
    next_follow_up_at: string | null;
  }>
): Promise<{ deal: CrmDeal }> {
  return apiFetchJson(`${API_BASE}/api/crm/deals/${dealId}`, {
    method: 'PATCH',
    body: JSON.stringify(patch),
  });
}

export async function createCrmInspection(
  dealId: string,
  payload: {
    scheduled_start: string;
    scheduled_end?: string | null;
    notes?: string;
    status?: string;
  }
): Promise<{ inspection: CrmInspection }> {
  const res = await fetch(`${API_BASE}/api/crm/deals/${dealId}/inspections`, {
    method: 'POST',
    headers: await authHeaders(),
    body: JSON.stringify(payload),
  });
  return parseJson(res) as { inspection: CrmInspection };
}

export async function createCrmReminder(
  dealId: string,
  payload: { remind_at: string; body?: string }
): Promise<{ reminder: CrmReminder }> {
  const res = await fetch(`${API_BASE}/api/crm/deals/${dealId}/reminders`, {
    method: 'POST',
    headers: await authHeaders(),
    body: JSON.stringify(payload),
  });
  return parseJson(res) as { reminder: CrmReminder };
}

export async function completeCrmReminder(reminderId: string): Promise<{ reminder: CrmReminder }> {
  const res = await fetch(`${API_BASE}/api/crm/reminders/${reminderId}/complete`, {
    method: 'PATCH',
    headers: await authHeaders(),
    body: JSON.stringify({}),
  });
  return parseJson(res) as { reminder: CrmReminder };
}

export async function listUpcomingReminders(days?: number): Promise<{ reminders: CrmReminder[] }> {
  const qs = days != null ? `?days=${encodeURIComponent(String(days))}` : '';
  const res = await fetch(`${API_BASE}/api/crm/reminders/upcoming${qs}`, {
    headers: await authHeaders(),
  });
  return parseJson(res) as { reminders: CrmReminder[] };
}
