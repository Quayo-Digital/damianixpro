/**
 * Review List Component
 * Displays a list of reviews with statistics and Add Review form for eligible guests
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ReviewCard } from './ReviewCard';
import { ReviewForm } from './ReviewForm';
import { getReviewsByListing, getReviewsByBooking } from '@/services/shortlet/api/reviews';
import { getBookingsByGuest } from '@/services/shortlet/api/bookings';
import { useToast } from '@/hooks/use-toast';
import { useAuthSession } from '@/contexts/auth';
import { Star, Loader2, MessageSquare, PenSquare } from 'lucide-react';
import { ReviewType } from '@/services/shortlet/types';
import { BookingStatus } from '@/services/shortlet/types';
import type { Review } from '@/services/shortlet/types';
import type { Booking } from '@/services/shortlet/types';

interface ReviewListProps {
  listingId?: string;
  bookingId?: string;
  ownerId?: string;
  showStatistics?: boolean;
  showAddReview?: boolean;
  limit?: number;
}

export function ReviewList({
  listingId,
  bookingId,
  ownerId,
  showStatistics = true,
  showAddReview = false,
  limit,
}: ReviewListProps) {
  const { toast } = useToast();
  const { user } = useAuthSession();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'highest' | 'lowest'>('newest');

  // Add Review: unreviewed completed booking for this listing
  const [eligibleBooking, setEligibleBooking] = useState<Booking | null>(null);
  const [hasReviewedAll, setHasReviewedAll] = useState(false);
  const [checkingEligibility, setCheckingEligibility] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const canShowAddReview = showAddReview && listingId && ownerId && user?.id && user.id !== ownerId; // Guest, not owner

  useEffect(() => {
    loadReviews();
  }, [listingId, bookingId, sortBy]);

  useEffect(() => {
    if (canShowAddReview && !showForm) {
      findEligibleBooking();
    } else if (!canShowAddReview) {
      setEligibleBooking(null);
      setHasReviewedAll(false);
    }
  }, [canShowAddReview, listingId, user?.id, showForm]);

  const loadReviews = async () => {
    setIsLoading(true);
    try {
      let allReviews: Review[] = [];

      if (bookingId) {
        const review = await getReviewsByBooking(bookingId);
        if (review) {
          allReviews = [review];
        }
      } else if (listingId) {
        allReviews = await getReviewsByListing(listingId);
      }

      // Sort reviews
      const sorted = [...allReviews].sort((a, b) => {
        switch (sortBy) {
          case 'newest':
            return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
          case 'oldest':
            return new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime();
          case 'highest':
            return b.rating - a.rating;
          case 'lowest':
            return a.rating - b.rating;
          default:
            return 0;
        }
      });

      if (limit) {
        setReviews(sorted.slice(0, limit));
      } else {
        setReviews(sorted);
      }
    } catch (error) {
      console.error('Error loading reviews:', error);
      toast({
        title: 'Error',
        description: 'Failed to load reviews',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const findEligibleBooking = async () => {
    if (!user?.id || !listingId) return;
    setCheckingEligibility(true);
    try {
      const bookings = await getBookingsByGuest(user.id, BookingStatus.COMPLETED);
      const forThisListing = (bookings || []).filter((b) => b.listing?.id === listingId);
      for (const booking of forThisListing) {
        const existing = await getReviewsByBooking(String(booking.id));
        if (!existing) {
          setEligibleBooking(booking);
          setHasReviewedAll(false);
          return;
        }
      }
      setEligibleBooking(null);
      setHasReviewedAll(forThisListing.length > 0);
    } catch {
      setEligibleBooking(null);
      setHasReviewedAll(false);
    } finally {
      setCheckingEligibility(false);
    }
  };

  const handleReviewSuccess = () => {
    setShowForm(false);
    setEligibleBooking(null);
    loadReviews();
  };

  const calculateStatistics = () => {
    if (reviews.length === 0) {
      return {
        average: 0,
        total: 0,
        distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
      };
    }

    const total = reviews.length;
    const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
    const average = sum / total;

    const distribution = reviews.reduce(
      (acc, review) => {
        acc[review.rating as keyof typeof acc] = (acc[review.rating as keyof typeof acc] || 0) + 1;
        return acc;
      },
      { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
    );

    return { average, total, distribution };
  };

  const stats = calculateStatistics();

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${
          i < rating ? 'fill-yellow-400 text-yellow-400' : 'fill-gray-200 text-gray-200'
        }`}
      />
    ));
  };

  return (
    <div className="space-y-6">
      {/* Statistics */}
      {showStatistics && reviews.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Reviews & Ratings</CardTitle>
            <CardDescription>
              {stats.total} {stats.total === 1 ? 'review' : 'reviews'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Average Rating */}
            <div className="flex items-center gap-4">
              <div className="text-center">
                <div className="text-4xl font-bold">{stats.average.toFixed(1)}</div>
                <div className="mt-1 flex items-center gap-1">
                  {renderStars(Math.round(stats.average))}
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  Based on {stats.total} {stats.total === 1 ? 'review' : 'reviews'}
                </p>
              </div>
              <div className="flex-1 space-y-2">
                {[5, 4, 3, 2, 1].map((rating) => {
                  const count = stats.distribution[rating as keyof typeof stats.distribution];
                  const percentage = stats.total > 0 ? (count / stats.total) * 100 : 0;
                  return (
                    <div key={rating} className="flex items-center gap-2">
                      <div className="flex w-16 items-center gap-1">
                        <span className="text-sm font-medium">{rating}</span>
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      </div>
                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full bg-yellow-400 transition-all"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <span className="w-12 text-right text-sm text-muted-foreground">{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add Review Section - for guests with completed stays or sign-in prompt */}
      {showAddReview && listingId && ownerId && !bookingId && user?.id !== ownerId && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PenSquare className="h-5 w-5" />
              Share Your Experience
            </CardTitle>
            <CardDescription>
              {!user
                ? 'Sign in to leave a review after your stay.'
                : checkingEligibility
                  ? 'Checking if you can leave a review...'
                  : eligibleBooking
                    ? 'You stayed here! Add a review to help other guests.'
                    : hasReviewedAll
                      ? "You've already reviewed this property. Thank you!"
                      : 'You can leave a review after completing a stay at this property.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!user ? null : checkingEligibility ? (
              <div className="flex h-24 items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : showForm && eligibleBooking ? (
              <ReviewForm
                bookingId={String(eligibleBooking.id)}
                listingId={listingId}
                revieweeId={String(ownerId)}
                reviewType={ReviewType.GUEST}
                onSuccess={handleReviewSuccess}
                onCancel={() => setShowForm(false)}
              />
            ) : eligibleBooking ? (
              <Button onClick={() => setShowForm(true)}>
                <PenSquare className="mr-2 h-4 w-4" />
                Write a Review
              </Button>
            ) : null}
          </CardContent>
        </Card>
      )}

      {/* Reviews Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold">
            {reviews.length} {reviews.length === 1 ? 'Review' : 'Reviews'}
          </h3>
        </div>
        {reviews.length > 0 && (
          <Select value={sortBy} onValueChange={(value) => setSortBy(value as any)}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest First</SelectItem>
              <SelectItem value="oldest">Oldest First</SelectItem>
              <SelectItem value="highest">Highest Rated</SelectItem>
              <SelectItem value="lowest">Lowest Rated</SelectItem>
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Reviews List */}
      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : reviews.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <MessageSquare className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="mb-2 text-lg font-semibold">No reviews yet</h3>
            <p className="text-muted-foreground">Be the first to review this property!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <ReviewCard key={review.id} review={review} />
          ))}
        </div>
      )}
    </div>
  );
}
