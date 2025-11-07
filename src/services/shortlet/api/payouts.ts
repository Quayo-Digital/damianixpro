/**
 * Payout API Service
 * Handles owner payout requests and Paystack transfer integration
 */

import { supabase } from '@/integrations/supabase/client';
import { getPaystackService } from '../integrations/paystack';
import { getOrCreateWallet, debitWallet } from './wallets';
import { createTransaction, TransactionType, TransactionStatus } from './transactions';
import { canRequestPayout } from './kyc';

// ============================================================================
// Types
// ============================================================================

export interface PayoutRequest {
  user_id: string;
  amount: number;
  bank_account: {
    account_number: string;
    bank_code: string;
    account_name: string;
  };
  reason?: string;
}

export interface PayoutResponse {
  success: boolean;
  payout_id?: string;
  transfer_code?: string;
  reference?: string;
  error?: string;
}

export interface RecipientInfo {
  recipient_code: string;
  account_number: string;
  account_name: string;
  bank_name: string;
  bank_code: string;
}

// ============================================================================
// Payout Functions
// ============================================================================

/**
 * Create or get Paystack transfer recipient
 */
export async function createOrGetRecipient(
  userId: string,
  bankAccount: {
    account_number: string;
    bank_code: string;
    account_name: string;
  }
): Promise<RecipientInfo> {
  // Check if recipient already exists in user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('paystack_recipient_code, paystack_recipient_data')
    .eq('id', userId)
    .single();

  if (profile?.paystack_recipient_code) {
    // Verify recipient still exists and is valid
    const paystack = getPaystackService();
    // Note: Paystack doesn't have a direct "get recipient" endpoint
    // We'll try to create a new one if needed, or reuse existing

    return {
      recipient_code: profile.paystack_recipient_code,
      account_number: bankAccount.account_number,
      account_name: bankAccount.account_name,
      bank_name: profile.paystack_recipient_data?.bank_name || '',
      bank_code: bankAccount.bank_code
    };
  }

  // Create new recipient
  const paystack = getPaystackService();
  const recipientResponse = await paystack.createRecipient({
    type: 'nuban',
    name: bankAccount.account_name,
    account_number: bankAccount.account_number,
    bank_code: bankAccount.bank_code,
    currency: 'NGN',
    description: `Payout recipient for user ${userId}`
  });

  if (!recipientResponse.success || !recipientResponse.recipient_code) {
    throw new Error(recipientResponse.error || 'Failed to create recipient');
  }

  // Get bank name from Paystack bank list
  const banksResponse = await paystack.listBanks();
  const bank = banksResponse.banks?.find((b: any) => b.code === bankAccount.bank_code);

  // Save recipient code to user profile
  await supabase
    .from('profiles')
    .update({
      paystack_recipient_code: recipientResponse.recipient_code,
      paystack_recipient_data: {
        account_number: recipientResponse.account_number,
        account_name: recipientResponse.account_name,
        bank_name: recipientResponse.bank_name || bank?.name || '',
        bank_code: bankAccount.bank_code
      }
    })
    .eq('id', userId);

  return {
    recipient_code: recipientResponse.recipient_code,
    account_number: recipientResponse.account_number || bankAccount.account_number,
    account_name: recipientResponse.account_name || bankAccount.account_name,
    bank_name: recipientResponse.bank_name || bank?.name || '',
    bank_code: bankAccount.bank_code
  };
}

/**
 * Request payout (initiate transfer to owner)
 */
