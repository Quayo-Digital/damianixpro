/**
 * Recurring Availability Patterns API Service
 * Handles weekly, monthly, and custom recurring patterns
 */

import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';
import { handleError } from '@/utils/errorHandler';
import {
  eachDayOfInterval,
  format,
  getDay,
  getDate,
  startOfMonth,
  endOfMonth,
  isSameDay,
} from 'date-fns';

export interface RecurringPattern {
  id?: string;
  listing_id: string;
  pattern_type: 'weekly' | 'monthly' | 'custom';
  pattern_config: {
    daysOfWeek?: number[]; // 0-6 (Sunday-Saturday)
    daysOfMonth?: number[]; // 1-31
    weeksOfMonth?: number[]; // 1-4 (first, second, third, fourth week)
    specificDates?: string[]; // Specific dates in YYYY-MM-DD format
  };
  start_date: string;
  end_date?: string;
  available: boolean;
  price_override?: number;
  min_nights?: number;
  max_nights?: number;
  checkin_days?: number[];
  checkout_days?: number[];
  active: boolean;
  created_at?: string;
  updated_at?: string;
}

/**
 * Get all recurring patterns for a listing
 */
export async function getRecurringPatterns(listingId: string): Promise<RecurringPattern[]> {
  try {
    const { data, error } = await supabase
      .from('recurring_availability_patterns')
      .select('*')
      .eq('listing_id', listingId)
      .eq('active', true)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []) as RecurringPattern[];
  } catch (error) {
    logger.error('Error fetching recurring patterns', error);
    throw handleError(error, 'getRecurringPatterns');
  }
}

/**
 * Create a recurring pattern
 */
export async function createRecurringPattern(
  pattern: Omit<RecurringPattern, 'id' | 'created_at' | 'updated_at'>
): Promise<RecurringPattern> {
  try {
    const { data, error } = await supabase
      .from('recurring_availability_patterns')
      .insert({
        ...pattern,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return data as RecurringPattern;
  } catch (error) {
    logger.error('Error creating recurring pattern', error);
    throw handleError(error, 'createRecurringPattern');
  }
}

/**
 * Update a recurring pattern
 */
export async function updateRecurringPattern(
  patternId: string,
  updates: Partial<RecurringPattern>
): Promise<RecurringPattern> {
  try {
    const { data, error } = await supabase
      .from('recurring_availability_patterns')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', patternId)
      .select()
      .single();

    if (error) throw error;
    return data as RecurringPattern;
  } catch (error) {
    logger.error('Error updating recurring pattern', error);
    throw handleError(error, 'updateRecurringPattern');
  }
}

/**
 * Delete a recurring pattern
 */
export async function deleteRecurringPattern(patternId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('recurring_availability_patterns')
      .delete()
      .eq('id', patternId);

    if (error) throw error;
  } catch (error) {
    logger.error('Error deleting recurring pattern', error);
    throw handleError(error, 'deleteRecurringPattern');
  }
}

/**
 * Apply recurring patterns to generate availability for a date range
 */
export async function applyPatternsToDateRange(
  listingId: string,
  startDate: string,
  endDate: string
): Promise<
  Array<{
    date: string;
    available: boolean;
    price?: number;
    minNights?: number;
    maxNights?: number;
  }>
> {
  try {
    const patterns = await getRecurringPatterns(listingId);
    const start = new Date(startDate);
    const end = new Date(endDate);
    const dates = eachDayOfInterval({ start, end });

    const result: Array<{
      date: string;
      available: boolean;
      price?: number;
      minNights?: number;
      maxNights?: number;
    }> = [];

    for (const date of dates) {
      const dateStr = format(date, 'yyyy-MM-dd');
      let available = true;
      let price: number | undefined;
      let minNights: number | undefined;
      let maxNights: number | undefined;

      // Check if date matches any pattern
      for (const pattern of patterns) {
        if (!pattern.active) continue;

        // Check if date is within pattern date range
        const patternStart = new Date(pattern.start_date);
        const patternEnd = pattern.end_date ? new Date(pattern.end_date) : null;

        if (date < patternStart) continue;
        if (patternEnd && date > patternEnd) continue;

        // Check if date matches pattern
        if (matchesPattern(date, pattern)) {
          available = pattern.available;
          if (pattern.price_override) {
            price = pattern.price_override;
          }
          if (pattern.min_nights) {
            minNights = pattern.min_nights;
          }
          if (pattern.max_nights) {
            maxNights = pattern.max_nights;
          }
          break; // First matching pattern wins
        }
      }

      result.push({ date: dateStr, available, price, minNights, maxNights });
    }

    return result;
  } catch (error) {
    logger.error('Error applying patterns to date range', error);
    throw handleError(error, 'applyPatternsToDateRange');
  }
}

/**
 * Check if a date matches a pattern
 */
function matchesPattern(date: Date, pattern: RecurringPattern): boolean {
  const config = pattern.pattern_config;
  const dayOfWeek = getDay(date);
  const dayOfMonth = getDate(date);

  switch (pattern.pattern_type) {
    case 'weekly':
      if (config.daysOfWeek) {
        return config.daysOfWeek.includes(dayOfWeek);
      }
      return false;

    case 'monthly':
      if (config.daysOfMonth) {
        return config.daysOfMonth.includes(dayOfMonth);
      }
      if (config.weeksOfMonth && config.daysOfWeek) {
        // Check if it's the Nth occurrence of a day of week in the month
        const monthStart = startOfMonth(date);
        const monthEnd = endOfMonth(date);
        const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });
        const matchingDays = monthDays.filter((d) => config.daysOfWeek!.includes(getDay(d)));
        const weekIndex = Math.floor(matchingDays.findIndex((d) => isSameDay(d, date)) / 7) + 1;
        return config.weeksOfMonth.includes(weekIndex) && config.daysOfWeek.includes(dayOfWeek);
      }
      return false;

    case 'custom':
      if (config.specificDates) {
        const dateStr = format(date, 'yyyy-MM-dd');
        return config.specificDates.includes(dateStr);
      }
      if (config.daysOfWeek) {
        return config.daysOfWeek.includes(dayOfWeek);
      }
      return false;

    default:
      return false;
  }
}

/**
 * Generate dates from a pattern for preview
 */
export function generateDatesFromPattern(
  pattern: RecurringPattern,
  startDate: string,
  endDate: string
): string[] {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const dates = eachDayOfInterval({ start, end });

  return dates
    .filter((date) => matchesPattern(date, pattern))
    .map((date) => format(date, 'yyyy-MM-dd'));
}
