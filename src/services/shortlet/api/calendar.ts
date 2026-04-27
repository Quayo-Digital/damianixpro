/**
 * Calendar & Availability API Service
 * Handles listing availability, date blocking, and calendar operations
 */

import { supabase } from '@/integrations/supabase/client';
import { Availability, availabilitySchema, AvailabilityCalendar } from '../types';
import {
  checkAvailability,
  generateDateRange,
  isDateAvailable,
} from '../utils/availabilityChecker';
import { getBookingsByListing } from './bookings';

// ============================================================================
// Types
// ============================================================================

export interface BulkAvailabilityRequest {
  listing_id: string;
  dates: {
    start_date: string;
    end_date: string;
    available: boolean;
    source?: 'manual' | 'external' | 'blocked';
    notes?: string;
  }[];
}

export interface CalendarViewRequest {
  listing_id: string;
  start_date: string;
  end_date: string;
  include_bookings?: boolean;
}

// ============================================================================
// Availability Functions
// ============================================================================

/**
 * Get availability for a listing
 */
export async function getListingAvailability(listingId: string): Promise<Availability[]> {
  const { data, error } = await supabase
    .from('listing_availabilities')
    .select('*')
    .eq('listing_id', listingId)
    .order('start_date', { ascending: true });

  if (error) throw error;
  return data as Availability[];
}

/**
 * Get availability calendar view (with bookings)
 */
export async function getCalendarView(request: CalendarViewRequest): Promise<AvailabilityCalendar> {
  const { listing_id, start_date, end_date, include_bookings = true } = request;

  // Get all availabilities in date range
  const { data: availabilities, error: availError } = await supabase
    .from('listing_availabilities')
    .select('*')
    .eq('listing_id', listing_id)
    .or(`start_date.lte.${end_date},end_date.gte.${start_date}`)
    .order('start_date', { ascending: true });

  if (availError) throw availError;

  // Get bookings if requested
  let bookings: any[] = [];
  if (include_bookings) {
    bookings = await getBookingsByListing(listing_id);
  }

  // Generate date range
  const dates = generateDateRange(start_date, end_date);

  // Build calendar
  const calendar: AvailabilityCalendar = {
    listing_id,
    dates: dates.map((date) => {
      const available = isDateAvailable(date, bookings, availabilities || []);
      const blocked =
        availabilities?.some((a) => !a.available && date >= a.start_date && date <= a.end_date) ||
        false;

      return {
        date,
        available,
        blocked,
      };
    }),
  };

  return calendar;
}

/**
 * Create availability entry
 */
export async function createAvailability(
  availability: Omit<Availability, 'id' | 'created_at' | 'updated_at'>
): Promise<Availability> {
  const validated = availabilitySchema.parse(availability);

  const { data, error } = await supabase
    .from('listing_availabilities')
    .insert([
      {
        listing_id: validated.listing_id,
        start_date: validated.start_date,
        end_date: validated.end_date,
        available: validated.available,
        source: validated.source,
        source_id: validated.source_id,
        notes: validated.notes,
      },
    ])
    .select()
    .single();

  if (error) throw error;
  return data as Availability;
}

/**
 * Update availability entry
 */
export async function updateAvailability(
  availabilityId: string,
  updates: Partial<Availability>
): Promise<Availability> {
  const { data, error } = await supabase
    .from('listing_availabilities')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', availabilityId)
    .select()
    .single();

  if (error) throw error;
  return data as Availability;
}

/**
 * Delete availability entry
 */
export async function deleteAvailability(availabilityId: string): Promise<void> {
  const { error } = await supabase.from('listing_availabilities').delete().eq('id', availabilityId);

  if (error) throw error;
}

/**
 * Block dates (set as unavailable)
 */
