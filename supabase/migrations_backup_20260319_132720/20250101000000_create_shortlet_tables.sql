-- Short-Let System Database Schema
-- Phase 1: Core tables for short-letting functionality

-- Extend properties table with short-let flag
ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS is_shortlet BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS shortlet_details JSONB;

-- Create listings table (a property may have multiple listings)
CREATE TABLE IF NOT EXISTS listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
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

-- Create listing availabilities table
CREATE TABLE IF NOT EXISTS listing_availabilities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  available BOOLEAN DEFAULT TRUE,
  source TEXT DEFAULT 'manual', -- 'manual', 'external', 'blocked'
  source_id TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT valid_date_range CHECK (end_date >= start_date)
);

-- Create bookings table
CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE RESTRICT,
  guest_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'confirmed', 'cancelled', 'completed', 'refunded'
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

-- Create transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  amount NUMERIC(12,2) NOT NULL,
  type TEXT NOT NULL, -- 'charge', 'refund', 'payout', 'deposit', 'commission'
  provider TEXT DEFAULT 'paystack', -- 'paystack', 'flutterwave', etc.
  provider_ref TEXT,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'success', 'failed', 'refunded'
  description TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT valid_transaction_type CHECK (type IN ('charge', 'refund', 'payout', 'deposit', 'commission')),
  CONSTRAINT valid_transaction_status CHECK (status IN ('pending', 'success', 'failed', 'refunded'))
);

-- Create wallets table
CREATE TABLE IF NOT EXISTS wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  balance NUMERIC(14,2) DEFAULT 0 CHECK (balance >= 0),
  pending_balance NUMERIC(14,2) DEFAULT 0 CHECK (pending_balance >= 0),
  total_earned NUMERIC(14,2) DEFAULT 0,
  total_paid_out NUMERIC(14,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create guest documents table
CREATE TABLE IF NOT EXISTS guest_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL, -- 'id_card', 'passport', 'drivers_license', 'other'
  document_url TEXT NOT NULL,
  verified BOOLEAN DEFAULT FALSE,
  verified_by UUID REFERENCES auth.users(id),
  verified_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create reviews table
CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL UNIQUE REFERENCES bookings(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  reviewee_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  review_type TEXT NOT NULL DEFAULT 'guest', -- 'guest' (guest reviews property/owner), 'owner' (owner reviews guest)
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  response TEXT, -- owner/guest response to review
  response_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT valid_review_type CHECK (review_type IN ('guest', 'owner'))
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_listings_property_id ON listings(property_id);
CREATE INDEX IF NOT EXISTS idx_listings_active ON listings(active) WHERE active = TRUE;
CREATE INDEX IF NOT EXISTS idx_availabilities_listing_id ON listing_availabilities(listing_id);
CREATE INDEX IF NOT EXISTS idx_availabilities_dates ON listing_availabilities(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_availabilities_available ON listing_availabilities(available) WHERE available = TRUE;
CREATE INDEX IF NOT EXISTS idx_bookings_listing_id ON bookings(listing_id);
CREATE INDEX IF NOT EXISTS idx_bookings_guest_id ON bookings(guest_id);
CREATE INDEX IF NOT EXISTS idx_bookings_owner_id ON bookings(owner_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_dates ON bookings(checkin_date, checkout_date);
CREATE INDEX IF NOT EXISTS idx_transactions_booking_id ON transactions(booking_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_wallets_user_id ON wallets(user_id);
CREATE INDEX IF NOT EXISTS idx_guest_documents_booking_id ON guest_documents(booking_id);
CREATE INDEX IF NOT EXISTS idx_reviews_booking_id ON reviews(booking_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers
CREATE TRIGGER update_listings_updated_at BEFORE UPDATE ON listings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_listing_availabilities_updated_at BEFORE UPDATE ON listing_availabilities
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON transactions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_wallets_updated_at BEFORE UPDATE ON wallets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_guest_documents_updated_at BEFORE UPDATE ON guest_documents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON reviews
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE listing_availabilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE guest_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- RLS Policies will be added in a separate migration file for better organization
-- Basic policies: owners can manage their listings/bookings, guests can view their bookings

COMMENT ON TABLE listings IS 'Short-let listings - a property can have multiple listings (e.g., whole apartment vs single room)';
COMMENT ON TABLE listing_availabilities IS 'Calendar availability and blocked dates for listings';
COMMENT ON TABLE bookings IS 'Guest bookings for short-let listings';
COMMENT ON TABLE transactions IS 'Payment transactions (charges, refunds, payouts)';
COMMENT ON TABLE wallets IS 'Owner/agent wallets for holding earnings before payout';
COMMENT ON TABLE guest_documents IS 'Guest verification documents (ID, passport, etc.)';
COMMENT ON TABLE reviews IS 'Reviews and ratings for bookings';

