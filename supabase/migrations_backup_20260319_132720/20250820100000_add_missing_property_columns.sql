-- Add missing property columns for enhanced property management
-- These columns are used by the Add Property form but don't exist in the current schema

ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS area_sqm DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS parking_spaces INTEGER,
ADD COLUMN IF NOT EXISTS year_built INTEGER,
ADD COLUMN IF NOT EXISTS security_deposit DECIMAL(15,2),
ADD COLUMN IF NOT EXISTS service_charge DECIMAL(15,2),
ADD COLUMN IF NOT EXISTS amenities TEXT[] DEFAULT '{}';

-- Add comments for documentation
COMMENT ON COLUMN properties.area_sqm IS 'Property area in square meters';
COMMENT ON COLUMN properties.parking_spaces IS 'Number of parking spaces available';
COMMENT ON COLUMN properties.year_built IS 'Year the property was constructed';
COMMENT ON COLUMN properties.security_deposit IS 'Required security deposit amount';
COMMENT ON COLUMN properties.service_charge IS 'Monthly service charge amount';
COMMENT ON COLUMN properties.amenities IS 'Array of property amenities and features';

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_properties_area_sqm ON properties(area_sqm) WHERE area_sqm IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_properties_year_built ON properties(year_built) WHERE year_built IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_properties_amenities ON properties USING GIN(amenities);
