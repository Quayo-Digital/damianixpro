/**
 * Short-Let Booking Flow Component
 * Complete booking process for guests
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
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
import { useAuthSession } from '@/contexts/auth';
import { useShortletPayment } from '@/hooks/useShortletPayment';
import { logger } from '@/utils/logger';
import { useCreateShortletBooking } from '@/hooks/useShortletBookings';
import { useShortletListing } from '@/hooks/useShortletListings';
import { useShortletBookingsByListing } from '@/hooks/useShortletBookings';
import { checkAvailability } from '@/services/shortlet/utils/availabilityChecker';
import { calculatePriceBreakdown } from '@/services/shortlet/utils/priceCalculator';
import { calculateDynamicPrice } from '@/services/shortlet/api/pricing';
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
  Loader2,
} from 'lucide-react';
import type { Listing, CreateBookingRequest, BookingStatus } from '@/services/shortlet/types';

interface BookingFlowProps {
  listingId: string;
  onBookingComplete?: (bookingId: string) => void;
}

export function BookingFlow({ listingId, onBookingComplete }: BookingFlowProps) {
  const { user, isAuthenticated } = useAuthSession();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { initializePayment, isLoading: paymentLoading } = useShortletPayment();

  const [step, setStep] = useState<'dates' | 'guests' | 'review' | 'payment' | 'success'>('dates');
  const createBookingMutation = useCreateShortletBooking();

  // Use React Query hooks
  const { data: listing, isLoading, error: listingError } = useShortletListing(listingId);
  const { data: existingBookings = [] } = useShortletBookingsByListing(listingId);
  const [selectedRange, setSelectedRange] = useState<DateRange | undefined>();
  const [guestsCount, setGuestsCount] = useState(1);
  const [specialRequests, setSpecialRequests] = useState('');
  const [priceBreakdown, setPriceBreakdown] = useState<any>(null);
  const [isCalculatingPrice, setIsCalculatingPrice] = useState(false);
  const [availabilityError, setAvailabilityError] = useState<string | null>(null);
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Reset transitioning when step actually changes
  const prevStepRef = useRef(step);
  useEffect(() => {
    if (prevStepRef.current !== step && isTransitioning) {
      // Step has changed, reset transitioning after a brief delay
      const timer = setTimeout(() => {
        setIsTransitioning(false);
      }, 150);
      prevStepRef.current = step;
      return () => clearTimeout(timer);
    }
    prevStepRef.current = step;
  }, [step, isTransitioning]);

  // Handle listing error
  useEffect(() => {
    if (listingError) {
      toast({
        title: 'Error',
        description: 'Failed to load listing details',
        variant: 'destructive',
      });
    }
  }, [listingError, toast]);

  // Define calculatePrice before useEffects that use it
  const calculatePrice = useCallback(async () => {
    if (!selectedRange?.from || !selectedRange?.to || !listing) return;

    setIsCalculatingPrice(true);
    try {
      // Try dynamic pricing first (includes date-specific pricing, rules, patterns)
      try {
        const dynamicBreakdown = await calculateDynamicPrice(
          listingId,
          Number(listing.base_price) || 0,
          format(selectedRange.from, 'yyyy-MM-dd'),
          format(selectedRange.to, 'yyyy-MM-dd'),
          guestsCount
        );

        // Convert dynamic pricing format to compatible format
        const breakdown = {
          base_price: dynamicBreakdown.breakdown.basePrice,
          nights: dynamicBreakdown.nightlyPrices.length,
          subtotal: dynamicBreakdown.totalPrice,
          cleaning_fee: Number(listing.cleaning_fee) || 0,
          security_deposit: Number(listing.security_deposit) || 0,
          service_fee: 0, // Will be calculated if needed
          total: dynamicBreakdown.totalPrice + (Number(listing.cleaning_fee) || 0),
          currency: 'NGN',
          // Additional dynamic pricing info
          nightlyPrices: dynamicBreakdown.nightlyPrices,
          customPricing: dynamicBreakdown.breakdown.customPricing,
          ruleAdjustments: dynamicBreakdown.breakdown.ruleAdjustments,
        };

        setPriceBreakdown(breakdown);
      } catch (dynamicError) {
        // Fallback to simple pricing if dynamic pricing fails
        logger.warn('Dynamic pricing failed, using simple pricing', dynamicError);
        const breakdown = calculatePriceBreakdown({
          listing,
          checkin_date: format(selectedRange.from, 'yyyy-MM-dd'),
          checkout_date: format(selectedRange.to, 'yyyy-MM-dd'),
          guests_count: guestsCount,
        });
        setPriceBreakdown(breakdown);
      }
    } catch (error) {
      logger.error('Error calculating price', error, { listingId, guestsCount });
      toast({
        title: 'Pricing Error',
        description: 'Failed to calculate price. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsCalculatingPrice(false);
    }
  }, [selectedRange, listing, listingId, guestsCount, toast]);

  // Check availability when dates are selected
  useEffect(() => {
    if (selectedRange?.from && selectedRange?.to && listing) {
      // Clear previous errors when dates change
      setAvailabilityError(null);
      checkDateAvailability();
    } else {
      // Clear error if dates are not selected
      setAvailabilityError(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedRange, listing]);

  // Calculate price when dates and guests change
  useEffect(() => {
    if (selectedRange?.from && selectedRange?.to && listing) {
      calculatePrice();
    }
  }, [selectedRange, guestsCount, listing, calculatePrice]);

  const checkDateAvailability = async () => {
    if (!selectedRange?.from || !selectedRange?.to || !listing) return;

    try {
      const existingBookings = await getBookingsByListing(listingId);
      const result = checkAvailability({
        listing_id: listingId,
        checkin_date: format(selectedRange.from, 'yyyy-MM-dd'),
        checkout_date: format(selectedRange.to, 'yyyy-MM-dd'),
        existing_bookings: existingBookings || [],
      });

      if (!result.available) {
        setAvailabilityError(result.reason || 'Selected dates are not available');
      } else {
        setAvailabilityError(null);
      }
    } catch (error: any) {
      logger.error('Error checking availability', error, {
        listingId,
        checkin: selectedRange?.from,
        checkout: selectedRange?.to,
      });
      // Don't block user for any errors - allow them to continue
      // The booking will be validated on the server side anyway
      logger.warn('Availability check failed, allowing user to continue', { listingId });
      setAvailabilityError(null);
    }
  };

  const handleContinue = () => {
    // Prevent multiple rapid clicks
    if (isTransitioning) {
      console.log('Already transitioning, ignoring click');
      return;
    }

    console.log('handleContinue called', {
      step,
      selectedRange,
      availabilityError,
      isLoading,
      paymentLoading,
    });

    setIsTransitioning(true);

    if (step === 'dates') {
      if (!selectedRange?.from || !selectedRange?.to) {
        console.log('No dates selected');
        setIsTransitioning(false);
        toast({
          title: 'Select Dates',
          description: 'Please select check-in and check-out dates',
          variant: 'destructive',
        });
        return;
      }
      // Only block if there's a specific availability conflict (not network errors)
      if (
        availabilityError &&
        !availabilityError.includes('offline') &&
        !availabilityError.includes('Failed to check')
      ) {
        console.log('Availability error blocking:', availabilityError);
        setIsTransitioning(false);
        toast({
          title: 'Dates Not Available',
          description: availabilityError,
          variant: 'destructive',
        });
        return;
      }
      console.log('Moving to guests step');
      setStep('guests');
      // isTransitioning will be reset by useEffect when step changes
    } else if (step === 'guests') {
      if (guestsCount < 1 || guestsCount > (listing?.capacity || 1)) {
        setIsTransitioning(false);
        toast({
          title: 'Invalid Guest Count',
          description: `Please select between 1 and ${listing?.capacity || 1} guests`,
          variant: 'destructive',
        });
        return;
      }
      // Require auth before proceeding to review & payment
      if (!isAuthenticated() || !user?.id) {
        setIsTransitioning(false);
        toast({
          title: 'Sign in required',
          description:
            'Please sign in to complete your booking. Your selected dates and guests will be saved.',
          variant: 'destructive',
        });
        const returnUrl = `${window.location.pathname}${window.location.search}`;
        navigate(`/auth?tab=login&returnUrl=${encodeURIComponent(returnUrl)}`);
        return;
      }
      setStep('review');
      // isTransitioning will be reset by useEffect when step changes
    } else if (step === 'review') {
      // Don't reset isTransitioning here - let handleCreateBooking manage it
      handleCreateBooking();
    }
  };

  const handleCreateBooking = async () => {
    // Defensive auth check (main check happens at guests->review transition)
    if (!isAuthenticated() || !user?.id) {
      toast({
        title: 'Sign in required',
        description: 'Please sign in to complete your booking.',
        variant: 'destructive',
      });
      setIsTransitioning(false);
      navigate(`/auth?tab=login&returnUrl=${encodeURIComponent(window.location.pathname)}`);
      return;
    }

    // Check other required data
    if (!selectedRange?.from || !selectedRange?.to || !listing) {
      logger.error('Missing required data for booking', undefined, {
        userId: user?.id,
        selectedRange,
        listing: listing?.id,
      });
      toast({
        title: 'Missing Information',
        description: 'Please ensure all booking details are complete',
        variant: 'destructive',
      });
      setIsTransitioning(false);
      return;
    }

    console.log('Creating booking...', {
      listingId,
      checkin: format(selectedRange.from, 'yyyy-MM-dd'),
      checkout: format(selectedRange.to, 'yyyy-MM-dd'),
      guests: guestsCount,
    });

    setIsTransitioning(true); // Keep transitioning during booking creation
    try {
      const request: CreateBookingRequest = {
        listing_id: listingId,
        checkin_date: format(selectedRange.from, 'yyyy-MM-dd'),
        checkout_date: format(selectedRange.to, 'yyyy-MM-dd'),
        guests_count: guestsCount,
        special_requests: specialRequests || undefined,
      };

      const result = await createBookingMutation.mutateAsync({ request, guestId: user.id });

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
      // Use logger utility instead of console.error
      logger.error('Error creating booking', error, { listingId, userId: user?.id });
      toast({
        title: 'Booking Failed',
        description:
          error instanceof Error ? error.message : 'Failed to create booking. Please try again.',
        variant: 'destructive',
      });
      setIsTransitioning(false); // Reset on error
    }
  };

  const nights =
    selectedRange?.from && selectedRange?.to
      ? differenceInDays(selectedRange.to, selectedRange.from)
      : 0;

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
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
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Listing Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-2xl">{listing.title}</CardTitle>
              <CardDescription className="mt-2 flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                {listing.property?.address || 'Location not specified'}
              </CardDescription>
            </div>
            <Badge variant="secondary" className="px-3 py-1 text-lg">
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
          {/* Auth reminder for unauthenticated users */}
          {!isAuthenticated() && (step === 'dates' || step === 'guests') && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="flex items-center justify-between gap-4">
                <span>Sign in to complete your booking</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    navigate(
                      `/auth?tab=login&returnUrl=${encodeURIComponent(window.location.pathname)}`
                    )
                  }
                >
                  Sign in
                </Button>
              </AlertDescription>
            </Alert>
          )}

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
                <div className="rounded-md bg-muted p-4">
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
          {step === 'review' && (
            <div className="space-y-4">
              {!priceBreakdown || isCalculatingPrice ? (
                <div className="py-8 text-center">
                  <Loader2 className="mx-auto mb-4 h-8 w-8 animate-spin text-primary" />
                  <p className="text-muted-foreground">Calculating price...</p>
                </div>
              ) : (
                <>
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
                          {priceBreakdown.nightlyPrices
                            ? `Dynamic pricing (${nights} nights)`
                            : `₦${Number(listing.base_price).toLocaleString()} × ${nights} nights`}
                        </span>
                        <span>
                          ₦
                          {Number(
                            priceBreakdown.subtotal || priceBreakdown.base_price
                          ).toLocaleString()}
                        </span>
                      </div>
                      {priceBreakdown.customPricing && priceBreakdown.customPricing > 0 && (
                        <div className="flex justify-between text-xs text-amber-600">
                          <span>Custom pricing applied</span>
                          <span>+₦{Number(priceBreakdown.customPricing).toLocaleString()}</span>
                        </div>
                      )}
                      {priceBreakdown.ruleAdjustments && priceBreakdown.ruleAdjustments > 0 && (
                        <div className="flex justify-between text-xs text-blue-600">
                          <span>Pricing rules applied</span>
                          <span>+₦{Number(priceBreakdown.ruleAdjustments).toLocaleString()}</span>
                        </div>
                      )}
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
                      <div className="flex justify-between text-lg font-semibold">
                        <span>Total</span>
                        <span>
                          ₦
                          {Number(
                            priceBreakdown.total + priceBreakdown.security_deposit
                          ).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Step 4: Success */}
          {step === 'success' && (
            <div className="space-y-4 py-8 text-center">
              <CheckCircle2 className="mx-auto h-16 w-16 text-green-600" />
              <div>
                <h3 className="text-2xl font-semibold">Booking Confirmed!</h3>
                <p className="mt-2 text-muted-foreground">
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
                <Button
                  variant="outline"
                  onClick={() => setStep(step === 'guests' ? 'dates' : 'guests')}
                >
                  Back
                </Button>
              )}
              <Button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log('Continue button clicked', {
                    step,
                    selectedRange,
                    availabilityError,
                    isLoading,
                    paymentLoading,
                    hasDates: !!(selectedRange?.from && selectedRange?.to),
                    isDisabled:
                      isLoading ||
                      paymentLoading ||
                      (step === 'dates' && (!selectedRange?.from || !selectedRange?.to)) ||
                      (!!availabilityError &&
                        !availabilityError.includes('offline') &&
                        !availabilityError.includes('Failed to check') &&
                        !availabilityError.includes('Unable to check')),
                  });
                  if (!isLoading && !paymentLoading && !isTransitioning) {
                    handleContinue();
                  } else {
                    console.log('Button is disabled, not calling handleContinue', {
                      isLoading,
                      paymentLoading,
                      isTransitioning,
                    });
                  }
                }}
                disabled={
                  isLoading ||
                  paymentLoading ||
                  isTransitioning ||
                  (step === 'dates' && (!selectedRange?.from || !selectedRange?.to)) ||
                  (step === 'review' && !priceBreakdown) ||
                  (!!availabilityError &&
                    !availabilityError.includes('offline') &&
                    !availabilityError.includes('Failed to check') &&
                    !availabilityError.includes('Unable to check'))
                }
                className="ml-auto"
                type="button"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : step === 'review' ? (
                  <>
                    Confirm & Pay
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                ) : (
                  <>
                    Continue
                    <ArrowRight className="ml-2 h-4 w-4" />
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
