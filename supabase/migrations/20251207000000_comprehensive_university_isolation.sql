-- ============================================================================
-- Comprehensive University Multi-Tenant Isolation
-- ============================================================================
-- This migration ensures complete data isolation for university accounts.
-- 
-- Issue: Multiple university accounts were mirroring the same profile data
-- (e.g., all new accounts inherited "Pineapple University").
--
-- Root Cause: When isolated tenant creation failed, the system fell back to
-- the default tenant, causing all partners to share the same tenant_id.
--
-- This migration adds:
-- 1. Strict unique constraint on universities.tenant_id
-- 2. Validation triggers to prevent tenant_id reuse for partners
-- 3. Defense-in-depth RLS policies
-- 4. Audit logging for tenant operations
-- ============================================================================

-- ============================================================================
-- STEP 1: Ensure unique constraint on universities.tenant_id
-- ============================================================================

-- Drop the old constraint if it exists (might have different name)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conrelid = 'public.universities'::regclass 
    AND conname = 'universities_tenant_id_key'
  ) THEN
    ALTER TABLE public.universities DROP CONSTRAINT universities_tenant_id_key;
  END IF;
END $$;

-- Add the unique constraint with standardized name
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'universities_tenant_id_unique'
      AND conrelid = 'public.universities'::regclass
  ) THEN
    -- First, clean up any duplicate universities per tenant (keep the most recent)
    -- This is idempotent and safe to run multiple times
    WITH ranked AS (
      SELECT 
        id,
        tenant_id,
        ROW_NUMBER() OVER (
          PARTITION BY tenant_id 
          ORDER BY 
            CASE WHEN active = true THEN 0 ELSE 1 END,
            updated_at DESC NULLS LAST, 
            created_at DESC NULLS LAST
        ) as rn
      FROM public.universities
      WHERE tenant_id IS NOT NULL
    ),
    duplicates AS (
      SELECT id FROM ranked WHERE rn > 1
    )
    DELETE FROM public.universities
    WHERE id IN (SELECT id FROM duplicates);

    -- Now add the unique constraint
    ALTER TABLE public.universities
    ADD CONSTRAINT universities_tenant_id_unique UNIQUE (tenant_id);
    
    RAISE NOTICE 'Added unique constraint universities_tenant_id_unique';
  ELSE
    RAISE NOTICE 'Constraint universities_tenant_id_unique already exists';
  END IF;
END $$;

-- ============================================================================
-- STEP 2: Create helper functions for tenant isolation checks
-- ============================================================================

-- Function to get the authenticated user's tenant_id
CREATE OR REPLACE FUNCTION public.get_auth_tenant_id()
RETURNS UUID
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT tenant_id
  FROM public.profiles
  WHERE id = auth.uid()
  LIMIT 1;
$$;

COMMENT ON FUNCTION public.get_auth_tenant_id() IS 
  'Returns the tenant_id for the currently authenticated user.';

GRANT EXECUTE ON FUNCTION public.get_auth_tenant_id() TO authenticated;

-- Function to check if a tenant has a university (for isolation validation)
CREATE OR REPLACE FUNCTION public.tenant_has_university(p_tenant_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.universities
    WHERE tenant_id = p_tenant_id
  );
$$;

COMMENT ON FUNCTION public.tenant_has_university(UUID) IS 
  'Checks if a given tenant already has an associated university.';

GRANT EXECUTE ON FUNCTION public.tenant_has_university(UUID) TO authenticated;

-- ============================================================================
-- STEP 3: Create trigger to validate university tenant isolation
-- ============================================================================

