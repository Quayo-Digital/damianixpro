/**
 * Payment Service Adapters
 * Helper functions to convert between old and new payment formats
 */

import {
  UnifiedPaymentRequest,
  RegularPaymentMetadata,
  ShortletPaymentMetadata,
  PaymentMethod,
} from './types';
import { PaymentRequest as OldPaymentRequest } from '@/services/paymentService';

// ============================================================================
// Regular Payment Adapters
// ============================================================================

/**
 * Convert old PaymentRequest to UnifiedPaymentRequest (regular payments)
 */
export function adaptRegularPaymentRequest(
  oldRequest: OldPaymentRequest,
  customer: { email: string; name?: string; phone?: string }
): UnifiedPaymentRequest {
  // Map old payment_method to new PaymentMethod
  let method: PaymentMethod = 'flutterwave';
  if (oldRequest.payment_method === 'card') {
    method = 'flutterwave';
  } else if (oldRequest.payment_method === 'bank_transfer') {
    method = 'bank_transfer';
  } else if (oldRequest.payment_method === 'ussd') {
    method = 'ussd';
  } else if (oldRequest.payment_method === 'mobile_money') {
    method = 'mobile_money';
  }

  const metadata: RegularPaymentMetadata = {
    tenant_id: oldRequest.tenant_id,
    lease_id: oldRequest.lease_id,
    payment_type: oldRequest.payment_type,
  };

  return {
    amount: oldRequest.amount,
    method,
    customer,
    context: 'regular',
    metadata,
    description: oldRequest.description,
    currency: 'NGN',
  };
}

// ============================================================================
// Shortlet Payment Adapters
// ============================================================================

/**
 * Create UnifiedPaymentRequest for shortlet booking
 */
export function createShortletPaymentRequest(
  bookingId: string,
  listingId: string,
  guestId: string,
  ownerId: string,
  amount: number,
  customer: { email: string; name?: string; phone?: string },
  method: PaymentMethod = 'flutterwave',
  callbackUrl?: string,
  nights?: number
): UnifiedPaymentRequest {
  const metadata: ShortletPaymentMetadata = {
    booking_id: bookingId,
    listing_id: listingId,
    guest_id: guestId,
    owner_id: ownerId,
  };

  if (nights) {
    metadata.nights = nights;
  }

  return {
    amount,
    method,
    customer,
    context: 'shortlet',
    metadata,
    description: `Payment for booking ${bookingId}`,
    callback_url: callbackUrl,
    currency: 'NGN',
  };
}

// ============================================================================
// Response Adapters
// ============================================================================

/**
 * Convert UnifiedPaymentResponse to old PaymentResponse format (for backward compatibility)
 */
export function adaptToOldPaymentResponse(
  unifiedResponse: import('./types').UnifiedPaymentResponse
): import('@/services/paymentService').PaymentResponse {
  return {
    success: unifiedResponse.success,
    payment_id: unifiedResponse.payment_id || unifiedResponse.reference,
    reference_number: unifiedResponse.reference,
    authorization_url: unifiedResponse.authorization_url,
    access_code: unifiedResponse.access_code,
    error: unifiedResponse.error,
    message: unifiedResponse.message,
  };
}
