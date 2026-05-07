import { supabase } from '@/integrations/supabase/client';

type ActivationEventAction = 'started' | 'completed' | 'skipped';
type ActivationStepId =
  | 'create_company'
  | 'add_property'
  | 'add_units'
  | 'add_tenants'
  | 'activate_payments';

type ActivationEvent = {
  stepId: ActivationStepId;
  action: ActivationEventAction;
  at: string;
};

export type ActivationFunnelReport = {
  usersWithStep1Started: number;
  usersWithStep5Completed: number;
  conversionRatePct: number;
  avgMinutesStep1ToStep5: number | null;
  snapshotAt: string;
};

function isEvent(x: unknown): x is ActivationEvent {
  if (!x || typeof x !== 'object') return false;
  const r = x as { stepId?: string; action?: string; at?: string };
  return (
    typeof r.stepId === 'string' &&
    typeof r.action === 'string' &&
    typeof r.at === 'string' &&
    ['create_company', 'add_property', 'add_units', 'add_tenants', 'activate_payments'].includes(
      r.stepId
    ) &&
    ['started', 'completed', 'skipped'].includes(r.action)
  );
}

export async function fetchActivationFunnelReport(): Promise<ActivationFunnelReport> {
  const { data, error } = await supabase.from('organization_setup_state').select('user_id,state');
  if (error) throw error;

  const usersWithStep1Started = new Set<string>();
  const usersWithStep5Completed = new Set<string>();
  const durationsMinutes: number[] = [];

  for (const row of data || []) {
    const uid = String((row as { user_id?: string }).user_id || '');
    if (!uid) continue;
    const state = (row as { state?: unknown }).state;
    if (!state || typeof state !== 'object') continue;

    const eventsRaw = (state as { activationEvents?: unknown }).activationEvents;
    if (!Array.isArray(eventsRaw)) continue;
    const events = eventsRaw.filter(isEvent);
    if (!events.length) continue;

    const step1StartedAt = events
      .filter((e) => e.stepId === 'create_company' && e.action === 'started')
      .map((e) => e.at)
      .sort()[0];
    const step5CompletedAt = events
      .filter((e) => e.stepId === 'activate_payments' && e.action === 'completed')
      .map((e) => e.at)
      .sort()[0];

    if (step1StartedAt) usersWithStep1Started.add(uid);
    if (step5CompletedAt) usersWithStep5Completed.add(uid);

    if (step1StartedAt && step5CompletedAt) {
      const ms = new Date(step5CompletedAt).getTime() - new Date(step1StartedAt).getTime();
      if (Number.isFinite(ms) && ms >= 0) durationsMinutes.push(ms / 60000);
    }
  }

  const started = usersWithStep1Started.size;
  const completed = usersWithStep5Completed.size;
  const conversionRatePct = started > 0 ? Math.round((completed / started) * 1000) / 10 : 0;
  const avgMinutesStep1ToStep5 =
    durationsMinutes.length > 0
      ? Math.round(
          (durationsMinutes.reduce((sum, n) => sum + n, 0) / Math.max(durationsMinutes.length, 1)) *
            10
        ) / 10
      : null;

  return {
    usersWithStep1Started: started,
    usersWithStep5Completed: completed,
    conversionRatePct,
    avgMinutesStep1ToStep5,
    snapshotAt: new Date().toISOString(),
  };
}
