-- ============================================================================
-- Populate App with Dummy Data
-- This script creates realistic dummy content for the entire application
-- Run this in Supabase SQL Editor
-- ============================================================================

-- Note: This script assumes you have at least one user in auth.users
-- If you don't have users, create them first through the app's signup

-- ============================================================================
-- 0. ENSURE SHORT-LET TABLES AND COLUMNS EXIST
-- ============================================================================

-- Add is_shortlet and shortlet_details columns if they don't exist
ALTER TABLE public.properties 
ADD COLUMN IF NOT EXISTS is_shortlet BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS shortlet_details JSONB,
ADD COLUMN IF NOT EXISTS imageUrl TEXT;

-- Create listings table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  capacity INT NOT NULL DEFAULT 1,
  amenities JSONB DEFAULT '[]'::jsonb,
  base_price NUMERIC(12,2) NOT NULL,
  cleaning_fee NUMERIC(12,2) DEFAULT 0,
  security_deposit NUMERIC(12,2) DEFAULT 0,
  timezone TEXT DEFAULT 'Africa/Lagos',
  instant_book BOOLEAN DEFAULT FALSE,
  active BOOLEAN DEFAULT TRUE,
  cancellation_policy JSONB DEFAULT '{"policy_name": "Moderate", "full_refund_before_days": 7, "partial_refund_before_days": 2, "partial_refund_percent": 50, "no_refund_within_days": 2}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create listing_availabilities table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.listing_availabilities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  available BOOLEAN DEFAULT TRUE,
  source TEXT DEFAULT 'manual',
  source_id TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT valid_date_range CHECK (end_date >= start_date)
);

-- Create bookings table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE RESTRICT,
  guest_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  status TEXT NOT NULL DEFAULT 'pending',
  checkin_date DATE NOT NULL,
  checkout_date DATE NOT NULL,
  nights INT NOT NULL,
  guests_count INT NOT NULL DEFAULT 1,
  total_amount NUMERIC(12,2) NOT NULL,
  payout_amount NUMERIC(12,2),
  commission_amount NUMERIC(12,2),
  currency TEXT DEFAULT 'NGN',
  payment_reference TEXT,
  deposit_amount NUMERIC(12,2) DEFAULT 0,
  cancellation_policy JSONB,
  metadata JSONB DEFAULT '{}'::jsonb,
  cancellation_reason TEXT,
  cancelled_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT valid_booking_dates CHECK (checkout_date > checkin_date),
  CONSTRAINT valid_booking_status CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed', 'refunded'))
);

