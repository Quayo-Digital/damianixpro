-- Fix Property Images
-- This script updates the imageUrl field from the images array for existing properties

-- Update imageUrl from the first image in the images array
UPDATE public.properties
SET "imageUrl" = CASE 
  WHEN images IS NOT NULL AND array_length(images, 1) > 0 THEN
    images[1]  -- PostgreSQL arrays are 1-indexed
  WHEN "imageUrl" IS NULL OR "imageUrl" = '' THEN
    CASE 
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
  ELSE
    "imageUrl"  -- Keep existing imageUrl if it exists
END
WHERE is_shortlet = true;

-- Also ensure images array has at least one image if it's empty
UPDATE public.properties
SET images = CASE 
  WHEN images IS NULL OR array_length(images, 1) IS NULL THEN
    ARRAY[COALESCE("imageUrl", 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop')]
  ELSE
    images
END
WHERE is_shortlet = true;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Property images updated!';
  RAISE NOTICE '   - Properties with imageUrl: %', (SELECT COUNT(*) FROM public.properties WHERE is_shortlet = true AND "imageUrl" IS NOT NULL AND "imageUrl" != '');
  RAISE NOTICE '   - Properties with images array: %', (SELECT COUNT(*) FROM public.properties WHERE is_shortlet = true AND images IS NOT NULL AND array_length(images, 1) > 0);
END $$;

