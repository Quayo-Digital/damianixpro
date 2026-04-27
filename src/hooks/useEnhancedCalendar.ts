/**
 * Hook for Enhanced Calendar functionality
 * Provides easy access to calendar features
 */

import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/utils/logger';
import { format } from 'date-fns';
import {
  getDatePricing,
  bulkSetDatePricing,
  calculateDynamicPrice,
} from '@/services/shortlet/api/pricing';
import {
  getRecurringPatterns,
  applyPatternsToDateRange,
} from '@/services/shortlet/api/recurringPatterns';
import {
  getChannelIntegrations,
  syncAvailabilityToChannel,
  syncAvailabilityFromChannel,
} from '@/services/shortlet/api/channelManager';
import { getCalendarView } from '@/services/shortlet/api/calendar';

export interface UseEnhancedCalendarOptions {
  listingId: string;
  basePrice: number;
}

export interface CalendarDate {
  date: string;
  available: boolean;
  price: number;
  blocked: boolean;
  booked: boolean;
  minNights?: number;
  maxNights?: number;
}

export function useEnhancedCalendar({ listingId, basePrice }: UseEnhancedCalendarOptions) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [calendarDates, setCalendarDates] = useState<Map<string, CalendarDate>>(new Map());

  /**
   * Load calendar data for a date range
   */
  const loadCalendar = useCallback(
    async (startDate: Date, endDate: Date) => {
      setIsLoading(true);
      try {
        const startStr = format(startDate, 'yyyy-MM-dd');
        const endStr = format(endDate, 'yyyy-MM-dd');

        // Load calendar view
        const calendar = await getCalendarView({
          listing_id: listingId,
          start_date: startStr,
          end_date: endStr,
          include_bookings: true,
        });

        // Load date pricing
        const pricing = await getDatePricing(listingId, startStr, endStr);
        const pricingMap = new Map(pricing.map((p) => [p.date, p]));

        // Apply recurring patterns
        const patterns = await getRecurringPatterns(listingId);
        const patternDates = await applyPatternsToDateRange(listingId, startStr, endStr);

        // Combine all data
        const datesMap = new Map<string, CalendarDate>();

        calendar.dates.forEach((dateEntry) => {
          const customPricing = pricingMap.get(dateEntry.date);
          const patternDate = patternDates.find((p) => p.date === dateEntry.date);

          datesMap.set(dateEntry.date, {
            date: dateEntry.date,
            available: patternDate?.available ?? dateEntry.available,
            price: customPricing?.price ?? patternDate?.price ?? basePrice,
            blocked: !dateEntry.available || patternDate?.available === false,
            booked: !dateEntry.available && !dateEntry.blocked,
            minNights: customPricing?.min_nights ?? patternDate?.minNights,
            maxNights: customPricing?.max_nights ?? patternDate?.maxNights,
          });
        });

        setCalendarDates(datesMap);
        return datesMap;
      } catch (error) {
        logger.error('Error loading calendar', error);
        toast({
          title: 'Error',
          description: 'Failed to load calendar data',
          variant: 'destructive',
        });
        return new Map<string, CalendarDate>();
      } finally {
        setIsLoading(false);
      }
    },
    [listingId, basePrice, toast]
  );

  /**
   * Set pricing for multiple dates
   */
  const setPricing = useCallback(
    async (
      dates: string[],
      price: number,
      options?: { minNights?: number; maxNights?: number; available?: boolean }
    ) => {
      try {
        const pricing = dates.map((date) => ({
          date,
          price,
          available: options?.available ?? true,
          min_nights: options?.minNights,
          max_nights: options?.maxNights,
        }));

        const result = await bulkSetDatePricing(listingId, pricing);

        toast({
          title: 'Success',
          description: `Pricing updated for ${result.success} date(s)`,
        });

        return result;
      } catch (error) {
        logger.error('Error setting pricing', error);
        toast({
          title: 'Error',
          description: 'Failed to update pricing',
          variant: 'destructive',
        });
        throw error;
      }
    },
    [listingId, toast]
  );

  /**
   * Calculate price for a date range
   */
  const calculatePrice = useCallback(
    async (checkinDate: string, checkoutDate: string, guestsCount: number = 1) => {
      try {
        return await calculateDynamicPrice(
          listingId,
          basePrice,
          checkinDate,
          checkoutDate,
          guestsCount
        );
      } catch (error) {
        logger.error('Error calculating price', error);
        throw error;
      }
    },
    [listingId, basePrice]
  );

  /**
   * Sync with channel manager
   */
  const syncToChannel = useCallback(
    async (integrationId: string, startDate: string, endDate: string) => {
      try {
        const result = await syncAvailabilityToChannel(integrationId, startDate, endDate);
        toast({
          title: result.success ? 'Sync Successful' : 'Sync Failed',
          description: `Synced ${result.itemsSynced} items`,
        });
        return result;
      } catch (error) {
        logger.error('Error syncing to channel', error);
        toast({
          title: 'Sync Error',
          description: 'Failed to sync with channel',
          variant: 'destructive',
        });
        throw error;
      }
    },
    [toast]
  );

  /**
   * Sync from channel manager
   */
  const syncFromChannel = useCallback(
    async (integrationId: string, startDate: string, endDate: string) => {
      try {
        const result = await syncAvailabilityFromChannel(integrationId, startDate, endDate);
        toast({
          title: result.success ? 'Sync Successful' : 'Sync Failed',
          description: `Synced ${result.itemsSynced} items`,
        });
        return result;
      } catch (error) {
        logger.error('Error syncing from channel', error);
        toast({
          title: 'Sync Error',
          description: 'Failed to sync from channel',
          variant: 'destructive',
        });
        throw error;
      }
    },
    [toast]
  );

  /**
   * Get channel integrations
   */
  const loadChannels = useCallback(async () => {
    try {
      return await getChannelIntegrations(listingId);
    } catch (error) {
      logger.error('Error loading channels', error);
      return [];
    }
  }, [listingId]);

  return {
    isLoading,
    calendarDates,
    loadCalendar,
    setPricing,
    calculatePrice,
    syncToChannel,
    syncFromChannel,
    loadChannels,
  };
}
