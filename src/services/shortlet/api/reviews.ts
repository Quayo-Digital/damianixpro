/**
 * Reviews API Service
 * Handles review creation, retrieval, and management
 */

import { supabase } from '@/integrations/supabase/client';
import { Review, reviewSchema, ReviewType } from '../types';
import { logger } from '@/utils/logger';
import { profileForUi } from '@/lib/profileDisplayName';

/**
 * Create a new review
 */
export async function createReview(
  review: Omit<Review, 'id' | 'created_at' | 'updated_at'>
): Promise<Review> {
  const validated = reviewSchema.parse(review);

  // Check if review already exists for this booking
  const { data: existing } = await supabase
    .from('reviews')
    .select('id')
    .eq('booking_id', validated.booking_id)
    .single();

  if (existing) {
    throw new Error('Review already exists for this booking');
  }

  const { data, error } = await supabase
    .from('reviews')
    .insert([
      {
        booking_id: validated.booking_id,
        reviewer_id: validated.reviewer_id,
        reviewee_id: validated.reviewee_id,
        review_type: validated.review_type,
        rating: validated.rating,
        comment: validated.comment,
      },
    ])
    .select()
    .single();

  if (error) throw error;
  return data as Review;
}

/**
 * Get review by ID
 */
export async function getReviewById(reviewId: string): Promise<Review | null> {
  const { data, error } = await supabase
    .from('reviews')
    .select(
      `
      *,
      booking:bookings (
        id,
        listing:listings (
          id,
          title,
          property:properties (
            id,
            name,
            address
          )
        )
      )
    `
    )
    .eq('id', reviewId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }

  if (!data) return null;

  // Fetch profiles separately since reviews.reviewer_id and reviewee_id reference auth.users, not profiles
  // Note: RLS policies may block profile access, so we handle errors gracefully
  // Check if user is authenticated before attempting profile fetches
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isAuthenticated = !!user;

  let reviewerProfile = null;
  let revieweeProfile = null;

  if (isAuthenticated) {
    try {
      const [reviewerResult, revieweeResult] = await Promise.all([
        supabase
          .from('profiles')
          .select('id, first_name, last_name, email, phone')
          .eq('id', data.reviewer_id)
          .single(),
        supabase
          .from('profiles')
          .select('id, first_name, last_name, email, phone')
          .eq('id', data.reviewee_id)
          .single(),
      ]);

      // Suppress expected 406 errors (RLS blocking) - these are normal for restricted profiles
      if (!reviewerResult.error && reviewerResult.data) {
        reviewerProfile = profileForUi(reviewerResult.data);
      } else if (
        reviewerResult.error &&
        reviewerResult.error.status !== 406 &&
        reviewerResult.error.code !== 'PGRST116'
      ) {
        logger.debug('Could not fetch reviewer profile', { reviewer_id: data.reviewer_id });
      }

      // Suppress expected 406 errors (RLS blocking) - these are normal for restricted profiles
      if (!revieweeResult.error && revieweeResult.data) {
        revieweeProfile = profileForUi(revieweeResult.data);
      } else if (
        revieweeResult.error &&
        revieweeResult.error.status !== 406 &&
        revieweeResult.error.code !== 'PGRST116'
      ) {
        logger.debug('Could not fetch reviewee profile', { reviewee_id: data.reviewee_id });
      }
    } catch (error: any) {
      // Silently fail for expected RLS errors (406 Not Acceptable)
      // Profile data is optional for reviews
      if (error?.status !== 406 && error?.code !== 'PGRST116') {
        logger.debug('Could not fetch profiles', {
          reviewer_id: data.reviewer_id,
          reviewee_id: data.reviewee_id,
        });
      }
    }
  }

  return {
    ...data,
    reviewer: reviewerProfile,
    reviewee: revieweeProfile,
  } as Review;
}

/**
 * Get review by booking ID
 */
export async function getReviewsByBooking(bookingId: string): Promise<Review | null> {
  const { data, error } = await supabase
    .from('reviews')
    .select(
      `
      *,
      booking:bookings (
        id,
        listing:listings (
          id,
          title
        )
      )
    `
    )
    .eq('booking_id', bookingId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }

  if (!data) return null;

  // Fetch reviewer profile separately since reviews.reviewer_id references auth.users, not profiles
  // Note: RLS policies may block profile access, so we handle errors gracefully
  // Check if user is authenticated before attempting profile fetch
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isAuthenticated = !!user;

  let reviewerProfile = null;
  if (isAuthenticated) {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, email, phone')
        .eq('id', data.reviewer_id)
        .single();

      // Suppress expected 406 errors (RLS blocking) - these are normal for restricted profiles
      if (!error && profile) {
        reviewerProfile = profileForUi(profile);
      } else if (error && error.status !== 406 && error.code !== 'PGRST116') {
        logger.debug('Could not fetch reviewer profile', { reviewer_id: data.reviewer_id });
      }
    } catch (error: any) {
      // Silently fail for expected RLS errors (406 Not Acceptable)
      // Profile data is optional for reviews
      if (error?.status !== 406 && error?.code !== 'PGRST116') {
        logger.debug('Could not fetch reviewer profile', { reviewer_id: data.reviewer_id });
      }
    }
  }

  return {
    ...data,
    reviewer: reviewerProfile,
  } as Review;
}

/**
 * Get reviews for a listing
 */
