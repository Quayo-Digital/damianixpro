import { supabase } from '@/integrations/supabase/client';
import type { Json } from '@/integrations/supabase/types';

export type SetupWizardPersistedState = {
  companyName?: string;
  timeZone?: string;
  industryType?: string;
  lastFileName?: string;
  lastImportAt?: string;
  lastImportSummary?: string;
  activationCurrentStep?: number;
  activationStatus?: Record<
    string,
    {
      completed?: boolean;
      skipped?: boolean;
    }
  >;
  activationEvents?: Array<{
    stepId: string;
    action: 'started' | 'completed' | 'skipped';
    at: string;
  }>;
};

export async function loadSetupWizardState(userId: string): Promise<{
  step: number;
  state: SetupWizardPersistedState;
} | null> {
  const { data, error } = await supabase
    .from('organization_setup_state')
    .select('step,state')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    console.warn('organization_setup_state load:', error.message);
    return null;
  }
  if (!data) return null;
  return {
    step: data.step,
    state: (data.state && typeof data.state === 'object'
      ? data.state
      : {}) as SetupWizardPersistedState,
  };
}

export async function saveSetupWizardState(
  userId: string,
  step: number,
  state: SetupWizardPersistedState,
  organizationId?: string | null
): Promise<void> {
  const { error } = await supabase.from('organization_setup_state').upsert(
    {
      user_id: userId,
      step,
      state: state as Json,
      organization_id: organizationId ?? null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id' }
  );

  if (error) {
    console.warn('organization_setup_state save:', error.message);
  }
}
