/**
 * Booking Detail Page
 * View detailed information about a single booking
 */

import React from 'react';
import { useParams } from 'react-router-dom';
import { BookingDetails } from '@/components/shortlet/BookingDetails';
import { useAuthSession } from '@/contexts/auth';
import ErrorBoundary from '@/components/ErrorBoundary';

export function BookingDetailPage() {
  const { bookingId } = useParams<{ bookingId: string }>();
  const { userRole } = useAuthSession();
  const mode = userRole === 'owner' ? 'owner' : 'guest';

  return (
    <ErrorBoundary>
      <div className="container mx-auto py-8">
        <BookingDetails bookingId={bookingId} mode={mode} />
      </div>
    </ErrorBoundary>
  );
}

export default BookingDetailPage;
