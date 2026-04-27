-- Enhanced Calendar & Pricing System
-- Adds dynamic pricing, recurring patterns, and channel manager support

-- Add pricing columns to listing_availabilities
ALTER TABLE listing_availabilities
ADD COLUMN IF NOT EXISTS price_override NUMERIC(12,2),
ADD COLUMN IF NOT EXISTS min_nights INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS max_nights INTEGER,
ADD COLUMN IF NOT EXISTS checkin_days INTEGER[], -- Days of week allowed for checkin (0=Sunday, 6=Saturday)
ADD COLUMN IF NOT EXISTS checkout_days INTEGER[]; -- Days of week allowed for checkout

-- Create dynamic pricing table (per-date pricing)
CREATE TABLE IF NOT EXISTS listing_pricing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  price NUMERIC(12,2) NOT NULL,
  min_nights INTEGER DEFAULT 1,
  max_nights INTEGER,
  available BOOLEAN DEFAULT TRUE,
  source TEXT DEFAULT 'manual', -- 'manual', 'channel_manager', 'pricing_rule'
  source_id TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(listing_id, date)
);

-- Create recurring availability patterns
CREATE TABLE IF NOT EXISTS recurring_availability_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  pattern_type TEXT NOT NULL, -- 'weekly', 'monthly', 'custom'
  pattern_config JSONB NOT NULL, -- Pattern configuration
  start_date DATE NOT NULL,
  end_date DATE, -- NULL means ongoing
  available BOOLEAN DEFAULT TRUE,
  price_override NUMERIC(12,2),
  min_nights INTEGER DEFAULT 1,
  max_nights INTEGER,
  checkin_days INTEGER[],
  checkout_days INTEGER[],
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create channel manager integrations table
CREATE TABLE IF NOT EXISTS channel_manager_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  channel_name TEXT NOT NULL, -- 'airbnb', 'booking_com', 'expedia', 'custom'
  channel_listing_id TEXT NOT NULL, -- External listing ID
  sync_enabled BOOLEAN DEFAULT TRUE,
  sync_direction TEXT DEFAULT 'bidirectional', -- 'to_channel', 'from_channel', 'bidirectional'
  last_sync_at TIMESTAMP WITH TIME ZONE,
  sync_status TEXT DEFAULT 'active', -- 'active', 'paused', 'error'
  credentials JSONB, -- Encrypted channel credentials
  settings JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(listing_id, channel_name, channel_listing_id)
);

-- Create channel sync logs
CREATE TABLE IF NOT EXISTS channel_sync_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_id UUID NOT NULL REFERENCES channel_manager_integrations(id) ON DELETE CASCADE,
  sync_type TEXT NOT NULL, -- 'availability', 'pricing', 'booking', 'full'
  direction TEXT NOT NULL, -- 'to_channel', 'from_channel'
  status TEXT NOT NULL, -- 'success', 'failed', 'partial'
  items_synced INTEGER DEFAULT 0,
  items_failed INTEGER DEFAULT 0,
  error_message TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create pricing rules table (for dynamic pricing strategies)
CREATE TABLE IF NOT EXISTS pricing_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  rule_name TEXT NOT NULL,
  rule_type TEXT NOT NULL, -- 'seasonal', 'demand', 'day_of_week', 'advance_booking', 'length_of_stay'
  rule_config JSONB NOT NULL, -- Rule-specific configuration
  priority INTEGER DEFAULT 0, -- Higher priority rules apply first
  active BOOLEAN DEFAULT TRUE,
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_listing_pricing_listing_date ON listing_pricing(listing_id, date);
CREATE INDEX IF NOT EXISTS idx_listing_pricing_date ON listing_pricing(date);
CREATE INDEX IF NOT EXISTS idx_recurring_patterns_listing ON recurring_availability_patterns(listing_id, active);
CREATE INDEX IF NOT EXISTS idx_channel_integrations_listing ON channel_manager_integrations(listing_id, sync_enabled);
CREATE INDEX IF NOT EXISTS idx_channel_sync_logs_integration ON channel_sync_logs(integration_id, created_at);
CREATE INDEX IF NOT EXISTS idx_pricing_rules_listing ON pricing_rules(listing_id, active);

-- Function to apply recurring patterns to calendar
CREATE OR REPLACE FUNCTION apply_recurring_patterns()
RETURNS TRIGGER AS $$
BEGIN
  -- This will be called to generate availability from patterns
  -- Implementation can be done in application layer for flexibility
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- RLS Policies
ALTER TABLE listing_pricing ENABLE ROW LEVEL SECURITY;
ALTER TABLE recurring_availability_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE channel_manager_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE channel_sync_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE pricing_rules ENABLE ROW LEVEL SECURITY;

-- RLS: Owners can manage their own listings' pricing and patterns
-- Drop existing policies if they exist (idempotent)
DROP POLICY IF EXISTS "Owners can manage pricing" ON listing_pricing;
DROP POLICY IF EXISTS "Owners can manage patterns" ON recurring_availability_patterns;
DROP POLICY IF EXISTS "Owners can manage channel integrations" ON channel_manager_integrations;
DROP POLICY IF EXISTS "Owners can view sync logs" ON channel_sync_logs;
DROP POLICY IF EXISTS "Owners can manage pricing rules" ON pricing_rules;

-- Create policies
-- For INSERT, UPDATE, DELETE operations, we need both USING and WITH CHECK
CREATE POLICY "Owners can manage pricing" ON listing_pricing
  FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM listings l
      JOIN properties p ON l.property_id = p.id
      WHERE l.id = listing_pricing.listing_id
      AND p.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM listings l
      JOIN properties p ON l.property_id = p.id
      WHERE l.id = listing_pricing.listing_id
      AND p.owner_id = auth.uid()
    )
  );

