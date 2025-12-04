-- Fix university profile RLS policies properly
-- This migration ensures clean state by dropping all potential policy variants
-- and recreating only the correct ones with proper error handling.

-- Drop all potential policy variants (both old and new names)
DROP POLICY IF EXISTS "Partners can update their university" ON public.universities;
DROP POLICY IF EXISTS "Partners can create their university" ON public.universities;
DROP POLICY IF EXISTS "University users can create their university profile" ON public.universities;
DROP POLICY IF EXISTS "University users can update their university profile" ON public.universities;
DROP POLICY IF EXISTS "Partners can create their university profile" ON public.universities;
DROP POLICY IF EXISTS "Partners can update their university profile" ON public.universities;

-- Now create the correct policies for INSERT and UPDATE
CREATE POLICY "Partners can create their university profile"
  ON public.universities FOR INSERT
  WITH CHECK (
    get_user_role(auth.uid()) IN ('partner', 'university')
    AND tenant_id = get_user_tenant(auth.uid())
  );

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
