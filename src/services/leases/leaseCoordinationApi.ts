import { supabase } from '@/integrations/supabase/client';
import { buildDefaultPostLeaseCoordinationTasks } from '@/services/leases/leaseCoordinationDefaults';
import type {
  CoordinationPhase,
  CoordinationTask,
  LeaseCoordinationChecklistRow,
} from '@/services/leases/leaseCoordinationTypes';

function isMissingTableError(err: { code?: string; message?: string } | null): boolean {
  if (!err) return false;
  if (err.code === '42P01') return true;
  const m = (err.message || '').toLowerCase();
  return m.includes('does not exist') && m.includes('lease_coordination');
}

function parseTasks(raw: unknown): CoordinationTask[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter(
    (t) => t && typeof t === 'object' && 'key' in t && 'title' in t
  ) as CoordinationTask[];
}

export async function getLeaseCoordinationChecklist(
  leaseId: string
): Promise<LeaseCoordinationChecklistRow | null> {
  const { data, error } = await supabase
    .from('lease_coordination_checklists')
    .select('*')
    .eq('lease_id', leaseId)
    .maybeSingle();

  if (error) {
    if (isMissingTableError(error)) return null;
    console.error('[leaseCoordination] fetch', error);
    return null;
  }

  if (!data) return null;

  return {
    ...(data as LeaseCoordinationChecklistRow),
    tasks: parseTasks(data.tasks),
  };
}

export async function ensureLeaseCoordinationChecklist(params: {
  leaseId: string;
  propertyId: string;
  tenantId: string;
  leaseStartDate?: string | null;
}): Promise<{ created: boolean; row: LeaseCoordinationChecklistRow | null }> {
  const existing = await getLeaseCoordinationChecklist(params.leaseId);
  if (existing) {
    return { created: false, row: existing };
  }

  const tasks = buildDefaultPostLeaseCoordinationTasks(params.leaseStartDate ?? null);

  const { data, error } = await supabase
    .from('lease_coordination_checklists')
    .insert({
      lease_id: params.leaseId,
      property_id: params.propertyId,
      tenant_id: params.tenantId,
      phase: 'post_executed',
      tasks,
    })
    .select('*')
    .single();

  if (error) {
    if (isMissingTableError(error)) {
      return { created: false, row: null };
    }
    console.error('[leaseCoordination] insert', error);
    return { created: false, row: null };
  }

  return {
    created: true,
    row: {
      ...(data as LeaseCoordinationChecklistRow),
      tasks: parseTasks(data.tasks),
    },
  };
}

export async function updateLeaseCoordinationTasks(
  leaseId: string,
  tasks: CoordinationTask[]
): Promise<boolean> {
  const { error } = await supabase
    .from('lease_coordination_checklists')
    .update({
      tasks,
      updated_at: new Date().toISOString(),
    })
    .eq('lease_id', leaseId);

  if (error) {
    console.error('[leaseCoordination] update tasks', error);
    return false;
  }
  return true;
}

export async function updateLeaseCoordinationPhase(
  leaseId: string,
  phase: CoordinationPhase
): Promise<boolean> {
  const { error } = await supabase
    .from('lease_coordination_checklists')
    .update({
      phase,
      updated_at: new Date().toISOString(),
    })
    .eq('lease_id', leaseId);

  if (error) {
    console.error('[leaseCoordination] update phase', error);
    return false;
  }
  return true;
}

export async function updateLeaseCoordinationAiHint(
  leaseId: string,
  hint: string | null
): Promise<boolean> {
  const { error } = await supabase
    .from('lease_coordination_checklists')
    .update({
      ai_coordination_hint: hint,
      updated_at: new Date().toISOString(),
    })
    .eq('lease_id', leaseId);

  if (error) {
    console.error('[leaseCoordination] update ai hint', error);
    return false;
  }
  return true;
}
