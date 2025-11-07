/**
 * Availability Checking Utilities
 * Handles date range validation and conflict detection
 */

import { Availability, Booking, BookingConflict } from '../types';

export interface AvailabilityCheckInput {
  listing_id: string;
  checkin_date: string;
  checkout_date: string;
  existing_bookings?: Booking[];
  existing_availabilities?: Availability[];
}

export interface AvailabilityResult {
  available: boolean;
  conflicts?: BookingConflict[];
  blocked_dates?: string[];
}

/**
 * Check if dates are available for booking
 */
export function checkAvailability(input: AvailabilityCheckInput): AvailabilityResult {
  const {
    checkin_date,
    checkout_date,
    existing_bookings = [],
    existing_availabilities = []
  } = input;

  const checkin = new Date(checkin_date);
  const checkout = new Date(checkout_date);

  // Validate date range
  if (checkout <= checkin) {
    return {
      available: false,
      conflicts: [],
      blocked_dates: []
    };
  }

  // Check for blocked dates in availabilities
  const blocked_dates: string[] = [];
  for (const availability of existing_availabilities) {
    if (!availability.available) {
      const blockStart = new Date(availability.start_date);
      const blockEnd = new Date(availability.end_date);
      
      // Check if booking dates overlap with blocked dates
      if (
        (checkin >= blockStart && checkin <= blockEnd) ||
        (checkout >= blockStart && checkout <= blockEnd) ||
        (checkin <= blockStart && checkout >= blockEnd)
      ) {
        blocked_dates.push(availability.start_date);
      }
    }
  }

  // Check for conflicting bookings
  const conflicts: BookingConflict[] = [];
  for (const booking of existing_bookings) {
    if (
      booking.status === 'confirmed' ||
      booking.status === 'pending' ||
      booking.status === 'completed'
    ) {
      const bookingCheckin = new Date(booking.checkin_date);
      const bookingCheckout = new Date(booking.checkout_date);

      // Check if dates overlap
      if (
        (checkin >= bookingCheckin && checkin < bookingCheckout) ||
        (checkout > bookingCheckin && checkout <= bookingCheckout) ||
        (checkin <= bookingCheckin && checkout >= bookingCheckout)
      ) {
        conflicts.push({
          booking_id: booking.id,
          checkin_date: booking.checkin_date,
          checkout_date: booking.checkout_date,
          status: booking.status as any
        });
      }
    }
  }

  return {
    available: conflicts.length === 0 && blocked_dates.length === 0,
    conflicts: conflicts.length > 0 ? conflicts : undefined,
    blocked_dates: blocked_dates.length > 0 ? blocked_dates : undefined
  };
}

/**
 * Generate date range for availability calendar
 */
export function generateDateRange(start_date: string, end_date: string): string[] {
  const dates: string[] = [];
  const start = new Date(start_date);
  const end = new Date(end_date);
  
  const current = new Date(start);
  while (current <= end) {
    dates.push(current.toISOString().split('T')[0]);
    current.setDate(current.getDate() + 1);
  }
  
  return dates;
}

/**
 * Check if a specific date is available
 */
export function isDateAvailable(
  date: string,
  bookings: Booking[],
  availabilities: Availability[]
): boolean {
  const checkDate = new Date(date);

  // Check if date is blocked
  for (const availability of availabilities) {
    if (!availability.available) {
      const blockStart = new Date(availability.start_date);
      const blockEnd = new Date(availability.end_date);
      
      if (checkDate >= blockStart && checkDate <= blockEnd) {
        return false;
      }
    }
  }

  // Check if date is booked
  for (const booking of bookings) {
    if (
      booking.status === 'confirmed' ||
      booking.status === 'pending' ||
      booking.status === 'completed'
    ) {
      const bookingCheckin = new Date(booking.checkin_date);
      const bookingCheckout = new Date(booking.checkout_date);
      
      if (checkDate >= bookingCheckin && checkDate < bookingCheckout) {
        return false;
      }
    }
  }

  return true;
}

