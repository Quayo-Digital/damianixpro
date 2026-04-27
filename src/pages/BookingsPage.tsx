/**
 * Bookings Management Page
 * Main page for viewing and managing bookings
 */

import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BookingList } from '@/components/shortlet/BookingList';
import { useAuthSession } from '@/contexts/auth';
import { Calendar, Users } from 'lucide-react';
import ErrorBoundary from '@/components/ErrorBoundary';

export function BookingsPage() {
  const { user, userRole } = useAuthSession();
  const [searchParams] = useSearchParams();
  const listingId = searchParams.get('listingId') || undefined;

  const isOwner = userRole === 'owner';
  const isGuest = userRole === 'tenant' || !isOwner;

  return (
    <ErrorBoundary>
      <div className="container mx-auto space-y-6 py-8">
        <div>
          <h1 className="text-3xl font-bold">Bookings</h1>
          <p className="mt-1 text-muted-foreground">
            {isOwner ? 'Manage bookings for your short-let listings' : 'View your booking history'}
          </p>
        </div>

        {isOwner && !listingId && (
          <Tabs defaultValue="all" className="w-full">
            <TabsList>
              <TabsTrigger value="all">
                <Calendar className="mr-2 h-4 w-4" />
                All Bookings
              </TabsTrigger>
              <TabsTrigger value="listing">
                <Users className="mr-2 h-4 w-4" />
                By Listing
              </TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="mt-6">
              <BookingList
                ownerId={user?.id ? String(user.id) : undefined}
                mode="owner"
                onBookingClick={(id) => (window.location.href = `/bookings/${String(id)}`)}
              />
            </TabsContent>

            <TabsContent value="listing" className="mt-6">
              <p className="py-8 text-center text-muted-foreground">
                Select a listing to view its bookings, or view all bookings above.
              </p>
            </TabsContent>
          </Tabs>
        )}

        {!isOwner && (
          <BookingList
            guestId={user?.id ? String(user.id) : undefined}
            mode="guest"
            onBookingClick={(id) => (window.location.href = `/bookings/${String(id)}`)}
          />
        )}

        {listingId && (
          <BookingList
            listingId={String(listingId)}
            mode="listing"
            onBookingClick={(id) => (window.location.href = `/bookings/${String(id)}`)}
          />
        )}
      </div>
    </ErrorBoundary>
  );
}

export default BookingsPage;
