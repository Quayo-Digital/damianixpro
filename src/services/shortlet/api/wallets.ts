/**
 * Wallet API Service
 * Handles owner wallet management, balance tracking, and payout operations
 */

import { supabase } from '@/integrations/supabase/client';
import { Wallet, walletSchema, Transaction, TransactionType, TransactionStatus } from '../types';
import { getPaystackService } from '../integrations/paystack';
import { getBookingById } from './bookings';
import { createTransaction } from './transactions';

/**
 * Get or create wallet for user
 */
export async function getOrCreateWallet(userId: string): Promise<Wallet> {
  // Try to get existing wallet
  const { data: existingWallet, error: fetchError } = await supabase
    .from('wallets')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (existingWallet && !fetchError) {
    return existingWallet as Wallet;
  }

  // Create new wallet if it doesn't exist
  const { data: newWallet, error: createError } = await supabase
    .from('wallets')
    .insert([{
      user_id: userId,
      balance: 0,
      pending_balance: 0,
      total_earned: 0,
      total_paid_out: 0
    }])
    .select()
    .single();

  if (createError) throw createError;
  return newWallet as Wallet;
}

/**
 * Get wallet by user ID
 */
export async function getWalletByUserId(userId: string): Promise<Wallet | null> {
  const { data, error } = await supabase
    .from('wallets')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // Not found
    throw error;
  }

  return data as Wallet;
}

/**
 * Credit wallet (add funds)
 */
export async function creditWallet(
  userId: string,
  amount: number,
  bookingId?: string,
  description?: string
): Promise<Wallet> {
  const wallet = await getOrCreateWallet(userId);

  const newBalance = (wallet.balance || 0) + amount;
  const newTotalEarned = (wallet.total_earned || 0) + amount;

  const { data, error } = await supabase
    .from('wallets')
    .update({
      balance: newBalance,
      total_earned: newTotalEarned,
      updated_at: new Date().toISOString()
    })
    .eq('id', wallet.id)
    .select()
    .single();

  if (error) throw error;

  // Create transaction record
  if (bookingId) {
    await createTransaction({
      booking_id: bookingId,
      user_id: userId,
      amount,
      type: TransactionType.CHARGE,
      provider: 'paystack',
      status: TransactionStatus.SUCCESS,
      description: description || `Earnings from booking ${bookingId}`
    });
  }

  return data as Wallet;
}

/**
 * Debit wallet (remove funds)
 */
export async function debitWallet(
  userId: string,
  amount: number,
  description?: string
): Promise<Wallet> {
  const wallet = await getOrCreateWallet(userId);

  if ((wallet.balance || 0) < amount) {
    throw new Error('Insufficient wallet balance');
  }

  const newBalance = (wallet.balance || 0) - amount;

  const { data, error } = await supabase
    .from('wallets')
    .update({
      balance: newBalance,
      updated_at: new Date().toISOString()
    })
    .eq('id', wallet.id)
    .select()
    .single();

  if (error) throw error;

  return data as Wallet;
}

/**
 * Move funds from pending to available balance
 * Called after booking checkout (clearance period)
 */
export async function releasePendingFunds(
  userId: string,
  amount: number,
  bookingId: string
): Promise<Wallet> {
  const wallet = await getOrCreateWallet(userId);

  if ((wallet.pending_balance || 0) < amount) {
    throw new Error('Insufficient pending balance');
  }

  const newPendingBalance = (wallet.pending_balance || 0) - amount;
  const newBalance = (wallet.balance || 0) + amount;

  const { data, error } = await supabase
    .from('wallets')
    .update({
      balance: newBalance,
      pending_balance: newPendingBalance,
      updated_at: new Date().toISOString()
    })
    .eq('id', wallet.id)
    .select()
    .single();

  if (error) throw error;

  return data as Wallet;
}

/**
 * Get wallet transactions
 */
export async function getWalletTransactions(
  userId: string,
  limit: number = 50
): Promise<Transaction[]> {
  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data as Transaction[];
}

/**
 * Get wallet summary with earnings breakdown
 */
export async function getWalletSummary(userId: string): Promise<{
  wallet: Wallet;
  recentTransactions: Transaction[];
  earningsBreakdown: {
    total_earned: number;
    total_paid_out: number;
    available: number;
    pending: number;
    pending_payouts: number;
  };
}> {
  const wallet = await getOrCreateWallet(userId);
  const transactions = await getWalletTransactions(userId, 10);

  // Get pending payout transactions
  const { data: pendingPayouts } = await supabase
    .from('transactions')
    .select('amount')
    .eq('user_id', userId)
    .eq('type', TransactionType.PAYOUT)
    .eq('status', TransactionStatus.PENDING);

  const pendingPayoutsAmount = pendingPayouts?.reduce((sum, tx) => sum + Number(tx.amount), 0) || 0;

  return {
    wallet,
    recentTransactions: transactions,
    earningsBreakdown: {
      total_earned: Number(wallet.total_earned || 0),
      total_paid_out: Number(wallet.total_paid_out || 0),
      available: Number(wallet.balance || 0),
      pending: Number(wallet.pending_balance || 0),
      pending_payouts: pendingPayoutsAmount
    }
  };
}

