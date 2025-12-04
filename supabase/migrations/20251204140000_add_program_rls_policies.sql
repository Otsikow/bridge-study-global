-- Migration: Add RLS policies for partners/universities to manage programmes
-- Created: 2025-12-04
-- Issue: Partners and universities could not create, update, or delete programmes
-- Solution: Add INSERT, UPDATE, and DELETE policies for programmes table

-- Allow partners/universities to create programmes for their university
CREATE POLICY "Partners can create programmes for their university"
  ON programs FOR INSERT
  WITH CHECK (
    get_user_role(auth.uid()) IN ('partner', 'university')
    AND tenant_id = get_user_tenant(auth.uid())
    AND EXISTS (
      SELECT 1 FROM universities u
      WHERE u.id = university_id
      AND u.tenant_id = get_user_tenant(auth.uid())
    )
  );

-- Allow partners/universities to update their own programmes
CREATE POLICY "Partners can update their university's programmes"
  ON programs FOR UPDATE
  USING (
    get_user_role(auth.uid()) IN ('partner', 'university')
    AND tenant_id = get_user_tenant(auth.uid())
    AND EXISTS (
      SELECT 1 FROM universities u
      WHERE u.id = university_id
      AND u.tenant_id = get_user_tenant(auth.uid())
    )
  )
  WITH CHECK (
    get_user_role(auth.uid()) IN ('partner', 'university')
    AND tenant_id = get_user_tenant(auth.uid())
    AND EXISTS (
      SELECT 1 FROM universities u
      WHERE u.id = university_id
      AND u.tenant_id = get_user_tenant(auth.uid())
    )
  );

-- Allow partners/universities to delete their own programmes
CREATE POLICY "Partners can delete their university's programmes"
  ON programs FOR DELETE
  USING (
    get_user_role(auth.uid()) IN ('partner', 'university')
    AND tenant_id = get_user_tenant(auth.uid())
    AND EXISTS (
      SELECT 1 FROM universities u
      WHERE u.id = university_id
      AND u.tenant_id = get_user_tenant(auth.uid())
    )
  );
