-- Align university profile policies with partner role
-- Partners need to insert and update their tenant's university profile records.
-- The previous policies only allowed the (unused) "university" role, causing
-- RLS failures for partner users when saving profile changes.

DROP POLICY IF EXISTS "University users can create their university profile" ON public.universities;
DROP POLICY IF EXISTS "University users can update their university profile" ON public.universities;

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
