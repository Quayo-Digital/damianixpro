-- Setup Image Storage Bucket for Property Images
-- This script creates the property-images storage bucket and policies

-- Create property-images storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('property-images', 'property-images', true, 104857600, ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'])
ON CONFLICT (id) DO NOTHING;

-- Storage policies for 'property-images' bucket
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

-- Property owners can manage images for their properties
CREATE POLICY "Property owners can manage property images" ON storage.objects
FOR ALL USING (
  bucket_id = 'property-images' AND 
  EXISTS (
    SELECT 1 FROM public.properties 
    WHERE id::text = (storage.foldername(name))[2] 
    AND owner_id = auth.uid()
  )
);
