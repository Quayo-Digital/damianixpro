/**
 * Payout Service - Flutterwave only
 * Short-let owner payouts use Flutterwave
 */

import { FlutterwaveEdgeFunctionService } from './flutterwaveEdgeFunctionService';
import type { RecipientInfo } from './flutterwaveEdgeFunctionService';

export type PayoutProvider = 'flutterwave';
export type { RecipientInfo };

export interface PayoutServiceInterface {
  createRecipient(request: {
    type: string;
    name: string;
    account_number: string;
    bank_code: string;
    currency?: string;
    description?: string;
  }): Promise<{
    success: boolean;
    recipient_code?: string;
    account_number?: string;
    account_name?: string;
    bank_name?: string;
    error?: string;
  }>;
  initiateTransfer(
    request: {
      amount: number;
      recipient_code?: string;
      reason?: string;
      reference?: string;
      currency?: string;
    },
    recipient: RecipientInfo
  ): Promise<{
    success: boolean;
    transfer_code?: string;
    reference?: string;
    error?: string;
  }>;
  verifyTransfer(
    transferCode: string
  ): Promise<{ success: boolean; status?: string; error?: string }>;
  listBanks(): Promise<{ success: boolean; banks?: unknown[]; error?: string }>;
  resolveAccount(
    account_number: string,
    bank_code: string
  ): Promise<{
    success: boolean;
    account_name?: string;
    account_number?: string;
    bank_code?: string;
    error?: string;
  }>;
}

let payoutInstance: PayoutServiceInterface | null = null;
let currentProvider: PayoutProvider | null = null;

function getProvider(): PayoutProvider {
  return 'flutterwave';
}

export function getPayoutProvider(): PayoutProvider {
  return getProvider();
}

export function getPayoutService(): PayoutServiceInterface {
  const provider = getProvider();
  if (payoutInstance && currentProvider === provider) {
    return payoutInstance;
  }

  const flwKey = import.meta.env.VITE_FLUTTERWAVE_PUBLIC_KEY;
  if (!flwKey) {
    throw new Error(
      'Flutterwave not configured. Set VITE_FLUTTERWAVE_PUBLIC_KEY. Secret key must be in Supabase secrets (FLUTTERWAVE_SECRET_KEY).'
    );
  }
  payoutInstance = new FlutterwavePayoutAdapter(new FlutterwaveEdgeFunctionService());
  currentProvider = provider;
  return payoutInstance;
}

class FlutterwavePayoutAdapter implements PayoutServiceInterface {
  constructor(private flutterwave: FlutterwaveEdgeFunctionService) {}

  async createRecipient(request: Parameters<PayoutServiceInterface['createRecipient']>[0]) {
    return this.flutterwave.createRecipient(request as any);
  }

  async initiateTransfer(
    request: Parameters<PayoutServiceInterface['initiateTransfer']>[0],
    recipient: RecipientInfo
  ) {
    return this.flutterwave.initiateTransfer({
      ...request,
      recipient,
    } as any);
  }

  async verifyTransfer(transferCode: string) {
    return this.flutterwave.verifyTransfer(transferCode);
  }

  async listBanks() {
    return this.flutterwave.listBanks();
  }

  async resolveAccount(account_number: string, bank_code: string) {
    return this.flutterwave.resolveAccount(account_number, bank_code);
  }
}
