-- ============================================================================
-- COMPLETE UNIVERSITY DATA ISOLATION
-- ============================================================================
-- This migration ensures each university operates in complete isolation:
-- 1. Universities can only update their own profiles
-- 2. Programs are strictly bound to their parent university
-- 3. Applications are visible only to the owning university
-- 4. Document requests are tenant-scoped
-- 5. Agents are managed per-tenant
--
-- Core principle: Every data row is associated with a tenant_id, and all
-- queries must be scoped by tenant to prevent cross-university data leakage.
-- ============================================================================

-- ============================================================================
-- STEP 1: Ensure unique constraint on universities.tenant_id exists
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'universities_tenant_id_unique'
      AND conrelid = 'public.universities'::regclass
  ) THEN
    ALTER TABLE public.universities
    ADD CONSTRAINT universities_tenant_id_unique UNIQUE (tenant_id);
    RAISE NOTICE 'Added unique constraint universities_tenant_id_unique';
  END IF;
END$$;

-- ============================================================================
-- STEP 2: Create helper function for strict tenant verification
-- ============================================================================

CREATE OR REPLACE FUNCTION public.verify_user_owns_tenant(
  p_user_id UUID,
  p_tenant_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
DECLARE
  v_user_tenant_id UUID;
BEGIN
  IF p_user_id IS NULL OR p_tenant_id IS NULL THEN
    RETURN FALSE;
  END IF;

  SELECT tenant_id INTO v_user_tenant_id
  FROM public.profiles
  WHERE id = p_user_id;

  RETURN v_user_tenant_id IS NOT NULL AND v_user_tenant_id = p_tenant_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.verify_user_owns_tenant(UUID, UUID) TO authenticated;

-- ============================================================================
-- STEP 3: Create function to get university_id for current user's tenant
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_user_university_id()
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
DECLARE
  v_tenant_id UUID;
  v_university_id UUID;
BEGIN
  -- Get the user's tenant_id
  SELECT tenant_id INTO v_tenant_id
  FROM public.profiles
  WHERE id = auth.uid();

  IF v_tenant_id IS NULL THEN
    RETURN NULL;
  END IF;

  -- Get the university for this tenant
  SELECT id INTO v_university_id
  FROM public.universities
  WHERE tenant_id = v_tenant_id
  LIMIT 1;

  RETURN v_university_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_user_university_id() TO authenticated;

-- ============================================================================
-- STEP 4: Create function to check if program belongs to user's university
-- ============================================================================

CREATE OR REPLACE FUNCTION public.program_belongs_to_user_university(p_program_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
DECLARE
  v_user_university_id UUID;
  v_program_university_id UUID;
BEGIN
  v_user_university_id := public.get_user_university_id();
  
  IF v_user_university_id IS NULL THEN
    RETURN FALSE;
  END IF;

  SELECT university_id INTO v_program_university_id
  FROM public.programs
  WHERE id = p_program_id;

  RETURN v_program_university_id IS NOT NULL 
    AND v_program_university_id = v_user_university_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.program_belongs_to_user_university(UUID) TO authenticated;

-- ============================================================================
-- STEP 5: Ensure programs table has proper constraints
-- ============================================================================

-- Add tenant_id column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'programs' 
      AND column_name = 'tenant_id'
  ) THEN
    ALTER TABLE public.programs ADD COLUMN tenant_id UUID REFERENCES public.tenants(id);
  END IF;
END$$;

-- Create index for faster tenant-scoped queries
CREATE INDEX IF NOT EXISTS idx_programs_tenant_id ON public.programs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_programs_university_id ON public.programs(university_id);
CREATE INDEX IF NOT EXISTS idx_programs_tenant_university ON public.programs(tenant_id, university_id);

-- ============================================================================
-- STEP 6: Trigger to auto-populate tenant_id on programs from university
-- ============================================================================

CREATE OR REPLACE FUNCTION public.sync_program_tenant_id()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_university_tenant_id UUID;
BEGIN
  -- Get the university's tenant_id
  SELECT tenant_id INTO v_university_tenant_id
  FROM public.universities
  WHERE id = NEW.university_id;

  -- Ensure the program's tenant_id matches the university's tenant_id
  IF NEW.tenant_id IS NULL THEN
    NEW.tenant_id := v_university_tenant_id;
  ELSIF NEW.tenant_id != v_university_tenant_id THEN
    RAISE EXCEPTION 'Program tenant_id must match the university tenant_id';
  END IF;

  RETURN NEW;
END;
$$;

-- Drop and recreate trigger
DROP TRIGGER IF EXISTS sync_program_tenant_id_trigger ON public.programs;
CREATE TRIGGER sync_program_tenant_id_trigger
  BEFORE INSERT OR UPDATE ON public.programs
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_program_tenant_id();

-- ============================================================================
-- STEP 7: Clean up and recreate university RLS policies
-- ============================================================================

-- Drop all existing university policies to start fresh
DROP POLICY IF EXISTS "Partners can create their university profile" ON public.universities;
DROP POLICY IF EXISTS "Partners can update their university profile" ON public.universities;
DROP POLICY IF EXISTS "partner_create_university" ON public.universities;
DROP POLICY IF EXISTS "partner_update_university" ON public.universities;
DROP POLICY IF EXISTS "Public can view active universities" ON public.universities;
DROP POLICY IF EXISTS "Anyone can view universities in their tenant" ON public.universities;
DROP POLICY IF EXISTS "Admins can manage universities" ON public.universities;

-- Enable RLS
ALTER TABLE public.universities ENABLE ROW LEVEL SECURITY;

-- SELECT: Public can view active universities (for student browsing)
-- OR users can see their own tenant's university
CREATE POLICY "university_select"
  ON public.universities FOR SELECT
  USING (
    active = true
    OR tenant_id = public.get_user_tenant(auth.uid())
    OR public.is_admin_or_staff(auth.uid())
  );

-- INSERT: Partners can create a university for their tenant
CREATE POLICY "university_insert"
  ON public.universities FOR INSERT
  TO authenticated
  WITH CHECK (
    public.get_user_role(auth.uid()) = 'partner'::public.app_role
    AND tenant_id = public.get_user_tenant(auth.uid())
  );

-- UPDATE: Partners can only update their own tenant's university
CREATE POLICY "university_update"
  ON public.universities FOR UPDATE
  TO authenticated
  USING (
    public.get_user_role(auth.uid()) = 'partner'::public.app_role
    AND tenant_id = public.get_user_tenant(auth.uid())
  )
  WITH CHECK (
    public.get_user_role(auth.uid()) = 'partner'::public.app_role
    AND tenant_id = public.get_user_tenant(auth.uid())
  );

-- DELETE: Only admins can delete universities
CREATE POLICY "university_delete"
  ON public.universities FOR DELETE
  TO authenticated
  USING (
    public.is_admin_or_staff(auth.uid())
  );

-- Admin full access
CREATE POLICY "university_admin_all"
  ON public.universities FOR ALL
  TO authenticated
  USING (
    public.is_admin_or_staff(auth.uid())
  )
  WITH CHECK (
    public.is_admin_or_staff(auth.uid())
  );

-- ============================================================================
-- STEP 8: Clean up and recreate programs RLS policies
-- ============================================================================

-- Drop all existing program policies
DROP POLICY IF EXISTS "partner_insert_programs" ON public.programs;
DROP POLICY IF EXISTS "partner_update_programs" ON public.programs;
DROP POLICY IF EXISTS "partner_delete_programs" ON public.programs;
DROP POLICY IF EXISTS "partner_select_all_programs" ON public.programs;
DROP POLICY IF EXISTS "Partners can create programs for their university" ON public.programs;
DROP POLICY IF EXISTS "Partners can update their university programs" ON public.programs;
DROP POLICY IF EXISTS "Partners can delete their university programs" ON public.programs;
DROP POLICY IF EXISTS "Partners can view all programs in their tenant" ON public.programs;
DROP POLICY IF EXISTS "Anyone can view active programs in their tenant" ON public.programs;
DROP POLICY IF EXISTS "Admins can manage programs" ON public.programs;

-- Enable RLS
ALTER TABLE public.programs ENABLE ROW LEVEL SECURITY;

-- SELECT: Public can view active programs, partners can see all in their tenant
CREATE POLICY "programs_select"
  ON public.programs FOR SELECT
  USING (
    -- Active programs are visible to everyone
    (active = true)
    OR
    -- Partners can see all programs in their tenant (including inactive)
    (
      public.get_user_role(auth.uid()) = 'partner'::public.app_role
      AND tenant_id = public.get_user_tenant(auth.uid())
    )
    OR
    -- Agents and students can see programs
    (
      public.get_user_role(auth.uid()) IN ('agent'::public.app_role, 'student'::public.app_role)
      AND active = true
    )
    OR
    -- Admins can see all
    public.is_admin_or_staff(auth.uid())
  );

-- INSERT: Partners can only create programs for their own university
CREATE POLICY "programs_insert"
  ON public.programs FOR INSERT
  TO authenticated
  WITH CHECK (
    public.get_user_role(auth.uid()) = 'partner'::public.app_role
    AND tenant_id = public.get_user_tenant(auth.uid())
    AND university_id = public.get_user_university_id()
  );

-- UPDATE: Partners can only update programs in their own tenant/university
CREATE POLICY "programs_update"
  ON public.programs FOR UPDATE
  TO authenticated
  USING (
    public.get_user_role(auth.uid()) = 'partner'::public.app_role
    AND tenant_id = public.get_user_tenant(auth.uid())
    AND university_id = public.get_user_university_id()
  )
  WITH CHECK (
    public.get_user_role(auth.uid()) = 'partner'::public.app_role
    AND tenant_id = public.get_user_tenant(auth.uid())
    AND university_id = public.get_user_university_id()
  );

-- DELETE: Partners can only delete programs in their own tenant/university
CREATE POLICY "programs_delete"
  ON public.programs FOR DELETE
  TO authenticated
  USING (
    public.get_user_role(auth.uid()) = 'partner'::public.app_role
    AND tenant_id = public.get_user_tenant(auth.uid())
    AND university_id = public.get_user_university_id()
  );

-- Admin full access
CREATE POLICY "programs_admin_all"
  ON public.programs FOR ALL
  TO authenticated
  USING (
    public.is_admin_or_staff(auth.uid())
  )
  WITH CHECK (
    public.is_admin_or_staff(auth.uid())
  );

-- ============================================================================
-- STEP 9: Add RLS policies for applications to ensure university isolation
-- ============================================================================

-- First check if we need to add policies for applications
DO $$
BEGIN
  -- Ensure RLS is enabled
  ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
END$$;

-- Drop existing policies that might conflict
DROP POLICY IF EXISTS "Partners can view applications to their programs" ON public.applications;
DROP POLICY IF EXISTS "Partners can update applications to their programs" ON public.applications;

-- SELECT: Partners can only see applications to their university's programs
CREATE POLICY "applications_partner_select"
  ON public.applications FOR SELECT
  TO authenticated
  USING (
    (
      public.get_user_role(auth.uid()) = 'partner'::public.app_role
      AND EXISTS (
        SELECT 1 FROM public.programs p
        WHERE p.id = program_id
          AND p.university_id = public.get_user_university_id()
          AND p.tenant_id = public.get_user_tenant(auth.uid())
      )
    )
    OR
    -- Keep existing policies for agents, students, etc.
    public.is_admin_or_staff(auth.uid())
    OR
    student_id IN (
      SELECT id FROM public.students 
      WHERE profile_id = auth.uid()
    )
    OR
    agent_id IN (
      SELECT id FROM public.agents 
      WHERE profile_id = auth.uid()
    )
  );

-- UPDATE: Partners can update applications to their university's programs
CREATE POLICY "applications_partner_update"
  ON public.applications FOR UPDATE
  TO authenticated
  USING (
    public.get_user_role(auth.uid()) = 'partner'::public.app_role
    AND EXISTS (
      SELECT 1 FROM public.programs p
      WHERE p.id = program_id
        AND p.university_id = public.get_user_university_id()
        AND p.tenant_id = public.get_user_tenant(auth.uid())
    )
  )
  WITH CHECK (
    public.get_user_role(auth.uid()) = 'partner'::public.app_role
    AND EXISTS (
      SELECT 1 FROM public.programs p
      WHERE p.id = program_id
        AND p.university_id = public.get_user_university_id()
        AND p.tenant_id = public.get_user_tenant(auth.uid())
    )
  );

-- ============================================================================
-- STEP 10: Add RLS policies for offers table for university isolation
-- ============================================================================

-- Enable RLS on offers if not already
DO $$
BEGIN
  ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN OTHERS THEN
  -- Table might not exist yet
  RAISE NOTICE 'offers table may not exist: %', SQLERRM;
END$$;

-- Drop existing policies
DROP POLICY IF EXISTS "Partners can manage offers for their applications" ON public.offers;

-- Create partner offers policy
DO $$
BEGIN
  CREATE POLICY "offers_partner_manage"
    ON public.offers FOR ALL
    TO authenticated
    USING (
      public.get_user_role(auth.uid()) = 'partner'::public.app_role
      AND EXISTS (
        SELECT 1 FROM public.applications a
        JOIN public.programs p ON a.program_id = p.id
        WHERE a.id = application_id
          AND p.university_id = public.get_user_university_id()
          AND p.tenant_id = public.get_user_tenant(auth.uid())
      )
    )
    WITH CHECK (
      public.get_user_role(auth.uid()) = 'partner'::public.app_role
      AND EXISTS (
        SELECT 1 FROM public.applications a
        JOIN public.programs p ON a.program_id = p.id
        WHERE a.id = application_id
          AND p.university_id = public.get_user_university_id()
          AND p.tenant_id = public.get_user_tenant(auth.uid())
      )
    );
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Could not create offers policy: %', SQLERRM;
END$$;

-- ============================================================================
-- STEP 11: Ensure document_requests are tenant-scoped
-- ============================================================================

-- Enable RLS
ALTER TABLE public.document_requests ENABLE ROW LEVEL SECURITY;

-- Drop and recreate partner policy
DROP POLICY IF EXISTS "Partners can view document requests in their tenant" ON public.document_requests;
DROP POLICY IF EXISTS "Partners can manage document requests in their tenant" ON public.document_requests;

CREATE POLICY "document_requests_partner_select"
  ON public.document_requests FOR SELECT
  TO authenticated
  USING (
    tenant_id = public.get_user_tenant(auth.uid())
    AND public.get_user_role(auth.uid()) = 'partner'::public.app_role
  );

CREATE POLICY "document_requests_partner_manage"
  ON public.document_requests FOR ALL
  TO authenticated
  USING (
    tenant_id = public.get_user_tenant(auth.uid())
    AND public.get_user_role(auth.uid()) = 'partner'::public.app_role
  )
  WITH CHECK (
    tenant_id = public.get_user_tenant(auth.uid())
    AND public.get_user_role(auth.uid()) = 'partner'::public.app_role
  );

-- ============================================================================
-- STEP 12: Ensure agents are tenant-scoped
-- ============================================================================

-- Enable RLS
ALTER TABLE public.agents ENABLE ROW LEVEL SECURITY;

-- Drop and recreate partner policy
DROP POLICY IF EXISTS "Partners can view agents in their tenant" ON public.agents;

CREATE POLICY "agents_partner_select"
  ON public.agents FOR SELECT
  TO authenticated
  USING (
    tenant_id = public.get_user_tenant(auth.uid())
    AND public.get_user_role(auth.uid()) = 'partner'::public.app_role
  );

-- ============================================================================
-- STEP 13: Trigger to prevent university tenant_id modification
-- ============================================================================

CREATE OR REPLACE FUNCTION public.prevent_university_tenant_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.tenant_id IS NOT NULL AND NEW.tenant_id IS DISTINCT FROM OLD.tenant_id THEN
    RAISE EXCEPTION 'Cannot change tenant_id for an existing university profile';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS prevent_university_tenant_change_trigger ON public.universities;
CREATE TRIGGER prevent_university_tenant_change_trigger
  BEFORE UPDATE ON public.universities
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_university_tenant_change();

-- ============================================================================
-- STEP 14: Trigger to prevent program university_id modification
-- ============================================================================

CREATE OR REPLACE FUNCTION public.prevent_program_university_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.university_id IS NOT NULL AND NEW.university_id IS DISTINCT FROM OLD.university_id THEN
    RAISE EXCEPTION 'Cannot change university_id for an existing program';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS prevent_program_university_change_trigger ON public.programs;
CREATE TRIGGER prevent_program_university_change_trigger
  BEFORE UPDATE ON public.programs
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_program_university_change();

-- ============================================================================
-- STEP 15: Add comments for documentation
-- ============================================================================

COMMENT ON FUNCTION public.verify_user_owns_tenant(UUID, UUID) IS 
  'Verifies that a user belongs to the specified tenant. Used for RLS policy checks.';

COMMENT ON FUNCTION public.get_user_university_id() IS 
  'Returns the university ID for the current authenticated user based on their tenant_id.';

COMMENT ON FUNCTION public.program_belongs_to_user_university(UUID) IS 
  'Checks if a program belongs to the current user''s university.';

COMMENT ON FUNCTION public.sync_program_tenant_id() IS 
  'Trigger function to ensure program.tenant_id matches university.tenant_id.';

COMMENT ON FUNCTION public.prevent_university_tenant_change() IS 
  'Prevents modification of tenant_id on existing university records.';

COMMENT ON FUNCTION public.prevent_program_university_change() IS 
  'Prevents modification of university_id on existing program records.';

-- ============================================================================
-- COMPLETE: University data is now fully isolated by tenant
-- ============================================================================