export async function getReviewsByListing(listingId: string): Promise<Review[]> {
  const { data, error } = await supabase
    .from('reviews')
    .select(
      `
      *,
      booking:bookings (
        id,
        listing_id,
        listing:listings (
          id,
          title
        )
      )
    `
    )
    .eq('booking.listing_id', listingId)
    .eq('review_type', ReviewType.GUEST)
    .order('created_at', { ascending: false });

  if (error) throw error;

  // Fetch profiles separately since reviews.reviewer_id references auth.users, not profiles
  // Note: RLS policies may block profile access, so we handle errors gracefully
  // Check if user is authenticated before attempting profile fetches
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isAuthenticated = !!user;

  const reviewsWithProfiles = await Promise.all(
    (data || []).map(async (review: any) => {
      // Fetch reviewer profile - handle RLS errors gracefully
      // Skip profile fetch if not authenticated (will always fail due to RLS)
      let reviewerProfile = null;
      if (isAuthenticated) {
        try {
          const { data: profile, error } = await supabase
            .from('profiles')
            .select('id, first_name, last_name, email, phone')
            .eq('id', review.reviewer_id)
            .single();

          // Suppress expected 406 errors (RLS blocking) - these are normal for restricted profiles
          if (!error && profile) {
            reviewerProfile = profileForUi(profile);
          } else if (error && error.status !== 406 && error.code !== 'PGRST116') {
            // Only log unexpected errors (not 406 Not Acceptable which is expected for RLS blocks)
            logger.debug('Could not fetch reviewer profile', {
              reviewer_id: review.reviewer_id,
              error_code: error.code,
              error_status: error.status,
            });
          }
        } catch (error: any) {
          // Silently fail for expected RLS errors (406 Not Acceptable)
          // Profile data is optional for reviews
          if (error?.status !== 406 && error?.code !== 'PGRST116') {
            logger.debug('Could not fetch reviewer profile', { reviewer_id: review.reviewer_id });
          }
        }
      }

      return {
        ...review,
        reviewer: reviewerProfile,
      };
    })
  );

  return reviewsWithProfiles as Review[];
}

/**
 * Get reviews by user (reviews they received)
 */
export async function getReviewsByUser(userId: string, reviewType?: ReviewType): Promise<Review[]> {
  let query = supabase
    .from('reviews')
    .select(
      `
      *,
      booking:bookings (
        id,
        listing:listings (
          id,
          title,
          property:properties (
            id,
            name,
            address
          )
        )
      )
    `
    )
    .eq('reviewee_id', userId);

  if (reviewType) {
    query = query.eq('review_type', reviewType);
  }

  const { data, error } = await query.order('created_at', { ascending: false });

  if (error) throw error;

  // Fetch profiles separately since reviews.reviewer_id references auth.users, not profiles
  // Note: RLS policies may block profile access, so we handle errors gracefully
  // Check if user is authenticated before attempting profile fetches
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isAuthenticated = !!user;

  const reviewsWithProfiles = await Promise.all(
    (data || []).map(async (review: any) => {
      // Fetch reviewer profile - handle RLS errors gracefully
      // Skip profile fetch if not authenticated (will always fail due to RLS)
      let reviewerProfile = null;
      if (isAuthenticated) {
        try {
          const { data: profile, error } = await supabase
            .from('profiles')
            .select('id, first_name, last_name, email, phone')
            .eq('id', review.reviewer_id)
            .single();

          // Suppress expected 406 errors (RLS blocking) - these are normal for restricted profiles
          if (!error && profile) {
            reviewerProfile = profileForUi(profile);
          } else if (error && error.status !== 406 && error.code !== 'PGRST116') {
            // Only log unexpected errors (not 406 Not Acceptable which is expected for RLS blocks)
            logger.debug('Could not fetch reviewer profile', {
              reviewer_id: review.reviewer_id,
              error_code: error.code,
              error_status: error.status,
            });
          }
        } catch (error: any) {
          // Silently fail for expected RLS errors (406 Not Acceptable)
          // Profile data is optional for reviews
          if (error?.status !== 406 && error?.code !== 'PGRST116') {
            logger.debug('Could not fetch reviewer profile', { reviewer_id: review.reviewer_id });
          }
        }
      }

      return {
        ...review,
        reviewer: reviewerProfile,
      };
    })
  );

  return reviewsWithProfiles as Review[];
}

/**
 * Update review
 */
export async function updateReview(
  reviewId: string,
  updates: Partial<Pick<Review, 'rating' | 'comment'>>
): Promise<Review> {
  const { data, error } = await supabase
    .from('reviews')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', reviewId)
    .select()
    .single();

  if (error) throw error;
  return data as Review;
}

/**
 * Delete review
 */
export async function deleteReview(reviewId: string): Promise<void> {
  const { error } = await supabase.from('reviews').delete().eq('id', reviewId);

  if (error) throw error;
}

/**
 * Get average rating for a listing
 */
export async function getListingAverageRating(listingId: string): Promise<{
  average: number;
  count: number;
}> {
  const reviews = await getReviewsByListing(listingId);

  if (reviews.length === 0) {
    return { average: 0, count: 0 };
  }

  const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
  const average = sum / reviews.length;

  return {
    average: Math.round(average * 10) / 10, // Round to 1 decimal
    count: reviews.length,
  };
}
