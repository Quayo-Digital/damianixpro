
import { supabase } from '@/integrations/supabase/client';
import { Milestone } from '@/components/tenants/milestones/types';

export const fetchMilestones = async (): Promise<Milestone[]> => {
  const { data, error } = await supabase
    .from('rental_milestones')
    .select('*')
    .order('date', { ascending: true });

  if (error) {
    console.error('Error fetching milestones:', error);
    throw new Error('Failed to fetch rental milestones');
  }

  return data as Milestone[];
};

export const updateMilestoneNotificationSent = async (milestoneId: string): Promise<Milestone> => {
  const { data, error } = await supabase
    .from('rental_milestones')
    .update({ notification_sent: true, updated_at: new Date().toISOString() })
    .eq('id', milestoneId)
    .select()
    .single();

  if (error) {
    console.error('Error updating milestone notification status:', error);
    throw new Error('Failed to update milestone');
  }

  return data as Milestone;
};

export const checkAndSyncMilestones = async (): Promise<void> => {
  console.log('Checking and syncing milestones...');
  // In a real app, this would trigger a backend process, like a Supabase Edge Function.
  // For now, this is a placeholder to simulate the check.
  await new Promise(resolve => setTimeout(resolve, 1000));
};
