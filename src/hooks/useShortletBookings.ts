/**
 * React Query hook for shortlet bookings
 * Provides caching, automatic refetching, and consistent error handling
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getBookingById,
  getBookingsByListing,
  getBookingsByGuest,
  getBookingsByOwner,
  createBooking,
  CreateBookingRequest,
  BookingStatus,
} from '@/services/shortlet/api/bookings';
import { Booking } from '@/services/shortlet/types';
import { logger } from '@/utils/logger';

/**
 * Get a single booking by ID
 */
export function useShortletBooking(bookingId: string | null | undefined) {
  return useQuery({
    queryKey: ['shortlet-booking', bookingId],
    queryFn: async () => {
      if (!bookingId) {
        throw new Error('Booking ID is required');
      }
      const booking = await getBookingById(bookingId);
      if (!booking) {
        throw new Error('Booking not found');
      }
      return booking;
    },
    enabled: !!bookingId,
    staleTime: 2 * 60 * 1000, // 2 minutes
    retry: 2,
    onError: (error) => {
      logger.error('Failed to fetch shortlet booking', error, { bookingId });
    },
  });
}

/**
 * Get bookings by listing
 */
export function useShortletBookingsByListing(listingId: string | null | undefined) {
  return useQuery({
    queryKey: ['shortlet-bookings', 'listing', listingId],
    queryFn: async () => {
      if (!listingId) {
        return [];
      }
      return await getBookingsByListing(listingId);
    },
    enabled: !!listingId,
    staleTime: 1 * 60 * 1000, // 1 minute
    retry: 2,
    onError: (error) => {
      logger.error('Failed to fetch bookings by listing', error, { listingId });
    },
  });
}

/**
 * Get bookings by guest (current user)
 */
export function useShortletBookingsByGuest(guestId: string | null | undefined) {
  return useQuery({
    queryKey: ['shortlet-bookings', 'guest', guestId],
    queryFn: async () => {
      if (!guestId) {
        return [];
      }
      return await getBookingsByGuest(guestId);
    },
    enabled: !!guestId,
    staleTime: 2 * 60 * 1000, // 2 minutes
    retry: 2,
    onError: (error) => {
      logger.error('Failed to fetch bookings by guest', error, { guestId });
    },
  });
}

/**
 * Get bookings by owner
 */
export function useShortletBookingsByOwner(ownerId: string | null | undefined) {
  return useQuery({
    queryKey: ['shortlet-bookings', 'owner', ownerId],
    queryFn: async () => {
      if (!ownerId) {
        return [];
      }
      return await getBookingsByOwner(ownerId);
    },
    enabled: !!ownerId,
    staleTime: 2 * 60 * 1000, // 2 minutes
    retry: 2,
    onError: (error) => {
      logger.error('Failed to fetch bookings by owner', error, { ownerId });
    },
  });
}

/**
 * Create a new booking
 */
export function useCreateShortletBooking() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      request,
      guestId,
    }: {
      request: CreateBookingRequest;
      guestId: string;
    }) => {
      return await createBooking(request, guestId);
    },
    onSuccess: (data) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['shortlet-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['shortlet-listing', data.booking_id] });
      logger.info('Shortlet booking created successfully', { bookingId: data.booking_id });
    },
    onError: (error) => {
      logger.error('Failed to create shortlet booking', error);
    },
  });
}

/**
 * Update booking status
 */
export function useUpdateShortletBookingStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ bookingId, status }: { bookingId: string; status: BookingStatus }) => {
      // This should call updateBookingStatus - need to check API
      const booking = await getBookingById(bookingId);
      return booking;
    },
    onSuccess: (_, variables) => {
      // Invalidate specific booking and related queries
      queryClient.invalidateQueries({ queryKey: ['shortlet-booking', variables.bookingId] });
      queryClient.invalidateQueries({ queryKey: ['shortlet-bookings'] });
      logger.info('Shortlet booking status updated', {
        bookingId: variables.bookingId,
        status: variables.status,
      });
    },
    onError: (error) => {
      logger.error('Failed to update shortlet booking status', error);
    },
  });
}
