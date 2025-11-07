/**
 * React Hook for Short-Let Wallet Management
 * Provides easy-to-use functions for wallet operations and payouts
 */

import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '@/contexts/auth';
import { useToast } from '@/hooks/use-toast';
import {
  getOrCreateWallet,
  getWalletSummary,
  getWalletTransactions,
  releasePendingFunds
} from '@/services/shortlet/api/wallets';
import {
  requestPayout,
  getPayoutHistory,
  verifyPayoutStatus,
  cancelPayout,
  createOrGetRecipient
} from '@/services/shortlet/api/payouts';
import { Wallet, Transaction } from '@/services/shortlet/types';

export interface UseShortletWalletReturn {
  wallet: Wallet | null;
  walletSummary: any | null;
  transactions: Transaction[];
  isLoading: boolean;
  refreshWallet: () => Promise<void>;
  requestPayout: (amount: number, bankAccount: {
    account_number: string;
    bank_code: string;
    account_name: string;
  }, reason?: string) => Promise<{
    success: boolean;
    payout_id?: string;
    error?: string;
  }>;
  getPayoutHistory: () => Promise<void>;
  payoutHistory: any[];
  verifyPayout: (transferCode: string) => Promise<void>;
  cancelPayout: (payoutId: string) => Promise<{ success: boolean; error?: string }>;
}

export function useShortletWallet(): UseShortletWalletReturn {
  const { user } = useAuth();
  const { toast } = useToast();
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [walletSummary, setWalletSummary] = useState<any | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [payoutHistory, setPayoutHistory] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const refreshWallet = useCallback(async () => {
    if (!user?.id) return;

    setIsLoading(true);
    try {
      const summary = await getWalletSummary(user.id);
      setWallet(summary.wallet);
      setWalletSummary(summary);
      setTransactions(summary.recentTransactions);
    } catch (error) {
      console.error('Error refreshing wallet:', error);
      toast({
        title: 'Error',
        description: 'Failed to load wallet information',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [user, toast]);

  const handleRequestPayout = useCallback(async (
    amount: number,
    bankAccount: {
      account_number: string;
      bank_code: string;
      account_name: string;
    },
    reason?: string
  ) => {
    if (!user?.id) {
      return {
        success: false,
        error: 'User not authenticated'
      };
    }

    setIsLoading(true);
    try {
      const result = await requestPayout({
        user_id: user.id,
        amount,
        bank_account: bankAccount,
        reason
      });

      if (result.success) {
        toast({
          title: 'Payout Requested',
          description: 'Your payout request has been submitted successfully.',
        });
        await refreshWallet();
        await getPayoutHistory();
      } else {
        toast({
          title: 'Payout Failed',
          description: result.error || 'Failed to request payout',
          variant: 'destructive',
        });
      }

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Payout request failed';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      return {
        success: false,
        error: errorMessage
      };
    } finally {
      setIsLoading(false);
    }
  }, [user, toast, refreshWallet]);

  const handleGetPayoutHistory = useCallback(async () => {
    if (!user?.id) return;

    setIsLoading(true);
    try {
      const history = await getPayoutHistory(user.id);
      setPayoutHistory(history);
    } catch (error) {
      console.error('Error fetching payout history:', error);
      toast({
        title: 'Error',
        description: 'Failed to load payout history',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [user, toast]);

  const handleVerifyPayout = useCallback(async (transferCode: string) => {
    setIsLoading(true);
    try {
      const result = await verifyPayoutStatus(transferCode);
      if (result.success) {
        toast({
          title: 'Payout Status Updated',
          description: `Payout status: ${result.status}`,
        });
        await refreshWallet();
        await handleGetPayoutHistory();
      } else {
        toast({
          title: 'Verification Failed',
          description: result.error || 'Could not verify payout status',
          variant: 'destructive',
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Payout verification failed';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast, refreshWallet, handleGetPayoutHistory]);

  const handleCancelPayout = useCallback(async (payoutId: string) => {
    setIsLoading(true);
    try {
      const result = await cancelPayout(payoutId);
      if (result.success) {
        toast({
          title: 'Payout Cancelled',
          description: 'Payout has been cancelled and funds returned to your wallet.',
        });
        await refreshWallet();
        await handleGetPayoutHistory();
      } else {
        toast({
          title: 'Cancellation Failed',
          description: result.error || 'Could not cancel payout',
          variant: 'destructive',
        });
      }
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Payout cancellation failed';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      return {
        success: false,
        error: errorMessage
      };
    } finally {
      setIsLoading(false);
    }
  }, [toast, refreshWallet, handleGetPayoutHistory]);

  // Load wallet on mount
  useEffect(() => {
    if (user?.id) {
      refreshWallet();
      handleGetPayoutHistory();
    }
  }, [user?.id, refreshWallet, handleGetPayoutHistory]);

  return {
    wallet,
    walletSummary,
    transactions,
    isLoading,
    refreshWallet,
    requestPayout: handleRequestPayout,
    getPayoutHistory: handleGetPayoutHistory,
    payoutHistory,
    verifyPayout: handleVerifyPayout,
    cancelPayout: handleCancelPayout
  };
}

