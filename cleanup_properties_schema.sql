-- Cleanup Properties Table Schema
-- This script optimizes the properties table by removing duplicates and fixing data types

-- 1. Remove duplicate columns (keep the ones the app expects)
DO $$ 
BEGIN
  -- Remove duplicate square_feet column (keep squareFeet)
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'square_feet') THEN
    ALTER TABLE properties DROP COLUMN square_feet;
    RAISE NOTICE 'Dropped duplicate square_feet column, keeping squareFeet';
  END IF;
  
  -- Remove duplicate property_type column (keep type)
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'property_type') THEN
    ALTER TABLE properties DROP COLUMN property_type;
    RAISE NOTICE 'Dropped duplicate property_type column, keeping type';
  END IF;
  
  -- Remove duplicate city and state columns (keep location)
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'city') THEN
    ALTER TABLE properties DROP COLUMN city;
    RAISE NOTICE 'Dropped duplicate city column, keeping location';
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'state') THEN
    ALTER TABLE properties DROP COLUMN state;
    RAISE NOTICE 'Dropped duplicate state column, keeping location';
  END IF;
END $$;

-- 2. Fix data types to match application expectations
DO $$ 
BEGIN
  -- Convert bedrooms from integer to text (app expects text)
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'bedrooms' AND data_type = 'integer') THEN
    ALTER TABLE properties ALTER COLUMN bedrooms TYPE TEXT;
    RAISE NOTICE 'Converted bedrooms column to TEXT type';
  END IF;
  
  -- Convert bathrooms from integer to text (app expects text)
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'bathrooms' AND data_type = 'integer') THEN
    ALTER TABLE properties ALTER COLUMN bathrooms TYPE TEXT;
    RAISE NOTICE 'Converted bathrooms column to TEXT type';
  END IF;
  
  -- Convert price from numeric to text (app expects text)
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'price' AND data_type = 'numeric') THEN
    ALTER TABLE properties ALTER COLUMN price TYPE TEXT;
    RAISE NOTICE 'Converted price column to TEXT type';
  END IF;
  
  -- Convert latitude from numeric to double precision
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'latitude' AND data_type = 'numeric') THEN
    ALTER TABLE properties ALTER COLUMN latitude TYPE DOUBLE PRECISION;
    RAISE NOTICE 'Converted latitude column to DOUBLE PRECISION type';
  END IF;
  
  -- Convert longitude from numeric to double precision
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'longitude' AND data_type = 'numeric') THEN
    ALTER TABLE properties ALTER COLUMN longitude TYPE DOUBLE PRECISION;
    RAISE NOTICE 'Converted longitude column to DOUBLE PRECISION type';
  END IF;
  
  -- Convert agent_commission_rate from numeric to double precision
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'agent_commission_rate' AND data_type = 'numeric') THEN
    ALTER TABLE properties ALTER COLUMN agent_commission_rate TYPE DOUBLE PRECISION;
    RAISE NOTICE 'Converted agent_commission_rate column to DOUBLE PRECISION type';
  END IF;
END $$;

-- 3. Add missing columns if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'bedrooms') THEN
    ALTER TABLE properties ADD COLUMN bedrooms TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'bathrooms') THEN
    ALTER TABLE properties ADD COLUMN bathrooms TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'squareFeet') THEN
    ALTER TABLE properties ADD COLUMN "squareFeet" TEXT;
  END IF;
END $$;

-- 4. Ensure proper constraints
ALTER TABLE properties ALTER COLUMN name SET NOT NULL;
ALTER TABLE properties ALTER COLUMN location SET NOT NULL;

-- 5. Set default values for status
ALTER TABLE properties ALTER COLUMN status SET DEFAULT 'available';

-- 6. Create proper indexes
CREATE INDEX IF NOT EXISTS idx_properties_owner_id ON properties(owner_id);
CREATE INDEX IF NOT EXISTS idx_properties_status ON properties(status);
CREATE INDEX IF NOT EXISTS idx_properties_name ON properties(name);
CREATE INDEX IF NOT EXISTS idx_properties_location ON properties(location);

-- 7. Ensure RLS is enabled and policies exist
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own properties" ON properties;
DROP POLICY IF EXISTS "Users can insert their own properties" ON properties;
DROP POLICY IF EXISTS "Users can update their own properties" ON properties;
DROP POLICY IF EXISTS "Users can delete their own properties" ON properties;
DROP POLICY IF EXISTS "Enable read access for all users" ON properties;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON properties;
DROP POLICY IF EXISTS "Enable update for owners" ON properties;
DROP POLICY IF EXISTS "Enable delete for owners" ON properties;

-- Create new policies
CREATE POLICY "Enable read access for all users" ON properties FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users" ON properties FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable update for owners" ON properties FOR UPDATE USING (auth.uid() = owner_id);
CREATE POLICY "Enable delete for owners" ON properties FOR DELETE USING (auth.uid() = owner_id);

-- 8. Create or replace the update trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS update_properties_updated_at ON properties;
CREATE TRIGGER update_properties_updated_at
    BEFORE UPDATE ON properties
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 9. Show final schema
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'properties' 
ORDER BY ordinal_position;
