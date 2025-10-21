-- Create storage bucket for student documents
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'student-documents',
  'student-documents',
  false,
  10485760,
  ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/jpg', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for student documents
CREATE POLICY "Students can upload their own documents"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'student-documents' AND
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