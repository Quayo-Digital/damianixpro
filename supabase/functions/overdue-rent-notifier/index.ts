import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function getOverduePayments(supabase: SupabaseClient) {
  const today = new Date().toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('rent_payments')
    .select(
      `
        id,
        amount,
        due_date,
        property_tenants (
          tenants (
            user_id
          )
        )
      `
    )
    .eq('status', 'pending')
    .lt('due_date', today);

  if (error) {
    console.error('Error fetching overdue payments:', error);
    throw error;
  }
  return data || [];
}

async function createNotifications(supabase: SupabaseClient, payments: any[]) {
  const notificationsToInsert = [];

  for (const payment of payments) {
    const tenantInfo = payment.property_tenants?.tenants;

    if (tenantInfo && tenantInfo.user_id) {
      const { data: existingNotification, error: checkError } = await supabase
        .from('notifications')
        .select('id')
        .eq('user_id', tenantInfo.user_id)
        .eq('type', 'payment')
        .eq('metadata->>rent_payment_id', payment.id)
        .limit(1)
        .maybeSingle();

      if (checkError) {
        console.error(
          `Error checking for existing notification for payment ${payment.id}:`,
          checkError
        );
        continue;
      }

      if (!existingNotification) {
        notificationsToInsert.push({
          user_id: tenantInfo.user_id,
          title: 'Overdue Rent Payment',
          description: `Your rent payment of ₦${payment.amount.toLocaleString()} was due on ${new Date(payment.due_date).toLocaleDateString()}.`,
          type: 'payment',
          link: '/tenant/dashboard?tab=payments',
          metadata: {
            rent_payment_id: payment.id,
            amount: payment.amount,
            due_date: payment.due_date,
          },
        });
      }
    }
  }

  if (notificationsToInsert.length > 0) {
    const { error: insertError } = await supabase
      .from('notifications')
      .insert(notificationsToInsert);

    if (insertError) {
      console.error('Error inserting notifications:', insertError);
      throw insertError;
    }
  }
  return notificationsToInsert.length;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const overduePayments = await getOverduePayments(supabase);

    if (overduePayments.length === 0) {
      return new Response(JSON.stringify({ message: 'No overdue payments found.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    const createdCount = await createNotifications(supabase, overduePayments);

    return new Response(
      JSON.stringify({
        message: `Processed ${overduePayments.length} overdue payments. Created ${createdCount} new notifications.`,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error in overdue-rent-notifier function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
