/**
 * Payment Edge Function API
 * Calls Supabase Edge Functions for Flutterwave (and legacy payment edge routes where deployed).
 * Secret keys are stored server-side only.
 */

import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';

export interface PaystackInitializeParams {
  email: string;
  amount: number;
  reference?: string;
  callback_url?: string;
  currency?: string;
  metadata?: Record<string, unknown>;
}

export interface PaystackInitializeResult {
  status: boolean;
  data?: {
    reference: string;
    authorization_url: string;
    access_code: string;
  };
  message?: string;
}

export interface PaystackVerifyResult {
  status: boolean;
  data?: {
    reference: string;
    status: string;
    amount: number;
    paid_at?: string;
    fees?: number;
    gateway_response?: string;
    customer?: { email?: string; first_name?: string; last_name?: string };
    metadata?: Record<string, unknown>;
  };
  message?: string;
}

export interface PaystackRefundParams {
  transaction_reference: string;
  amount?: number;
  currency?: string;
  customer_note?: string;
  merchant_note?: string;
}

export interface FlutterwaveInitializeParams {
  email: string;
  amount: number;
  tx_ref?: string;
  redirect_url?: string;
  currency?: string;
  customer_name?: string;
  customer_phone?: string;
  /** Passed through to Flutterwave hosted page (title, description, logo) */
  customizations?: { title?: string; description?: string; logo?: string };
  meta?: Record<string, unknown>;
}

export interface FlutterwaveInitializeResult {
  status: string;
  message?: string;
  data?: {
    link: string;
    tx_ref: string;
    flw_ref?: string;
  };
}

export interface FlutterwaveVerifyResult {
  status: string;
  message?: string;
  data?: {
    tx_ref: string;
    status: string;
    amount: number;
    created_at?: string;
    app_fee?: number;
    processor_response?: string;
    customer?: { email?: string; name?: string };
    meta?: Record<string, unknown>;
  };
}

export interface FlutterwaveRefundParams {
  transaction_reference: string;
  amount?: number;
  comments?: string;
}

/**
 * Initialize payment via legacy `paystack-payments` Edge Function (Flutterwave is preferred for new flows).
 */
export async function paystackInitialize(
  params: PaystackInitializeParams
): Promise<PaystackInitializeResult> {
  const { data, error } = await supabase.functions.invoke<PaystackInitializeResult>(
    'paystack-payments',
    {
      body: {
        action: 'initialize',
        ...params,
      },
    }
  );

  if (error) {
    logger.error('Payment initialize Edge Function error', error);
    return { status: false, message: error.message || 'Payment initialization failed' };
  }

  return data || { status: false, message: 'No response from payment service' };
}

/**
 * Verify payment via Edge Function
 */
export async function paystackVerify(reference: string): Promise<PaystackVerifyResult> {
  const { data, error } = await supabase.functions.invoke<PaystackVerifyResult>(
    'paystack-payments',
    {
      body: {
        action: 'verify',
        reference,
      },
    }
  );

  if (error) {
    logger.error('Payment verify Edge Function error', error);
    return { status: false, message: error.message || 'Payment verification failed' };
  }

  return data || { status: false, message: 'No response from payment service' };
}

/**
 * Resolve bank account via Edge Function
 */
export async function paystackResolveAccount(
  accountNumber: string,
  bankCode: string
): Promise<{
  status: boolean;
  data?: { account_name: string; account_number: string; bank_code: string };
  message?: string;
}> {
  const { data, error } = await supabase.functions.invoke('paystack-payments', {
    body: { action: 'resolve_account', account_number: accountNumber, bank_code: bankCode },
  });

  if (error) {
    logger.error('Resolve account Edge Function error', error);
    return { status: false, message: error.message };
  }

  const result = data as {
    status: boolean;
    data?: { account_name: string; account_number: string; bank_code: string };
    message?: string;
  };
  return result || { status: false };
}

/**
 * List banks via Edge Function
 */
export async function paystackListBanks(
  country: string = 'NG'
): Promise<{ status: boolean; data?: { name: string; code: string }[]; message?: string }> {
  const { data, error } = await supabase.functions.invoke('paystack-payments', {
    body: { action: 'list_banks', country },
  });

  if (error) {
    logger.error('List banks Edge Function error', error);
    return { status: false, message: error.message };
  }

  return (data as { status: boolean; data?: unknown; message?: string }) || { status: false };
}

