/**
 * Review Card Component
 * Displays a single review with rating and comment
 */

import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { Star, User } from 'lucide-react';
import type { Review } from '@/services/shortlet/types';

interface ReviewCardProps {
  review: Review;
  showListing?: boolean;
}

export function ReviewCard({ review, showListing = false }: ReviewCardProps) {
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

  const getInitials = (name?: string) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarFallback>{getInitials(review.reviewer?.name)}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold">{review.reviewer?.name || 'Anonymous'}</p>
              <p className="text-sm text-muted-foreground">
                {review.created_at && format(new Date(review.created_at), 'MMM dd, yyyy')}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">{renderStars(review.rating)}</div>
        </div>
      </CardHeader>
      <CardContent>
        {review.comment && (
          <p className="whitespace-pre-wrap text-sm text-muted-foreground">{review.comment}</p>
        )}
        {showListing && review.booking?.listing && (
          <div className="mt-4 border-t pt-4">
            <p className="text-xs text-muted-foreground">
              Review for: {review.booking.listing.title}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
