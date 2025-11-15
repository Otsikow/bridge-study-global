-- Ensure Zoe chat uploads bucket exists for attachments shared in conversations
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'chat-uploads',
  'chat-uploads',
  true,
  10485760, -- 10MB file size limit aligned with client validation
  ARRAY[
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'text/plain',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Authenticated users can upload files into their user-specific folder
CREATE POLICY IF NOT EXISTS "Zoe chat uploads insert"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'chat-uploads'
  AND auth.uid() IS NOT NULL
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow reading attachments so Zoe can fetch public URLs
CREATE POLICY IF NOT EXISTS "Zoe chat uploads select"
ON storage.objects
FOR SELECT
USING (bucket_id = 'chat-uploads');

-- Users can update or delete only their own uploads
CREATE POLICY IF NOT EXISTS "Zoe chat uploads update"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'chat-uploads'
  AND auth.uid() IS NOT NULL
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY IF NOT EXISTS "Zoe chat uploads delete"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'chat-uploads'
  AND auth.uid() IS NOT NULL
  AND (storage.foldername(name))[1] = auth.uid()::text
);