export async function blockDates(
  listingId: string,
  startDate: string,
  endDate: string,
  notes?: string
): Promise<Availability> {
  // Check if overlapping availability exists
  const { data: existing } = await supabase
    .from('listing_availabilities')
    .select('*')
    .eq('listing_id', listingId)
    .or(`start_date.lte.${endDate},end_date.gte.${startDate}`);

  if (existing && existing.length > 0) {
    // Update existing or create new
    const overlapping = existing.find((a) => a.start_date <= endDate && a.end_date >= startDate);

    if (overlapping) {
      return updateAvailability(overlapping.id, {
        available: false,
        notes: notes || overlapping.notes,
      });
    }
  }

  // Create new blocked entry
  return createAvailability({
    listing_id: listingId,
    start_date: startDate,
    end_date: endDate,
    available: false,
    source: 'manual',
    notes,
  });
}

/**
 * Unblock dates (set as available)
 */
export async function unblockDates(
  listingId: string,
  startDate: string,
  endDate: string
): Promise<void> {
  // Find and delete or update blocked entries in range
  const { data: blocked } = await supabase
    .from('listing_availabilities')
    .select('*')
    .eq('listing_id', listingId)
    .eq('available', false)
    .or(`start_date.lte.${endDate},end_date.gte.${startDate}`);

  if (blocked && blocked.length > 0) {
    // Delete blocked entries that are fully within the unblock range
    for (const entry of blocked) {
      if (entry.start_date >= startDate && entry.end_date <= endDate) {
        await deleteAvailability(entry.id);
      } else if (entry.start_date < startDate && entry.end_date > endDate) {
        // Split: create two entries around the unblocked range
        if (entry.start_date < startDate) {
          await createAvailability({
            listing_id: listingId,
            start_date: entry.start_date,
            end_date: new Date(new Date(startDate).getTime() - 86400000)
              .toISOString()
              .split('T')[0],
            available: false,
            source: entry.source,
            notes: entry.notes,
          });
        }
        if (entry.end_date > endDate) {
          await createAvailability({
            listing_id: listingId,
            start_date: new Date(new Date(endDate).getTime() + 86400000)
              .toISOString()
              .split('T')[0],
            end_date: entry.end_date,
            available: false,
            source: entry.source,
            notes: entry.notes,
          });
        }
        await deleteAvailability(entry.id);
      } else {
        // Trim the entry
        if (entry.start_date < startDate) {
          await updateAvailability(entry.id, {
            end_date: new Date(new Date(startDate).getTime() - 86400000)
              .toISOString()
              .split('T')[0],
          });
        } else {
          await updateAvailability(entry.id, {
            start_date: new Date(new Date(endDate).getTime() + 86400000)
              .toISOString()
              .split('T')[0],
          });
        }
      }
    }
  }
}

/**
 * Bulk update availability
 */
export async function bulkUpdateAvailability(request: BulkAvailabilityRequest): Promise<{
  created: number;
  updated: number;
  errors: string[];
}> {
  const { listing_id, dates } = request;
  let created = 0;
  let updated = 0;
  const errors: string[] = [];

  for (const dateRange of dates) {
    try {
      // Check if entry exists
      const { data: existing } = await supabase
        .from('listing_availabilities')
        .select('*')
        .eq('listing_id', listing_id)
        .eq('start_date', dateRange.start_date)
        .eq('end_date', dateRange.end_date)
        .single();

      if (existing) {
        await updateAvailability(existing.id, {
          available: dateRange.available,
          source: dateRange.source || 'manual',
          notes: dateRange.notes,
        });
        updated++;
      } else {
        await createAvailability({
          listing_id,
          start_date: dateRange.start_date,
          end_date: dateRange.end_date,
          available: dateRange.available,
          source: dateRange.source || 'manual',
          notes: dateRange.notes,
        });
        created++;
      }
    } catch (error) {
      const errorMsg = `Failed to update ${dateRange.start_date} to ${dateRange.end_date}: ${error instanceof Error ? error.message : 'Unknown error'}`;
      errors.push(errorMsg);
      console.error(errorMsg);
    }
  }

  return { created, updated, errors };
}

/**
 * Clear all availability entries for a listing
 */
