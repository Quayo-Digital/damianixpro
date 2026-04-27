/**
 * Unified Payment Service Types
 * Common types for all payment operations (regular payments and shortlets)
 */

// ============================================================================
// Payment Methods
// ============================================================================

export type PaymentMethod = 'flutterwave' | 'bank_transfer' | 'ussd' | 'mobile_money';

export type PaymentProvider = 'flutterwave' | 'bank_transfer' | 'ussd';

export type PaymentStatus =
  | 'pending'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'cancelled'
  | 'refunded';

// ============================================================================
// Payment Context (Regular vs Shortlet)
// ============================================================================

export type PaymentContext = 'regular' | 'shortlet';

export interface RegularPaymentMetadata {
  tenant_id: string;
  lease_id: string;
  property_tenant_id?: string;
  payment_type: 'rent' | 'deposit' | 'late_fee' | 'utility' | 'maintenance' | 'other';
}

export interface ShortletPaymentMetadata {
  booking_id: string;
  listing_id: string;
  guest_id: string;
  owner_id: string;
  nights?: number;
}

export type PaymentMetadata = RegularPaymentMetadata | ShortletPaymentMetadata;

// ============================================================================
// Unified Payment Request
// ============================================================================

export interface UnifiedPaymentRequest {
  // Amount in Naira
  amount: number;

  // Payment method/provider
  method: PaymentMethod;

  // Customer information
  customer: {
    email: string;
    name?: string;
    phone?: string;
  };

  // Payment context
  context: PaymentContext;

  // Context-specific metadata
  metadata: PaymentMetadata;

  // Description
  description: string;

  // Callback URL
  callback_url?: string;

  // Currency (defaults to NGN)
  currency?: string;

  // Additional options
  options?: {
    reference?: string;
    [key: string]: any;
  };
}

// ============================================================================
// Unified Payment Response
// ============================================================================

export interface UnifiedPaymentResponse {
  success: boolean;
  payment_id?: string;
  reference?: string;
  authorization_url?: string;
  access_code?: string;
  message?: string;
  error?: string;
  provider?: PaymentProvider;
  metadata?: Record<string, any>;
}

// ============================================================================
// Payment Verification
// ============================================================================

export interface PaymentVerificationRequest {
  reference: string;
  provider?: PaymentProvider; // Auto-detect if not provided
}

export interface PaymentVerificationResponse {
  success: boolean;
  status: PaymentStatus;
  amount: number;
  reference: string;
  provider: PaymentProvider;
  customer?: {
    email: string;
    name?: string;
  };
  metadata?: Record<string, any>;
  paid_at?: string;
  fees?: number;
  gateway_response?: string;
  error?: string;
}

// ============================================================================
// Refund Request/Response
// ============================================================================

export interface RefundRequest {
  transaction_reference: string;
  provider?: PaymentProvider;
  amount?: number; // Partial refund if specified, full refund if omitted
  currency?: string;
  customer_note?: string;
  merchant_note?: string;
  reason?: string;
}

export interface RefundResponse {
  success: boolean;
  refund_id?: string;
  transaction_id?: string;
  amount?: number;
  reference?: string;
  message?: string;
  error?: string;
}

// ============================================================================
// Payment Provider Interface
// ============================================================================

export interface IPaymentProvider {
  /**
   * Initialize a payment transaction
   */
  initializePayment(request: UnifiedPaymentRequest): Promise<UnifiedPaymentResponse>;

  /**
   * Verify a payment transaction
   */
  verifyPayment(reference: string): Promise<PaymentVerificationResponse>;

  /**
   * Create a refund
   */
  createRefund(request: RefundRequest): Promise<RefundResponse>;

  /**
   * Get provider name
   */
  getName(): PaymentProvider;

  /**
   * Check if provider is available/configured
   */
  isAvailable(): boolean;
}

// ============================================================================
// Payment Service Configuration
// ============================================================================

export interface PaymentServiceConfig {
  defaultMethod?: PaymentMethod;
  enabledProviders?: PaymentProvider[];
  defaultCurrency?: string;
  callbackBaseUrl?: string;
}
