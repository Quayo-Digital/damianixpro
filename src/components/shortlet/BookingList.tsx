/**
 * Booking List Component
 * Displays a list of bookings with filtering and status management
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { getBookingsByListing, getBookingsByOwner, getBookingsByGuest, updateBookingStatus } from '@/services/shortlet/api/bookings';
import { format, differenceInDays } from 'date-fns';
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
  Loader2
} from 'lucide-react';
import type { Booking, BookingStatus } from '@/services/shortlet/types';
import { BookingCard } from './BookingCard';
import { useAuth } from '@/contexts/auth';

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
  onBookingClick 
}: BookingListProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<BookingStatus | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadBookings();
  }, [listingId, ownerId, guestId, activeTab]);

  const loadBookings = async () => {
    setIsLoading(true);
    try {
      let allBookings: Booking[] = [];

      if (listingId) {
        allBookings = await getBookingsByListing(String(listingId));
      } else if (ownerId || (mode === 'owner' && user?.id)) {
        const id = ownerId || user?.id;
        allBookings = await getBookingsByOwner(String(id || ''));
      } else if (guestId || (mode === 'guest' && user?.id)) {
        const id = guestId || user?.id;
        allBookings = await getBookingsByGuest(String(id || ''));
      }

      // Filter by status
      if (activeTab !== 'all') {
        allBookings = allBookings.filter(b => b.status === activeTab);
      }

      // Filter by search query
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        allBookings = allBookings.filter(b => 
          b.listing?.title?.toLowerCase().includes(query) ||
          b.guest?.name?.toLowerCase().includes(query) ||
          b.id.toLowerCase().includes(query)
        );
      }

      setBookings(allBookings);
    } catch (error) {
      console.error('Error loading bookings:', error);
      toast({
        title: 'Error',
        description: 'Failed to load bookings',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = async (bookingId: string, newStatus: BookingStatus) => {
    try {
      await updateBookingStatus(bookingId, newStatus);
      toast({
        title: 'Success',
        description: `Booking ${newStatus}`,
      });
      loadBookings();
    } catch (error) {
      console.error('Error updating booking status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update booking status',
        variant: 'destructive',
      });
    }
  };

  const statusCounts = {
    all: bookings.length,
    pending: bookings.filter(b => b.status === 'pending').length,
    confirmed: bookings.filter(b => b.status === 'confirmed').length,
    cancelled: bookings.filter(b => b.status === 'cancelled').length,
    completed: bookings.filter(b => b.status === 'completed').length,
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
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
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
          <TabsTrigger value="all">
            All ({statusCounts.all})
          </TabsTrigger>
          <TabsTrigger value="pending">
            <Clock className="h-4 w-4 mr-2" />
            Pending ({statusCounts.pending})
          </TabsTrigger>
          <TabsTrigger value="confirmed">
            <CheckCircle2 className="h-4 w-4 mr-2" />
            Confirmed ({statusCounts.confirmed})
          </TabsTrigger>
          <TabsTrigger value="cancelled">
            <XCircle className="h-4 w-4 mr-2" />
            Cancelled ({statusCounts.cancelled})
          </TabsTrigger>
          <TabsTrigger value="completed">
            <CheckCircle2 className="h-4 w-4 mr-2" />
            Completed ({statusCounts.completed})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : bookings.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">No bookings found</h3>
                <p className="text-muted-foreground">
                  {activeTab === 'all' 
                    ? 'No bookings match your criteria'
                    : `No ${activeTab} bookings found`}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {bookings.map(booking => (
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

