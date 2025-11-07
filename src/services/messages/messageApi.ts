
import { supabase } from '@/integrations/supabase/client';
import { Tenant, Message } from './types';

// Fetch all tenants with their primary property
export const fetchTenants = async (): Promise<Tenant[]> => {
  const { data: tenantsData, error } = await supabase
    .from('tenants')
    .select(`
      id,
      user_id,
      first_name,
      last_name,
      property_tenants!inner(
        properties(id, name)
      )
    `);

  if (error) {
    console.error('Error fetching tenants:', error);
    throw new Error('Failed to fetch tenants');
  }

  // Format the data to match the Tenant interface
  const formattedTenants: Tenant[] = tenantsData
    .map((t: any) => {
      // Find the first associated property for display
      const propertyInfo = t.property_tenants[0]?.properties;
      return {
        id: t.id,
        user_id: t.user_id,
        name: `${t.first_name || ''} ${t.last_name || ''}`.trim(),
        property: propertyInfo?.name || 'No assigned property',
        property_id: propertyInfo?.id || '',
      };
    })
    // Filter out tenants without a valid property link for cleaner messaging UI
    .filter(t => t.property_id);

  return formattedTenants;
};


// Fetch messages between the manager and a specific tenant
export const fetchMessages = async (tenantUserId: string, managerId: string): Promise<Message[]> => {
    const { data, error } = await supabase
        .from('messages')
        .select('*')
        .or(`(sender_id.eq.${managerId},recipient_id.eq.${tenantUserId}),(sender_id.eq.${tenantUserId},recipient_id.eq.${managerId})`)
        .order('created_at', { ascending: true });

    if (error) {
        console.error('Error fetching messages:', error);
        throw new Error('Failed to fetch messages');
    }
    return data as Message[];
};


// Send a message
export const sendMessage = async ({
  content,
  recipientId, // this is the tenant's user_id
  senderId,    // this is manager's user_id
}: {
  content: string;
  recipientId: string;
  senderId: string;
}): Promise<any> => {
  const { data, error } = await supabase
    .from('messages')
    .insert([{ content, recipient_id: recipientId, sender_id: senderId }])
    .select();
  
  if (error) {
    console.error('Error sending message:', error);
    throw new Error('Failed to send message');
  }

  return data;
};
