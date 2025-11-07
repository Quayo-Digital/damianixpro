/**
 * Bookings API Service
 * Handles booking creation, management, and status updates
 */

import { supabase } from '@/integrations/supabase/client';
import { 
  Booking, 
  bookingSchema, 
  CreateBookingRequest, 
  CreateBookingResponse,
  BookingStatus 
} from '../types';
import { checkAvailability } from '../utils/availabilityChecker';
import { calculatePriceBreakdown } from '../utils/priceCalculator';
import { getListingById } from './listings';
import { initializeBookingPayment } from './transactions';
import { getOrCreateWallet } from './wallets';

/**
 * Create a new booking
 */
export async function createBooking(
  request: CreateBookingRequest,
  guestId: string
): Promise<CreateBookingResponse> {
  // Get listing details
  const listing = await getListingById(request.listing_id);
  if (!listing) {
    throw new Error('Listing not found');
  }

  if (!listing.active) {
    throw new Error('Listing is not active');
  }

  // Check capacity
  if (request.guests_count > listing.capacity) {
    throw new Error(`Maximum capacity is ${listing.capacity} guests`);
  }

  // Check availability
  const existingBookings = await getBookingsByListing(request.listing_id);
  const availabilityResult = checkAvailability({
    listing_id: request.listing_id,
    checkin_date: request.checkin_date,
    checkout_date: request.checkout_date,
    existing_bookings: existingBookings
  });

  if (!availabilityResult.available) {
    throw new Error('Selected dates are not available');
  }

  // Calculate price
  const priceBreakdown = calculatePriceBreakdown({
    listing,
    checkin_date: request.checkin_date,
    checkout_date: request.checkout_date,
    guests_count: request.guests_count
  });

  // Calculate nights
  const checkin = new Date(request.checkin_date);
  const checkout = new Date(request.checkout_date);
  const nights = Math.ceil((checkout.getTime() - checkin.getTime()) / (1000 * 60 * 60 * 24));

  // Determine booking status
  const status = listing.instant_book ? BookingStatus.CONFIRMED : BookingStatus.PENDING;

  // Get owner_id from property
  const { data: property } = await supabase
    .from('properties')
    .select('owner_id')
    .eq('id', listing.property_id)
    .single();

  if (!property) {
    throw new Error('Property not found');
  }

  // Ensure owner has a wallet
  await getOrCreateWallet(property.owner_id);

  // Create booking
  const { data: booking, error } = await supabase
    .from('bookings')
    .insert([{
      listing_id: request.listing_id,
      guest_id: guestId,
      owner_id: property.owner_id,
      status,
      checkin_date: request.checkin_date,
      checkout_date: request.checkout_date,
      nights,
      guests_count: request.guests_count,
      total_amount: priceBreakdown.total,
      payout_amount: priceBreakdown.total - priceBreakdown.service_fee,
      commission_amount: priceBreakdown.service_fee,
      currency: priceBreakdown.currency,
      deposit_amount: listing.security_deposit,
      cancellation_policy: listing.cancellation_policy
    }])
    .select()
    .single();

  if (error) throw error;

  // Initialize payment if booking is confirmed (instant book) or if manual payment is needed
  let payment_url: string | undefined;
  if (status === BookingStatus.CONFIRMED || listing.instant_book) {
    try {
      // Get guest email (you may need to fetch this from user profile)
      const { data: guestProfile } = await supabase
        .from('profiles')
        .select('email')
        .eq('id', guestId)
        .single();

      if (guestProfile?.email) {
        const callbackUrl = typeof window !== 'undefined' 
          ? `${window.location.origin}/shortlets/booking/${booking.id}/payment/callback`
          : undefined;
        
        const paymentResult = await initializeBookingPayment(
          booking.id,
          guestProfile.email,
          priceBreakdown.total + priceBreakdown.security_deposit,
          callbackUrl
        );
        payment_url = paymentResult.payment_url;
      }
    } catch (paymentError) {
      console.error('Payment initialization error:', paymentError);
      // Don't fail booking creation if payment init fails
    }
  }

  return {
    booking_id: booking.id,
    status: booking.status as BookingStatus,
    amount_due: priceBreakdown.total + priceBreakdown.security_deposit,
    payment_url,
    payment_reference: booking.payment_reference
  };
}

/**
 * Get booking by ID
 */
