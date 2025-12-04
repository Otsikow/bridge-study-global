-- ============================================================================
-- Add Partner Storage Access for Application Documents
-- ============================================================================
-- University partners need to be able to read application documents
-- for applications submitted to their programs
-- ============================================================================

-- Helper function to check if a storage path belongs to an application at partner's university
CREATE OR REPLACE FUNCTION public.storage_path_is_partner_application(path_name TEXT)
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.applications a
    JOIN public.programs p ON a.program_id = p.id
    JOIN public.universities u ON p.university_id = u.id
    WHERE a.id::text = (storage.foldername(path_name))[1]
      AND u.tenant_id = public.get_user_tenant(auth.uid())
      AND a.submitted_at IS NOT NULL
  );
$$;

COMMENT ON FUNCTION public.storage_path_is_partner_application(TEXT) IS 
  'Helper function to check if a storage path belongs to an application at a university in the partner''s tenant.';

GRANT EXECUTE ON FUNCTION public.storage_path_is_partner_application(TEXT) TO authenticated;

-- Drop existing policy if exists and recreate with partner access
DROP POLICY IF EXISTS "Partners can read application documents" ON storage.objects;

-- Allow university partners to read application documents for their programs
CREATE POLICY "Partners can read application documents"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'application-documents' AND
  public.has_role(auth.uid(), 'partner'::app_role) AND
  public.storage_path_is_partner_application(name)
);
