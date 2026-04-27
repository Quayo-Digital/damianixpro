/**
 * Paystack Webhook Handler for Short-Let Bookings
 * Supabase Edge Function to process Paystack webhook events
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import * as crypto from 'node:crypto';

const PAYSTACK_WEBHOOK_SECRET = Deno.env.get('PAYSTACK_WEBHOOK_SECRET');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-paystack-signature',
};

interface PaystackWebhookEvent {
  event: string;
  data: {
    reference?: string;
    status?: string;
    amount?: number;
    customer?: {
      email?: string;
    };
    metadata?: {
      booking_id?: string;
      listing_id?: string;
      guest_id?: string;
      owner_id?: string;
      [key: string]: any;
    };
    transfer?: {
      transfer_code?: string;
      status?: string;
      amount?: number;
      recipient?: {
        recipient_code?: string;
      };
    };
    [key: string]: any;
  };
}

/**
 * Verify Paystack webhook signature
 */
function verifySignature(payload: string, signature: string, secret: string): boolean {
  if (!secret) {
    console.error('PAYSTACK_WEBHOOK_SECRET is not configured');
    return false;
  }

  try {
    const hash = crypto.createHmac('sha512', secret).update(payload).digest('hex');
    return hash === signature;
  } catch (error) {
    console.error('Signature verification error:', error);
    return false;
  }
}

/**
 * Handle charge.success event
 */
