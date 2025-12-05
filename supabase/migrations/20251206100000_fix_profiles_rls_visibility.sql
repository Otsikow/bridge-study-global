-- ============================================================================
-- FIX PROFILES TABLE RLS POLICY FOR RESTRICTED VISIBILITY
-- ============================================================================
-- This migration restricts profile visibility according to the following rules:
-- 1. Users can only see their own profile
-- 2. Staff (and admins) can see all profiles
-- 3. Agents can see profiles of students linked to them via agent_student_links
-- 4. Partners can see profiles of students who applied to their university (already exists)
-- ============================================================================

-- ============================================================================
-- STEP 1: Drop the overly broad "Users can view profiles in their tenant" policy
-- ============================================================================
-- This policy allowed any user in the same tenant to see all profiles,
-- which is a security concern.

DROP POLICY IF EXISTS "Users can view profiles in their tenant" ON public.profiles;

-- ============================================================================
-- STEP 2: Create policy for users to view their own profile
-- ============================================================================

CREATE POLICY "Users can view their own profile"
  ON public.profiles
  FOR SELECT
  USING (id = auth.uid());

-- ============================================================================
-- STEP 3: Create helper function to check if user is an agent for a student profile
-- ============================================================================

CREATE OR REPLACE FUNCTION public.is_agent_for_profile(p_agent_user_id UUID, p_student_profile_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.agent_student_links asl
    JOIN public.students s ON asl.student_id = s.id
    WHERE asl.agent_profile_id = p_agent_user_id
      AND s.profile_id = p_student_profile_id
  );
$$;

COMMENT ON FUNCTION public.is_agent_for_profile(UUID, UUID) IS 
  'Checks if a user (agent) is linked to a student profile via agent_student_links.';

GRANT EXECUTE ON FUNCTION public.is_agent_for_profile(UUID, UUID) TO authenticated;

-- Set search_path for security
ALTER FUNCTION public.is_agent_for_profile(UUID, UUID) SET search_path = public;

-- ============================================================================
-- STEP 4: Create policy for agents to view linked student profiles
-- ============================================================================

CREATE POLICY "Agents can view linked student profiles"
  ON public.profiles
  FOR SELECT
  USING (
    -- Current user must be an agent
    public.has_role(auth.uid(), 'agent'::app_role)
    -- The profile being viewed belongs to a student linked to this agent
    AND public.is_agent_for_profile(auth.uid(), id)
  );

-- ============================================================================
-- STEP 5: Ensure staff/admin policy exists (should already exist, recreate if needed)
-- ============================================================================

-- The "Admins can manage all profiles" policy should already exist from the initial schema,
-- but let's ensure it's properly in place for SELECT operations specifically.
-- Note: The existing FOR ALL policy handles this, but we add an explicit SELECT for clarity.

-- Drop if we need to recreate
DROP POLICY IF EXISTS "Staff can view all profiles" ON public.profiles;

CREATE POLICY "Staff can view all profiles"
  ON public.profiles
  FOR SELECT
  USING (public.is_admin_or_staff(auth.uid()));

-- ============================================================================
-- STEP 6: Add index for performance on agent_student_links lookups
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_agent_student_links_agent_profile_id 
  ON public.agent_student_links(agent_profile_id);

CREATE INDEX IF NOT EXISTS idx_agent_student_links_student_id_profile_lookup
  ON public.agent_student_links(student_id);

-- ============================================================================
-- STEP 7: Ensure partners policy for viewing applicant profiles exists
-- ============================================================================
-- This was created in migration 20251205100000_fix_application_flow_for_universities.sql
-- We don't need to recreate it, just verify it's there.

-- The policy "Partners can view profiles for their applicants" should already exist.
-- It uses the function profile_has_application_to_partner_university(profile_id)

-- ============================================================================
-- Documentation
-- ============================================================================

COMMENT ON POLICY "Users can view their own profile" ON public.profiles IS 
  'Every authenticated user can view their own profile.';

COMMENT ON POLICY "Agents can view linked student profiles" ON public.profiles IS 
  'Agents can view profiles of students that are linked to them via agent_student_links table.';

COMMENT ON POLICY "Staff can view all profiles" ON public.profiles IS 
  'Staff and admin users can view all profiles in the system.';

-- ============================================================================
-- Summary of profiles SELECT policies after this migration:
-- 1. "Users can view their own profile" - id = auth.uid()
-- 2. "Staff can view all profiles" - is_admin_or_staff(auth.uid())
-- 3. "Agents can view linked student profiles" - agent_student_links check
-- 4. "Partners can view profiles for their applicants" - existing policy
-- 5. "Admins can manage all profiles" - FOR ALL policy for admin/staff
-- ============================================================================
