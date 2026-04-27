import { supabase } from '@/integrations/supabase/client';
import type { CoordinationPhase, CoordinationTask } from '@/services/leases/leaseCoordinationTypes';
import type { LeaseAgreement } from '@/services/applications/types';

const API_BASE = import.meta.env.VITE_VOICE_SERVER_URL || 'http://localhost:4000';

export type LeaseOnboardingAssistResult = { ok: true; text: string } | { ok: false; error: string };

export async function fetchLeaseOnboardingCoordinationPlan(
  lease: Pick<
    LeaseAgreement,
    'property_name' | 'tenant_name' | 'start_date' | 'end_date' | 'status'
  >,
  phase: CoordinationPhase,
  tasks: CoordinationTask[]
): Promise<LeaseOnboardingAssistResult> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const token = session?.access_token;
  if (!token) {
    return { ok: false, error: 'Please sign in to use AI coordination.' };
  }

  const leaseSummary = {
    property_name: lease.property_name ?? null,
    tenant_name: lease.tenant_name ?? null,
    start_date: lease.start_date ?? null,
    end_date: lease.end_date ?? null,
    status: lease.status ?? null,
  };

  const res = await fetch(`${API_BASE}/api/ai/lease-onboarding-coordination`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      lease: leaseSummary,
      phase,
      tasks: tasks.map((t) => ({
        key: t.key,
        title: t.title,
        status: t.status,
        owner_team: t.owner_team,
        due_at: t.due_at,
      })),
    }),
  });

  const data = (await res.json().catch(() => ({}))) as { text?: string; error?: string };

  if (!res.ok) {
    return {
      ok: false,
      error: data.error || `Request failed (${res.status}). Try again later.`,
    };
  }

  const text = data.text?.trim();
  if (!text) {
    return { ok: false, error: 'No response from AI. Try again.' };
  }

  return { ok: true, text };
}
