import { supabase } from '@/integrations/supabase/client';
import { Tenant, Message, LandlordAgent } from './types';

// Fetch all tenants with their primary property
export const fetchTenants = async (): Promise<Tenant[]> => {
  const { data: tenantsData, error } = await supabase.from('tenants').select(`
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
    .filter((t) => t.property_id);

  return formattedTenants;
};

// Fetch messages between two users (works for both tenant-landlord and landlord-tenant)
export const fetchMessages = async (userId1: string, userId2: string): Promise<Message[]> => {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .or(
      `(sender_id.eq.${userId1},recipient_id.eq.${userId2}),(sender_id.eq.${userId2},recipient_id.eq.${userId1})`
    )
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
  senderId, // this is manager's user_id
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

// Fetch landlords/agents that a tenant can message (based on their active lease)
export const fetchLandlordsAgents = async (tenantUserId: string): Promise<LandlordAgent[]> => {
  try {
    // First, get the tenant record
    const { data: tenantRecord, error: tenantError } = await supabase
      .from('tenants')
      .select('id')
      .eq('user_id', tenantUserId)
      .maybeSingle();

    if (tenantError) {
      console.error('Error fetching tenant record:', tenantError);
      throw new Error('Failed to fetch tenant record');
    }

    if (!tenantRecord) {
      console.log('No tenant record found for user:', tenantUserId);
      return [];
    }

    // Get active leases for this tenant
    const { data: leases, error: leasesError } = await supabase
      .from('leases')
      .select(
        `
        id,
        property_id,
        properties!inner(
          id,
          name,
          owner_id,
          agent_id
        )
      `
      )
      .eq('tenant_id', tenantRecord.id)
      .eq('status', 'ACTIVE');

    if (leasesError) {
      console.error('Error fetching leases:', leasesError);
      throw new Error('Failed to fetch leases');
    }

    if (!leases || leases.length === 0) {
      console.log('No active leases found for tenant');
      return [];
    }

    // Collect unique owner_ids and agent_ids
    const ownerIds = new Set<string>();
    const agentIds = new Set<string>();
    const propertyMap = new Map<string, { name: string; property_id: string }>();

    leases.forEach((lease: any) => {
      const property = lease.properties;
      if (property) {
        propertyMap.set(property.id, {
          name: property.name || 'Unknown Property',
          property_id: property.id,
        });

        if (property.owner_id) {
          ownerIds.add(property.owner_id);
        }
        if (property.agent_id) {
          agentIds.add(property.agent_id);
        }
      }
    });

    // Fetch profiles for owners and agents
    const allIds = Array.from(new Set([...ownerIds, ...agentIds]));

    if (allIds.length === 0) {
      return [];
    }

    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, role')
      .in('id', allIds)
      .in('role', ['owner', 'agent', 'admin']); // Only fetch owners/agents

    if (profilesError) {
      console.error('Error fetching profiles:', profilesError);
      throw new Error('Failed to fetch landlord/agent profiles');
    }

    if (!profiles || profiles.length === 0) {
      return [];
    }

    // Map profiles to LandlordAgent format
    const landlordsAgents: LandlordAgent[] = [];
    const processedIds = new Set<string>();

    leases.forEach((lease: any) => {
      const property = lease.properties;
      const propertyInfo = propertyMap.get(property.id);

      if (!propertyInfo) return;

      // Add owner if exists and not already added
      if (property.owner_id && !processedIds.has(property.owner_id)) {
        const ownerProfile = profiles.find((p) => p.id === property.owner_id);
        if (ownerProfile && (ownerProfile.role === 'owner' || ownerProfile.role === 'admin')) {
          landlordsAgents.push({
            id: ownerProfile.id,
            user_id: ownerProfile.id,
            name:
              `${ownerProfile.first_name || ''} ${ownerProfile.last_name || ''}`.trim() ||
              'Property Owner',
            role: 'owner',
            property: propertyInfo.name,
            property_id: propertyInfo.property_id,
          });
          processedIds.add(property.owner_id);
        }
      }

      // Add agent if exists and not already added
      if (property.agent_id && !processedIds.has(property.agent_id)) {
        const agentProfile = profiles.find((p) => p.id === property.agent_id);
        if (agentProfile && agentProfile.role === 'agent') {
          landlordsAgents.push({
            id: agentProfile.id,
            user_id: agentProfile.id,
            name:
              `${agentProfile.first_name || ''} ${agentProfile.last_name || ''}`.trim() ||
              'Property Agent',
            role: 'agent',
            property: propertyInfo.name,
            property_id: propertyInfo.property_id,
          });
          processedIds.add(property.agent_id);
        }
      }
    });

    return landlordsAgents;
  } catch (error) {
    console.error('Error in fetchLandlordsAgents:', error);
    throw error;
  }
};
