-- ============================================================================
-- Fix Application Flow for Universities
-- ============================================================================
-- This migration fixes the end-to-end application flow by:
-- 1. Fixing RLS policy for partners to view only applications to their university
-- 2. Adding RLS policy for partners to view students who submitted to their programs
-- 3. Adding RLS policy for partners to view application documents
-- 4. Adding RLS policy for partners to update application status
-- ============================================================================

-- ============================================================================
-- STEP 1: Drop existing problematic policies
-- ============================================================================

-- Drop the overly broad partner applications policy
DROP POLICY IF EXISTS "Partners can view applications to their programs" ON public.applications;
DROP POLICY IF EXISTS "Partners can view applications to their university" ON public.applications;

-- Drop any existing partner policies on students/application_documents we'll recreate
DROP POLICY IF EXISTS "Partners can view students for their applications" ON public.students;
DROP POLICY IF EXISTS "Partners can view application documents" ON public.application_documents;
DROP POLICY IF EXISTS "Partners can update applications" ON public.applications;
DROP POLICY IF EXISTS "Partners can update their applications" ON public.applications;

-- ============================================================================
-- STEP 2: Create helper function to check if application belongs to partner's university
-- ============================================================================

CREATE OR REPLACE FUNCTION public.application_belongs_to_partner_university(app_program_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.programs p
    JOIN public.universities u ON p.university_id = u.id
    WHERE p.id = app_program_id
      AND u.tenant_id = public.get_user_tenant(auth.uid())
  );
$$;

COMMENT ON FUNCTION public.application_belongs_to_partner_university(UUID) IS 
  'Helper function to check if an application (via program_id) belongs to a university in the partner''s tenant.';

-- ============================================================================
-- STEP 3: Create proper RLS policy for partners to view applications
-- ============================================================================

-- Partners can only view applications to programs at their university
CREATE POLICY "Partners can view applications to their university programs"
  ON public.applications
  FOR SELECT
  USING (
    -- User must be a partner
    public.has_role(auth.uid(), 'partner'::app_role)
    -- Application must be for a program at their university
    AND public.application_belongs_to_partner_university(program_id)
    -- Only show submitted applications (not drafts)
    AND (submitted_at IS NOT NULL OR status != 'draft')
  );

-- ============================================================================
-- STEP 4: Create RLS policy for partners to update applications
-- ============================================================================

-- Partners can update applications to their university (change status, add notes, etc.)
CREATE POLICY "Partners can update applications to their university programs"
  ON public.applications
  FOR UPDATE
  USING (
    public.has_role(auth.uid(), 'partner'::app_role)
    AND public.application_belongs_to_partner_university(program_id)
    AND submitted_at IS NOT NULL
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'partner'::app_role)
    AND public.application_belongs_to_partner_university(program_id)
  );

-- ============================================================================
-- STEP 5: Create RLS policy for partners to view students for their applications
-- ============================================================================

-- Helper function to check if a student has submitted applications to partner's university
CREATE OR REPLACE FUNCTION public.student_has_application_to_partner_university(p_student_id UUID)
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
    WHERE a.student_id = p_student_id
      AND u.tenant_id = public.get_user_tenant(auth.uid())
      AND a.submitted_at IS NOT NULL
  );
$$;

COMMENT ON FUNCTION public.student_has_application_to_partner_university(UUID) IS 
  'Helper function to check if a student has submitted applications to a university in the partner''s tenant.';

-- Partners can view students who have submitted applications to their programs
CREATE POLICY "Partners can view students with applications to their university"
  ON public.students
  FOR SELECT
  USING (
    public.has_role(auth.uid(), 'partner'::app_role)
    AND public.student_has_application_to_partner_university(id)
  );

-- ============================================================================
-- STEP 6: Create RLS policy for partners to view application documents
-- ============================================================================

-- Helper function to check if an application document belongs to partner's university
CREATE OR REPLACE FUNCTION public.app_document_belongs_to_partner_university(p_application_id UUID)
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
    WHERE a.id = p_application_id
      AND u.tenant_id = public.get_user_tenant(auth.uid())
      AND a.submitted_at IS NOT NULL
  );
