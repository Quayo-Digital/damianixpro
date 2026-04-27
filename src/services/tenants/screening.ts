import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const initiateTenantScreening = async (tenantId: string) => {
  try {
    const { error } = await supabase
      .from('tenant_screenings')
      .insert({ tenant_id: tenantId, status: 'pending' });

    if (error) throw error;

    toast.success('Screening Initiated', {
      description: 'Tenant screening process has been successfully started.',
    });

    return true;
  } catch (error: any) {
    console.error('Error initiating tenant screening:', error);
    toast.error('Screening Error', {
      description: error.message || 'Failed to initiate tenant screening.',
    });
    return false;
  }
};

export const getScreenings = async () => {
  const { data, error } = await supabase
    .from('tenant_screenings')
    .select(
      `
      id,
      status,
      created_at,
      results,
      tenants (
        id,
        first_name,
        last_name
      )
    `
    )
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching tenant screenings:', error);
    throw error;
  }
  return data || [];
};

export const getScreeningForTenant = async (tenantId: string) => {
  const { data, error } = await supabase
    .from('tenant_screenings')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error(`Error fetching screening for tenant ${tenantId}:`, error);
    throw error;
  }
  return data;
};

// This simulates a screening process
export const processScreening = async (screeningId: string) => {
  try {
    // 1. Set to in_progress
    let { error } = await supabase
      .from('tenant_screenings')
      .update({ status: 'in_progress' })
      .eq('id', screeningId);
    if (error) throw error;
    toast.info('Screening in progress...', { description: 'The screening process has started.' });

    // 2. Simulate background work
    await new Promise((resolve) => setTimeout(resolve, 3000));

    // 3. Set to completed with mock results
    const mockResults = [
      {
        type: 'background',
        status: 'completed',
        verified: Math.random() > 0.2,
        score: Math.floor(Math.random() * (100 - 50 + 1)) + 50,
      },
      {
        type: 'credit',
        status: 'completed',
        verified: Math.random() > 0.1,
        score: Math.floor(Math.random() * (850 - 500 + 1)) + 500,
      },
      { type: 'criminal', status: 'completed', verified: Math.random() > 0.05 },
      { type: 'employment', status: 'completed', verified: Math.random() > 0.3 },
      { type: 'rental_history', status: 'completed', verified: Math.random() > 0.25 },
    ];

    ({ error } = await supabase
      .from('tenant_screenings')
      .update({ status: 'completed', results: mockResults as any })
      .eq('id', screeningId));
    if (error) throw error;

    toast.success('Screening Completed', {
      description: 'The tenant screening process is complete.',
    });
    return true;
  } catch (error: any) {
    console.error('Error processing screening:', error);
    toast.error('Screening Processing Error', {
      description: error.message || 'Failed to process tenant screening.',
    });
    // Optionally revert status to 'failed'
    await supabase.from('tenant_screenings').update({ status: 'failed' }).eq('id', screeningId);
    return false;
  }
};