CREATE POLICY "Owners can manage patterns" ON recurring_availability_patterns
  FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM listings l
      JOIN properties p ON l.property_id = p.id
      WHERE l.id = recurring_availability_patterns.listing_id
      AND p.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM listings l
      JOIN properties p ON l.property_id = p.id
      WHERE l.id = recurring_availability_patterns.listing_id
      AND p.owner_id = auth.uid()
    )
  );

CREATE POLICY "Owners can manage channel integrations" ON channel_manager_integrations
  FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM listings l
      JOIN properties p ON l.property_id = p.id
      WHERE l.id = channel_manager_integrations.listing_id
      AND p.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM listings l
      JOIN properties p ON l.property_id = p.id
      WHERE l.id = channel_manager_integrations.listing_id
      AND p.owner_id = auth.uid()
    )
  );

CREATE POLICY "Owners can view sync logs" ON channel_sync_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM channel_manager_integrations ci
      JOIN listings l ON ci.listing_id = l.id
      JOIN properties p ON l.property_id = p.id
      WHERE ci.id = channel_sync_logs.integration_id
      AND p.owner_id = auth.uid()
    )
  );

CREATE POLICY "Owners can manage pricing rules" ON pricing_rules
  FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM listings l
      JOIN properties p ON l.property_id = p.id
      WHERE l.id = pricing_rules.listing_id
      AND p.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM listings l
      JOIN properties p ON l.property_id = p.id
      WHERE l.id = pricing_rules.listing_id
      AND p.owner_id = auth.uid()
    )
  );

-- Owner read policies: Owners can view their own listings' data (even if inactive)
-- Drop existing owner read policies if they exist
DROP POLICY IF EXISTS "Owners can view their own pricing" ON listing_pricing;
DROP POLICY IF EXISTS "Owners can view their own patterns" ON recurring_availability_patterns;
DROP POLICY IF EXISTS "Owners can view their own pricing rules" ON pricing_rules;

-- Owners can view pricing for their own listings (includes inactive listings)
CREATE POLICY "Owners can view their own pricing" ON listing_pricing
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM listings l
      JOIN properties p ON l.property_id = p.id
      WHERE l.id = listing_pricing.listing_id
      AND p.owner_id = auth.uid()
    )
  );

-- Owners can view patterns for their own listings (includes inactive listings)
CREATE POLICY "Owners can view their own patterns" ON recurring_availability_patterns
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM listings l
      JOIN properties p ON l.property_id = p.id
      WHERE l.id = recurring_availability_patterns.listing_id
      AND p.owner_id = auth.uid()
    )
  );

-- Owners can view pricing rules for their own listings (includes inactive listings)
CREATE POLICY "Owners can view their own pricing rules" ON pricing_rules
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM listings l
      JOIN properties p ON l.property_id = p.id
      WHERE l.id = pricing_rules.listing_id
      AND p.owner_id = auth.uid()
    )
  );

-- Public read policies for calendar view (guests need to see pricing and availability)
-- Only for active listings, and only for non-owners (to prevent owners from seeing other owners' data)
-- Drop existing public policies if they exist
DROP POLICY IF EXISTS "Public can view pricing for active listings" ON listing_pricing;
DROP POLICY IF EXISTS "Public can view patterns for active listings" ON recurring_availability_patterns;
DROP POLICY IF EXISTS "Public can view pricing rules for active listings" ON pricing_rules;

-- Public can view pricing for active listings
-- IMPORTANT: This policy ONLY applies to:
--   1. Unauthenticated users (public access)
--   2. Authenticated users who do NOT own any properties
-- Authenticated property owners can ONLY access their own listings via owner policies
CREATE POLICY "Public can view pricing for active listings" ON listing_pricing
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM listings l
      WHERE l.id = listing_pricing.listing_id
      AND l.active = TRUE
      -- Only allow if user is unauthenticated OR doesn't own any properties
      -- This prevents property owners from viewing other owners' listings
      AND (
        auth.uid() IS NULL 
        OR NOT EXISTS (
          SELECT 1 FROM properties
          WHERE owner_id = auth.uid()
        )
      )
    )
  );

-- Public can view patterns for active listings
-- IMPORTANT: Authenticated property owners can ONLY access their own listings via owner policies
CREATE POLICY "Public can view patterns for active listings" ON recurring_availability_patterns
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM listings l
      WHERE l.id = recurring_availability_patterns.listing_id
      AND l.active = TRUE
      AND recurring_availability_patterns.active = TRUE
      -- Only allow if user is unauthenticated OR doesn't own any properties
      AND (
        auth.uid() IS NULL 
        OR NOT EXISTS (
          SELECT 1 FROM properties
          WHERE owner_id = auth.uid()
        )
      )
    )
  );

-- Public can view pricing rules for active listings
-- IMPORTANT: Authenticated property owners can ONLY access their own listings via owner policies
CREATE POLICY "Public can view pricing rules for active listings" ON pricing_rules
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM listings l
      WHERE l.id = pricing_rules.listing_id
      AND l.active = TRUE
      AND pricing_rules.active = TRUE
      -- Only allow if user is unauthenticated OR doesn't own any properties
      AND (
        auth.uid() IS NULL 
        OR NOT EXISTS (
          SELECT 1 FROM properties
          WHERE owner_id = auth.uid()
        )
      )
    )
  );