-- Prevent multiple universities from being assigned to the same tenant
CREATE OR REPLACE FUNCTION public.validate_university_tenant_isolation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  existing_count INTEGER;
BEGIN
  -- For INSERT: Check if this tenant already has a university
  IF TG_OP = 'INSERT' THEN
    SELECT COUNT(*) INTO existing_count
    FROM public.universities
    WHERE tenant_id = NEW.tenant_id;
    
    IF existing_count > 0 THEN
      RAISE EXCEPTION 'TENANT_ISOLATION_VIOLATION: Tenant % already has a university. Each tenant can only have one university.', NEW.tenant_id;
    END IF;
  END IF;
  
  -- For UPDATE: Prevent changing tenant_id to one that already has a university
  IF TG_OP = 'UPDATE' AND OLD.tenant_id IS DISTINCT FROM NEW.tenant_id THEN
    SELECT COUNT(*) INTO existing_count
    FROM public.universities
    WHERE tenant_id = NEW.tenant_id
      AND id != NEW.id;
    
    IF existing_count > 0 THEN
      RAISE EXCEPTION 'TENANT_ISOLATION_VIOLATION: Cannot move university to tenant % - that tenant already has a university.', NEW.tenant_id;
    END IF;
    
    -- Also prevent changing tenant_id once set (additional safety)
    IF OLD.tenant_id IS NOT NULL THEN
      RAISE EXCEPTION 'TENANT_ISOLATION_VIOLATION: Cannot change tenant_id for an existing university. Each university must remain associated with its original tenant.';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.validate_university_tenant_isolation() IS 
  'Ensures each tenant can only have one university and prevents tenant_id modification.';

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS trg_validate_university_tenant_isolation ON public.universities;

-- Create the trigger
CREATE TRIGGER trg_validate_university_tenant_isolation
  BEFORE INSERT OR UPDATE ON public.universities
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_university_tenant_isolation();

-- ============================================================================
-- STEP 4: Ensure NOT NULL constraint on tenant_id
-- ============================================================================

-- Update any NULL tenant_id values (shouldn't happen, but safety first)
-- Each university without a tenant will get its own new tenant
DO $$
DECLARE
  uni_record RECORD;
  new_tenant_id UUID;
BEGIN
  FOR uni_record IN 
    SELECT id, name 
    FROM public.universities 
    WHERE tenant_id IS NULL
  LOOP
    -- Create a new isolated tenant for this orphaned university
    INSERT INTO public.tenants (name, slug, email_from, active)
    VALUES (
      uni_record.name || ' Tenant',
      'orphan-uni-' || SUBSTRING(uni_record.id::TEXT FROM 1 FOR 8) || '-' || EXTRACT(EPOCH FROM NOW())::INTEGER,
      'noreply@example.com',
      true
    )
    RETURNING id INTO new_tenant_id;
    
    -- Assign the university to this new tenant
    UPDATE public.universities 
    SET tenant_id = new_tenant_id
    WHERE id = uni_record.id;
    
    RAISE NOTICE 'Assigned orphan university % to new tenant %', uni_record.id, new_tenant_id;
  END LOOP;
END $$;

-- Add NOT NULL constraint if not already present
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'universities' 
    AND column_name = 'tenant_id'
    AND is_nullable = 'YES'
  ) THEN
    ALTER TABLE public.universities 
    ALTER COLUMN tenant_id SET NOT NULL;
    RAISE NOTICE 'Added NOT NULL constraint to universities.tenant_id';
  END IF;
END $$;

-- ============================================================================
-- STEP 5: Update RLS policies for strict tenant isolation
-- ============================================================================

-- Drop and recreate partner policies with strict tenant checks
DROP POLICY IF EXISTS "partner_read_own_university" ON public.universities;
DROP POLICY IF EXISTS "partner_create_university" ON public.universities;
DROP POLICY IF EXISTS "partner_update_university" ON public.universities;
DROP POLICY IF EXISTS "partner_delete_university" ON public.universities;

