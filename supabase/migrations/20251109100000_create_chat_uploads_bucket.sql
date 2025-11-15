-- Dedicated bucket for Zoe chat attachments so users can share documents with the assistant
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'chat-uploads',
  'chat-uploads',
  true,
  10485760, -- 10MB limit matches client validation
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

-- Allow authenticated users to upload into their own folder
CREATE POLICY IF NOT EXISTS "Zoe chat uploads insert"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'chat-uploads'
  AND auth.uid() IS NOT NULL
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Provide read access so Zoe can fetch attachments via the generated public URL
CREATE POLICY IF NOT EXISTS "Zoe chat uploads select"
ON storage.objects
FOR SELECT
USING (bucket_id = 'chat-uploads');

-- Allow users to update or delete only their own files
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
