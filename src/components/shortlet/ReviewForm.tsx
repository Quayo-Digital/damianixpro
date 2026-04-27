/**
 * Review Form Component
 * Form for submitting reviews and ratings
 */

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { createReview, updateReview } from '@/services/shortlet/api/reviews';
import { Star, Loader2 } from 'lucide-react';
import { useAuthSession } from '@/contexts/auth';
import type { Review } from '@/services/shortlet/types';
import { ReviewType } from '@/services/shortlet/types';

const reviewSchema = z.object({
  rating: z.number().min(1).max(5),
  comment: z.string().min(10, 'Comment must be at least 10 characters').optional(),
});

type ReviewFormValues = z.infer<typeof reviewSchema>;

interface ReviewFormProps {
  bookingId: string;
  listingId?: string;
  existingReview?: Review;
  reviewType?: ReviewType;
  revieweeId?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function ReviewForm({
  bookingId,
  listingId,
  existingReview,
  reviewType = ReviewType.GUEST,
  revieweeId,
  onSuccess,
  onCancel,
}: ReviewFormProps) {
  const { toast } = useToast();
  const { user } = useAuthSession();
  const [hoveredRating, setHoveredRating] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<ReviewFormValues>({
    resolver: zodResolver(reviewSchema),
    defaultValues: {
      rating: existingReview?.rating || 0,
      comment: existingReview?.comment || '',
    },
  });

  const rating = watch('rating');

  const handleRatingClick = (value: number) => {
    setValue('rating', value, { shouldValidate: true });
  };

  const onSubmit = async (data: ReviewFormValues) => {
    setIsSubmitting(true);
    try {
      if (existingReview) {
        await updateReview(existingReview.id, {
          rating: data.rating,
          comment: data.comment || undefined,
        });
        toast({
          title: 'Success',
          description: 'Review updated successfully',
        });
      } else {
        if (!user?.id) {
          throw new Error('You must be logged in to submit a review');
        }
        if (!revieweeId) {
          throw new Error('Reviewee ID is required');
        }

        await createReview({
          booking_id: bookingId,
          reviewer_id: user.id,
          reviewee_id: revieweeId,
          review_type: reviewType,
          rating: data.rating,
          comment: data.comment || undefined,
        });
        toast({
          title: 'Success',
          description: 'Thank you for your review!',
        });
      }

      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Error submitting review:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to submit review',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStars = () => {
    return Array.from({ length: 5 }, (_, i) => {
      const value = i + 1;
      const isFilled = value <= (hoveredRating || rating);

      return (
        <button
          key={i}
          type="button"
          onClick={() => handleRatingClick(value)}
          onMouseEnter={() => setHoveredRating(value)}
          onMouseLeave={() => setHoveredRating(0)}
          className="transition-transform hover:scale-110 focus:outline-none"
        >
          <Star
            className={`h-8 w-8 ${
              isFilled ? 'fill-yellow-400 text-yellow-400' : 'fill-gray-200 text-gray-200'
            }`}
          />
        </button>
      );
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{existingReview ? 'Edit Your Review' : 'Write a Review'}</CardTitle>
        <CardDescription>
          {existingReview
            ? 'Update your review and rating'
            : 'Share your experience with other guests'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Rating */}
          <div className="space-y-2">
            <Label>Rating *</Label>
            <div className="flex items-center gap-2">
              {renderStars()}
              {rating > 0 && (
                <span className="ml-2 text-sm text-muted-foreground">
                  {rating} {rating === 1 ? 'star' : 'stars'}
                </span>
              )}
            </div>
            {errors.rating && <p className="text-sm text-destructive">{errors.rating.message}</p>}
            <input type="hidden" {...register('rating', { valueAsNumber: true })} />
          </div>

          {/* Comment */}
          <div className="space-y-2">
            <Label htmlFor="comment">Your Review (Optional)</Label>
            <Textarea
              id="comment"
              {...register('comment')}
              placeholder="Tell others about your experience..."
              rows={6}
            />
            {errors.comment && <p className="text-sm text-destructive">{errors.comment.message}</p>}
            <p className="text-xs text-muted-foreground">
              Minimum 10 characters. Share details about your stay, the property, and your host.
            </p>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2">
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            )}
            <Button type="submit" disabled={isSubmitting || rating === 0}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : existingReview ? (
                'Update Review'
              ) : (
                'Submit Review'
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