/**
 * Create transfer recipient via Edge Function
 */
export async function paystackCreateRecipient(params: {
  type: string;
  name: string;
  account_number: string;
  bank_code: string;
  currency?: string;
  description?: string;
}): Promise<{
  status: boolean;
  data?: {
    recipient_code: string;
    details: { account_number: string; account_name: string; bank_name: string };
  };
  message?: string;
}> {
  const { data, error } = await supabase.functions.invoke('paystack-payments', {
    body: { action: 'create_recipient', ...params },
  });

  if (error) {
    logger.error('Create recipient Edge Function error', error);
    return { status: false, message: error.message };
  }

  const result = data as {
    status: boolean;
    data?: {
      recipient_code: string;
      details: { account_number: string; account_name: string; bank_name: string };
    };
    message?: string;
  };
  return result || { status: false };
}

/**
 * Verify transfer via Edge Function
 */
export async function paystackVerifyTransfer(
  transferCode: string
): Promise<{ status: boolean; data?: { status: string }; message?: string }> {
  const { data, error } = await supabase.functions.invoke('paystack-payments', {
    body: { action: 'verify_transfer', transfer_code: transferCode },
  });

  if (error) {
    logger.error('Verify transfer Edge Function error', error);
    return { status: false, message: error.message };
  }

  const result = data as { status: boolean; data?: { status: string }; message?: string };
  return result || { status: false };
}

/**
 * Transfer via Edge Function
 */
export async function paystackTransfer(params: {
  recipient: string;
  amount: number;
  reason?: string;
  reference?: string;
  currency?: string;
}): Promise<{
  status: boolean;
  data?: { reference: string; transfer_code: string };
  message?: string;
}> {
  const { data, error } = await supabase.functions.invoke('paystack-payments', {
    body: { action: 'transfer', ...params },
  });

  if (error) {
    logger.error('Transfer Edge Function error', error);
    return { status: false, message: error.message };
  }

  const result = data as {
    status: boolean;
    data?: { reference: string; transfer_code: string };
    message?: string;
  };
  return result || { status: false };
}

/**
 * Create refund via Edge Function
 */
export async function paystackRefund(
  params: PaystackRefundParams
): Promise<{ status: boolean; data?: unknown; message?: string }> {
  const { data, error } = await supabase.functions.invoke('paystack-payments', {
    body: {
      action: 'refund',
      ...params,
    },
  });

  if (error) {
    logger.error('Refund Edge Function error', error);
    return { status: false, message: error.message || 'Refund failed' };
  }

  return data || { status: false, message: 'No response from payment service' };
}

/**
 * Initialize Flutterwave payment via Edge Function
 */
export async function flutterwaveInitialize(
  params: FlutterwaveInitializeParams
): Promise<FlutterwaveInitializeResult> {
  const { data, error } = await supabase.functions.invoke<Record<string, unknown>>(
    'flutterwave-payments',
    {
      body: {
        action: 'initialize',
        ...params,
      },
    }
  );

  if (error) {
    logger.error('Flutterwave initialize Edge Function error', error);
    return { status: 'error', message: error.message || 'Payment initialization failed' };
  }

  if (!data || typeof data !== 'object') {
    return { status: 'error', message: 'No response from payment service' };
  }

  // Edge function returns raw Flutterwave JSON: { status, message, data: { link, ... } }
  const edgeError = typeof data.error === 'string' ? data.error : undefined;
  if (data.success === false && edgeError) {
    return { status: 'error', message: edgeError };
  }

  const rawStatus = typeof data.status === 'string' ? data.status.toLowerCase() : '';
  const inner = data.data as Record<string, unknown> | undefined;
  const link =
    inner && typeof inner.link === 'string'
      ? inner.link
      : typeof (data as { link?: string }).link === 'string'
        ? (data as { link: string }).link
        : undefined;

  const txFromInner =
    inner &&
    (typeof inner.tx_ref === 'string'
      ? inner.tx_ref
      : typeof inner.reference === 'string'
        ? inner.reference
        : undefined);

  if ((rawStatus === 'success' || rawStatus === 'successful') && link) {
    return {
      status: 'success',
      data: {
        link,
        tx_ref: txFromInner || params.tx_ref || '',
        flw_ref: inner && typeof inner.flw_ref === 'string' ? inner.flw_ref : undefined,
      },
    };
  }

  const message =
    (typeof data.message === 'string' && data.message) ||
    edgeError ||
    'Payment initialization failed';
  return { status: 'error', message };
}

