-- Fix programs RLS policies for partner/university users
-- Issue: The previous migration used 'university' role which doesn't exist in app_role enum
-- The valid roles are: 'student', 'agent', 'partner', 'staff', 'admin'
-- Partners/universities use the 'partner' role

-- First, drop the existing policies that have the invalid role check
DROP POLICY IF EXISTS "Partners can create programmes for their university" ON public.programs;
DROP POLICY IF EXISTS "Partners can update their university's programmes" ON public.programs;
DROP POLICY IF EXISTS "Partners can delete their university's programmes" ON public.programs;

-- Also ensure we have a proper SELECT policy for partners
-- (they need to see all programs in their tenant, not just active ones)
DROP POLICY IF EXISTS "Partners can view all programs in their tenant" ON public.programs;

-- Create a helper function to check if a user can manage a university's programs
-- This makes the policies cleaner and more maintainable
CREATE OR REPLACE FUNCTION public.can_manage_university_programs(user_id UUID, p_tenant_id UUID, p_university_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.profiles p
    WHERE p.id = user_id
      AND p.role = 'partner'
      AND p.tenant_id = p_tenant_id
  )
  AND EXISTS (
    SELECT 1
    FROM public.universities u
    WHERE u.id = p_university_id
      AND u.tenant_id = p_tenant_id
  );
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.can_manage_university_programs(UUID, UUID, UUID) TO authenticated;

-- Create INSERT policy for partners
-- Partners can create programs for universities in their tenant
CREATE POLICY "Partners can create programs for their university"
  ON public.programs FOR INSERT
  WITH CHECK (
    public.can_manage_university_programs(auth.uid(), tenant_id, university_id)
  );

-- Create UPDATE policy for partners
-- Partners can update programs belonging to universities in their tenant
CREATE POLICY "Partners can update their university programs"
  ON public.programs FOR UPDATE
  USING (
    public.can_manage_university_programs(auth.uid(), tenant_id, university_id)
  )
  WITH CHECK (
    public.can_manage_university_programs(auth.uid(), tenant_id, university_id)
  );

-- Create DELETE policy for partners
-- Partners can delete programs belonging to universities in their tenant
CREATE POLICY "Partners can delete their university programs"
  ON public.programs FOR DELETE
  USING (
    public.can_manage_university_programs(auth.uid(), tenant_id, university_id)
  );

-- Create SELECT policy for partners to view all programs (including inactive)
-- This is in addition to the existing "Anyone can view active programs in their tenant" policy
CREATE POLICY "Partners can view all programs in their tenant"
  ON public.programs FOR SELECT
  USING (
    tenant_id = public.get_user_tenant(auth.uid())
    AND public.get_user_role(auth.uid()) = 'partner'
  );

-- Add a comment for documentation
COMMENT ON FUNCTION public.can_manage_university_programs(UUID, UUID, UUID) IS 
  'Helper function to check if a user (partner) can manage programs for a specific university. Returns true if the user is a partner in the same tenant as the university.';

-- ============================================================================
-- Also fix universities table policies that have the same invalid role issue
-- ============================================================================

-- Drop existing policies with invalid role check
DROP POLICY IF EXISTS "Partners can create their university profile" ON public.universities;
DROP POLICY IF EXISTS "Partners can update their university profile" ON public.universities;

-- Create a helper function to check if a user can manage their university profile
CREATE OR REPLACE FUNCTION public.can_manage_university_profile(user_id UUID, p_tenant_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.profiles p
    WHERE p.id = user_id
      AND p.role = 'partner'
      AND p.tenant_id = p_tenant_id
  );
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.can_manage_university_profile(UUID, UUID) TO authenticated;

-- Create INSERT policy for universities
CREATE POLICY "Partners can create their university profile"
  ON public.universities FOR INSERT
  WITH CHECK (
    public.can_manage_university_profile(auth.uid(), tenant_id)
  );

-- Create UPDATE policy for universities
CREATE POLICY "Partners can update their university profile"
  ON public.universities FOR UPDATE
  USING (
    public.can_manage_university_profile(auth.uid(), tenant_id)
  )
  WITH CHECK (
    public.can_manage_university_profile(auth.uid(), tenant_id)
  );

-- Add a comment for documentation
COMMENT ON FUNCTION public.can_manage_university_profile(UUID, UUID) IS 
  'Helper function to check if a user (partner) can manage their university profile. Returns true if the user is a partner with matching tenant_id.';
