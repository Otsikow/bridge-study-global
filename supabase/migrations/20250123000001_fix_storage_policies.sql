-- Fix storage policies for better upload reliability
-- Drop existing policies and recreate them with better error handling

-- Drop existing policies for student-documents
DROP POLICY IF EXISTS "Students can upload their own documents" ON storage.objects;
DROP POLICY IF EXISTS "Students can view their own documents" ON storage.objects;
DROP POLICY IF EXISTS "Students can delete their own documents" ON storage.objects;
DROP POLICY IF EXISTS "Staff can view all student documents" ON storage.objects;
DROP POLICY IF EXISTS "Staff can manage all student documents" ON storage.objects;

-- Recreate policies with better structure
CREATE POLICY "Students can upload their own documents"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'student-documents' AND
  auth.uid() IS NOT NULL AND
  (storage.foldername(name))[1] IN (
    SELECT id::text FROM students WHERE profile_id = auth.uid()
  )
);

CREATE POLICY "Students can view their own documents"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'student-documents' AND
  auth.uid() IS NOT NULL AND
  (storage.foldername(name))[1] IN (
    SELECT id::text FROM students WHERE profile_id = auth.uid()
  )
);

CREATE POLICY "Students can delete their own documents"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'student-documents' AND
  auth.uid() IS NOT NULL AND
  (storage.foldername(name))[1] IN (
    SELECT id::text FROM students WHERE profile_id = auth.uid()
  )
);

CREATE POLICY "Staff can view all student documents"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'student-documents' AND
  is_admin_or_staff(auth.uid())
);

CREATE POLICY "Staff can manage all student documents"
ON storage.objects
FOR ALL
TO authenticated
USING (
  bucket_id = 'student-documents' AND
  is_admin_or_staff(auth.uid())
);

-- Also fix public bucket policies for chat attachments
DROP POLICY IF EXISTS "Anyone can upload to public bucket" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view public bucket files" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can update their own files in public bucket" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can delete their own files in public bucket" ON storage.objects;

CREATE POLICY "Authenticated users can upload to public bucket"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'public');

CREATE POLICY "Anyone can view public bucket files"
ON storage.objects
FOR SELECT
USING (bucket_id = 'public');

CREATE POLICY "Authenticated users can update their own files in public bucket"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'public' AND 
  auth.uid() IS NOT NULL AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Authenticated users can delete their own files in public bucket"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'public' AND 
  auth.uid() IS NOT NULL AND
  (storage.foldername(name))[1] = auth.uid()::text
);