/**
 * Booking Detail Page
 * View detailed information about a single booking
 */

import React from 'react';
import { useParams } from 'react-router-dom';
import { BookingDetails } from '@/components/shortlet/BookingDetails';
import { useAuth } from '@/contexts/auth';

export function BookingDetailPage() {
  const { bookingId } = useParams<{ bookingId: string }>();
  const { userRole } = useAuth();
  const mode = userRole === 'owner' ? 'owner' : 'guest';

  return (
    <div className="container mx-auto py-8">
      <BookingDetails bookingId={bookingId} mode={mode} />
    </div>
  );
}

export default BookingDetailPage;

