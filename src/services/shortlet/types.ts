/**
 * Short-Let System Type Definitions
 * Phase 1: Core types for short-letting functionality
 */

import { z } from 'zod';

// ============================================================================
// Enums
// ============================================================================

export enum BookingStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  CANCELLED = 'cancelled',
  COMPLETED = 'completed',
  REFUNDED = 'refunded',
}

export enum TransactionType {
  CHARGE = 'charge',
  REFUND = 'refund',
  PAYOUT = 'payout',
  DEPOSIT = 'deposit',
  COMMISSION = 'commission',
}

export enum TransactionStatus {
  PENDING = 'pending',
  SUCCESS = 'success',
  FAILED = 'failed',
  REFUNDED = 'refunded',
}

export enum ReviewType {
  GUEST = 'guest', // Guest reviews property/owner
  OWNER = 'owner', // Owner reviews guest
}

export enum DocumentType {
  ID_CARD = 'id_card',
  PASSPORT = 'passport',
  DRIVERS_LICENSE = 'drivers_license',
  OTHER = 'other',
}

// ============================================================================
// Schemas
// ============================================================================

export const cancellationPolicySchema = z.object({
  policy_name: z.string(),
  full_refund_before_days: z.number().int().min(0),
  partial_refund_before_days: z.number().int().min(0),
  partial_refund_percent: z.number().int().min(0).max(100),
  no_refund_within_days: z.number().int().min(0),
});

export const listingSchema = z.object({
  id: z.string().uuid().optional(),
  property_id: z.string().uuid(),
  title: z.string().min(1),
  description: z.string().optional(),
  capacity: z.number().int().min(1).default(1),
  amenities: z.array(z.string()).default([]),
  base_price: z.number().min(0),
  cleaning_fee: z.number().min(0).default(0),
  security_deposit: z.number().min(0).default(0),
  timezone: z.string().default('Africa/Lagos'),
  instant_book: z.boolean().default(false),
  active: z.boolean().default(true),
  cancellation_policy: cancellationPolicySchema.optional(),
});

export const availabilitySchema = z
  .object({
    id: z.string().uuid().optional(),
    listing_id: z.string().uuid(),
    start_date: z.string().date(),
    end_date: z.string().date(),
    available: z.boolean().default(true),
    source: z.enum(['manual', 'external', 'blocked']).default('manual'),
    source_id: z.string().optional(),
    notes: z.string().optional(),
  })
  .refine((data) => new Date(data.end_date) >= new Date(data.start_date), {
    message: 'End date must be after start date',
  });

export const bookingSchema = z
  .object({
    id: z.string().uuid().optional(),
    listing_id: z.string().uuid(),
    guest_id: z.string().uuid(),
    owner_id: z.string().uuid(),
    status: z.nativeEnum(BookingStatus).default(BookingStatus.PENDING),
    checkin_date: z.string().date(),
    checkout_date: z.string().date(),
    nights: z.number().int().min(1),
    guests_count: z.number().int().min(1).default(1),
    total_amount: z.number().min(0),
    payout_amount: z.number().min(0).optional(),
    commission_amount: z.number().min(0).optional(),
    currency: z.string().default('NGN'),
    payment_reference: z.string().optional(),
    deposit_amount: z.number().min(0).default(0),
    cancellation_policy: cancellationPolicySchema.optional(),
    metadata: z.record(z.any()).default({}),
    cancellation_reason: z.string().optional(),
    cancelled_at: z.string().datetime().optional(),
  })
  .refine((data) => new Date(data.checkout_date) > new Date(data.checkin_date), {
    message: 'Checkout date must be after checkin date',
  });

export const transactionSchema = z.object({
  id: z.string().uuid().optional(),
  booking_id: z.string().uuid().optional(),
  user_id: z.string().uuid(),
  amount: z.number(),
  type: z.nativeEnum(TransactionType),
  provider: z.string().default('flutterwave'),
  provider_ref: z.string().optional(),
  status: z.nativeEnum(TransactionStatus).default(TransactionStatus.PENDING),
  description: z.string().optional(),
  metadata: z.record(z.any()).default({}),
});

export const walletSchema = z.object({
  id: z.string().uuid().optional(),
  user_id: z.string().uuid(),
  balance: z.number().min(0).default(0),
  pending_balance: z.number().min(0).default(0),
  total_earned: z.number().min(0).default(0),
  total_paid_out: z.number().min(0).default(0),
});