$$;

COMMENT ON FUNCTION public.app_document_belongs_to_partner_university(UUID) IS 
  'Helper function to check if an application document belongs to an application at a university in the partner''s tenant.';

-- Partners can view documents for applications to their university
CREATE POLICY "Partners can view application documents for their university"
  ON public.application_documents
  FOR SELECT
  USING (
    public.has_role(auth.uid(), 'partner'::app_role)
    AND public.app_document_belongs_to_partner_university(application_id)
  );

-- Partners can update document verification status
CREATE POLICY "Partners can update application documents for their university"
  ON public.application_documents
  FOR UPDATE
  USING (
    public.has_role(auth.uid(), 'partner'::app_role)
    AND public.app_document_belongs_to_partner_university(application_id)
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'partner'::app_role)
    AND public.app_document_belongs_to_partner_university(application_id)
  );

-- ============================================================================
-- STEP 7: Create RLS policy for partners to view profiles (for student names)
-- ============================================================================

-- Partners can view profiles for students who have applications to their university
CREATE OR REPLACE FUNCTION public.profile_has_application_to_partner_university(p_profile_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.students s
    JOIN public.applications a ON a.student_id = s.id
    JOIN public.programs p ON a.program_id = p.id
    JOIN public.universities u ON p.university_id = u.id
    WHERE s.profile_id = p_profile_id
      AND u.tenant_id = public.get_user_tenant(auth.uid())
      AND a.submitted_at IS NOT NULL
  );
$$;

COMMENT ON FUNCTION public.profile_has_application_to_partner_university(UUID) IS 
  'Helper function to check if a profile has a student with submitted applications to a university in the partner''s tenant.';

-- Drop existing policy if exists
DROP POLICY IF EXISTS "Partners can view profiles for their applicants" ON public.profiles;

-- Partners can view profiles for students who have applications to their university
CREATE POLICY "Partners can view profiles for their applicants"
  ON public.profiles
  FOR SELECT
  USING (
    public.has_role(auth.uid(), 'partner'::app_role)
    AND public.profile_has_application_to_partner_university(id)
  );

-- ============================================================================
-- STEP 8: Grant execute permissions
-- ============================================================================

GRANT EXECUTE ON FUNCTION public.application_belongs_to_partner_university(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.student_has_application_to_partner_university(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.app_document_belongs_to_partner_university(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.profile_has_application_to_partner_university(UUID) TO authenticated;

-- ============================================================================
-- STEP 9: Add indexes for performance
-- ============================================================================

-- Index for faster application queries by program_id and submitted_at
CREATE INDEX IF NOT EXISTS idx_applications_program_submitted 
  ON public.applications(program_id, submitted_at) 
  WHERE submitted_at IS NOT NULL;

-- Index for faster program university lookups
CREATE INDEX IF NOT EXISTS idx_programs_university_id 
  ON public.programs(university_id);

-- Index for faster university tenant lookups
CREATE INDEX IF NOT EXISTS idx_universities_tenant_id 
  ON public.universities(tenant_id);

-- ============================================================================
-- Comments
-- ============================================================================

COMMENT ON POLICY "Partners can view applications to their university programs" ON public.applications IS 
  'Allows university partners to view submitted applications to programs at their university.';

COMMENT ON POLICY "Partners can update applications to their university programs" ON public.applications IS 
  'Allows university partners to update applications (status, notes) for their programs.';

COMMENT ON POLICY "Partners can view students with applications to their university" ON public.students IS 
  'Allows university partners to view student data for students who have applied to their programs.';

COMMENT ON POLICY "Partners can view application documents for their university" ON public.application_documents IS 
  'Allows university partners to view documents attached to applications at their university.';

COMMENT ON POLICY "Partners can update application documents for their university" ON public.application_documents IS 
  'Allows university partners to verify/update documents for applications at their university.';
