
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { addDays, differenceInDays, parseISO } from "https://deno.land/x/date_fns@v2.29.3/index.js";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface Lease {
  id: string;
  tenant_id: string;
  property_id: string;
  end_date: string;
}

// Returns true if a new notification was created
async function createLeaseExpiryNotification(
  supabase: SupabaseClient,
  tenantId: string,
  leaseId: string,
  propertyId: string,
  expiryDate: string,
  milestoneDays: number
): Promise<boolean> {
  const { count, error: checkError } = await supabase
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('type', 'lease')
    .eq('metadata->>lease_id', leaseId)
    .eq('metadata->>milestone_days', milestoneDays);
    
  if (checkError) {
    console.error(`Error checking for existing lease notification for lease ${leaseId}:`, checkError);
    return false;
  }
  
  if (count !== null && count > 0) {
    // Already sent, do nothing
    return false;
  }

  const daysRemaining = differenceInDays(parseISO(expiryDate), new Date());
  const message = `Your lease is expiring in ${daysRemaining} days on ${new Date(expiryDate).toLocaleDateString()}. Please contact your property manager to discuss renewal options.`;
  
  const { error: insertError } = await supabase.from('notifications').insert({
      user_id: tenantId,
      title: `Lease Expiry Reminder`,
      description: message,
      type: 'lease',
      link: `/documents`,
      metadata: { lease_id: leaseId, property_id: propertyId, milestone_days: milestoneDays }
  });

  if (insertError) {
    console.error(`Error sending lease expiry notification for lease ${leaseId}:`, insertError);
    return false;
  }
  
  console.log(`Lease expiry notification created for tenant ${tenantId} for lease ${leaseId} (${milestoneDays} days milestone).`);
  return true;
}

async function getExpiringLeases(supabase: SupabaseClient): Promise<Lease[]> {
    const today = new Date();
    const ninetyDaysFromNow = addDays(today, 90);

    const { data, error } = await supabase
      .from('lease_agreements')
      .select('id, tenant_id, property_id, end_date')
      .lte('end_date', ninetyDaysFromNow.toISOString().split('T')[0])
      .gt('end_date', today.toISOString().split('T')[0])
      .eq('status', 'active');
      
    if (error) {
      console.error('Error fetching expiring leases:', error);
      throw error;
    }
    
    return (data || []) as Lease[];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const expiringLeases = await getExpiringLeases(supabase);
    
    if (expiringLeases.length === 0) {
      return new Response(JSON.stringify({ message: 'No expiring leases found to process.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    let notificationsCreated = 0;
    const milestones = [90, 60, 30, 14, 7, 1];
    
    for (const lease of expiringLeases) {
        const daysRemaining = differenceInDays(parseISO(lease.end_date), new Date());
        
        const applicableMilestone = milestones.find(m => daysRemaining <= m);

        if (applicableMilestone) {
            const created = await createLeaseExpiryNotification(
                supabase,
                lease.tenant_id,
                lease.id,
                lease.property_id,
                lease.end_date,
                applicableMilestone
            );
            if (created) {
                notificationsCreated++;
            }
        }
    }
    
    return new Response(JSON.stringify({ message: `Processed ${expiringLeases.length} expiring leases. Created ${notificationsCreated} new notifications.` }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Error in lease-milestone-notifier function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