export const guestDocumentSchema = z.object({
  id: z.string().uuid().optional(),
  user_id: z.string().uuid(),
  booking_id: z.string().uuid().optional(),
  document_type: z.nativeEnum(DocumentType),
  document_url: z.string().url(),
  verified: z.boolean().default(false),
  verified_by: z.string().uuid().optional(),
  verified_at: z.string().datetime().optional(),
});

export const reviewSchema = z.object({
  id: z.string().uuid().optional(),
  booking_id: z.string().uuid(),
  reviewer_id: z.string().uuid(),
  reviewee_id: z.string().uuid(),
  review_type: z.nativeEnum(ReviewType).default(ReviewType.GUEST),
  rating: z.number().int().min(1).max(5),
  comment: z.string().optional(),
  response: z.string().optional(),
  response_at: z.string().datetime().optional(),
});

// ============================================================================
// Types
// ============================================================================

export type CancellationPolicy = z.infer<typeof cancellationPolicySchema>;
export type Listing = z.infer<typeof listingSchema> & {
  id: string;
  created_at?: string;
  updated_at?: string;
  property?: {
    id: string;
    name: string;
    address: string;
    location: string;
    /** From `shortlet_details.form_meta` via `mapSupabaseToProperty` */
    imageUrl?: string;
  };
};
export type Availability = z.infer<typeof availabilitySchema> & {
  id: string;
  created_at?: string;
  updated_at?: string;
};
export type Booking = z.infer<typeof bookingSchema> & {
  id: string;
  created_at?: string;
  updated_at?: string;
  listing?: Listing;
  guest?: {
    id: string;
    name: string;
    email: string;
  };
  owner?: {
    id: string;
    name: string;
    email: string;
  };
};
export type Transaction = z.infer<typeof transactionSchema> & {
  id: string;
  created_at?: string;
  updated_at?: string;
};
export type Wallet = z.infer<typeof walletSchema> & {
  id: string;
  created_at?: string;
  updated_at?: string;
};
export type GuestDocument = z.infer<typeof guestDocumentSchema> & {
  id: string;
  created_at?: string;
  updated_at?: string;
};
export type Review = z.infer<typeof reviewSchema> & {
  id: string;
  created_at?: string;
  updated_at?: string;
  reviewer?: {
    id: string;
    name: string;
    email: string;
  };
  reviewee?: {
    id: string;
    name: string;
    email: string;
  };
  booking?: {
    id: string;
    listing?: {
      id: string;
      title: string;
      property?: {
        id: string;
        name: string;
        address: string;
      };
    };
  };
};

// ============================================================================
// Request/Response Types
// ============================================================================

export interface SearchListingsRequest {
  query?: string;
  location?: string;
  checkin_date?: string;
  checkout_date?: string;
  guests?: number;
  min_price?: number;
  max_price?: number;
  amenities?: string[];
  instant_book?: boolean;
  sort_by?: 'price_low' | 'price_high' | 'newest' | 'popular';
  page?: number;
  limit?: number;
  page_size?: number;
}

export interface SearchListingsResponse {
  listings: Listing[];
  total: number;
  page: number;
  limit: number;
}

export interface CreateBookingRequest {
  listing_id: string;
  checkin_date: string;
  checkout_date: string;
  guests_count: number;
  payment_method?: string;
  guest_data?: {
    name: string;
    email: string;
    phone: string;
  };
}

export interface CreateBookingResponse {
  booking_id: string;
  status: BookingStatus;
  amount_due: number;
  payment_url?: string;
  payment_reference?: string;
}

export interface PriceBreakdown {
  base_price: number;
  nights: number;
  subtotal: number;
  cleaning_fee: number;
  security_deposit: number;
  service_fee: number;
  total: number;
  currency: string;
}

export interface AvailabilityCalendar {
  listing_id: string;
  dates: {
    date: string;
    available: boolean;
    price?: number;
    blocked?: boolean;
  }[];
}

// ============================================================================
// Utility Types
// ============================================================================

export interface BookingConflict {
  booking_id: string;
  checkin_date: string;
  checkout_date: string;
  status: BookingStatus;
}

export interface PayoutRequest {
  user_id: string;
  amount: number;
  bank_account: {
    account_number: string;
    bank_code: string;
    account_name: string;
  };
}
