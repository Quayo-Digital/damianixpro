/**
 * Price Calculation Utilities for Short-Lets
 * Handles pricing breakdown, discounts, and fee calculations
 */

import { Listing, PriceBreakdown } from '../types';

export interface PriceCalculationInput {
  listing: Listing;
  checkin_date: string;
  checkout_date: string;
  guests_count: number;
  service_fee_percent?: number; // Platform commission percentage
}

/**
 * Calculate total price breakdown for a booking
 */
export function calculatePriceBreakdown(input: PriceCalculationInput): PriceBreakdown {
  const {
    listing,
    checkin_date,
    checkout_date,
    guests_count,
    service_fee_percent = 10 // Default 10% platform commission
  } = input;

  // Calculate number of nights
  const checkin = new Date(checkin_date);
  const checkout = new Date(checkout_date);
  const nights = Math.ceil((checkout.getTime() - checkin.getTime()) / (1000 * 60 * 60 * 24));

  // Base price (per night)
  const base_price = Number(listing.base_price) || 0;
  const subtotal = base_price * nights;

  // Additional fees
  const cleaning_fee = Number(listing.cleaning_fee) || 0;
  const security_deposit = Number(listing.security_deposit) || 0;

  // Service fee (platform commission)
  const service_fee = (subtotal + cleaning_fee) * (service_fee_percent / 100);

  // Total (excluding security deposit, which is held separately)
  const total = subtotal + cleaning_fee + service_fee;

  return {
    base_price,
    nights,
    subtotal,
    cleaning_fee,
    security_deposit,
    service_fee,
    total,
    currency: 'NGN'
  };
}

/**
 * Calculate refund amount based on cancellation policy
 */
export function calculateRefundAmount(
  total_amount: number,
  cancellation_policy: any,
  checkin_date: string,
  cancellation_date: string = new Date().toISOString().split('T')[0]
): number {
  if (!cancellation_policy) {
    return 0; // No refund policy
  }

  const checkin = new Date(checkin_date);
  const cancellation = new Date(cancellation_date);
  const days_before = Math.ceil((checkin.getTime() - cancellation.getTime()) / (1000 * 60 * 60 * 24));

  // Full refund
  if (days_before >= cancellation_policy.full_refund_before_days) {
    return total_amount;
  }

  // Partial refund
  if (days_before >= cancellation_policy.partial_refund_before_days) {
    const refund_percent = cancellation_policy.partial_refund_percent || 50;
    return total_amount * (refund_percent / 100);
  }

  // No refund
  if (days_before < cancellation_policy.no_refund_within_days) {
    return 0;
  }

  // Default: no refund
  return 0;
}

/**
 * Calculate payout amount for owner (after platform commission)
 */
export function calculatePayoutAmount(
  total_amount: number,
  commission_percent: number = 10
): number {
  const commission = total_amount * (commission_percent / 100);
  return total_amount - commission;
}

