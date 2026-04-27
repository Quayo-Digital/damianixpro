/**
 * Shared payment types for Flutterwave integration
 * Used by FlutterwaveEdgeFunctionService and payout adapters
 */

export interface CreateRecipientRequest {
  type: 'nuban'; // Nigerian bank account
  name: string;
  account_number: string;
  bank_code: string;
  currency?: string;
  description?: string;
}

export interface CreateRecipientResponse {
  success: boolean;
  recipient_code?: string;
  account_number?: string;
  account_name?: string;
  bank_name?: string;
  message?: string;
  error?: string;
}

export interface TransferRequest {
  amount: number; // Amount in Naira
  recipient_code?: string;
  reason?: string;
  reference?: string;
  currency?: string;
}

export interface TransferResponse {
  success: boolean;
  transfer_code?: string;
  reference?: string;
  amount?: number;
  message?: string;
  error?: string;
}
