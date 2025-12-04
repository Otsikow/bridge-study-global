-- Comprehensive fix for programs table RLS policies
-- This migration:
-- 1. Drops ALL existing INSERT/UPDATE/DELETE policies on programs table
-- 2. Creates a robust helper function for checking program management permissions
-- 3. Creates clean RLS policies for partners to manage programs
--
-- Root cause: Previous migrations created policies with invalid role checks or conflicting names

-- ============================================================================
-- STEP 1: Drop ALL existing INSERT/UPDATE/DELETE policies on programs table
-- ============================================================================

-- Drop all possible policy name variations we've seen in migrations
DROP POLICY IF EXISTS "Partners can create programmes for their university" ON public.programs;
DROP POLICY IF EXISTS "Partners can create programs for their university" ON public.programs;
DROP POLICY IF EXISTS "Partners can update their university's programmes" ON public.programs;
DROP POLICY IF EXISTS "Partners can update their university programmes" ON public.programs;
DROP POLICY IF EXISTS "Partners can update their university programs" ON public.programs;
DROP POLICY IF EXISTS "Partners can delete their university's programmes" ON public.programs;
DROP POLICY IF EXISTS "Partners can delete their university programmes" ON public.programs;
DROP POLICY IF EXISTS "Partners can delete their university programs" ON public.programs;
DROP POLICY IF EXISTS "Partners can view all programs in their tenant" ON public.programs;

-- Also drop any policies we'll be creating (in case this migration runs again)
DROP POLICY IF EXISTS "partner_insert_programs" ON public.programs;
DROP POLICY IF EXISTS "partner_update_programs" ON public.programs;
DROP POLICY IF EXISTS "partner_delete_programs" ON public.programs;
DROP POLICY IF EXISTS "partner_select_all_programs" ON public.programs;

-- ============================================================================
-- STEP 2: Create or replace the helper function for checking permissions
-- ============================================================================

-- Drop the old helper function if it exists (it may have issues)
DROP FUNCTION IF EXISTS public.can_manage_university_programs(UUID, UUID, UUID);

-- This function uses SECURITY DEFINER to bypass RLS on profile/university lookups
-- It checks if a user (by ID) is a partner and can manage programs in the given tenant
CREATE OR REPLACE FUNCTION public.check_can_manage_programs(
  p_user_id UUID,
  p_tenant_id UUID,
  p_university_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
DECLARE
  v_user_role TEXT;
  v_user_tenant_id UUID;
  v_university_exists BOOLEAN;
BEGIN
  -- Early exit if any parameter is NULL
  IF p_user_id IS NULL OR p_tenant_id IS NULL OR p_university_id IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Get the user's role and tenant_id
  SELECT role::text, tenant_id
  INTO v_user_role, v_user_tenant_id
  FROM public.profiles
  WHERE id = p_user_id;
  
  -- User must exist and be a partner
  IF v_user_role IS NULL OR v_user_role != 'partner' THEN
    RETURN FALSE;
  END IF;
  
  -- The user's tenant must match the program's tenant
  IF v_user_tenant_id IS NULL OR v_user_tenant_id != p_tenant_id THEN
    RETURN FALSE;
  END IF;
  
  -- The university must exist and belong to the same tenant
  SELECT EXISTS (
    SELECT 1
    FROM public.universities u
    WHERE u.id = p_university_id
      AND u.tenant_id = p_tenant_id
  ) INTO v_university_exists;
  
  RETURN v_university_exists;
END;
$$;

-- Grant execute permission to authenticated users and public (for RLS checks)
GRANT EXECUTE ON FUNCTION public.check_can_manage_programs(UUID, UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_can_manage_programs(UUID, UUID, UUID) TO public;

-- Add comment for documentation
COMMENT ON FUNCTION public.check_can_manage_programs(UUID, UUID, UUID) IS 
  'Checks if a user can manage programs for a specific university. Returns TRUE if the user is a partner in the same tenant as the university.';

-- ============================================================================
-- STEP 3: Create RLS policies for programs table
-- ============================================================================

-- INSERT policy: Partners can create programs for universities in their tenant
CREATE POLICY "partner_insert_programs"
  ON public.programs
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.check_can_manage_programs(auth.uid(), tenant_id, university_id)
  );

-- UPDATE policy: Partners can update programs for universities in their tenant
CREATE POLICY "partner_update_programs"
  ON public.programs
  FOR UPDATE
  TO authenticated
  USING (
    public.check_can_manage_programs(auth.uid(), tenant_id, university_id)
  )
  WITH CHECK (
    public.check_can_manage_programs(auth.uid(), tenant_id, university_id)
  );

-- DELETE policy: Partners can delete programs for universities in their tenant
CREATE POLICY "partner_delete_programs"
  ON public.programs
  FOR DELETE
  TO authenticated
  USING (
    public.check_can_manage_programs(auth.uid(), tenant_id, university_id)
  );

-- SELECT policy: Partners can view ALL programs in their tenant (including inactive)
CREATE POLICY "partner_select_all_programs"
  ON public.programs
  FOR SELECT
  TO authenticated
  USING (
    -- Partners can see all programs in their tenant
    (
      public.get_user_role(auth.uid()) = 'partner'::public.app_role
      AND tenant_id = public.get_user_tenant(auth.uid())
    )
  );

-- ============================================================================
-- STEP 4: Verify existing SELECT policies still work
-- ============================================================================

-- The existing policy "Anyone can view active programs in their tenant" should still exist
-- from the initial migration. We don't need to recreate it.
-- The "Admins can manage programs" policy should also still exist.

-- ============================================================================
-- Done!
-- ============================================================================
