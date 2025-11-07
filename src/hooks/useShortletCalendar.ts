/**
 * React Hook for Short-Let Calendar Management
 * Provides easy-to-use functions for calendar operations
 */

import { useState, useCallback, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import {
  getCalendarView,
  getListingAvailability,
  blockDates,
  unblockDates,
  bulkUpdateAvailability,
  getAvailabilityConflicts,
  getNextAvailableDates,
  clearAvailability,
  setDefaultAvailability
} from '@/services/shortlet/api/calendar';
import { AvailabilityCalendar, Availability } from '@/services/shortlet/types';

export interface UseShortletCalendarReturn {
  calendar: AvailabilityCalendar | null;
  availability: Availability[];
  isLoading: boolean;
  refreshCalendar: (listingId: string, startDate: string, endDate: string) => Promise<void>;
  blockDates: (listingId: string, startDate: string, endDate: string, notes?: string) => Promise<void>;
  unblockDates: (listingId: string, startDate: string, endDate: string) => Promise<void>;
  checkConflicts: (listingId: string, startDate: string, endDate: string) => Promise<any>;
  getAvailableDates: (listingId: string, startDate: string, nights: number) => Promise<string[]>;
  clearAll: (listingId: string) => Promise<void>;
  setDefault: (listingId: string, startDate: string, endDate: string) => Promise<void>;
}

export function useShortletCalendar(): UseShortletCalendarReturn {
  const { toast } = useToast();
  const [calendar, setCalendar] = useState<AvailabilityCalendar | null>(null);
  const [availability, setAvailability] = useState<Availability[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const refreshCalendar = useCallback(async (
    listingId: string,
    startDate: string,
    endDate: string
  ) => {
    setIsLoading(true);
    try {
      const calendarData = await getCalendarView({
        listing_id: listingId,
        start_date: startDate,
        end_date: endDate,
        include_bookings: true
      });
      setCalendar(calendarData);

      const availabilityData = await getListingAvailability(listingId);
      setAvailability(availabilityData);
    } catch (error) {
      console.error('Error refreshing calendar:', error);
      toast({
        title: 'Error',
        description: 'Failed to load calendar',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const handleBlockDates = useCallback(async (
    listingId: string,
    startDate: string,
    endDate: string,
    notes?: string
  ) => {
    setIsLoading(true);
    try {
      await blockDates(listingId, startDate, endDate, notes);
      toast({
        title: 'Dates Blocked',
        description: 'Selected dates have been blocked successfully.',
      });
      // Refresh calendar if it's loaded
      if (calendar) {
        await refreshCalendar(listingId, calendar.dates[0]?.date || startDate, endDate);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to block dates';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast, calendar, refreshCalendar]);

  const handleUnblockDates = useCallback(async (
    listingId: string,
    startDate: string,
    endDate: string
  ) => {
    setIsLoading(true);
    try {
      await unblockDates(listingId, startDate, endDate);
      toast({
        title: 'Dates Unblocked',
        description: 'Selected dates have been unblocked successfully.',
      });
      // Refresh calendar if it's loaded
      if (calendar) {
        await refreshCalendar(listingId, calendar.dates[0]?.date || startDate, endDate);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to unblock dates';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast, calendar, refreshCalendar]);

  const checkConflicts = useCallback(async (
    listingId: string,
    startDate: string,
    endDate: string
  ) => {
    try {
      const result = await getAvailabilityConflicts(listingId, startDate, endDate);
      return result;
    } catch (error) {
      console.error('Error checking conflicts:', error);
      toast({
        title: 'Error',
        description: 'Failed to check availability conflicts',
        variant: 'destructive',
      });
      return { has_conflicts: false, conflicts: [] };
    }
  }, [toast]);

  const getAvailableDates = useCallback(async (
    listingId: string,
    startDate: string,
    nights: number
  ) => {
    try {
      const dates = await getNextAvailableDates(listingId, startDate, nights);
      return dates;
    } catch (error) {
      console.error('Error getting available dates:', error);
      toast({
        title: 'Error',
        description: 'Failed to find available dates',
        variant: 'destructive',
      });
      return [];
    }
  }, [toast]);

  const clearAll = useCallback(async (listingId: string) => {
    setIsLoading(true);
    try {
      await clearAvailability(listingId);
      toast({
        title: 'Availability Cleared',
        description: 'All availability entries have been cleared.',
      });
      await refreshCalendar(listingId, new Date().toISOString().split('T')[0], 
        new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to clear availability';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast, refreshCalendar]);

  const setDefault = useCallback(async (
    listingId: string,
    startDate: string,
    endDate: string
  ) => {
    setIsLoading(true);
    try {
      await setDefaultAvailability(listingId, startDate, endDate);
      toast({
        title: 'Default Availability Set',
        description: 'Listing is now available for the selected period.',
      });
      await refreshCalendar(listingId, startDate, endDate);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to set default availability';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast, refreshCalendar]);

  return {
    calendar,
    availability,
    isLoading,
    refreshCalendar,
    blockDates: handleBlockDates,
    unblockDates: handleUnblockDates,
    checkConflicts,
    getAvailableDates,
    clearAll,
    setDefault
  };
}

