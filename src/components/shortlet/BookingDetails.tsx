/**
 * Booking Details Component
 * Detailed view of a single booking
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { getBookingById, updateBookingStatus } from '@/services/shortlet/api/bookings';
import { format, differenceInDays } from 'date-fns';
import { 
  Calendar, 
  Users, 
  DollarSign, 
  MapPin,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowLeft,
  Phone,
  Mail,
  FileText,
  CreditCard,
  Loader2
} from 'lucide-react';
import type { Booking, BookingStatus } from '@/services/shortlet/types';
import { useAuth } from '@/contexts/auth';
import { ReviewForm } from './ReviewForm';
import { ReviewList } from './ReviewList';
import { getReviewsByBooking } from '@/services/shortlet/api/reviews';
import type { Review } from '@/services/shortlet/types';
import { ReviewType } from '@/services/shortlet/types';
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

interface BookingDetailsProps {
  bookingId?: string;
  mode?: 'owner' | 'guest';
}

export function BookingDetails({ bookingId: propBookingId, mode }: BookingDetailsProps) {
  const { bookingId: paramBookingId } = useParams<{ bookingId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, userRole } = useAuth();
  
  const bookingId = propBookingId || paramBookingId;
  const [booking, setBooking] = useState<Booking | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [existingReview, setExistingReview] = useState<Review | null>(null);
  const [showReviewForm, setShowReviewForm] = useState(false);

  // Determine mode if not provided
  const displayMode = mode || (userRole === 'owner' ? 'owner' : 'guest');
  const isOwner = displayMode === 'owner';

  useEffect(() => {
    if (bookingId) {
      loadBooking();
      loadReview();
    }
  }, [bookingId]);

  const loadBooking = async () => {
    if (!bookingId) return;
    setIsLoading(true);
    try {
      const data = await getBookingById(String(bookingId));
      setBooking(data);
    } catch (error) {
      console.error('Error loading booking:', error);
      toast({
        title: 'Error',
        description: 'Failed to load booking details',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadReview = async () => {
    if (!bookingId) return;
    try {
      const review = await getReviewsByBooking(String(bookingId));
      setExistingReview(review);
    } catch (error) {
      console.error('Error loading review:', error);
    }
  };

  const handleStatusChange = async (newStatus: BookingStatus) => {
    if (!bookingId) return;
    setIsUpdating(true);
    try {
      await updateBookingStatus(String(bookingId), newStatus);
      toast({
        title: 'Success',
        description: `Booking ${String(newStatus)}`,
      });
      await loadBooking();
    } catch (error) {
      console.error('Error updating booking status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update booking status',
        variant: 'destructive',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!booking) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">Booking not found</p>
          <Button onClick={() => navigate(-1)} className="mt-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go Back
          </Button>
        </CardContent>
      </Card>
    );
  }

  const nights = differenceInDays(new Date(booking.checkout_date), new Date(booking.checkin_date));

  const getStatusBadge = (status: BookingStatus) => {
    const variants = {
      pending: { variant: 'secondary' as const, icon: Clock, label: 'Pending Approval' },
      confirmed: { variant: 'default' as const, icon: CheckCircle2, label: 'Confirmed' },
      cancelled: { variant: 'destructive' as const, icon: XCircle, label: 'Cancelled' },
      completed: { variant: 'default' as const, icon: CheckCircle2, label: 'Completed' },
      refunded: { variant: 'secondary' as const, icon: XCircle, label: 'Refunded' },
    };
    
    const config = variants[status] || variants.pending;
    const Icon = config.icon;
    
    return (
      <Badge variant={config.variant} className="flex items-center gap-1 text-sm px-3 py-1">
        <Icon className="h-4 w-4" />
        {config.label}
      </Badge>
    );
  };

  const canApprove = isOwner && booking.status === 'pending';
  const canCancel = (booking.status === 'pending' || booking.status === 'confirmed');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Booking Details</h1>
            <p className="text-muted-foreground">Booking ID: {String(booking.id).slice(0, 8)}...</p>
          </div>
        </div>
        {getStatusBadge(booking.status)}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Listing Info */}
          <Card>
            <CardHeader>
              <CardTitle>Listing Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="text-xl font-semibold mb-1">{booking.listing?.title}</h3>
                <p className="text-muted-foreground flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {booking.listing?.property?.address || 'Location not specified'}
                </p>
              </div>
              <Separator />
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Check-in</p>
                  <p className="text-lg font-semibold">
                    {format(new Date(booking.checkin_date), 'EEEE, MMM dd, yyyy')}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Check-out</p>
                  <p className="text-lg font-semibold">
                    {format(new Date(booking.checkout_date), 'EEEE, MMM dd, yyyy')}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-2 border-t">
                <div>
                  <p className="text-sm text-muted-foreground">Duration</p>
                  <p className="text-base font-semibold">{nights} {nights === 1 ? 'night' : 'nights'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Guests</p>
                  <p className="text-base font-semibold">{booking.guests_count || 1} {booking.guests_count === 1 ? 'guest' : 'guests'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Guest/Owner Info */}
          <Card>
            <CardHeader>
              <CardTitle>{isOwner ? 'Guest Information' : 'Host Information'}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {isOwner && booking.guest && (
                <>
                  <div>
                    <p className="text-sm text-muted-foreground">Name</p>
                    <p className="text-base font-medium">{booking.guest.name || 'Guest'}</p>
                  </div>
                  {booking.guest.email && (
                    <div>
                      <p className="text-sm text-muted-foreground">Email</p>
                      <p className="text-base font-medium flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        {booking.guest.email}
                      </p>
                    </div>
                  )}
                  {booking.guest.phone && (
                    <div>
                      <p className="text-sm text-muted-foreground">Phone</p>
                      <p className="text-base font-medium flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        {booking.guest.phone}
                      </p>
                    </div>
                  )}
                </>
              )}
              {!isOwner && booking.owner && (
                <>
                  <div>
                    <p className="text-sm text-muted-foreground">Host Name</p>
                    <p className="text-base font-medium">{booking.owner.name || 'Host'}</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Special Requests */}
          {booking.metadata?.special_requests && (
            <Card>
              <CardHeader>
                <CardTitle>Special Requests</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{booking.metadata.special_requests}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Price Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Price Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    ₦{Number(booking.listing?.base_price || 0).toLocaleString()} × {nights} nights
                  </span>
                  <span>₦{Number(booking.total_amount - (Number(booking.listing?.cleaning_fee || 0))).toLocaleString()}</span>
                </div>
                {booking.listing?.cleaning_fee && Number(booking.listing.cleaning_fee) > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Cleaning Fee</span>
                    <span>₦{Number(booking.listing.cleaning_fee).toLocaleString()}</span>
                  </div>
                )}
                {booking.listing?.security_deposit && Number(booking.listing.security_deposit) > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Security Deposit</span>
                    <span>₦{Number(booking.listing.security_deposit).toLocaleString()}</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between font-semibold text-lg">
                  <span>Total</span>
                  <span>₦{Number(booking.total_amount).toLocaleString()}</span>
                </div>
              </div>
              {isOwner && booking.payout_amount && (
                <>
                  <Separator />
                  <div className="pt-2">
                    <p className="text-sm text-muted-foreground mb-1">Your Payout</p>
                    <p className="text-2xl font-bold text-green-600">
                      ₦{Number(booking.payout_amount).toLocaleString()}
                    </p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Payment Info */}
          {booking.payment_reference && (
            <Card>
              <CardHeader>
                <CardTitle>Payment Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div>
                  <p className="text-sm text-muted-foreground">Payment Reference</p>
                  <p className="text-sm font-mono">{booking.payment_reference}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge variant={booking.payment_reference ? 'default' : 'secondary'}>
                    {booking.payment_reference ? 'Paid' : 'Pending'}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {canApprove && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button className="w-full" disabled={isUpdating}>
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Approve Booking
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
                      <AlertDialogAction onClick={() => handleStatusChange('confirmed')}>
                        Approve Booking
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}

              {canCancel && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" className="w-full" disabled={isUpdating}>
                      <XCircle className="h-4 w-4 mr-2" />
                      Cancel Booking
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
                        onClick={() => handleStatusChange('cancelled')}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Cancel Booking
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}

              {booking.listing && (
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => navigate(`/shortlets/${booking.listing?.id}`)}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  View Listing
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Review Section */}
          {booking.status === 'completed' && (
            <Card>
              <CardHeader>
                <CardTitle>Your Review</CardTitle>
                <CardDescription>
                  {existingReview 
                    ? 'You have already reviewed this booking'
                    : 'Share your experience'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {existingReview ? (
                  <div className="space-y-4">
                    <ReviewList bookingId={String(bookingId || '')} showStatistics={false} />
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => setShowReviewForm(true)}
                    >
                      Edit Review
                    </Button>
                  </div>
                ) : (
                  <Button 
                    className="w-full"
                    onClick={() => setShowReviewForm(true)}
                  >
                    Write a Review
                  </Button>
                )}
                {showReviewForm && (
                  <div className="mt-4">
                    <ReviewForm
                      bookingId={String(bookingId || '')}
                      existingReview={existingReview || undefined}
                      reviewType={isOwner ? ReviewType.OWNER : ReviewType.GUEST}
                      revieweeId={isOwner ? String(booking.guest?.id || '') : String(booking.owner_id || '')}
                      onSuccess={() => {
                        setShowReviewForm(false);
                        loadReview();
                      }}
                      onCancel={() => setShowReviewForm(false)}
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