export async function requestPayout(
  request: PayoutRequest
): Promise<PayoutResponse> {
  try {
    const { user_id, amount, bank_account, reason } = request;

    // Validate amount
    if (amount <= 0) {
      return {
        success: false,
        error: 'Payout amount must be greater than 0'
      };
    }

    // Check KYC verification
    const kycCheck = await canRequestPayout(user_id);
    if (!kycCheck.can_request) {
      return {
        success: false,
        error: kycCheck.reason || 'KYC verification required'
      };
    }

    // Check wallet balance
    const wallet = await getOrCreateWallet(user_id);
    const availableBalance = wallet.balance || 0;

    if (availableBalance < amount) {
      return {
        success: false,
        error: `Insufficient balance. Available: ₦${availableBalance.toLocaleString()}, Requested: ₦${amount.toLocaleString()}`
      };
    }

    // Create or get recipient
    const recipient = await createOrGetRecipient(user_id, bank_account);

    // Debit wallet (hold funds)
    await debitWallet(user_id, amount, `Payout request: ${reason || 'Owner payout'}`);

    // Create payout transaction (pending)
    const payoutTransaction = await createTransaction({
      user_id,
      amount,
      type: TransactionType.PAYOUT,
      provider: 'paystack',
      status: TransactionStatus.PENDING,
      description: reason || `Payout to ${bank_account.account_name}`,
      metadata: {
        recipient_code: recipient.recipient_code,
        account_number: bank_account.account_number,
        bank_code: bank_account.bank_code
      }
    });

    // Initiate Paystack transfer
    const paystack = getPaystackService();
    const transferResponse = await paystack.initiateTransfer({
      amount,
      recipient_code: recipient.recipient_code,
      reason: reason || 'Short-let booking payout',
      reference: payoutTransaction.id
    });

    if (!transferResponse.success) {
      // Refund wallet if transfer initiation fails
      await supabase
        .from('wallets')
        .update({
          balance: availableBalance, // Restore balance
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user_id);

      // Update transaction status
      await supabase
        .from('transactions')
        .update({
          status: TransactionStatus.FAILED,
          updated_at: new Date().toISOString()
        })
        .eq('id', payoutTransaction.id);

      return {
        success: false,
        error: transferResponse.error || 'Failed to initiate payout'
      };
    }

    // Update transaction with transfer code
    await supabase
      .from('transactions')
      .update({
        provider_ref: transferResponse.transfer_code || transferResponse.reference,
        metadata: {
          ...payoutTransaction.metadata,
          transfer_code: transferResponse.transfer_code,
          transfer_reference: transferResponse.reference
        },
        updated_at: new Date().toISOString()
      })
      .eq('id', payoutTransaction.id);

    return {
      success: true,
      payout_id: payoutTransaction.id,
      transfer_code: transferResponse.transfer_code,
      reference: transferResponse.reference
    };
  } catch (error) {
    console.error('Payout request error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Payout request failed'
    };
  }
}

/**
 * Get payout history for user
 */
export async function getPayoutHistory(
  userId: string,
  limit: number = 50
): Promise<any[]> {
  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .eq('user_id', userId)
    .eq('type', TransactionType.PAYOUT)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data || [];
}

/**
 * Verify payout status
 */
export async function verifyPayoutStatus(transferCode: string): Promise<{
  success: boolean;
  status?: string;
  error?: string;
}> {
  try {
    const paystack = getPaystackService();
    const result = await paystack.verifyTransfer(transferCode);

    if (result.success && result.status) {
      // Update transaction status if changed
      const { data: transaction } = await supabase
        .from('transactions')
        .select('*')
        .eq('provider_ref', transferCode)
        .eq('type', TransactionType.PAYOUT)
        .single();

      if (transaction) {
        const newStatus = result.status === 'success' 
          ? TransactionStatus.SUCCESS 
          : result.status === 'failed' 
          ? TransactionStatus.FAILED 
          : TransactionStatus.PENDING;

        if (transaction.status !== newStatus) {
          await supabase
            .from('transactions')
            .update({
              status: newStatus,
              updated_at: new Date().toISOString()
            })
            .eq('id', transaction.id);

          // If successful, update wallet paid_out amount
          if (newStatus === TransactionStatus.SUCCESS) {
            const wallet = await getOrCreateWallet(transaction.user_id);
            await supabase
              .from('wallets')
              .update({
                total_paid_out: (wallet.total_paid_out || 0) + Number(transaction.amount),
                updated_at: new Date().toISOString()
              })
              .eq('user_id', transaction.user_id);
          }
        }
      }
    }

    return result;
  } catch (error) {
    console.error('Payout verification error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Payout verification failed'
    };
  }
}

/**
 * Cancel pending payout
 */
export async function cancelPayout(payoutId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    // Get payout transaction
    const { data: transaction, error: txError } = await supabase
      .from('transactions')
      .select('*')
      .eq('id', payoutId)
      .eq('type', TransactionType.PAYOUT)
      .eq('status', TransactionStatus.PENDING)
      .single();

    if (txError || !transaction) {
      return {
        success: false,
        error: 'Payout not found or cannot be cancelled'
      };
    }

    // Check if transfer can be cancelled (Paystack doesn't support cancellation)
    // We can only cancel if it's still pending and hasn't been processed
    // For now, we'll just refund the wallet

    const wallet = await getOrCreateWallet(transaction.user_id);
    const refundAmount = Number(transaction.amount);

    // Refund to wallet
    await supabase
      .from('wallets')
      .update({
        balance: (wallet.balance || 0) + refundAmount,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', transaction.user_id);

    // Update transaction status
    await supabase
      .from('transactions')
      .update({
        status: TransactionStatus.FAILED,
        metadata: {
          ...transaction.metadata,
          cancelled: true,
          cancelled_at: new Date().toISOString()
        },
        updated_at: new Date().toISOString()
      })
      .eq('id', payoutId);

    return {
      success: true
    };
  } catch (error) {
    console.error('Cancel payout error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to cancel payout'
    };
  }
}

/**
 * Auto-release funds after booking completion
 * Should be called after checkout clearance period (e.g., 24 hours)
 */
export async function autoReleaseBookingFunds(bookingId: string): Promise<{
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

    if (booking.status !== 'completed') {
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

    // Release pending funds to available balance
    await releasePendingFunds(
      booking.owner_id,
      Number(booking.payout_amount),
      bookingId
    );

    return {
      success: true
    };
  } catch (error) {
    console.error('Auto-release funds error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to release funds'
    };
  }
}