export async function getBookingById(bookingId: string): Promise<Booking | null> {
  const { data, error } = await supabase
    .from('bookings')
    .select(`
      *,
      listing:listings (
        id,
        title,
        description,
        capacity,
        base_price,
        cleaning_fee,
        security_deposit,
        property:properties (
          id,
          name,
          address,
          location,
          imageUrl
        )
      ),
      guest:profiles!bookings_guest_id_fkey (
        id,
        name,
        email,
        phone
      ),
      owner:profiles!bookings_owner_id_fkey (
        id,
        name,
        email,
        phone
      )
    `)
    .eq('id', bookingId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }

  return data as Booking;
}

/**
 * Get bookings for a listing
 */
export async function getBookingsByListing(listingId: string): Promise<Booking[]> {
  const { data, error } = await supabase
    .from('bookings')
    .select(`
      *,
      listing:listings (
        id,
        title,
        property:properties (
          id,
          name,
          address,
          location,
          imageUrl
        )
      ),
      guest:profiles!bookings_guest_id_fkey (
        id,
        name,
        email,
        phone
      ),
      owner:profiles!bookings_owner_id_fkey (
        id,
        name,
        email,
        phone
      )
    `)
    .eq('listing_id', listingId)
    .in('status', ['pending', 'confirmed', 'completed'])
    .order('checkin_date', { ascending: true });

  if (error) throw error;
  return data as Booking[];
}

/**
 * Get bookings for a guest
 */
export async function getGuestBookings(guestId: string): Promise<Booking[]> {
  const { data, error } = await supabase
    .from('bookings')
    .select(`
      *,
      listing:listings (*)
    `)
    .eq('guest_id', guestId)
    .order('checkin_date', { ascending: false });

  if (error) throw error;
  return data as Booking[];
}

/**
 * Get bookings for an owner
 */
export async function getBookingsByOwner(
  ownerId: string,
  status?: BookingStatus
): Promise<Booking[]> {
  let query = supabase
    .from('bookings')
    .select(`
      *,
      listing:listings (
        id,
        title,
        property:properties (
          id,
          name,
          address,
          location,
          imageUrl
        )
      ),
      guest:profiles!bookings_guest_id_fkey (
        id,
        name,
        email,
        phone
      )
    `)
    .eq('owner_id', ownerId);

  if (status) {
    query = query.eq('status', status);
  }

  const { data, error } = await query.order('checkin_date', { ascending: false });

  if (error) throw error;
  return data as Booking[];
}

/**
 * Alias for backward compatibility
 */
export const getOwnerBookings = getBookingsByOwner;

/**
 * Get bookings for a guest
 */
export async function getBookingsByGuest(
  guestId: string,
  status?: BookingStatus
): Promise<Booking[]> {
  let query = supabase
    .from('bookings')
    .select(`
      *,
      listing:listings (
        id,
        title,
        property:properties (
          id,
          name,
          address,
          location,
          imageUrl
        )
      ),
      owner:profiles!bookings_owner_id_fkey (
        id,
        name,
        email,
        phone
      )
    `)
    .eq('guest_id', guestId);

  if (status) {
    query = query.eq('status', status);
  }

  const { data, error } = await query.order('checkin_date', { ascending: false });

  if (error) throw error;
  return data as Booking[];
}

/**
 * Update booking status
 */
export async function updateBookingStatus(
  bookingId: string,
  status: BookingStatus,
  reason?: string
): Promise<Booking> {
  const updateData: any = {
    status,
    updated_at: new Date().toISOString()
  };

  if (status === BookingStatus.CANCELLED) {
    updateData.cancelled_at = new Date().toISOString();
    if (reason) {
      updateData.cancellation_reason = reason;
    }
  }

  const { data, error } = await supabase
    .from('bookings')
    .update(updateData)
    .eq('id', bookingId)
    .select()
    .single();

  if (error) throw error;
  return data as Booking;
}

/**
 * Accept booking (change from pending to confirmed)
 */
export async function acceptBooking(bookingId: string): Promise<Booking> {
  return updateBookingStatus(bookingId, BookingStatus.CONFIRMED);
}

/**
 * Reject booking (cancel pending booking)
 */
export async function rejectBooking(bookingId: string, reason?: string): Promise<Booking> {
  return updateBookingStatus(bookingId, BookingStatus.CANCELLED, reason);
}

/**
 * Cancel booking
 */
export async function cancelBooking(bookingId: string, reason?: string): Promise<Booking> {
  return updateBookingStatus(bookingId, BookingStatus.CANCELLED, reason);
}

/**
 * Complete booking (after checkout)
 */
export async function completeBooking(bookingId: string): Promise<Booking> {
  return updateBookingStatus(bookingId, BookingStatus.COMPLETED);
}

