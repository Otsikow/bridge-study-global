-- Allow university users to manage their own university profile records
-- University partner accounts (role = 'university') should be able to create and
-- update the university profile that belongs to their tenant. Previously, only
-- admins and staff could modify the universities table, which prevented partners
-- from saving their profile changes through the app UI.

CREATE POLICY "University users can create their university profile"
  ON public.universities FOR INSERT
  WITH CHECK (
    get_user_role(auth.uid()) = 'university'
    AND tenant_id = get_user_tenant(auth.uid())
  );

CREATE POLICY "University users can update their university profile"
  ON public.universities FOR UPDATE
  USING (
    get_user_role(auth.uid()) = 'university'
    AND tenant_id = get_user_tenant(auth.uid())
  )
  WITH CHECK (
    get_user_role(auth.uid()) = 'university'
    AND tenant_id = get_user_tenant(auth.uid())
  );
