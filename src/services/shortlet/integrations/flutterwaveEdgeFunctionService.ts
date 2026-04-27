/**
 * Flutterwave Edge Function Service for Short-Let Payouts
 * Uses Supabase Edge Functions - no secret key in frontend
 * Handles bank resolution, transfers, and verification
 */

import {
  flutterwaveResolveAccount,
  flutterwaveListBanks,
  flutterwaveTransfer,
  flutterwaveVerifyTransfer,
} from '@/services/payments/edgeFunctionApi';
import type {
  CreateRecipientRequest,
  CreateRecipientResponse,
  TransferRequest,
  TransferResponse,
} from './paymentTypes';

export interface RecipientInfo {
  recipient_code: string;
  account_number: string;
  account_name: string;
  bank_name: string;
  bank_code: string;
}

/**
 * Flutterwave uses inline bank details (no recipient creation).
 * createRecipient verifies the account and returns RecipientInfo.
 * recipient_code is 'FLW_INLINE' as a sentinel for initiateTransfer.
 */
export class FlutterwaveEdgeFunctionService {
  generateReference(prefix: string = 'SL'): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 9).toUpperCase();
    return `${prefix}_${timestamp}_${random}`;
  }

  /**
   * Verify account via Flutterwave resolve; return RecipientInfo.
   * No Flutterwave recipient/beneficiary is created.
   */
  async createRecipient(request: CreateRecipientRequest): Promise<CreateRecipientResponse> {
    const result = await flutterwaveResolveAccount(request.account_number, request.bank_code);

    if (result.status && result.data) {
      const d = result.data;
      return {
        success: true,
        recipient_code: 'FLW_INLINE', // Sentinel - we use account details for transfer
        account_number: d.account_number || request.account_number,
        account_name: d.account_name || request.name,
        bank_name: '', // Resolve doesn't return bank name; listBanks can supplement
      };
    }
    return {
      success: false,
      error: result.message || 'Account resolution failed',
    };
  }

  /**
   * Initiate transfer using account_number and bank_code.
   * When recipient_code is 'FLW_INLINE', uses account_number and bank_code from recipient.
   */
  async initiateTransfer(
    request: TransferRequest & { recipient?: RecipientInfo }
  ): Promise<TransferResponse> {
    // Flutterwave needs account_number and account_bank (bank_code)
    const accountNumber = request.recipient?.account_number;
    const bankCode = request.recipient?.bank_code;
    if (!accountNumber || !bankCode) {
      return {
        success: false,
        error: 'account_number and bank_code are required for Flutterwave transfer',
      };
    }

    const result = await flutterwaveTransfer({
      account_number: accountNumber,
      account_bank: bankCode,
      amount: request.amount,
      currency: request.currency || 'NGN',
      narration: request.reason || 'Short-let booking payout',
      reference: request.reference || this.generateReference('PAYOUT'),
    });

    if (result.status && result.data) {
      const d = result.data;
      return {
        success: true,
        transfer_code: d.transfer_id || d.id,
        reference: d.reference,
      };
    }
    return {
      success: false,
      error: result.message || 'Transfer failed',
    };
  }

  async verifyTransfer(
    transferCode: string
  ): Promise<{ success: boolean; status?: string; error?: string }> {
    const result = await flutterwaveVerifyTransfer(transferCode);
    if (result.status && result.data) {
      return { success: true, status: result.data.status };
    }
    return { success: false, error: result.message };
  }

  async listBanks(): Promise<{ success: boolean; banks?: unknown[]; error?: string }> {
    const result = await flutterwaveListBanks('NG');

    if (!result.status || !result.data) {
      return { success: false, error: result.message || 'Failed to fetch banks' };
    }
    const banks = Array.isArray(result.data) ? result.data : [];
    return { success: true, banks };
  }

  async resolveAccount(
    account_number: string,
    bank_code: string
  ): Promise<{
    success: boolean;
    account_name?: string;
    account_number?: string;
    bank_code?: string;
    error?: string;
  }> {
    const result = await flutterwaveResolveAccount(account_number, bank_code);
    if (result.status && result.data) {
      const d = result.data;
      return {
        success: true,
        account_name: d.account_name,
        account_number: d.account_number,
        bank_code: d.bank_code,
      };
    }
    return { success: false, error: result.message || 'Account resolution failed' };
  }
}
