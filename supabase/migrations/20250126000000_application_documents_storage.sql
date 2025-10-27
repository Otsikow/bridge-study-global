-- Create storage bucket for application documents
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'application-documents',
  'application-documents',
  false,
  10485760, -- 10MB limit
  ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/jpg', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Storage policies for application-documents bucket

-- Allow authenticated users to upload to their own application folders
CREATE POLICY "Users can upload application documents"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'application-documents' AND
  (storage.foldername(name))[1] IN (
    SELECT id::text FROM applications WHERE student_id IN (
      SELECT id FROM students WHERE profile_id = auth.uid()
    )
  )
);

-- Allow authenticated users to read their own application documents
CREATE POLICY "Users can read their application documents"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'application-documents' AND
  (
    -- Students can read their own documents
    (storage.foldername(name))[1] IN (
      SELECT id::text FROM applications WHERE student_id IN (
        SELECT id FROM students WHERE profile_id = auth.uid()
      )
    )
    OR
    -- Staff and admins can read all documents
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'staff', 'counselor', 'verifier')
    )
  )
);

-- Allow students to delete their own application documents (before submission)
CREATE POLICY "Users can delete their application documents"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'application-documents' AND
  (storage.foldername(name))[1] IN (
    SELECT id::text FROM applications 
    WHERE student_id IN (
      SELECT id FROM students WHERE profile_id = auth.uid()
    )
    AND status = 'draft' -- Only allow deletion for draft applications
  )
);

-- Allow staff to update document metadata
CREATE POLICY "Staff can update application documents"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'application-documents' AND
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role IN ('admin', 'staff', 'verifier')
  )
);
