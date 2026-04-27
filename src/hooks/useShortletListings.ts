/**
 * React Query hook for shortlet listings
 * Provides caching, automatic refetching, and consistent error handling
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getListingById,
  getListings,
  searchListings,
  getOwnerListings,
  createListing,
  updateListing,
  deleteListing,
} from '@/services/shortlet/api/listings';
import { Listing, ListingSearchParams } from '@/services/shortlet/types';
import { logger } from '@/utils/logger';

const shouldRetryShortletQuery = (failureCount: number, error: unknown) => {
  const status = (error as { status?: number })?.status;
  if (typeof status === 'number' && status >= 500) return false;
  return failureCount < 2;
};

/**
 * Get a single listing by ID
 */
export function useShortletListing(listingId: string | null | undefined) {
  return useQuery({
    queryKey: ['shortlet-listing', listingId],
    queryFn: async () => {
      if (!listingId) {
        throw new Error('Listing ID is required');
      }
      const listing = await getListingById(listingId);
      if (!listing) {
        throw new Error('Listing not found');
      }
      return listing;
    },
    enabled: !!listingId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: shouldRetryShortletQuery,
    onError: (error) => {
      logger.error('Failed to fetch shortlet listing', error, { listingId });
    },
  });
}

/**
 * Get listings with filters (for owner dashboard, etc.)
 */
export function useShortletListings(params?: {
  ownerId?: string;
  propertyId?: string;
  active?: boolean;
}) {
  return useQuery({
    queryKey: ['shortlet-listings', params],
    queryFn: async () => {
      try {
        return await getListings(params);
      } catch (error) {
        // Provide better error messages for network issues
        if (
          error instanceof Error &&
          (error.message.includes('fetch') || error.message.includes('network'))
        ) {
          throw new Error(
            'Unable to connect to the server. Please check your internet connection and try again.'
          );
        }
        throw error;
      }
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    retry: shouldRetryShortletQuery,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
    onError: (error) => {
      logger.error('Failed to fetch shortlet listings', error, { params });
    },
  });
}

/**
 * Get owner's listings
 */
export function useOwnerShortletListings(ownerId: string | null | undefined) {
  return useQuery({
    queryKey: ['shortlet-listings', 'owner', ownerId],
    queryFn: async () => {
      if (!ownerId) {
        return [];
      }
      return await getOwnerListings(ownerId);
    },
    enabled: !!ownerId,
    staleTime: 2 * 60 * 1000, // 2 minutes
    retry: shouldRetryShortletQuery,
    onError: (error) => {
      logger.error('Failed to fetch owner shortlet listings', error, { ownerId });
    },
  });
}

/**
 * Search listings (for public search)
 */
export function useSearchShortletListings(searchParams: ListingSearchParams) {
  return useQuery({
    queryKey: ['shortlet-search', searchParams],
    queryFn: async () => {
      try {
        return await searchListings(searchParams);
      } catch (error) {
        // Provide better error messages for network issues
        if (
          error instanceof Error &&
          (error.message.includes('fetch') || error.message.includes('network'))
        ) {
          throw new Error(
            'Unable to connect to the server. Please check your internet connection and try again.'
          );
        }
        throw error;
      }
    },
    staleTime: 1 * 60 * 1000, // 1 minute (search results should be fresh)
    retry: shouldRetryShortletQuery,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
    // Always enabled - even with empty params, we want to show demo data
    enabled: true,
    onError: (error) => {
      logger.error('Failed to search shortlet listings', error, { searchParams });
    },
  });
}

/**
 * Create a new listing
 */
export function useCreateShortletListing() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Omit<Listing, 'id' | 'created_at' | 'updated_at'>) => {
      return await createListing(data);
    },
    onSuccess: (newListing) => {
      // Invalidate listings queries to refetch
      queryClient.invalidateQueries({ queryKey: ['shortlet-listings'] });
      queryClient.invalidateQueries({
        queryKey: ['shortlet-listings', 'owner', newListing.owner_id],
      });
      queryClient.invalidateQueries({ queryKey: ['shortlet-search'] });
      logger.info('Shortlet listing created successfully', { listingId: newListing.id });
    },
    onError: (error) => {
      logger.error('Failed to create shortlet listing', error);
    },
  });
}

/**
 * Update a listing
 */
export function useUpdateShortletListing() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ listingId, data }: { listingId: string; data: Partial<Listing> }) => {
      const updated = await updateListing(listingId, data);
      return updated;
    },
    onSuccess: (updatedListing, variables) => {
      // Invalidate specific listing and listings list
      queryClient.invalidateQueries({ queryKey: ['shortlet-listing', variables.listingId] });
      queryClient.invalidateQueries({ queryKey: ['shortlet-listings'] });
      queryClient.invalidateQueries({
        queryKey: ['shortlet-listings', 'owner', updatedListing.owner_id],
      });
      queryClient.invalidateQueries({ queryKey: ['shortlet-search'] });
      logger.info('Shortlet listing updated successfully', { listingId: variables.listingId });
    },
    onError: (error) => {
      logger.error('Failed to update shortlet listing', error);
    },
  });
}

/**
 * Delete a listing
 */
export function useDeleteShortletListing() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (listingId: string) => {
      await deleteListing(listingId);
      return listingId;
    },
    onSuccess: (listingId) => {
      // Remove from cache and invalidate queries
      queryClient.removeQueries({ queryKey: ['shortlet-listing', listingId] });
      queryClient.invalidateQueries({ queryKey: ['shortlet-listings'] });
      queryClient.invalidateQueries({ queryKey: ['shortlet-search'] });
      logger.info('Shortlet listing deleted successfully', { listingId });
    },
    onError: (error) => {
      logger.error('Failed to delete shortlet listing', error);
    },
  });
}
