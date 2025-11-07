/**
 * Transactions API Service
 * Handles payment transactions for short-let bookings
 */

import { supabase } from '@/integrations/supabase/client';
import { Transaction, TransactionType, TransactionStatus, transactionSchema } from '../types';
import { getPaystackService } from '../integrations/paystack';
import { getBookingById } from './bookings';

/**
 * Create transaction record
 */
export async function createTransaction(transaction: Omit<Transaction, 'id' | 'created_at' | 'updated_at'>): Promise<Transaction> {
  const validated = transactionSchema.parse(transaction);

  const { data, error } = await supabase
    .from('transactions')
    .insert([{
      booking_id: validated.booking_id,
      user_id: validated.user_id,
      amount: validated.amount,
      type: validated.type,
      provider: validated.provider,
      provider_ref: validated.provider_ref,
      status: validated.status,
      description: validated.description,
      metadata: validated.metadata
    }])
    .select()
    .single();

  if (error) throw error;
  return data as Transaction;
}

/**
 * Initialize payment for booking
 */
export async function initializeBookingPayment(
  bookingId: string,
  email: string,
  amount: number,
  callbackUrl?: string
): Promise<{ payment_url: string; reference: string }> {
  // Get booking details
  const booking = await getBookingById(bookingId);
  if (!booking) {
    throw new Error('Booking not found');
  }

  // Initialize Paystack payment
  const paystack = getPaystackService();
  const reference = paystack.generateReference('BOOK');

  const paymentResponse = await paystack.initializePayment({
    email,
    amount,
    reference,
    callback_url: callbackUrl,
    metadata: {
      booking_id: bookingId,
      listing_id: booking.listing_id,
      guest_id: booking.guest_id,
      owner_id: booking.owner_id
    }
  });

  if (!paymentResponse.success || !paymentResponse.authorization_url) {
    throw new Error(paymentResponse.error || 'Failed to initialize payment');
  }

  // Create transaction record
  await createTransaction({
    booking_id: bookingId,
    user_id: booking.guest_id,
    amount,
    type: TransactionType.CHARGE,
    provider: 'paystack',
    provider_ref: reference,
    status: TransactionStatus.PENDING,
    description: `Payment for booking ${bookingId}`,
    metadata: {
      authorization_url: paymentResponse.authorization_url,
      access_code: paymentResponse.access_code
    }
  });

  // Update booking with payment reference
  await supabase
    .from('bookings')
    .update({ payment_reference: reference })
    .eq('id', bookingId);

  return {
    payment_url: paymentResponse.authorization_url,
    reference
  };
}

/**
 * Verify payment and update booking status
 */
export async function verifyBookingPayment(reference: string): Promise<{
  success: boolean;
  transaction?: Transaction;
  booking?: any;
  error?: string;
}> {
  try {
    // Verify with Paystack
    const paystack = getPaystackService();
    const verification = await paystack.verifyPayment(reference);

    if (!verification.success || verification.status !== 'success') {
      return {
        success: false,
        error: verification.error || 'Payment verification failed'
      };
    }

    // Find transaction by reference
    const { data: transaction, error: txError } = await supabase
      .from('transactions')
      .select('*, booking:bookings (*)')
      .eq('provider_ref', reference)
      .single();

    if (txError || !transaction) {
      return {
        success: false,
        error: 'Transaction not found'
      };
    }

    // Update transaction status
    const { data: updatedTransaction, error: updateError } = await supabase
      .from('transactions')
      .update({
        status: TransactionStatus.SUCCESS,
        updated_at: new Date().toISOString()
      })
      .eq('id', transaction.id)
      .select()
      .single();

    if (updateError) {
      return {
        success: false,
        error: 'Failed to update transaction'
      };
    }

    // Update booking status if pending
    const booking = transaction.booking;
    if (booking && booking.status === 'pending') {
      await supabase
        .from('bookings')
        .update({ status: 'confirmed' })
        .eq('id', booking.id);
    }

    return {
      success: true,
      transaction: updatedTransaction as Transaction,
      booking
    };
  } catch (error) {
    console.error('Payment verification error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Payment verification failed'
    };
  }
}

/**
 * Process refund for booking
 */
export async function processRefund(
  bookingId: string,
  amount?: number,
  reason?: string
): Promise<{ success: boolean; transaction?: Transaction; error?: string }> {
  try {
    // Get booking
    const booking = await getBookingById(bookingId);
    if (!booking) {
      return {
        success: false,
        error: 'Booking not found'
      };
    }

    if (!booking.payment_reference) {
      return {
        success: false,
        error: 'No payment reference found for booking'
      };
    }

    // Get original transaction
    const { data: originalTx } = await supabase
      .from('transactions')
      .select('*')
      .eq('booking_id', bookingId)
      .eq('type', TransactionType.CHARGE)
      .eq('status', TransactionStatus.SUCCESS)
      .single();

    if (!originalTx) {
      return {
        success: false,
        error: 'Original transaction not found'
      };
    }

    // Process refund with Paystack
    const paystack = getPaystackService();
    const refundAmount = amount || booking.total_amount;
    const refundResponse = await paystack.createRefund({
      transaction_reference: booking.payment_reference,
      amount: refundAmount,
      customer_note: reason || 'Booking cancellation refund',
      merchant_note: `Refund for booking ${bookingId}`
    });

    if (!refundResponse.success) {
      return {
        success: false,
        error: refundResponse.error || 'Refund failed'
      };
    }

    // Create refund transaction record
    const refundTransaction = await createTransaction({
      booking_id: bookingId,
      user_id: booking.guest_id,
      amount: refundAmount,
      type: TransactionType.REFUND,
      provider: 'paystack',
      provider_ref: refundResponse.refund_id || booking.payment_reference,
      status: TransactionStatus.SUCCESS,
      description: `Refund for booking ${bookingId}`,
      metadata: {
        original_transaction_id: originalTx.id,
        reason
      }
    });

    // Update booking status
    await supabase
      .from('bookings')
      .update({ status: 'refunded' })
      .eq('id', bookingId);

    return {
      success: true,
      transaction: refundTransaction
    };
  } catch (error) {
    console.error('Refund processing error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Refund processing failed'
    };
  }
}

/**
 * Get transactions for a user
 */
export async function getUserTransactions(userId: string): Promise<Transaction[]> {
  const { data, error } = await supabase
    .from('transactions')
    .select('*, booking:bookings (*)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as Transaction[];
}

/**
 * Get transactions for a booking
 */
export async function getBookingTransactions(bookingId: string): Promise<Transaction[]> {
  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .eq('booking_id', bookingId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as Transaction[];
}

