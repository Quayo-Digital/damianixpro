/**
 * Flutterwave Webhook Handler for Short-Let Bookings
 * Supabase Edge Function to process Flutterwave charge.completed events
 * Configure this URL in Flutterwave Dashboard → Settings → Webhooks
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import * as crypto from 'node:crypto';

const FLUTTERWAVE_SECRET_HASH = Deno.env.get('FLUTTERWAVE_SECRET_HASH');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, flutterwave-signature',
};

interface FlutterwaveWebhookEvent {
  type: string;
  data: {
    id?: number;
    tx_ref?: string;
    flw_ref?: string;
    reference?: string;
    amount?: number;
    status?: string;
    customer?: { email?: string; name?: string };
    meta?: {
      booking_id?: string;
      listing_id?: string;
      guest_id?: string;
      owner_id?: string;
      [key: string]: unknown;
    };
    [key: string]: unknown;
  };
}

function verifySignature(rawBody: string, signature: string | null, secretHash: string): boolean {
  if (!secretHash || !signature) return false;
  const hash = crypto.createHmac('sha256', secretHash).update(rawBody).digest('base64');
  return hash === signature;
}

async function handleChargeSuccess(
  supabase: ReturnType<typeof createClient>,
  data: FlutterwaveWebhookEvent['data']
): Promise<{ success: boolean; message?: string; error?: string }> {
  const reference = data.tx_ref || data.reference || data.flw_ref?.toString();
  if (!reference) {
    return { success: false, error: 'Missing payment reference' };
  }

  try {
    const { data: transaction, error: txError } = await supabase
      .from('transactions')
      .select('*, booking:bookings (*)')
      .eq('provider_ref', reference)
      .single();

    if (txError || !transaction) {
      console.error('Transaction not found:', reference);
      return { success: false, error: 'Transaction not found' };
    }

    const { error: updateError } = await supabase
      .from('transactions')
      .update({
        status: 'success',
        updated_at: new Date().toISOString(),
        metadata: {
          ...(transaction.metadata as Record<string, unknown>),
          flutterwave_data: data,
          verified_at: new Date().toISOString(),
        },
      })
      .eq('id', transaction.id);

    if (updateError) {
      console.error('Failed to update transaction:', updateError);
      return { success: false, error: 'Failed to update transaction' };
    }

    const booking = transaction.booking as {
      id?: string;
      status?: string;
      owner_id?: string;
      payout_amount?: number;
    } | null;
    if (booking && booking.status === 'pending') {
      const { error: bookingError } = await supabase
        .from('bookings')
        .update({
          status: 'confirmed',
          updated_at: new Date().toISOString(),
        })
        .eq('id', booking.id);

      if (bookingError) {
        console.error('Failed to update booking:', bookingError);
      } else {
        console.log(`Booking ${booking.id} confirmed via webhook`);
      }
    }

    if (booking && booking.owner_id && booking.payout_amount) {
      let { data: wallet } = await supabase
        .from('wallets')
        .select('*')
        .eq('user_id', booking.owner_id)
        .single();

      if (!wallet) {
        const { data: newWallet, error: createError } = await supabase
          .from('wallets')
          .insert({
            user_id: booking.owner_id,
            pending_balance: Number(booking.payout_amount),
            balance: 0,
            total_earned: Number(booking.payout_amount),
            total_paid_out: 0,
          })
          .select()
          .single();

        if (!createError) wallet = newWallet;
      } else {
        await supabase
          .from('wallets')
          .update({
            pending_balance: (wallet.pending_balance || 0) + Number(booking.payout_amount),
            total_earned: (wallet.total_earned || 0) + Number(booking.payout_amount),
            updated_at: new Date().toISOString(),
          })
          .eq('id', wallet.id);
      }

      await supabase.from('transactions').insert({
        booking_id: booking.id,
        user_id: booking.owner_id,
        amount: Number(booking.payout_amount),
        type: 'commission',
        provider: 'flutterwave',
        provider_ref: reference,
        status: 'success',
        description: `Earnings from booking ${booking.id}`,
      });
    }

    return {
      success: true,
      message: `Payment verified for booking ${booking?.id || 'unknown'}`,
    };
  } catch (error) {
    console.error('Charge success handling error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const body = await req.text();
  const signature = req.headers.get('flutterwave-signature');

  if (!FLUTTERWAVE_SECRET_HASH) {
    console.error('FLUTTERWAVE_SECRET_HASH is not configured');
    return new Response(JSON.stringify({ received: false, error: 'Webhook not configured' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }

  if (!verifySignature(body, signature, FLUTTERWAVE_SECRET_HASH)) {
    console.warn('Invalid Flutterwave webhook signature');
    return new Response(JSON.stringify({ received: false }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 401,
    });
  }

  let event: FlutterwaveWebhookEvent;
  try {
    event = JSON.parse(body);
  } catch {
    return new Response(JSON.stringify({ received: false, error: 'Invalid JSON' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }

  console.log(`Received Flutterwave event: ${event.type}`);

  if (event.type !== 'charge.completed') {
    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  }

  const data = event.data;
  if (!data || (data.status !== 'successful' && data.status !== 'success')) {
    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  }

  try {
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    await handleChargeSuccess(supabase, data);
  } catch (err) {
    console.error('Error processing webhook:', err);
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    status: 200,
  });
});
