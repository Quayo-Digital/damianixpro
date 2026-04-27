/**
 * Booking List Component
 * Displays a list of bookings with filtering and status management
 */

import React, { useState, useEffect } from 'react';
import { useAuthSession } from '@/contexts/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import {
  useShortletBookingsByListing,
  useShortletBookingsByOwner,
  useShortletBookingsByGuest,
  useUpdateShortletBookingStatus,
} from '@/hooks/useShortletBookings';
import { format, differenceInDays } from 'date-fns';
import { logger } from '@/utils/logger';
import {
  Calendar,
  Users,
  DollarSign,
  MapPin,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  Search,
  Filter,
  Eye,
  Loader2,
} from 'lucide-react';
import type { Booking, BookingStatus } from '@/services/shortlet/types';
import { BookingCard } from './BookingCard';

interface BookingListProps {
  listingId?: string;
  ownerId?: string;
  guestId?: string;
  mode?: 'owner' | 'guest' | 'listing';
  onBookingClick?: (bookingId: string) => void;
}

export function BookingList({
  listingId,
  ownerId,
  guestId,
  mode = 'owner',
  onBookingClick,
}: BookingListProps) {
  const { toast } = useToast();
  const { user } = useAuthSession();
  const updateStatusMutation = useUpdateShortletBookingStatus();
  const [activeTab, setActiveTab] = useState<BookingStatus | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Use React Query hooks
  const effectiveOwnerId = ownerId || (mode === 'owner' && user?.id ? user.id : null);
  const effectiveGuestId = guestId || (mode === 'guest' && user?.id ? user.id : null);

  const listingsQuery = useShortletBookingsByListing(listingId || null);
  const ownerQuery = useShortletBookingsByOwner(effectiveOwnerId ? String(effectiveOwnerId) : null);
  const guestQuery = useShortletBookingsByGuest(effectiveGuestId ? String(effectiveGuestId) : null);

  // Determine which query to use
  let bookingsQuery;
  if (listingId) {
    bookingsQuery = listingsQuery;
  } else if (effectiveOwnerId) {
    bookingsQuery = ownerQuery;
  } else if (effectiveGuestId) {
    bookingsQuery = guestQuery;
  } else {
    bookingsQuery = { data: [], isLoading: false, error: null };
  }

  let allBookings = bookingsQuery.data || [];

  // Filter by status
  if (activeTab !== 'all') {
    allBookings = allBookings.filter((b) => b.status === activeTab);
  }

  // Filter by search query
  const filteredBookings = allBookings.filter((booking) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      booking.id.toLowerCase().includes(query) ||
      booking.listing?.title?.toLowerCase().includes(query) ||
      booking.guest?.email?.toLowerCase().includes(query)
    );
  });

  const isLoading = bookingsQuery.isLoading;

  // Handle errors
  useEffect(() => {
    if (bookingsQuery.error) {
      logger.error('Error loading bookings', bookingsQuery.error, {
        listingId,
        ownerId,
        guestId,
        mode,
      });
      toast({
        title: 'Error',
        description: 'Failed to load bookings',
        variant: 'destructive',
      });
    }
  }, [bookingsQuery.error, listingId, ownerId, guestId, mode, toast]);

  const handleStatusChange = async (bookingId: string, newStatus: BookingStatus) => {
    try {
      await updateStatusMutation.mutateAsync({ bookingId, status: newStatus });
      toast({
        title: 'Success',
        description: `Booking ${newStatus}`,
      });
      // React Query will automatically refetch
    } catch (error) {
      logger.error('Error updating booking status', error, { bookingId, newStatus });
      toast({
        title: 'Error',
        description: 'Failed to update booking status',
        variant: 'destructive',
      });
    }
  };

  const statusCounts = {
    all: filteredBookings.length,
    pending: filteredBookings.filter((b) => b.status === 'pending').length,
    confirmed: filteredBookings.filter((b) => b.status === 'confirmed').length,
    cancelled: filteredBookings.filter((b) => b.status === 'cancelled').length,
    completed: filteredBookings.filter((b) => b.status === 'completed').length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Bookings</h2>
          <p className="text-muted-foreground">
            {mode === 'owner' && 'Manage bookings for your listings'}
            {mode === 'guest' && 'Your booking history'}
            {mode === 'listing' && 'Bookings for this listing'}
          </p>
        </div>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-muted-foreground" />
              <Input
                placeholder="Search bookings..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Status Tabs */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="all">All ({statusCounts.all})</TabsTrigger>
          <TabsTrigger value="pending">
            <Clock className="mr-2 h-4 w-4" />
            Pending ({statusCounts.pending})
          </TabsTrigger>
          <TabsTrigger value="confirmed">
            <CheckCircle2 className="mr-2 h-4 w-4" />
            Confirmed ({statusCounts.confirmed})
          </TabsTrigger>
          <TabsTrigger value="cancelled">
            <XCircle className="mr-2 h-4 w-4" />
            Cancelled ({statusCounts.cancelled})
          </TabsTrigger>
          <TabsTrigger value="completed">
            <CheckCircle2 className="mr-2 h-4 w-4" />
            Completed ({statusCounts.completed})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          {isLoading ? (
            <div className="flex h-64 items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredBookings.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Calendar className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                <h3 className="mb-2 text-lg font-semibold">No bookings found</h3>
                <p className="text-muted-foreground">
                  {activeTab === 'all'
                    ? 'No bookings match your criteria'
                    : `No ${activeTab} bookings found`}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredBookings.map((booking) => (
                <BookingCard
                  key={booking.id}
                  booking={booking}
                  mode={mode}
                  onView={onBookingClick}
                  onStatusChange={handleStatusChange}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
