-- Setup Property Images Storage Bucket
-- This script specifically creates the property-images bucket for image uploads

-- 1. Create property-images storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'property-images',
  'property-images',
  true,
  104857600, -- 100MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']
)
ON CONFLICT (id) DO NOTHING;

-- 2. Drop existing policies if they exist
DO $$ 
BEGIN
  -- Drop existing policies for property-images bucket
  DROP POLICY IF EXISTS "Users can upload property images" ON storage.objects;
  DROP POLICY IF EXISTS "Anyone can view property images" ON storage.objects;
  DROP POLICY IF EXISTS "Users can update their own property images" ON storage.objects;
  DROP POLICY IF EXISTS "Users can delete their own property images" ON storage.objects;
END $$;

-- 3. Create RLS policies for property-images bucket
CREATE POLICY "Users can upload property images" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'property-images' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Anyone can view property images" ON storage.objects
FOR SELECT USING (bucket_id = 'property-images');

CREATE POLICY "Users can update their own property images" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'property-images' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own property images" ON storage.objects
FOR DELETE USING (
  bucket_id = 'property-images' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- 4. Verify the bucket was created
SELECT id, name, public, file_size_limit, allowed_mime_types 
FROM storage.buckets 
WHERE id = 'property-images';
