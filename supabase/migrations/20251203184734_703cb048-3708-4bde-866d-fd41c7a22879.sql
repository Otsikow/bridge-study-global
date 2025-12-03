-- Create university-media storage bucket for logos and hero images
INSERT INTO storage.buckets (id, name, public)
VALUES ('university-media', 'university-media', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload files to their tenant folder
CREATE POLICY "University partners can upload media"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'university-media' 
  AND auth.role() = 'authenticated'
);

-- Allow authenticated users to update their own files
CREATE POLICY "University partners can update their media"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'university-media' 
  AND auth.role() = 'authenticated'
);

-- Allow public read access for university branding assets
CREATE POLICY "Public can view university media"
ON storage.objects FOR SELECT
USING (bucket_id = 'university-media');

-- Allow authenticated users to delete their files
CREATE POLICY "University partners can delete their media"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'university-media' 
  AND auth.role() = 'authenticated'
);