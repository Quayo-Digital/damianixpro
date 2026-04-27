-- Add basic property columns that are missing from the properties table
-- This migration adds the fundamental columns needed for property management

ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS city TEXT,
ADD COLUMN IF NOT EXISTS state TEXT DEFAULT 'Lagos',
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS property_type TEXT,
ADD COLUMN IF NOT EXISTS bedrooms INTEGER,
ADD COLUMN IF NOT EXISTS bathrooms INTEGER,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'available',
ADD COLUMN IF NOT EXISTS monthly_rent DECIMAL(15,2),
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS location TEXT;

-- Add the enhanced columns from the previous migration
ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS area_sqm DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS parking_spaces INTEGER,
ADD COLUMN IF NOT EXISTS year_built INTEGER,
ADD COLUMN IF NOT EXISTS security_deposit DECIMAL(15,2),
ADD COLUMN IF NOT EXISTS service_charge DECIMAL(15,2),
ADD COLUMN IF NOT EXISTS amenities TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS images TEXT[] DEFAULT '{}';

-- Add sales/lease integration columns
ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS transaction_type TEXT DEFAULT 'LEASE' CHECK (transaction_type IN ('SALE', 'LEASE')),
ADD COLUMN IF NOT EXISTS sale_price DECIMAL(15,2),
ADD COLUMN IF NOT EXISTS lease_price DECIMAL(15,2),
ADD COLUMN IF NOT EXISTS is_negotiable BOOLEAN DEFAULT true;

-- Add comments for documentation
COMMENT ON COLUMN properties.city IS 'Property city location';
COMMENT ON COLUMN properties.state IS 'Property state location';
COMMENT ON COLUMN properties.address IS 'Property street address';
COMMENT ON COLUMN properties.property_type IS 'Type of property (apartment, house, etc.)';
COMMENT ON COLUMN properties.bedrooms IS 'Number of bedrooms';
COMMENT ON COLUMN properties.bathrooms IS 'Number of bathrooms';
COMMENT ON COLUMN properties.amenities IS 'Array of property amenities and features';
COMMENT ON COLUMN properties.images IS 'Array of property image URLs';
COMMENT ON COLUMN properties.monthly_rent IS 'Monthly rental amount';
COMMENT ON COLUMN properties.description IS 'Property description';
COMMENT ON COLUMN properties.location IS 'General location description';

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_properties_city_state ON properties(city, state);
CREATE INDEX IF NOT EXISTS idx_properties_type_status ON properties(property_type, status);
CREATE INDEX IF NOT EXISTS idx_properties_price_range ON properties(monthly_rent, sale_price);
