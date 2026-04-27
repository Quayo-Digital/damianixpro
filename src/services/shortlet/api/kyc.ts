/**
 * KYC (Know Your Customer) API Service
 * Handles KYC verification for owners receiving payouts
 */

import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';

export interface KYCData {
  user_id: string;
  bvn?: string;
  bank_account_number: string;
  bank_code: string;
  account_name: string;
  id_document_url?: string;
  proof_of_address_url?: string;
}

export interface KYCStatus {
  verified: boolean;
  verification_level: 'none' | 'basic' | 'full';
  verified_at?: string;
  verified_by?: string;
  rejection_reason?: string;
}

/**
 * Submit KYC information
 */
export async function submitKYC(kycData: KYCData): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    // Store KYC data in user profile
    const { error } = await supabase
      .from('profiles')
      .update({
        kyc_data: {
          bvn: kycData.bvn,
          bank_account_number: kycData.bank_account_number,
          bank_code: kycData.bank_code,
          account_name: kycData.account_name,
          id_document_url: kycData.id_document_url,
          proof_of_address_url: kycData.proof_of_address_url,
          submitted_at: new Date().toISOString(),
        },
        kyc_status: 'pending',
        updated_at: new Date().toISOString(),
      })
      .eq('id', kycData.user_id);

    if (error) throw error;

    return { success: true };
  } catch (error) {
    logger.error('KYC submission error', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'KYC submission failed',
    };
  }
}

/**
 * Get KYC status for user
 */
export async function getKYCStatus(userId: string): Promise<KYCStatus | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('kyc_status, kyc_data, kyc_verified_at, kyc_verified_by')
    .eq('id', userId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }

  return {
    verified: data.kyc_status === 'verified',
    verification_level:
      data.kyc_status === 'verified' ? 'full' : data.kyc_status === 'pending' ? 'basic' : 'none',
    verified_at: data.kyc_verified_at,
    verified_by: data.kyc_verified_by,
  };
}

/**
 * Check if user can request payout (KYC verified)
 */
export async function canRequestPayout(userId: string): Promise<{
  can_request: boolean;
  reason?: string;
}> {
  const kycStatus = await getKYCStatus(userId);

  if (!kycStatus || !kycStatus.verified) {
    return {
      can_request: false,
      reason: 'KYC verification required before requesting payouts',
    };
  }

  return {
    can_request: true,
  };
}
