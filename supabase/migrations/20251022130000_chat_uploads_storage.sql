-- Create storage bucket for AI chat file uploads
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'public',
  'public',
  true,
  10485760, -- 10MB limit
  ARRAY[
    'image/jpeg', 
    'image/png', 
    'image/jpg', 
    'image/gif',
    'image/webp',
    'application/pdf', 
    'application/msword', 
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Storage policies for chat uploads
CREATE POLICY IF NOT EXISTS "Authenticated users can upload chat files"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'public' AND
  (storage.foldername(name))[1] = 'chat-uploads' AND
  (storage.foldername(name))[2] = auth.uid()::text
);

CREATE POLICY IF NOT EXISTS "Anyone can view public chat files"
ON storage.objects
FOR SELECT
USING (bucket_id = 'public');

CREATE POLICY IF NOT EXISTS "Users can delete their own chat uploads"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'public' AND
  (storage.foldername(name))[1] = 'chat-uploads' AND
  (storage.foldername(name))[2] = auth.uid()::text
);
