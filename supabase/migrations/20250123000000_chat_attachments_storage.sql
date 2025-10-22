-- Create storage bucket for chat attachments
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'public', 
  'public', 
  true, 
  10485760, -- 10MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf', 'text/plain', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
);

-- Storage policies for public bucket (chat attachments)
CREATE POLICY "Anyone can upload to public bucket"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'public');

CREATE POLICY "Anyone can view public bucket files"
ON storage.objects
FOR SELECT
USING (bucket_id = 'public');

CREATE POLICY "Anyone can update their own files in public bucket"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'public' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Anyone can delete their own files in public bucket"
ON storage.objects
FOR DELETE
USING (bucket_id = 'public' AND auth.uid()::text = (storage.foldername(name))[1]);