-- Create wallets table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  balance NUMERIC(14,2) DEFAULT 0 CHECK (balance >= 0),
  pending_balance NUMERIC(14,2) DEFAULT 0 CHECK (pending_balance >= 0),
  total_earned NUMERIC(14,2) DEFAULT 0,
  total_paid_out NUMERIC(14,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create reviews table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  reviewee_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  review_type TEXT NOT NULL CHECK (review_type IN ('guest', 'owner')),
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  response TEXT,
  response_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 1. PROPERTIES (including short-let properties)
-- ============================================================================

-- Insert dummy properties (mix of regular and short-let properties)
INSERT INTO public.properties (
  id,
  name,
  address,
  location,
  type,
  transaction_type,
  price,
  sale_price,
  lease_price,
  bedrooms,
  bathrooms,
  description,
  status,
  owner_id,
  images,
  imageUrl,
  is_shortlet,
  shortlet_details,
  created_at,
  updated_at
) VALUES
-- Short-let Properties in Lagos
(
  gen_random_uuid(),
  'Luxury 3BR Apartment in Victoria Island',
  '15A Ahmadu Bello Way, Victoria Island',
  'Lagos, Nigeria',
  'Apartment',
  'LEASE',
  '₦150,000/month',
  0,
  150000,
  '3',
  '2',
  'Beautiful modern apartment in the heart of Victoria Island. Fully furnished with premium amenities. Perfect for short stays and business travelers. Features include high-speed WiFi, air conditioning, fully equipped kitchen, and 24/7 security.',
  'Available',
  (SELECT id FROM auth.users LIMIT 1),
  ARRAY['https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&h=600&fit=crop'],
  'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&h=600&fit=crop',
  true,
  '{"max_guests": 6, "check_in": "14:00", "check_out": "11:00"}'::jsonb,
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'Cozy 2BR Studio in Lekki Phase 1',
  'Plot 12, Admiralty Way, Lekki Phase 1',
  'Lagos, Nigeria',
  'Apartment',
  'LEASE',
  '₦85,000/month',
  0,
  85000,
  '2',
  '1',
  'Charming studio apartment in Lekki Phase 1. Ideal for couples or small families. Close to shopping malls, restaurants, and beaches. Features modern furnishings, WiFi, and parking space.',
  'Available',
  (SELECT id FROM auth.users LIMIT 1),
  ARRAY['https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800&h=600&fit=crop'],
  'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800&h=600&fit=crop',
  true,
  '{"max_guests": 4, "check_in": "15:00", "check_out": "12:00"}'::jsonb,
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'Spacious 4BR Villa in Ikoyi',
  '8 Bourdillon Road, Ikoyi',
  'Lagos, Nigeria',
  'House',
  'LEASE',
  '₦250,000/month',
  0,
  250000,
  '4',
  '3',
  'Elegant 4-bedroom villa in exclusive Ikoyi neighborhood. Perfect for families or groups. Features include private garden, swimming pool, modern kitchen, and spacious living areas. Close to business districts and entertainment.',
  'Available',
  (SELECT id FROM auth.users LIMIT 1),
  ARRAY['https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800&h=600&fit=crop'],
  'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800&h=600&fit=crop',
  true,
  '{"max_guests": 8, "check_in": "14:00", "check_out": "11:00"}'::jsonb,
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'Modern 1BR Apartment in Ikeja',
  '45 Obafemi Awolowo Way, Ikeja',
  'Lagos, Nigeria',
  'Apartment',
  'LEASE',
  '₦65,000/month',
  0,
  65000,
  '1',
  '1',
  'Compact and modern 1-bedroom apartment in Ikeja. Perfect for solo travelers or couples. Well-maintained with all essential amenities. Close to airport and business centers.',
  'Available',
  (SELECT id FROM auth.users LIMIT 1),
  ARRAY['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop'],
  'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop',
  true,
  '{"max_guests": 2, "check_in": "15:00", "check_out": "12:00"}'::jsonb,
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'Beachfront 3BR Condo in Tarkwa Bay',
  'Tarkwa Bay Beach, Lagos',
  'Lagos, Nigeria',
  'Condo',
  'LEASE',
  '₦200,000/month',
  0,
  200000,
  '3',
  '2',
  'Stunning beachfront condo with breathtaking ocean views. Perfect for vacation stays. Features include private beach access, balcony, modern amenities, and water sports equipment. Ideal for families and groups seeking a beach getaway.',
  'Available',
  (SELECT id FROM auth.users LIMIT 1),
  ARRAY['https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800&h=600&fit=crop'],
  'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800&h=600&fit=crop',
  true,
  '{"max_guests": 6, "check_in": "16:00", "check_out": "10:00"}'::jsonb,
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'Luxury Penthouse in Banana Island',
  'Banana Island, Ikoyi',
  'Lagos, Nigeria',
  'Penthouse',
  'LEASE',
  '₦500,000/month',
  0,
  500000,
  '5',
  '4',
  'Ultra-luxury penthouse in exclusive Banana Island. Features panoramic city views, private elevator, rooftop terrace, home theater, and premium finishes throughout. Perfect for high-end short stays and corporate accommodations.',
  'Available',
  (SELECT id FROM auth.users LIMIT 1),
  ARRAY['https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&h=600&fit=crop'],
  'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&h=600&fit=crop',
  true,
  '{"max_guests": 10, "check_in": "15:00", "check_out": "11:00"}'::jsonb,
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'Cozy 2BR Cottage in Surulere',
  '23 Bode Thomas Street, Surulere',
  'Lagos, Nigeria',
  'House',
  'LEASE',
  '₦75,000/month',
  0,
  75000,
  '2',
  '1',
  'Charming 2-bedroom cottage in Surulere. Traditional design with modern amenities. Quiet neighborhood, close to markets and transportation. Perfect for budget-conscious travelers.',
  'Available',
  (SELECT id FROM auth.users LIMIT 1),
  ARRAY['https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&h=600&fit=crop'],
  'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&h=600&fit=crop',
  true,
  '{"max_guests": 4, "check_in": "14:00", "check_out": "12:00"}'::jsonb,
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'Modern Studio in Yaba',
  '15 Herbert Macaulay Way, Yaba',
  'Lagos, Nigeria',
  'Apartment',
  'LEASE',
  '₦55,000/month',
  0,
  55000,
  '1',
  '1',
  'Affordable modern studio in Yaba tech hub. Perfect for digital nomads and students. Features high-speed internet, workspace, and proximity to tech companies and universities.',
  'Available',
  (SELECT id FROM auth.users LIMIT 1),
  ARRAY['https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=800&h=600&fit=crop'],
  'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=800&h=600&fit=crop',
  true,
  '{"max_guests": 2, "check_in": "15:00", "check_out": "12:00"}'::jsonb,
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 2. SHORT-LET LISTINGS
-- ============================================================================

-- Insert short-let listings for the properties above
DO $$
DECLARE
  property_rec RECORD;
  listing_id UUID;
BEGIN
  FOR property_rec IN 
    SELECT id, name, owner_id, lease_price 
    FROM public.properties 
    WHERE is_shortlet = true 
    LIMIT 8
  LOOP
    listing_id := gen_random_uuid();
    
    INSERT INTO public.listings (
      id,
      property_id,
      title,
      description,
      capacity,
      amenities,
      base_price,
      cleaning_fee,
      security_deposit,
      timezone,
      instant_book,
      active,
      cancellation_policy,
      created_at,
      updated_at
    ) VALUES (
      listing_id,
      property_rec.id,
      property_rec.name,
      CASE 
        WHEN property_rec.name LIKE '%Luxury%' OR property_rec.name LIKE '%Penthouse%' THEN
          'Experience luxury living in the heart of Lagos. This premium property offers world-class amenities, stunning views, and exceptional service. Perfect for business travelers, families, or anyone seeking an unforgettable stay in Nigeria''s commercial capital.'
        WHEN property_rec.name LIKE '%Beachfront%' OR property_rec.name LIKE '%Tarkwa%' THEN
          'Wake up to the sound of waves and breathtaking ocean views. This beachfront property offers direct beach access, water sports, and a serene environment perfect for relaxation and adventure.'
        WHEN property_rec.name LIKE '%Cozy%' OR property_rec.name LIKE '%Cottage%' THEN
          'A charming and comfortable space that feels like home. Perfect for extended stays, this property offers all the essentials in a warm and welcoming environment.'
        WHEN property_rec.name LIKE '%Studio%' THEN
          'Modern, compact, and fully equipped. This studio is perfect for solo travelers or couples seeking a convenient base in Lagos. All amenities included for a comfortable stay.'
        ELSE
          'Beautiful property in a prime Lagos location. Well-maintained, fully furnished, and ready for your stay. Close to major attractions, business districts, and entertainment venues.'
      END,
      CASE 
        WHEN property_rec.name LIKE '%1BR%' OR property_rec.name LIKE '%Studio%' THEN 2
        WHEN property_rec.name LIKE '%2BR%' OR property_rec.name LIKE '%Cottage%' THEN 4
        WHEN property_rec.name LIKE '%3BR%' THEN 6
        WHEN property_rec.name LIKE '%4BR%' THEN 8
        WHEN property_rec.name LIKE '%5BR%' OR property_rec.name LIKE '%Penthouse%' THEN 10
        ELSE 4
      END,
      CASE 
        WHEN property_rec.name LIKE '%Luxury%' OR property_rec.name LIKE '%Penthouse%' THEN
          '["wifi", "air_conditioning", "kitchen", "parking", "pool", "tv", "washer", "dryer", "gym", "concierge"]'::jsonb
        WHEN property_rec.name LIKE '%Beachfront%' THEN
          '["wifi", "air_conditioning", "kitchen", "parking", "tv", "beach_access", "water_sports"]'::jsonb
        ELSE
          '["wifi", "air_conditioning", "kitchen", "parking", "tv"]'::jsonb
      END,
      property_rec.lease_price,
      CASE 
        WHEN property_rec.lease_price > 200000 THEN 15000
        WHEN property_rec.lease_price > 100000 THEN 10000
        ELSE 5000
      END,
      CASE 
        WHEN property_rec.lease_price > 200000 THEN 50000
        WHEN property_rec.lease_price > 100000 THEN 30000
        ELSE 20000
      END,
      'Africa/Lagos',
      CASE WHEN property_rec.name LIKE '%Luxury%' OR property_rec.name LIKE '%Penthouse%' THEN true ELSE false END,
      true,
      '{"policy_name": "Moderate", "full_refund_before_days": 7, "partial_refund_before_days": 2, "partial_refund_percent": 50, "no_refund_within_days": 2}'::jsonb,
      NOW(),
      NOW()
    ) ON CONFLICT (id) DO NOTHING;
  END LOOP;
END $$;

-- ============================================================================
-- 3. DUMMY BOOKINGS
-- ============================================================================

-- Insert some past, current, and upcoming bookings
DO $$
DECLARE
  listing_rec RECORD;
  guest_user_id UUID;
  owner_user_id UUID;
  booking_id UUID;
  checkin_date DATE;
  checkout_date DATE;
  nights INT;
  total_amount NUMERIC;
BEGIN
  -- Get a guest user (or use first available user)
  SELECT id INTO guest_user_id FROM auth.users LIMIT 1 OFFSET 1;
  IF guest_user_id IS NULL THEN
    SELECT id INTO guest_user_id FROM auth.users LIMIT 1;
  END IF;
  
  FOR listing_rec IN 
    SELECT l.id, l.base_price, l.cleaning_fee, l.security_deposit, p.owner_id
    FROM public.listings l
    JOIN public.properties p ON l.property_id = p.id
    WHERE l.active = true
    LIMIT 5
  LOOP
    owner_user_id := listing_rec.owner_id;
    
    -- Past booking (completed)
    checkin_date := CURRENT_DATE - INTERVAL '30 days';
    checkout_date := checkin_date + INTERVAL '3 days';
    nights := 3;
    total_amount := (listing_rec.base_price * nights) + COALESCE(listing_rec.cleaning_fee, 0);
    
    booking_id := gen_random_uuid();
    INSERT INTO public.bookings (
      id,
      listing_id,
      guest_id,
      owner_id,
      status,
      checkin_date,
      checkout_date,
      nights,
      guests_count,
      total_amount,
      payout_amount,
      commission_amount,
      currency,
      payment_reference,
      created_at,
      updated_at
    ) VALUES (
      booking_id,
      listing_rec.id,
      guest_user_id,
      owner_user_id,
      'completed',
      checkin_date,
      checkout_date,
      nights,
      2,
      total_amount,
      total_amount * 0.90, -- 10% commission
      total_amount * 0.10,
      'NGN',
      'TXN_' || substr(booking_id::text, 1, 8),
      checkin_date - INTERVAL '45 days',
      checkout_date
    ) ON CONFLICT (id) DO NOTHING;
    
    -- Current booking (confirmed)
    checkin_date := CURRENT_DATE - INTERVAL '2 days';
    checkout_date := CURRENT_DATE + INTERVAL '2 days';
    nights := 4;
    total_amount := (listing_rec.base_price * nights) + COALESCE(listing_rec.cleaning_fee, 0);
    
    booking_id := gen_random_uuid();
    INSERT INTO public.bookings (
      id,
      listing_id,
      guest_id,
      owner_id,
      status,
      checkin_date,
      checkout_date,
      nights,
      guests_count,
      total_amount,
      payout_amount,
      commission_amount,
      currency,
      payment_reference,
      created_at,
      updated_at
    ) VALUES (
      booking_id,
      listing_rec.id,
      guest_user_id,
      owner_user_id,
      'confirmed',
      checkin_date,
      checkout_date,
      nights,
      3,
      total_amount,
      total_amount * 0.90,
      total_amount * 0.10,
      'NGN',
      'TXN_' || substr(booking_id::text, 1, 8),
      checkin_date - INTERVAL '10 days',
      NOW()
    ) ON CONFLICT (id) DO NOTHING;
    
    -- Upcoming booking (pending)
    checkin_date := CURRENT_DATE + INTERVAL '7 days';
    checkout_date := checkin_date + INTERVAL '5 days';
    nights := 5;
    total_amount := (listing_rec.base_price * nights) + COALESCE(listing_rec.cleaning_fee, 0);
    
    booking_id := gen_random_uuid();
    INSERT INTO public.bookings (
      id,
      listing_id,
      guest_id,
      owner_id,
      status,
      checkin_date,
      checkout_date,
      nights,
      guests_count,
      total_amount,
      payout_amount,
      commission_amount,
      currency,
      payment_reference,
      created_at,
      updated_at
    ) VALUES (
      booking_id,
      listing_rec.id,
      guest_user_id,
      owner_user_id,
      'pending',
      checkin_date,
      checkout_date,
      nights,
      2,
      total_amount,
      total_amount * 0.90,
      total_amount * 0.10,
      'NGN',
      NULL,
      CURRENT_DATE - INTERVAL '3 days',
      NOW()
    ) ON CONFLICT (id) DO NOTHING;
  END LOOP;
END $$;

-- ============================================================================
-- 4. REVIEWS
-- ============================================================================

-- Insert reviews for completed bookings
DO $$
DECLARE
  booking_rec RECORD;
  review_id UUID;
BEGIN
  FOR booking_rec IN 
    SELECT b.id, b.listing_id, b.guest_id, b.owner_id, b.created_at
    FROM public.bookings b
    WHERE b.status = 'completed'
    LIMIT 10
  LOOP
    -- Guest review (reviewing property/owner)
    review_id := gen_random_uuid();
    INSERT INTO public.reviews (
      id,
      booking_id,
      reviewer_id,
      reviewee_id,
      review_type,
      rating,
      comment,
      created_at,
      updated_at
    ) VALUES (
      review_id,
      booking_rec.id,
      booking_rec.guest_id,
      booking_rec.owner_id,
      'guest',
      CASE (random() * 4)::int + 1
        WHEN 1 THEN 5
        WHEN 2 THEN 4
        WHEN 3 THEN 5
        ELSE 4
      END,
      CASE (random() * 5)::int
        WHEN 0 THEN 'Excellent stay! The property was exactly as described, clean, and well-maintained. The host was very responsive and helpful. Highly recommend!'
        WHEN 1 THEN 'Great location and comfortable space. Everything we needed was provided. Would definitely book again.'
        WHEN 2 THEN 'Nice property in a good area. Some minor issues but overall a pleasant experience.'
        WHEN 3 THEN 'Beautiful property with amazing amenities. The host went above and beyond to make our stay memorable.'
        WHEN 4 THEN 'Perfect for our needs. Clean, spacious, and well-equipped. Great value for money.'
        ELSE 'Wonderful experience! The property exceeded our expectations. Highly recommended for anyone visiting Lagos.'
      END,
      booking_rec.created_at + INTERVAL '1 day',
      NOW()
    ) ON CONFLICT (id) DO NOTHING;
    
    -- Owner review (reviewing guest) - only for some bookings
    IF random() > 0.5 AND NOT EXISTS (SELECT 1 FROM public.reviews WHERE booking_id = booking_rec.id AND review_type = 'owner') THEN
      review_id := gen_random_uuid();
      INSERT INTO public.reviews (
        id,
        booking_id,
        reviewer_id,
        reviewee_id,
        review_type,
        rating,
        comment,
        created_at,
        updated_at
      ) VALUES (
        review_id,
        booking_rec.id,
        booking_rec.owner_id,
        booking_rec.guest_id,
        'owner',
        CASE (random() * 4)::int + 1
          WHEN 1 THEN 5
          WHEN 2 THEN 5
          WHEN 3 THEN 4
          ELSE 5
        END,
        CASE (random() * 3)::int
          WHEN 0 THEN 'Excellent guest! Very respectful, clean, and communicative. Would welcome them back anytime.'
          WHEN 1 THEN 'Great guest, followed all house rules and left the place in perfect condition.'
          WHEN 2 THEN 'Pleasant guest, no issues. Recommended.'
          ELSE 'Outstanding guest! Very responsible and easy to communicate with.'
        END,
        booking_rec.created_at + INTERVAL '2 days',
        NOW()
      ) ON CONFLICT (id) DO NOTHING;
    END IF;
  END LOOP;
END $$;

-- ============================================================================
-- 5. WALLETS (for owners)
-- ============================================================================

-- Create wallets for property owners
INSERT INTO public.wallets (
  id,
  user_id,
  balance,
  pending_balance,
  created_at,
  updated_at
)
SELECT 
  gen_random_uuid(),
  p.owner_id,
  COALESCE(SUM(b.payout_amount), 0) * 0.5, -- 50% of total payouts as current balance
  COALESCE(SUM(CASE WHEN b.status = 'confirmed' THEN b.payout_amount ELSE 0 END), 0) * 0.3, -- 30% as pending
  NOW(),
  NOW()
FROM public.properties p
LEFT JOIN public.bookings b ON b.owner_id = p.owner_id
WHERE p.is_shortlet = true
GROUP BY p.owner_id
ON CONFLICT (user_id) DO UPDATE SET
  balance = EXCLUDED.balance,
  pending_balance = EXCLUDED.pending_balance,
  updated_at = NOW();

-- ============================================================================
-- 6. AVAILABILITY BLOCKS (for calendar management)
-- ============================================================================

-- Block some dates for maintenance or owner use
DO $$
DECLARE
  listing_rec RECORD;
  block_start DATE;
  block_end DATE;
BEGIN
  FOR listing_rec IN 
    SELECT id FROM public.listings WHERE active = true LIMIT 5
  LOOP
    -- Block random dates in the future
    block_start := CURRENT_DATE + (random() * 30 + 10)::int;
    block_end := block_start + (random() * 3 + 1)::int;
    
    INSERT INTO public.listing_availabilities (
      id,
      listing_id,
      start_date,
      end_date,
      available,
      source,
      notes,
      created_at,
      updated_at
    ) VALUES (
      gen_random_uuid(),
      listing_rec.id,
      block_start,
      block_end,
      false,
      'manual',
      'Blocked for maintenance',
      NOW(),
      NOW()
    ) ON CONFLICT DO NOTHING;
  END LOOP;
END $$;

-- ============================================================================
-- 7. UPDATE PROPERTY IMAGES (using Unsplash placeholder images)
-- ============================================================================

-- Update property images with realistic placeholder images (if images array is empty)
-- Also set imageUrl from the first image for backward compatibility
UPDATE public.properties
SET 
  images = CASE 
    WHEN name LIKE '%Luxury%' OR name LIKE '%Penthouse%' THEN
      ARRAY['https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&h=600&fit=crop']
    WHEN name LIKE '%Beachfront%' OR name LIKE '%Tarkwa%' THEN
      ARRAY['https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800&h=600&fit=crop']
    WHEN name LIKE '%Cozy%' OR name LIKE '%Cottage%' THEN
      ARRAY['https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&h=600&fit=crop']
    WHEN name LIKE '%Studio%' THEN
      ARRAY['https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=800&h=600&fit=crop']
    WHEN name LIKE '%Villa%' OR name LIKE '%Ikoyi%' THEN
      ARRAY['https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800&h=600&fit=crop']
    WHEN name LIKE '%Victoria Island%' THEN
      ARRAY['https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&h=600&fit=crop']
    WHEN name LIKE '%Lekki%' THEN
      ARRAY['https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800&h=600&fit=crop']
    ELSE
      ARRAY['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop']
  END,
  imageUrl = CASE 
    WHEN name LIKE '%Luxury%' OR name LIKE '%Penthouse%' THEN
      'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&h=600&fit=crop'
    WHEN name LIKE '%Beachfront%' OR name LIKE '%Tarkwa%' THEN
      'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800&h=600&fit=crop'
    WHEN name LIKE '%Cozy%' OR name LIKE '%Cottage%' THEN
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&h=600&fit=crop'
    WHEN name LIKE '%Studio%' THEN
      'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=800&h=600&fit=crop'
    WHEN name LIKE '%Villa%' OR name LIKE '%Ikoyi%' THEN
      'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800&h=600&fit=crop'
    WHEN name LIKE '%Victoria Island%' THEN
      'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&h=600&fit=crop'
    WHEN name LIKE '%Lekki%' THEN
      'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800&h=600&fit=crop'
    ELSE
      'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop'
  END
WHERE is_shortlet = true AND (images IS NULL OR array_length(images, 1) IS NULL);

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Dummy data populated successfully!';
  RAISE NOTICE '   - Properties: %', (SELECT COUNT(*) FROM public.properties WHERE is_shortlet = true);
  RAISE NOTICE '   - Listings: %', (SELECT COUNT(*) FROM public.listings);
  RAISE NOTICE '   - Bookings: %', (SELECT COUNT(*) FROM public.bookings);
  RAISE NOTICE '   - Reviews: %', (SELECT COUNT(*) FROM public.reviews);
  RAISE NOTICE '   - Wallets: %', (SELECT COUNT(*) FROM public.wallets);
END $$;