async function handleChargeSuccess(
  supabase: any,
  data: PaystackWebhookEvent['data']
): Promise<{ success: boolean; message?: string; error?: string }> {
  if (!data.reference) {
    return { success: false, error: 'Missing payment reference' };
  }

  try {
    // Find transaction by reference
    const { data: transaction, error: txError } = await supabase
      .from('transactions')
      .select('*, booking:bookings (*)')
      .eq('provider_ref', data.reference)
      .single();

    if (txError || !transaction) {
      console.error('Transaction not found:', data.reference);
      return { success: false, error: 'Transaction not found' };
    }

    // Update transaction status
    const { error: updateError } = await supabase
      .from('transactions')
      .update({
        status: 'success',
        updated_at: new Date().toISOString(),
        metadata: {
          ...transaction.metadata,
          paystack_data: data,
          verified_at: new Date().toISOString(),
        },
      })
      .eq('id', transaction.id);

    if (updateError) {
      console.error('Failed to update transaction:', updateError);
      return { success: false, error: 'Failed to update transaction' };
    }

    // Update booking status if pending
    const booking = transaction.booking;
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
        // Don't fail the webhook if booking update fails
      } else {
        console.log(`Booking ${booking.id} confirmed via webhook`);
      }
    }

    // Update wallet if booking is completed (for owner payouts)
    if (booking && booking.owner_id && booking.payout_amount) {
      // Get or create wallet
      let { data: wallet } = await supabase
        .from('wallets')
        .select('*')
        .eq('user_id', booking.owner_id)
        .single();

      if (!wallet) {
        // Create wallet if it doesn't exist
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

        if (createError) {
          console.error('Failed to create wallet:', createError);
        } else {
          wallet = newWallet;
        }
      } else {
        // Add to pending balance (will be released after checkout)
        const { error: walletError } = await supabase
          .from('wallets')
          .update({
            pending_balance: (wallet.pending_balance || 0) + Number(booking.payout_amount),
            total_earned: (wallet.total_earned || 0) + Number(booking.payout_amount),
            updated_at: new Date().toISOString(),
          })
          .eq('id', wallet.id);

        if (walletError) {
          console.error('Failed to update wallet:', walletError);
        }
      }

      // Create transaction record for audit trail (owner earnings)
      const { error: txInsertError } = await supabase.from('transactions').insert({
        booking_id: booking.id,
        user_id: booking.owner_id,
        amount: Number(booking.payout_amount),
        type: 'commission',
        provider: 'paystack',
        provider_ref: data.reference,
        status: 'success',
        description: `Earnings from booking ${booking.id}`,
      });
      if (txInsertError)
        console.error('Failed to create owner earnings transaction:', txInsertError);
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

/**
 * Handle charge.failed event
 */
async function handleChargeFailed(
  supabase: any,
  data: PaystackWebhookEvent['data']
): Promise<{ success: boolean; message?: string; error?: string }> {
  if (!data.reference) {
    return { success: false, error: 'Missing payment reference' };
  }

  try {
    const { error } = await supabase
      .from('transactions')
      .update({
        status: 'failed',
        updated_at: new Date().toISOString(),
        metadata: {
          paystack_data: data,
          failed_at: new Date().toISOString(),
        },
      })
      .eq('provider_ref', data.reference);

    if (error) {
      console.error('Failed to update transaction:', error);
      return { success: false, error: 'Failed to update transaction' };
    }

    return { success: true, message: 'Payment failure recorded' };
  } catch (error) {
    console.error('Charge failed handling error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Handle transfer.success event (payout to owner)
 */
async function handleTransferSuccess(
  supabase: any,
  data: PaystackWebhookEvent['data']
): Promise<{ success: boolean; message?: string; error?: string }> {
  const transfer = data.transfer;
  if (!transfer?.transfer_code) {
    return { success: false, error: 'Missing transfer code' };
  }

  try {
    // Find transaction by transfer code
    const { data: transaction, error: txError } = await supabase
      .from('transactions')
      .select('*')
      .eq('provider_ref', transfer.transfer_code)
      .eq('type', 'payout')
      .single();

    if (txError || !transaction) {
      console.error('Payout transaction not found:', transfer.transfer_code);
      return { success: false, error: 'Transaction not found' };
    }

    // Update transaction status
    const { error: updateError } = await supabase
      .from('transactions')
      .update({
        status: 'success',
        updated_at: new Date().toISOString(),
        metadata: {
          ...transaction.metadata,
          paystack_transfer_data: transfer,
          completed_at: new Date().toISOString(),
        },
      })
      .eq('id', transaction.id);

    if (updateError) {
      console.error('Failed to update payout transaction:', updateError);
      return { success: false, error: 'Failed to update transaction' };
    }

    // Update wallet - move from balance to paid_out
    const { data: wallet } = await supabase
      .from('wallets')
      .select('*')
      .eq('user_id', transaction.user_id)
      .single();

    if (wallet) {
      const { error: walletError } = await supabase
        .from('wallets')
        .update({
          balance: Math.max(0, (wallet.balance || 0) - Number(transaction.amount)),
          total_paid_out: (wallet.total_paid_out || 0) + Number(transaction.amount),
          updated_at: new Date().toISOString(),
        })
        .eq('id', wallet.id);

      if (walletError) {
        console.error('Failed to update wallet:', walletError);
      }
    }

    return { success: true, message: 'Payout successful' };
  } catch (error) {
    console.error('Transfer success handling error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Handle transfer.failed event
 */
async function handleTransferFailed(
  supabase: any,
  data: PaystackWebhookEvent['data']
): Promise<{ success: boolean; message?: string; error?: string }> {
  const transfer = data.transfer;
  if (!transfer?.transfer_code) {
    return { success: false, error: 'Missing transfer code' };
  }

  try {
    const { error } = await supabase
      .from('transactions')
      .update({
        status: 'failed',
        updated_at: new Date().toISOString(),
        metadata: {
          paystack_transfer_data: transfer,
          failed_at: new Date().toISOString(),
        },
      })
      .eq('provider_ref', transfer.transfer_code)
      .eq('type', 'payout');

    if (error) {
      console.error('Failed to update transfer status:', error);
      return { success: false, error: 'Failed to update transfer status' };
    }

    return { success: true, message: 'Payout failure recorded' };
  } catch (error) {
    console.error('Transfer failed handling error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Handle refund.success event
 */
async function handleRefundSuccess(
  supabase: any,
  data: PaystackWebhookEvent['data']
): Promise<{ success: boolean; message?: string; error?: string }> {
  if (!data.reference) {
    return { success: false, error: 'Missing refund reference' };
  }

  try {
    // Find refund transaction
    const { data: transaction, error: txError } = await supabase
      .from('transactions')
      .select('*, booking:bookings (*)')
      .eq('provider_ref', data.reference)
      .eq('type', 'refund')
      .single();

    if (txError || !transaction) {
      console.error('Refund transaction not found:', data.reference);
      return { success: false, error: 'Transaction not found' };
    }

    // Update transaction status
    const { error: updateError } = await supabase
      .from('transactions')
      .update({
        status: 'success',
        updated_at: new Date().toISOString(),
        metadata: {
          ...transaction.metadata,
          paystack_refund_data: data,
          refunded_at: new Date().toISOString(),
        },
      })
      .eq('id', transaction.id);

    if (updateError) {
      console.error('Failed to update refund transaction:', updateError);
      return { success: false, error: 'Failed to update transaction' };
    }

    // Update booking status if needed
    const booking = transaction.booking;
    if (booking && booking.status !== 'refunded') {
      const { error: bookingError } = await supabase
        .from('bookings')
        .update({
          status: 'refunded',
          updated_at: new Date().toISOString(),
        })
        .eq('id', booking.id);

      if (bookingError) {
        console.error('Failed to update booking:', bookingError);
      }
    }

    return { success: true, message: 'Refund processed successfully' };
  } catch (error) {
    console.error('Refund success handling error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Main webhook handler
 */
serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Only allow POST
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    // Get signature from headers
    const signature = req.headers.get('x-paystack-signature');
    if (!signature) {
      console.warn('Missing Paystack signature header');
      return new Response(JSON.stringify({ error: 'Missing signature' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get raw body for signature verification
    const body = await req.text();

    // Verify signature
    if (!PAYSTACK_WEBHOOK_SECRET) {
      console.error('PAYSTACK_WEBHOOK_SECRET is not configured');
      return new Response(JSON.stringify({ error: 'Webhook secret not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const isValid = verifySignature(body, signature, PAYSTACK_WEBHOOK_SECRET);
    if (!isValid) {
      console.warn('Invalid webhook signature');
      return new Response(JSON.stringify({ error: 'Invalid signature' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Parse event
    const event: PaystackWebhookEvent = JSON.parse(body);
    console.log(`Received Paystack event: ${event.event}`);

    // Create Supabase client with service role
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Handle event based on type
    let result;
    switch (event.event) {
      case 'charge.success':
        result = await handleChargeSuccess(supabase, event.data);
        break;

      case 'charge.failed':
        result = await handleChargeFailed(supabase, event.data);
        break;

      case 'transfer.success':
        result = await handleTransferSuccess(supabase, event.data);
        break;

      case 'transfer.failed':
        result = await handleTransferFailed(supabase, event.data);
        break;

      case 'refund.success':
        result = await handleRefundSuccess(supabase, event.data);
        break;

      default:
        console.log(`Unhandled event type: ${event.event}`);
        result = {
          success: true,
          message: `Event ${event.event} acknowledged but not processed`,
        };
    }

    // Return response
    return new Response(JSON.stringify(result), {
      status: result.success ? 200 : 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Webhook processing error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
