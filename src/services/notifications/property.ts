import { supabase } from '@/integrations/supabase/client';
import { Property } from '@/services/property';
import { User } from '@supabase/supabase-js';

export async function sendViewingRequestNotification(
  agentId: string,
  property: Pick<Property, 'id' | 'name'>,
  requester: User
): Promise<{ success: boolean; error: any }> {
  if (!agentId) {
    console.error('Agent ID is missing, cannot send notification.');
    return { success: false, error: new Error('Agent ID is missing.') };
  }

  const { error } = await supabase.from('notifications').insert({
    user_id: agentId,
    title: `New Viewing Request: ${property.name}`,
    description: `A user (${requester.email}) has requested a viewing for your property.`,
    type: 'general',
    link: `/properties/${property.id}`,
    metadata: {
      property_id: property.id,
      requester_id: requester.id,
      requester_email: requester.email,
    },
  });

  if (error) {
    console.error('Error sending viewing request notification:', error);
    return { success: false, error };
  }

  return { success: true, error: null };
}
