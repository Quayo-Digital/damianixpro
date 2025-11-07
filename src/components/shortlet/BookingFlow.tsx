/**
 * Short-Let Booking Flow Component
 * Complete booking process for guests
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/auth';
import { useShortletPayment } from '@/hooks/useShortletPayment';
import { createBooking, getBookingById } from '@/services/shortlet/api/bookings';
import { getListingById } from '@/services/shortlet/api/listings';
import { checkAvailability } from '@/services/shortlet/utils/availabilityChecker';
import { calculatePriceBreakdown } from '@/services/shortlet/utils/priceCalculator';
import { getBookingsByListing } from '@/services/shortlet/api/bookings';
import { DayPicker, DateRange } from 'react-day-picker';
import 'react-day-picker/dist/style.css';
import { format, differenceInDays } from 'date-fns';
import {
  Calendar,
  Users,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Home,
  MapPin,
  Star,
  Wifi,
  Car,
  UtensilsCrossed,
  Waves,
  Loader2
} from 'lucide-react';
import type { Listing, CreateBookingRequest, BookingStatus } from '@/services/shortlet/types';

interface BookingFlowProps {
  listingId: string;
  onBookingComplete?: (bookingId: string) => void;
}

export function BookingFlow({ listingId, onBookingComplete }: BookingFlowProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { initializePayment, isLoading: paymentLoading } = useShortletPayment();

  const [step, setStep] = useState<'dates' | 'guests' | 'review' | 'payment' | 'success'>( 'dates');
  const [listing, setListing] = useState<Listing | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRange, setSelectedRange] = useState<DateRange | undefined>();
  const [guestsCount, setGuestsCount] = useState(1);
  const [specialRequests, setSpecialRequests] = useState('');
  const [priceBreakdown, setPriceBreakdown] = useState<any>(null);
  const [availabilityError, setAvailabilityError] = useState<string | null>(null);
  const [bookingId, setBookingId] = useState<string | null>(null);

  // Load listing
  useEffect(() => {
    const loadListing = async () => {
      try {
        const data = await getListingById(listingId);
        setListing(data);
      } catch (error) {
        console.error('Error loading listing:', error);
        toast({
          title: 'Error',
          description: 'Failed to load listing details',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadListing();
  }, [listingId, toast]);

  // Check availability when dates are selected
  useEffect(() => {
    if (selectedRange?.from && selectedRange?.to && listing) {
      checkDateAvailability();
    }
  }, [selectedRange, listing]);

  // Calculate price when dates and guests change
  useEffect(() => {
    if (selectedRange?.from && selectedRange?.to && listing) {
      calculatePrice();
    }
  }, [selectedRange, guestsCount, listing]);

  const checkDateAvailability = async () => {
    if (!selectedRange?.from || !selectedRange?.to || !listing) return;

    try {
      const existingBookings = await getBookingsByListing(listingId);
      const result = checkAvailability({
        listing_id: listingId,
        checkin_date: format(selectedRange.from, 'yyyy-MM-dd'),
        checkout_date: format(selectedRange.to, 'yyyy-MM-dd'),
        existing_bookings
      });

      if (!result.available) {
        setAvailabilityError(result.reason || 'Selected dates are not available');
      } else {
        setAvailabilityError(null);
      }
    } catch (error) {
      console.error('Error checking availability:', error);
      setAvailabilityError('Failed to check availability');
    }
  };

  const calculatePrice = () => {
    if (!selectedRange?.from || !selectedRange?.to || !listing) return;

    try {
      const breakdown = calculatePriceBreakdown({
        listing,
        checkin_date: format(selectedRange.from, 'yyyy-MM-dd'),
        checkout_date: format(selectedRange.to, 'yyyy-MM-dd'),
        guests_count: guestsCount
      });

      setPriceBreakdown(breakdown);
    } catch (error) {
      console.error('Error calculating price:', error);
    }
  };

  const handleContinue = () => {
    if (step === 'dates') {
      if (!selectedRange?.from || !selectedRange?.to) {
        toast({
          title: 'Select Dates',
          description: 'Please select check-in and check-out dates',
          variant: 'destructive',
        });
        return;
      }
      if (availabilityError) {
        toast({
          title: 'Dates Not Available',
          description: availabilityError,
          variant: 'destructive',
        });
        return;
      }
      setStep('guests');
    } else if (step === 'guests') {
      if (guestsCount < 1 || guestsCount > (listing?.capacity || 1)) {
        toast({
          title: 'Invalid Guest Count',
          description: `Please select between 1 and ${listing?.capacity || 1} guests`,
          variant: 'destructive',
        });
        return;
      }
      setStep('review');
    } else if (step === 'review') {
      handleCreateBooking();
    }
  };

  const handleCreateBooking = async () => {
    if (!user?.id || !selectedRange?.from || !selectedRange?.to || !listing) return;

    setIsLoading(true);
    try {
      const request: CreateBookingRequest = {
        listing_id: listingId,
        checkin_date: format(selectedRange.from, 'yyyy-MM-dd'),
        checkout_date: format(selectedRange.to, 'yyyy-MM-dd'),
        guests_count: guestsCount,
        special_requests: specialRequests || undefined
      };

      const result = await createBooking(request, user.id);

      if (result.status === 'confirmed' && result.payment_url) {
        // Redirect to payment
        setBookingId(result.booking_id);
        setStep('payment');
        window.location.href = result.payment_url;
      } else if (result.status === 'pending') {
        // Manual approval needed
        setBookingId(result.booking_id);
        setStep('success');
        toast({
          title: 'Booking Requested',
          description: 'Your booking request has been submitted and is pending approval.',
        });
      } else {
        throw new Error('Unexpected booking status');
      }
    } catch (error) {
      console.error('Error creating booking:', error);
      toast({
        title: 'Booking Failed',
        description: error instanceof Error ? error.message : 'Failed to create booking',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const nights = selectedRange?.from && selectedRange?.to
    ? differenceInDays(selectedRange.to, selectedRange.from)
    : 0;

  if (isLoading && !listing) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!listing) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>Listing not found</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Listing Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-2xl">{listing.title}</CardTitle>
              <CardDescription className="flex items-center gap-2 mt-2">
                <MapPin className="h-4 w-4" />
                {listing.property?.address || 'Location not specified'}
              </CardDescription>
            </div>
            <Badge variant="secondary" className="text-lg px-3 py-1">
              ₦{Number(listing.base_price).toLocaleString()}/night
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              Up to {listing.capacity} guests
            </div>
            {listing.amenities && (
              <div className="flex items-center gap-2">
                {listing.amenities.wifi && <Wifi className="h-4 w-4" />}
                {listing.amenities.parking && <Car className="h-4 w-4" />}
                {listing.amenities.kitchen && <UtensilsCrossed className="h-4 w-4" />}
                {listing.amenities.pool && <Waves className="h-4 w-4" />}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Booking Steps */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            {step === 'dates' && <Calendar className="h-5 w-5" />}
            {step === 'guests' && <Users className="h-5 w-5" />}
            {step === 'review' && <CreditCard className="h-5 w-5" />}
            {step === 'success' && <CheckCircle2 className="h-5 w-5 text-green-600" />}
            <CardTitle>
              {step === 'dates' && 'Select Dates'}
              {step === 'guests' && 'Guest Details'}
              {step === 'review' && 'Review & Confirm'}
              {step === 'success' && 'Booking Confirmed!'}
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Step 1: Dates */}
          {step === 'dates' && (
            <div className="space-y-4">
              <DayPicker
                mode="range"
                selected={selectedRange}
                onSelect={(range) => setSelectedRange(range as DateRange)}
                fromDate={new Date()}
                className="rounded-md border"
              />
              {selectedRange?.from && selectedRange?.to && (
                <div className="p-4 bg-muted rounded-md">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Check-in</p>
                      <p className="text-lg">{format(selectedRange.from, 'MMM dd, yyyy')}</p>
                    </div>
                    <ArrowRight className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Check-out</p>
                      <p className="text-lg">{format(selectedRange.to, 'MMM dd, yyyy')}</p>
                    </div>
                    <Separator orientation="vertical" className="mx-4" />
                    <div>
                      <p className="text-sm font-medium">Nights</p>
                      <p className="text-lg font-semibold">{nights}</p>
                    </div>
                  </div>
                </div>
              )}
              {availabilityError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{availabilityError}</AlertDescription>
                </Alert>
              )}
            </div>
          )}

          {/* Step 2: Guests */}
          {step === 'guests' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="guests">Number of Guests</Label>
                <Input
                  id="guests"
                  type="number"
                  min={1}
                  max={listing.capacity}
                  value={guestsCount}
                  onChange={(e) => setGuestsCount(parseInt(e.target.value) || 1)}
                />
                <p className="text-sm text-muted-foreground">
                  Maximum capacity: {listing.capacity} guests
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="special-requests">Special Requests (Optional)</Label>
                <Textarea
                  id="special-requests"
                  placeholder="Any special requests or notes..."
                  value={specialRequests}
                  onChange={(e) => setSpecialRequests(e.target.value)}
                  rows={4}
                />
              </div>
            </div>
          )}

          {/* Step 3: Review */}
          {step === 'review' && priceBreakdown && (
            <div className="space-y-4">
              <div className="space-y-2">
                <h3 className="font-semibold">Booking Summary</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Check-in</span>
                    <span>{format(selectedRange!.from!, 'MMM dd, yyyy')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Check-out</span>
                    <span>{format(selectedRange!.to!, 'MMM dd, yyyy')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Nights</span>
                    <span>{nights}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Guests</span>
                    <span>{guestsCount}</span>
                  </div>
                </div>
              </div>
              <Separator />
              <div className="space-y-2">
                <h3 className="font-semibold">Price Breakdown</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      ₦{Number(listing.base_price).toLocaleString()} × {nights} nights
                    </span>
                    <span>₦{Number(priceBreakdown.base_price).toLocaleString()}</span>
                  </div>
                  {priceBreakdown.cleaning_fee > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Cleaning Fee</span>
                      <span>₦{Number(priceBreakdown.cleaning_fee).toLocaleString()}</span>
                    </div>
                  )}
                  {priceBreakdown.security_deposit > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Security Deposit</span>
                      <span>₦{Number(priceBreakdown.security_deposit).toLocaleString()}</span>
                    </div>
                  )}
                  <Separator />
                  <div className="flex justify-between font-semibold text-lg">
                    <span>Total</span>
                    <span>₦{Number(priceBreakdown.total + priceBreakdown.security_deposit).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Success */}
          {step === 'success' && (
            <div className="text-center space-y-4 py-8">
              <CheckCircle2 className="h-16 w-16 text-green-600 mx-auto" />
              <div>
                <h3 className="text-2xl font-semibold">Booking Confirmed!</h3>
                <p className="text-muted-foreground mt-2">
                  {listing.instant_book 
                    ? 'Your booking has been confirmed. Check your email for details.'
                    : 'Your booking request has been submitted and is pending approval.'}
                </p>
              </div>
              {bookingId && (
                <div className="pt-4">
                  <Button onClick={() => navigate(`/bookings/${bookingId}`)}>
                    View Booking Details
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Navigation Buttons */}
          {step !== 'success' && (
            <div className="flex justify-between pt-4">
              {step !== 'dates' && (
                <Button variant="outline" onClick={() => setStep(step === 'guests' ? 'dates' : 'guests')}>
                  Back
                </Button>
              )}
              <Button 
                onClick={handleContinue}
                disabled={isLoading || paymentLoading || !!availabilityError}
                className="ml-auto"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : step === 'review' ? (
                  <>
                    Confirm & Pay
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </>
                ) : (
                  <>
                    Continue
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