/**
 * Verify Flutterwave payment via Edge Function
 */
export async function flutterwaveVerify(reference: string): Promise<FlutterwaveVerifyResult> {
  const { data, error } = await supabase.functions.invoke<FlutterwaveVerifyResult>(
    'flutterwave-payments',
    {
      body: {
        action: 'verify',
        reference,
      },
    }
  );

  if (error) {
    logger.error('Flutterwave verify Edge Function error', error);
    return { status: 'error', message: error.message || 'Payment verification failed' };
  }

  return data || { status: 'error', message: 'No response from payment service' };
}

/**
 * Create Flutterwave refund via Edge Function
 */
export async function flutterwaveRefund(
  params: FlutterwaveRefundParams
): Promise<{ status: string; data?: unknown; message?: string }> {
  const { data, error } = await supabase.functions.invoke('flutterwave-payments', {
    body: {
      action: 'refund',
      ...params,
    },
  });

  if (error) {
    logger.error('Flutterwave refund Edge Function error', error);
    return { status: 'error', message: error.message || 'Refund failed' };
  }

  return data || { status: 'error', message: 'No response from payment service' };
}

/**
 * Resolve Flutterwave bank account via Edge Function
 */
export async function flutterwaveResolveAccount(
  accountNumber: string,
  bankCode: string
): Promise<{
  status: boolean;
  data?: { account_name: string; account_number: string; bank_code: string };
  message?: string;
}> {
  const { data, error } = await supabase.functions.invoke('flutterwave-payments', {
    body: {
      action: 'resolve_account',
      account_number: accountNumber,
      account_bank: bankCode,
      bank_code: bankCode,
    },
  });

  if (error) {
    logger.error('Flutterwave resolve account Edge Function error', error);
    return { status: false, message: error.message };
  }

  const result = data as {
    status: boolean;
    data?: { account_name: string; account_number: string; bank_code: string };
    message?: string;
  };
  return result || { status: false };
}

/**
 * List Flutterwave banks via Edge Function
 */
export async function flutterwaveListBanks(
  country: string = 'NG'
): Promise<{ status: boolean; data?: { name: string; code: string }[]; message?: string }> {
  const { data, error } = await supabase.functions.invoke('flutterwave-payments', {
    body: { action: 'list_banks', country },
  });

  if (error) {
    logger.error('Flutterwave list banks Edge Function error', error);
    return { status: false, message: error.message };
  }

  const result = data as { status: boolean; data?: unknown; message?: string };
  return result || { status: false };
}

/**
 * Flutterwave transfer via Edge Function (direct bank transfer - no recipient creation)
 */
export async function flutterwaveTransfer(params: {
  account_number: string;
  account_bank: string;
  amount: number;
  currency?: string;
  narration?: string;
  reference?: string;
}): Promise<{
  status: boolean;
  data?: { id: string; transfer_id: string; reference: string };
  message?: string;
}> {
  const { data, error } = await supabase.functions.invoke('flutterwave-payments', {
    body: {
      action: 'transfer',
      ...params,
    },
  });

  if (error) {
    logger.error('Flutterwave transfer Edge Function error', error);
    return { status: false, message: error.message };
  }

  const result = data as {
    status: boolean;
    data?: { id: string; transfer_id: string; reference: string };
    message?: string;
  };
  return result || { status: false };
}

/**
 * Verify Flutterwave transfer via Edge Function
 */
export async function flutterwaveVerifyTransfer(
  transferId: string
): Promise<{ status: boolean; data?: { status: string }; message?: string }> {
  const { data, error } = await supabase.functions.invoke('flutterwave-payments', {
    body: { action: 'verify_transfer', transfer_id: transferId, id: transferId },
  });

  if (error) {
    logger.error('Flutterwave verify transfer Edge Function error', error);
    return { status: false, message: error.message };
  }

  const result = data as { status: boolean; data?: { status: string }; message?: string };
  return result || { status: false };
}
