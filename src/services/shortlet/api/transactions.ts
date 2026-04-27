/**
 * Transactions API Service
 * Handles payment transactions for short-let bookings
 */

import { supabase } from '@/integrations/supabase/client';
import {
  Transaction,
  TransactionType,
  TransactionStatus,
  transactionSchema,
  type Booking,
} from '../types';
import { getBookingById } from './bookings';
import { getUnifiedPaymentService } from '@/services/payments';
import { logger } from '@/utils/logger';
import { profileFullName } from '@/lib/profileDisplayName';

/**
 * Create transaction record
 */
export async function createTransaction(
  transaction: Omit<Transaction, 'id' | 'created_at' | 'updated_at'>
): Promise<Transaction> {
  const validated = transactionSchema.parse(transaction);

  const { data, error } = await supabase
    .from('transactions')
    .insert([
      {
        booking_id: validated.booking_id,
        user_id: validated.user_id,
        amount: validated.amount,
        type: validated.type,
        provider: validated.provider,
        provider_ref: validated.provider_ref,
        status: validated.status,
        description: validated.description,
        metadata: validated.metadata,
      },
    ])
    .select()
    .single();

  if (error) throw error;
  return data as Transaction;
}

/**
 * Initialize payment for booking (using unified payment service)
 */
export async function initializeBookingPayment(
  bookingId: string,
  email: string,
  amount: number,
  callbackUrl?: string,
  paymentMethod: 'flutterwave' | 'bank_transfer' = 'flutterwave'
): Promise<{ payment_url: string; reference: string }> {
  // Get booking details
  const booking = await getBookingById(bookingId);
  if (!booking) {
    throw new Error('Booking not found');
  }

  // Use unified payment service
  const { getUnifiedPaymentService } = await import('@/services/payments');
  const { createShortletPaymentRequest } = await import('@/services/payments/adapters');
  const paymentService = getUnifiedPaymentService();

  // Get guest profile for customer info (profiles may not have phone column)
  const { data: guestProfile } = await supabase
    .from('profiles')
    .select('email, first_name, last_name')
    .eq('id', booking.guest_id)
    .single();

  const customer = {
    email: guestProfile?.email || email,
    name: guestProfile ? (profileFullName(guestProfile) ?? undefined) : undefined,
    phone: undefined as string | undefined, // profiles table may not have phone column
  };

  // Create unified payment request
  const paymentRequest = createShortletPaymentRequest(
    bookingId,
    booking.listing_id,
    booking.guest_id,
    booking.owner_id,
    amount,
    customer,
    paymentMethod,
    callbackUrl,
    booking.nights
  );

  // Initialize payment
  const paymentResponse = await paymentService.initializePayment(paymentRequest);

  if (!paymentResponse.success) {
    throw new Error(paymentResponse.error || 'Failed to initialize payment');
  }

  const reference = paymentResponse.reference || paymentResponse.payment_id || '';

  // Create transaction record
  await createTransaction({
    booking_id: bookingId,
    user_id: booking.guest_id,
    amount,
    type: TransactionType.CHARGE,
    provider: paymentMethod,
    provider_ref: reference,
    status: TransactionStatus.PENDING,
    description: `Payment for booking ${bookingId}`,
    metadata: {
      authorization_url: paymentResponse.authorization_url,
      access_code: paymentResponse.access_code,
      provider: paymentResponse.provider,
    },
  });

  // Update booking with payment reference
  await supabase.from('bookings').update({ payment_reference: reference }).eq('id', bookingId);

  return {
    payment_url: paymentResponse.authorization_url || '',
    reference,
  };
}

/**
 * Verify payment and update booking status (using unified payment service)
 */
export async function verifyBookingPayment(reference: string): Promise<{
  success: boolean;
  transaction?: Transaction;
  booking?: Booking | { id: string; status: string };
  error?: string;
}> {
  try {
    // Use unified payment service for verification
    const paymentService = getUnifiedPaymentService();
    const verification = await paymentService.verifyPayment({ reference });

    if (!verification.success || verification.status !== 'completed') {
      return {
        success: false,
        error: verification.error || 'Payment verification failed',
      };
    }

    // Find transaction by reference (no join - avoids TS2589 "excessively deep" type instantiation)
    const { data: transaction, error: txError } = await supabase
      .from('transactions')
      .select(
        'id, booking_id, user_id, amount, type, provider, provider_ref, status, description, metadata, created_at, updated_at'
      )
      .eq('provider_ref', reference)
      .single();

    if (txError || !transaction) {
      return {
        success: false,
        error: 'Transaction not found',
      };
    }

    // Fetch booking separately (avoids complex join types)
    let booking: { id: string; status: string } | undefined;
    if (transaction.booking_id) {
      const { data: bookingRow } = await supabase
        .from('bookings')
        .select('id, status')
        .eq('id', transaction.booking_id)
        .single();
      booking = bookingRow ?? undefined;
    }

    // Update transaction status
    const { data: updatedTransaction, error: updateError } = await supabase
      .from('transactions')
      .update({
        status: TransactionStatus.SUCCESS,
        updated_at: new Date().toISOString(),
      })
      .eq('id', transaction.id)
      .select()
      .single();

    if (updateError) {
      return {
        success: false,
        error: 'Failed to update transaction',
      };
    }

    // Update booking status if pending
    if (booking && booking.status === 'pending') {
      await supabase.from('bookings').update({ status: 'confirmed' }).eq('id', booking.id);
    }

    return {
      success: true,
      transaction: updatedTransaction as Transaction,
      booking,
    };
  } catch (error) {
    logger.error('Payment verification error', error, { reference });
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Payment verification failed',
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
        error: 'Booking not found',
      };
    }

    if (!booking.payment_reference) {
      return {
        success: false,
        error: 'No payment reference found for booking',
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
        error: 'Original transaction not found',
      };
    }

    // Use unified payment service for refund
    const paymentService = getUnifiedPaymentService();
    const refundAmount = amount || booking.total_amount;

    // Determine provider from original transaction
    const provider = originalTx.provider as 'flutterwave' | 'bank_transfer' | undefined;

    const refundResponse = await paymentService.createRefund({
      transaction_reference: booking.payment_reference,
      provider,
      amount: refundAmount,
      customer_note: reason || 'Booking cancellation refund',
      merchant_note: `Refund for booking ${bookingId}`,
      reason: reason || 'Booking cancellation',
    });

    if (!refundResponse.success) {
      return {
        success: false,
        error: refundResponse.error || 'Refund failed',
      };
    }

    // Create refund transaction record
    const refundTransaction = await createTransaction({
      booking_id: bookingId,
      user_id: booking.guest_id,
      amount: refundAmount,
      type: TransactionType.REFUND,
      provider: provider || 'flutterwave',
      provider_ref:
        refundResponse.refund_id || refundResponse.reference || booking.payment_reference,
      status: TransactionStatus.SUCCESS,
      description: `Refund for booking ${bookingId}`,
      metadata: {
        original_transaction_id: originalTx.id,
        reason,
      },
    });

    // Update booking status
    await supabase.from('bookings').update({ status: 'refunded' }).eq('id', bookingId);

    return {
      success: true,
      transaction: refundTransaction,
    };
  } catch (error) {
    logger.error('Refund processing error', error, { bookingId, amount });
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Refund processing failed',
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
