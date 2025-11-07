/**
 * Reviews API Service
 * Handles review creation, retrieval, and management
 */

import { supabase } from '@/integrations/supabase/client';
import { Review, reviewSchema, ReviewType } from '../types';

/**
 * Create a new review
 */
export async function createReview(review: Omit<Review, 'id' | 'created_at' | 'updated_at'>): Promise<Review> {
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
    .insert([{
      booking_id: validated.booking_id,
      reviewer_id: validated.reviewer_id,
      reviewee_id: validated.reviewee_id,
      review_type: validated.review_type,
      rating: validated.rating,
      comment: validated.comment
    }])
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
    .select(`
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
      ),
      reviewer:profiles!reviews_reviewer_id_fkey (
        id,
        name,
        email
      ),
      reviewee:profiles!reviews_reviewee_id_fkey (
        id,
        name,
        email
      )
    `)
    .eq('id', reviewId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }

  return data as Review;
}

/**
 * Get review by booking ID
 */
export async function getReviewsByBooking(bookingId: string): Promise<Review | null> {
  const { data, error } = await supabase
    .from('reviews')
    .select(`
      *,
      booking:bookings (
        id,
        listing:listings (
          id,
          title
        )
      ),
      reviewer:profiles!reviews_reviewer_id_fkey (
        id,
        name,
        email
      )
    `)
    .eq('booking_id', bookingId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }

  return data as Review;
}

/**
 * Get reviews for a listing
 */
export async function getReviewsByListing(listingId: string): Promise<Review[]> {
  const { data, error } = await supabase
    .from('reviews')
    .select(`
      *,
      booking:bookings (
        id,
        listing_id,
        listing:listings (
          id,
          title
        )
      ),
      reviewer:profiles!reviews_reviewer_id_fkey (
        id,
        name,
        email
      )
    `)
    .eq('booking.listing_id', listingId)
    .eq('review_type', ReviewType.GUEST)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as Review[];
}

/**
 * Get reviews by user (reviews they received)
 */
export async function getReviewsByUser(userId: string, reviewType?: ReviewType): Promise<Review[]> {
  let query = supabase
    .from('reviews')
    .select(`
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
      ),
      reviewer:profiles!reviews_reviewer_id_fkey (
        id,
        name,
        email
      )
    `)
    .eq('reviewee_id', userId);

  if (reviewType) {
    query = query.eq('review_type', reviewType);
  }

  const { data, error } = await query.order('created_at', { ascending: false });

  if (error) throw error;
  return data as Review[];
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
      updated_at: new Date().toISOString()
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
  const { error } = await supabase
    .from('reviews')
    .delete()
    .eq('id', reviewId);

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
    count: reviews.length
  };
}

