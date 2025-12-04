-- Clean up duplicate and conflicting university profile policies
-- The Dec 3 and Dec 4 migrations created overlapping policies that may conflict.
-- This migration removes the Dec 3 policies and ensures only the Dec 4 policies remain.

-- Drop the Dec 3 policies that use has_role()
DROP POLICY IF EXISTS "Partners can update their university" ON public.universities;
DROP POLICY IF EXISTS "Partners can create their university" ON public.universities;

-- Ensure the Dec 4 policies exist (idempotent - won't error if they already exist)
DO $$
BEGIN
  -- Drop and recreate to ensure they're correct
  DROP POLICY IF EXISTS "Partners can create their university profile" ON public.universities;
  DROP POLICY IF EXISTS "Partners can update their university profile" ON public.universities;

  -- Create the INSERT policy
  CREATE POLICY "Partners can create their university profile"
    ON public.universities FOR INSERT
    WITH CHECK (
      get_user_role(auth.uid()) IN ('partner', 'university')
      AND tenant_id = get_user_tenant(auth.uid())
    );

  -- Create the UPDATE policy
  CREATE POLICY "Partners can update their university profile"
    ON public.universities FOR UPDATE
    USING (
      get_user_role(auth.uid()) IN ('partner', 'university')
      AND tenant_id = get_user_tenant(auth.uid())
    )
    WITH CHECK (
      get_user_role(auth.uid()) IN ('partner', 'university')
      AND tenant_id = get_user_tenant(auth.uid())
    );
END$$;
