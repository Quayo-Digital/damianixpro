/**
 * Fund Release Utilities
 * Handles automatic release of pending funds after booking checkout
 */

import { supabase } from '@/integrations/supabase/client';
import { releasePendingFunds } from '../api/wallets';
import { getBookingById } from '../api/bookings';
import { BookingStatus } from '../types';

/**
 * Release funds for completed bookings after clearance period
 * Should be called by a scheduled job/cron
 */
export async function releaseFundsForCompletedBookings(
  clearanceHours: number = 24
): Promise<{
  released: number;
  errors: string[];
}> {
  const errors: string[] = [];
  let released = 0;

  try {
    // Get bookings that are completed and past clearance period
    const clearanceDate = new Date();
    clearanceDate.setHours(clearanceDate.getHours() - clearanceHours);

    const { data: bookings, error } = await supabase
      .from('bookings')
      .select('id, checkout_date, owner_id, payout_amount, status')
      .eq('status', BookingStatus.COMPLETED)
      .lte('checkout_date', clearanceDate.toISOString().split('T')[0])
      .not('payout_amount', 'is', null);

    if (error) {
      throw error;
    }

    if (!bookings || bookings.length === 0) {
      return { released: 0, errors: [] };
    }

    // Release funds for each booking
    for (const booking of bookings) {
      try {
        // Check if funds already released (by checking if balance was updated)
        const bookingData = await getBookingById(booking.id);
        if (!bookingData || !bookingData.owner_id || !bookingData.payout_amount) {
          continue;
        }

        await releasePendingFunds(
          bookingData.owner_id,
          Number(bookingData.payout_amount),
          booking.id
        );

        released++;
        console.log(`Released funds for booking ${booking.id}`);
      } catch (bookingError) {
        const errorMsg = `Failed to release funds for booking ${booking.id}: ${bookingError instanceof Error ? bookingError.message : 'Unknown error'}`;
        errors.push(errorMsg);
        console.error(errorMsg);
      }
    }

    return { released, errors };
  } catch (error) {
    console.error('Error releasing funds:', error);
    return {
      released,
      errors: [...errors, error instanceof Error ? error.message : 'Unknown error']
    };
  }
}

/**
 * Release funds for a specific booking
 */
export async function releaseFundsForBooking(bookingId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const booking = await getBookingById(bookingId);
    
    if (!booking) {
      return {
        success: false,
        error: 'Booking not found'
      };
    }

    if (booking.status !== BookingStatus.COMPLETED) {
      return {
        success: false,
        error: 'Booking must be completed before releasing funds'
      };
    }

    if (!booking.owner_id || !booking.payout_amount) {
      return {
        success: false,
        error: 'Invalid booking data for payout'
      };
    }

    await releasePendingFunds(
      booking.owner_id,
      Number(booking.payout_amount),
      bookingId
    );

    return {
      success: true
    };
  } catch (error) {
    console.error('Release funds error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to release funds'
    };
  }
}

/**
 * Get bookings ready for fund release
 */
export async function getBookingsReadyForRelease(
  clearanceHours: number = 24
): Promise<any[]> {
  const clearanceDate = new Date();
  clearanceDate.setHours(clearanceDate.getHours() - clearanceHours);

  const { data, error } = await supabase
    .from('bookings')
    .select(`
      id,
      checkout_date,
      owner_id,
      payout_amount,
      status,
      listing:listings (
        title,
        property:properties (
          name
        )
      )
    `)
    .eq('status', BookingStatus.COMPLETED)
    .lte('checkout_date', clearanceDate.toISOString().split('T')[0])
    .not('payout_amount', 'is', null)
    .order('checkout_date', { ascending: true });

  if (error) throw error;
  return data || [];
}

