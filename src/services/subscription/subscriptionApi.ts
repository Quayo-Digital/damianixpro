
import { supabase } from '@/integrations/supabase/client';
import { Subscription } from './types';

export const createPendingSubscription = async (
  userId: string,
  planId: string, // e.g. 'basic-monthly'
  planCode: string
): Promise<Subscription> => {
  const { data, error } = await supabase
    .from('subscriptions')
    .insert({
      user_id: userId,
      plan_id: planId,
      status: 'pending',
      paystack_plan_code: planCode,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating pending subscription:', error);
    throw error;
  }

  return data as Subscription;
};

export const getUserSubscription = async (userId: string): Promise<Subscription | null> => {
    const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', userId)
        .in('status', ['active', 'past_due'])
        .maybeSingle();

    if (error) {
        console.error('Error fetching user subscription', error);
        throw error;
    }

    return data as Subscription | null;
}
