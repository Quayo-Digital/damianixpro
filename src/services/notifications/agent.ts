import { supabase } from '@/integrations/supabase/client';
import { Property } from '@/services/property';

interface AgentAssignmentNotificationData {
  agentId: string;
  propertyId: string;
  propertyName: string;
  ownerId: string;
  ownerName: string;
  ownerEmail: string;
  ownerPhone?: string;
  commissionRate: number | string;
}

/**
 * Sends a notification to an agent when they are assigned to a property
 */
export async function sendAgentAssignmentNotification(
  data: AgentAssignmentNotificationData
): Promise<{ success: boolean; error: any }> {
  if (!data.agentId) {
    console.error('Agent ID is missing, cannot send notification.');
    return { success: false, error: new Error('Agent ID is missing.') };
  }

  const commissionRate =
    typeof data.commissionRate === 'string' ? parseFloat(data.commissionRate) : data.commissionRate;

  const commissionPercentage = (commissionRate * 100).toFixed(2);

  const { error } = await supabase.from('notifications').insert({
    user_id: data.agentId,
    title: `New Property Assignment: ${data.propertyName}`,
    description: `You have been assigned to manage "${data.propertyName}" by ${data.ownerName} (${data.ownerEmail}). Commission Rate: ${commissionPercentage}%`,
    type: 'general',
    link: `/properties/${data.propertyId}`,
    metadata: {
      property_id: data.propertyId,
      property_name: data.propertyName,
      owner_id: data.ownerId,
      owner_name: data.ownerName,
      owner_email: data.ownerEmail,
      owner_phone: data.ownerPhone,
      commission_rate: commissionRate,
      commission_percentage: commissionPercentage,
      assignment_date: new Date().toISOString(),
    },
  });

  if (error) {
    console.error('Error sending agent assignment notification:', error);
    return { success: false, error };
  }

  return { success: true, error: null };
}
