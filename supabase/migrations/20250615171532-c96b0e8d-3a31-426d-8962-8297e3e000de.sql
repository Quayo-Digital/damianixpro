
-- Create a new storage bucket for property images if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('property-images', 'property-images', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access to images
CREATE POLICY "Public read access for property images"
  ON storage.objects FOR SELECT
  USING ( bucket_id = 'property-images' );

-- Allow authenticated users to upload images
CREATE POLICY "Authenticated users can upload property images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK ( bucket_id = 'property-images' );

-- Allow owners to update their images
CREATE POLICY "Users can update their own property images"
  ON storage.objects FOR UPDATE
  USING ( auth.uid() = owner )
  WITH CHECK ( bucket_id = 'property-images' );

-- Allow owners to delete their own property images
CREATE POLICY "Users can delete their own property images"
  ON storage.objects FOR DELETE
  USING ( auth.uid() = owner );
