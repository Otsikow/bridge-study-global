-- Fix chat upload storage policies to accept folder structure chat-uploads/<user_id>/...
DROP POLICY IF EXISTS "Authenticated users can upload chat files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own chat uploads" ON storage.objects;

CREATE POLICY "Authenticated users can upload chat files"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'public'
  AND split_part(name, '/', 1) = 'chat-uploads'
  AND split_part(name, '/', 2) = auth.uid()::text
);

CREATE POLICY "Users can delete their own chat uploads"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'public'
  AND split_part(name, '/', 1) = 'chat-uploads'
  AND split_part(name, '/', 2) = auth.uid()::text
);
