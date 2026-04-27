/**
 * Scheduled Function to Release Pending Funds
 * Runs periodically to move funds from pending to available balance
 * after booking checkout clearance period
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const CLEARANCE_HOURS = 24; // Funds released 24 hours after checkout

serve(async (req) => {
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Get bookings that are completed and past clearance period
    const clearanceDate = new Date();
    clearanceDate.setHours(clearanceDate.getHours() - CLEARANCE_HOURS);

    const { data: bookings, error: fetchError } = await supabase
      .from('bookings')
      .select('id, checkout_date, owner_id, payout_amount, status')
      .eq('status', 'completed')
      .lte('checkout_date', clearanceDate.toISOString().split('T')[0])
      .not('payout_amount', 'is', null);

    if (fetchError) {
      console.error('Error fetching bookings:', fetchError);
      return new Response(JSON.stringify({ error: 'Failed to fetch bookings' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!bookings || bookings.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No bookings ready for fund release', released: 0 }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    let released = 0;
    const errors: string[] = [];

    // Release funds for each booking
    for (const booking of bookings) {
      try {
        // Get wallet
        const { data: wallet } = await supabase
          .from('wallets')
          .select('*')
          .eq('user_id', booking.owner_id)
          .single();

        if (!wallet) {
          errors.push(`Wallet not found for owner ${booking.owner_id}`);
          continue;
        }

        const payoutAmount = Number(booking.payout_amount);
        const pendingBalance = wallet.pending_balance || 0;
        const currentBalance = wallet.balance || 0;

        if (pendingBalance < payoutAmount) {
          errors.push(`Insufficient pending balance for booking ${booking.id}`);
          continue;
        }

        // Move funds from pending to available
        const { error: updateError } = await supabase
          .from('wallets')
          .update({
            balance: currentBalance + payoutAmount,
            pending_balance: pendingBalance - payoutAmount,
            updated_at: new Date().toISOString(),
          })
          .eq('id', wallet.id);

        if (updateError) {
          errors.push(`Failed to update wallet for booking ${booking.id}: ${updateError.message}`);
          continue;
        }

        // Create transaction record for audit trail (pending → available)
        const { error: txError } = await supabase.from('transactions').insert({
          booking_id: booking.id,
          user_id: booking.owner_id,
          amount: payoutAmount,
          type: 'deposit',
          provider: 'system',
          status: 'success',
          description: `Funds released from pending after checkout (booking ${booking.id})`,
        });
        if (txError) console.error('Failed to create release transaction:', txError);

        released++;
        console.log(`Released ₦${payoutAmount} for booking ${booking.id}`);
      } catch (bookingError) {
        const errorMsg = `Error processing booking ${booking.id}: ${bookingError instanceof Error ? bookingError.message : 'Unknown error'}`;
        errors.push(errorMsg);
        console.error(errorMsg);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        released,
        total: bookings.length,
        errors: errors.length > 0 ? errors : undefined,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Fund release function error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});