export async function clearAvailability(listingId: string): Promise<void> {
  const { error } = await supabase
    .from('listing_availabilities')
    .delete()
    .eq('listing_id', listingId);

  if (error) throw error;
}

/**
 * Set default availability (available every day)
 */
export async function setDefaultAvailability(
  listingId: string,
  startDate: string,
  endDate: string
): Promise<void> {
  // Clear existing
  await clearAvailability(listingId);

  // Create single available range
  await createAvailability({
    listing_id: listingId,
    start_date: startDate,
    end_date: endDate,
    available: true,
    source: 'manual',
    notes: 'Default availability',
  });
}

/**
 * Get availability conflicts (overlapping bookings/blocked dates)
 */
export async function getAvailabilityConflicts(
  listingId: string,
  startDate: string,
  endDate: string
): Promise<{
  has_conflicts: boolean;
  conflicts: {
    type: 'booking' | 'blocked';
    start_date: string;
    end_date: string;
    details: any;
  }[];
}> {
  const conflicts: any[] = [];

  // Check bookings
  const bookings = await getBookingsByListing(listingId);
  const checkin = new Date(startDate);
  const checkout = new Date(endDate);

  for (const booking of bookings) {
    if (
      booking.status === 'confirmed' ||
      booking.status === 'pending' ||
      booking.status === 'completed'
    ) {
      const bookingCheckin = new Date(booking.checkin_date);
      const bookingCheckout = new Date(booking.checkout_date);

      if (
        (checkin >= bookingCheckin && checkin < bookingCheckout) ||
        (checkout > bookingCheckin && checkout <= bookingCheckout) ||
        (checkin <= bookingCheckin && checkout >= bookingCheckout)
      ) {
        conflicts.push({
          type: 'booking',
          start_date: booking.checkin_date,
          end_date: booking.checkout_date,
          details: {
            booking_id: booking.id,
            status: booking.status,
            guest_id: booking.guest_id,
          },
        });
      }
    }
  }

  // Check blocked dates
  const { data: blocked } = await supabase
    .from('listing_availabilities')
    .select('*')
    .eq('listing_id', listingId)
    .eq('available', false)
    .or(`start_date.lte.${endDate},end_date.gte.${startDate}`);

  if (blocked) {
    for (const block of blocked) {
      const blockStart = new Date(block.start_date);
      const blockEnd = new Date(block.end_date);

      if (
        (checkin >= blockStart && checkin <= blockEnd) ||
        (checkout >= blockStart && checkout <= blockEnd) ||
        (checkin <= blockStart && checkout >= blockEnd)
      ) {
        conflicts.push({
          type: 'blocked',
          start_date: block.start_date,
          end_date: block.end_date,
          details: {
            availability_id: block.id,
            source: block.source,
            notes: block.notes,
          },
        });
      }
    }
  }

  return {
    has_conflicts: conflicts.length > 0,
    conflicts,
  };
}

/**
 * Get next available dates
 */
export async function getNextAvailableDates(
  listingId: string,
  startDate: string,
  nights: number,
  maxDays: number = 90
): Promise<string[]> {
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + maxDays);

  const calendar = await getCalendarView({
    listing_id: listingId,
    start_date: startDate,
    end_date: endDate.toISOString().split('T')[0],
    include_bookings: true,
  });

  const availableDates: string[] = [];
  let consecutiveAvailable = 0;
  let currentStart: string | null = null;

  for (const dateEntry of calendar.dates) {
    if (dateEntry.available && !dateEntry.blocked) {
      if (currentStart === null) {
        currentStart = dateEntry.date;
      }
      consecutiveAvailable++;

      if (consecutiveAvailable >= nights) {
        availableDates.push(currentStart);
        // Reset to find next range
        consecutiveAvailable = 0;
        currentStart = null;
      }
    } else {
      // Reset counter
      consecutiveAvailable = 0;
      currentStart = null;
    }
  }

  return availableDates;
}