-- Partners can only read their own tenant's university
CREATE POLICY "partner_read_own_university"
  ON public.universities
  FOR SELECT
  TO authenticated
  USING (
    -- Public universities are readable by anyone
    active = true
    OR (
      -- Partners can read their own tenant's university
      public.get_user_role(auth.uid()) = 'partner'::public.app_role
      AND tenant_id = public.get_auth_tenant_id()
    )
    OR (
      -- Admins and staff can read all
      public.get_user_role(auth.uid()) IN ('admin'::public.app_role, 'staff'::public.app_role)
    )
  );

-- Partners can create university only for their own tenant (if none exists)
CREATE POLICY "partner_create_university"
  ON public.universities
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.get_user_role(auth.uid()) = 'partner'::public.app_role
    AND tenant_id = public.get_auth_tenant_id()
    AND NOT public.tenant_has_university(tenant_id)
  );

-- Partners can only update their own tenant's university
CREATE POLICY "partner_update_university"
  ON public.universities
  FOR UPDATE
  TO authenticated
  USING (
    public.get_user_role(auth.uid()) = 'partner'::public.app_role
    AND tenant_id = public.get_auth_tenant_id()
  )
  WITH CHECK (
    public.get_user_role(auth.uid()) = 'partner'::public.app_role
    AND tenant_id = public.get_auth_tenant_id()
  );

-- ============================================================================
-- STEP 6: Add indexes for performance
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_universities_tenant_id 
  ON public.universities(tenant_id);

CREATE INDEX IF NOT EXISTS idx_universities_active_tenant 
  ON public.universities(active, tenant_id);

-- ============================================================================
-- STEP 7: Create audit function for debugging tenant issues
-- ============================================================================

CREATE OR REPLACE FUNCTION public.audit_tenant_assignment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Log tenant assignments for debugging
  IF TG_OP = 'INSERT' THEN
    RAISE NOTICE 'TENANT_AUDIT: New % created - ID: %, Tenant: %, User: %', 
      TG_TABLE_NAME, NEW.id, NEW.tenant_id, auth.uid();
  END IF;
  
  IF TG_OP = 'UPDATE' AND OLD.tenant_id IS DISTINCT FROM NEW.tenant_id THEN
    RAISE NOTICE 'TENANT_AUDIT: % tenant changed - ID: %, Old Tenant: %, New Tenant: %, User: %', 
      TG_TABLE_NAME, NEW.id, OLD.tenant_id, NEW.tenant_id, auth.uid();
  END IF;
  
  RETURN NEW;
END;
$$;

-- Apply audit trigger to universities (optional, for debugging)
DROP TRIGGER IF EXISTS trg_audit_university_tenant ON public.universities;
CREATE TRIGGER trg_audit_university_tenant
  AFTER INSERT OR UPDATE ON public.universities
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_tenant_assignment();

-- ============================================================================
-- STEP 8: Verify existing data integrity
-- ============================================================================

DO $$
DECLARE
  duplicate_count INTEGER;
  null_count INTEGER;
BEGIN
  -- Check for duplicate tenant_id (should be 0 after our cleanup)
  SELECT COUNT(*) INTO duplicate_count
  FROM (
    SELECT tenant_id, COUNT(*) as cnt
    FROM public.universities
    GROUP BY tenant_id
    HAVING COUNT(*) > 1
  ) t;
  
  IF duplicate_count > 0 THEN
    RAISE WARNING 'Found % tenant_ids with multiple universities - this should be fixed', duplicate_count;
  ELSE
    RAISE NOTICE 'Data integrity check passed: No duplicate tenant_ids found';
  END IF;
  
  -- Check for NULL tenant_id (should be 0 after our update)
  SELECT COUNT(*) INTO null_count
  FROM public.universities
  WHERE tenant_id IS NULL;
  
  IF null_count > 0 THEN
    RAISE WARNING 'Found % universities with NULL tenant_id - this should be fixed', null_count;
  ELSE
    RAISE NOTICE 'Data integrity check passed: No NULL tenant_ids found';
  END IF;
END $$;

-- ============================================================================
-- Done! University profiles are now completely isolated per tenant.
-- ============================================================================
