-- Fix for university profile mirroring issue
-- Issue: Multiple universities sharing the same profile record, causing updates
-- from one university to affect another.
--
-- Root Cause: The upsert operation was not properly using tenant_id as the
-- conflict target, which could lead to data cross-contamination.
--
-- This migration ensures:
-- 1. The unique constraint on tenant_id exists and is enforced
-- 2. Any orphaned or duplicate university records are cleaned up
-- 3. RLS policies are correctly scoped to tenant_id

-- ============================================================================
-- STEP 1: Verify and enforce unique constraint on tenant_id
-- ============================================================================

-- Check if the constraint exists, if not create it
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'universities_tenant_id_unique'
      AND conrelid = 'public.universities'::regclass
  ) THEN
    -- Before adding the constraint, we need to clean up any duplicates
    -- First, identify and keep only the most recently updated university per tenant
    WITH ranked AS (
      SELECT 
        id,
        tenant_id,
        ROW_NUMBER() OVER (
          PARTITION BY tenant_id 
          ORDER BY updated_at DESC NULLS LAST, created_at DESC NULLS LAST
        ) as rn
      FROM public.universities
      WHERE tenant_id IS NOT NULL
    ),
    universities_to_delete AS (
      SELECT id FROM ranked WHERE rn > 1
    )
    -- Delete duplicates but first reassign any foreign key references
    UPDATE public.programs p
    SET university_id = (
      SELECT r.id FROM ranked r 
      WHERE r.tenant_id = (SELECT tenant_id FROM public.universities WHERE id = p.university_id)
        AND r.rn = 1
    )
    WHERE p.university_id IN (SELECT id FROM universities_to_delete);

    -- Now delete the duplicates
    DELETE FROM public.universities
    WHERE id IN (
      SELECT id FROM (
        SELECT 
          id,
          tenant_id,
          ROW_NUMBER() OVER (
            PARTITION BY tenant_id 
            ORDER BY updated_at DESC NULLS LAST, created_at DESC NULLS LAST
          ) as rn
        FROM public.universities
        WHERE tenant_id IS NOT NULL
      ) ranked WHERE rn > 1
    );

    -- Now add the unique constraint
    ALTER TABLE public.universities
    ADD CONSTRAINT universities_tenant_id_unique UNIQUE (tenant_id);

    RAISE NOTICE 'Added unique constraint universities_tenant_id_unique';
  ELSE
    RAISE NOTICE 'Constraint universities_tenant_id_unique already exists';
  END IF;
END$$;

-- ============================================================================
-- STEP 2: Create or replace a helper function for tenant-scoped university access
-- ============================================================================

-- This function verifies that a user can only access their own tenant's university
CREATE OR REPLACE FUNCTION public.get_user_university_id(p_user_id UUID)
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
  WHERE id = p_user_id;

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

GRANT EXECUTE ON FUNCTION public.get_user_university_id(UUID) TO authenticated;

COMMENT ON FUNCTION public.get_user_university_id(UUID) IS 
  'Returns the university ID for a user based on their tenant_id. Ensures tenant isolation.';

-- ============================================================================
-- STEP 3: Ensure university profile update policy enforces tenant isolation
-- ============================================================================

-- Drop existing policies and recreate with proper tenant isolation
DROP POLICY IF EXISTS "Partners can create their university profile" ON public.universities;
DROP POLICY IF EXISTS "Partners can update their university profile" ON public.universities;
DROP POLICY IF EXISTS "partner_create_university" ON public.universities;
DROP POLICY IF EXISTS "partner_update_university" ON public.universities;

-- Create INSERT policy with strict tenant check
CREATE POLICY "partner_create_university"
  ON public.universities
  FOR INSERT
  TO authenticated
  WITH CHECK (
    -- User must be a partner
    public.get_user_role(auth.uid()) = 'partner'::public.app_role
    -- The tenant_id must match the user's tenant
    AND tenant_id = public.get_user_tenant(auth.uid())
    -- Ensure no other university exists for this tenant (enforced by unique constraint,
    -- but also checking here for safety)
    AND NOT EXISTS (
      SELECT 1 FROM public.universities u
      WHERE u.tenant_id = tenant_id
    )
  );

-- Create UPDATE policy with strict tenant check
CREATE POLICY "partner_update_university"
  ON public.universities
  FOR UPDATE
  TO authenticated
  USING (
    -- User must be a partner
    public.get_user_role(auth.uid()) = 'partner'::public.app_role
    -- The university must belong to the user's tenant
    AND tenant_id = public.get_user_tenant(auth.uid())
  )
  WITH CHECK (
    -- User must be a partner
    public.get_user_role(auth.uid()) = 'partner'::public.app_role
    -- Cannot change the tenant_id (must remain the same)
    AND tenant_id = public.get_user_tenant(auth.uid())
  );

-- ============================================================================
-- STEP 4: Add index for performance on tenant_id lookups
-- ============================================================================

-- Add index if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE indexname = 'idx_universities_tenant_id_unique'
      AND tablename = 'universities'
  ) THEN
    -- The unique constraint already creates an index, so we just note this
    RAISE NOTICE 'Index on universities.tenant_id exists via unique constraint';
  END IF;
END$$;

-- ============================================================================
-- STEP 5: Add a trigger to prevent tenant_id modification after creation
-- ============================================================================

CREATE OR REPLACE FUNCTION public.prevent_university_tenant_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Prevent changing tenant_id once set
  IF OLD.tenant_id IS NOT NULL AND NEW.tenant_id IS DISTINCT FROM OLD.tenant_id THEN
    RAISE EXCEPTION 'Cannot change tenant_id for an existing university profile. Each university must remain associated with its original tenant.';
  END IF;
  
  RETURN NEW;
END;
$$;

-- Drop if exists and recreate
DROP TRIGGER IF EXISTS prevent_university_tenant_change_trigger ON public.universities;

CREATE TRIGGER prevent_university_tenant_change_trigger
  BEFORE UPDATE ON public.universities
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_university_tenant_change();

COMMENT ON FUNCTION public.prevent_university_tenant_change() IS
  'Prevents changing the tenant_id of a university to ensure profile isolation between tenants.';

-- ============================================================================
-- Done! University profiles are now properly isolated per tenant.
-- ============================================================================
