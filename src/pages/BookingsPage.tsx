/**
 * Bookings Management Page
 * Main page for viewing and managing bookings
 */

import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BookingList } from '@/components/shortlet/BookingList';
import { useAuth } from '@/contexts/auth';
import { Calendar, Users } from 'lucide-react';

export function BookingsPage() {
  const { user, userRole } = useAuth();
  const [searchParams] = useSearchParams();
  const listingId = searchParams.get('listingId') || undefined;

  const isOwner = userRole === 'owner';
  const isGuest = userRole === 'tenant' || !isOwner;

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Bookings</h1>
        <p className="text-muted-foreground mt-1">
          {isOwner 
            ? 'Manage bookings for your short-let listings'
            : 'View your booking history'}
        </p>
      </div>

      {isOwner && !listingId && (
        <Tabs defaultValue="all" className="w-full">
          <TabsList>
            <TabsTrigger value="all">
              <Calendar className="h-4 w-4 mr-2" />
              All Bookings
            </TabsTrigger>
            <TabsTrigger value="listing">
              <Users className="h-4 w-4 mr-2" />
              By Listing
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-6">
            <BookingList 
              ownerId={user?.id ? String(user.id) : undefined}
              mode="owner"
              onBookingClick={(id) => window.location.href = `/bookings/${String(id)}`}
            />
          </TabsContent>

          <TabsContent value="listing" className="mt-6">
            <p className="text-muted-foreground text-center py-8">
              Select a listing to view its bookings, or view all bookings above.
            </p>
          </TabsContent>
        </Tabs>
      )}

      {!isOwner && (
        <BookingList 
          guestId={user?.id ? String(user.id) : undefined}
          mode="guest"
          onBookingClick={(id) => window.location.href = `/bookings/${String(id)}`}
        />
      )}

      {listingId && (
        <BookingList 
          listingId={String(listingId)}
          mode="listing"
          onBookingClick={(id) => window.location.href = `/bookings/${String(id)}`}
        />
      )}
    </div>
  );
}

export default BookingsPage;

