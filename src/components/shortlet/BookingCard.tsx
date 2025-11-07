/**
 * Booking Card Component
 * Displays a single booking with details and actions
 */

import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Calendar, 
  Users, 
  DollarSign, 
  MapPin,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  Eye,
  Phone,
  Mail
} from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import type { Booking, BookingStatus } from '@/services/shortlet/types';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface BookingCardProps {
  booking: Booking;
  mode?: 'owner' | 'guest' | 'listing';
  onView?: (bookingId: string) => void;
  onStatusChange?: (bookingId: string, status: BookingStatus) => void;
}

export function BookingCard({ 
  booking, 
  mode = 'owner',
  onView,
  onStatusChange 
}: BookingCardProps) {
  const nights = differenceInDays(new Date(booking.checkout_date), new Date(booking.checkin_date));
  
  const getStatusBadge = (status: BookingStatus) => {
    const variants = {
      pending: { variant: 'secondary' as const, icon: Clock, label: 'Pending' },
      confirmed: { variant: 'default' as const, icon: CheckCircle2, label: 'Confirmed' },
      cancelled: { variant: 'destructive' as const, icon: XCircle, label: 'Cancelled' },
      completed: { variant: 'default' as const, icon: CheckCircle2, label: 'Completed' },
      refunded: { variant: 'secondary' as const, icon: AlertCircle, label: 'Refunded' },
    };
    
    const config = variants[status] || variants.pending;
    const Icon = config.icon;
    
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const canApprove = mode === 'owner' && booking.status === 'pending';
  const canCancel = (mode === 'owner' || mode === 'guest') && 
                    (booking.status === 'pending' || booking.status === 'confirmed');

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg mb-1">
              {booking.listing?.title || 'Unknown Listing'}
            </CardTitle>
            <CardDescription className="flex items-center gap-1 mt-1">
              <MapPin className="h-4 w-4" />
              {booking.listing?.property?.address || 'Location not specified'}
            </CardDescription>
          </div>
          {getStatusBadge(booking.status)}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Dates */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Check-in</p>
            <p className="text-base font-semibold">{format(new Date(booking.checkin_date), 'MMM dd, yyyy')}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Check-out</p>
            <p className="text-base font-semibold">{format(new Date(booking.checkout_date), 'MMM dd, yyyy')}</p>
          </div>
        </div>

          {/* Guest/Owner Info */}
        {mode === 'owner' && booking.guest && (
          <div className="p-3 bg-muted rounded-md">
            <p className="text-sm font-medium mb-2">Guest Information</p>
            <div className="space-y-1 text-sm">
              <p className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                {booking.guest.name || 'Guest'}
              </p>
              {booking.guest.email && (
                <p className="flex items-center gap-2 text-xs">
                  <Mail className="h-3 w-3" />
                  {booking.guest.email}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Booking Details */}
        <div className="grid grid-cols-2 gap-4 pt-2 border-t">
          <div>
            <p className="text-sm text-muted-foreground">Nights</p>
            <p className="text-base font-semibold">{nights}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Guests</p>
            <p className="text-base font-semibold">{booking.guests_count || 1}</p>
          </div>
        </div>

        {/* Price */}
        <div className="pt-2 border-t">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Amount</p>
              <p className="text-2xl font-bold">₦{Number(booking.total_amount).toLocaleString()}</p>
            </div>
            {booking.payout_amount && mode === 'owner' && (
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Your Payout</p>
                <p className="text-xl font-semibold text-green-600">
                  ₦{Number(booking.payout_amount).toLocaleString()}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Payment Status */}
        {booking.payment_reference && (
          <div className="p-2 bg-muted rounded text-xs">
            <p className="text-muted-foreground">Payment Reference: {booking.payment_reference}</p>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex gap-2">
        {onView && (
          <Button variant="outline" onClick={() => onView(String(booking.id))} className="flex-1">
            <Eye className="h-4 w-4 mr-2" />
            View Details
          </Button>
        )}
        
        {canApprove && onStatusChange && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button className="flex-1">
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Approve
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Approve Booking</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to approve this booking? The guest will be notified and payment will be processed.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => onStatusChange(String(booking.id), 'confirmed')}>
                  Approve Booking
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}

        {canCancel && onStatusChange && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" className="flex-1">
                <XCircle className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Cancel Booking</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to cancel this booking? {booking.status === 'confirmed' && 'A refund may be processed according to the cancellation policy.'}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Keep Booking</AlertDialogCancel>
                <AlertDialogAction 
                  onClick={() => onStatusChange(String(booking.id), 'cancelled')}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Cancel Booking
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </CardFooter>
    </Card>
  );
}

