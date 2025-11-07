-- Align Zoe chat upload storage policies with the chat-uploads/<user_id>/... folder structure
DROP POLICY IF EXISTS "Authenticated users can upload chat files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own chat uploads" ON storage.objects;

CREATE POLICY "Authenticated users can upload chat files"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'public'
  AND auth.role() = 'authenticated'
  AND auth.uid() IS NOT NULL
  AND name LIKE 'chat-uploads/' || auth.uid()::text || '/%'
);

CREATE POLICY "Users can delete their own chat uploads"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'public'
  AND auth.role() = 'authenticated'
  AND auth.uid() IS NOT NULL
  AND name LIKE 'chat-uploads/' || auth.uid()::text || '/%'
);
