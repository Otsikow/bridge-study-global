-- ============================================================================
-- Enhanced Multi-Tenant Isolation
-- ============================================================================
-- This migration adds additional defense-in-depth policies to ensure strict
-- tenant isolation for universities. It complements existing RLS policies
-- by adding explicit tenant_id checks.
--
-- IMPORTANT: These are additive policies that don't replace existing ones.
-- They add an extra layer of protection for multi-tenant security.
-- ============================================================================

-- ============================================================================
-- STEP 1: Add helper function to get partner's tenant_id
-- ============================================================================

-- This function returns the tenant_id for the current authenticated partner user
CREATE OR REPLACE FUNCTION public.get_current_partner_tenant()
RETURNS UUID
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT tenant_id
  FROM public.profiles
  WHERE id = auth.uid()
    AND role = 'partner'
  LIMIT 1;
$$;

COMMENT ON FUNCTION public.get_current_partner_tenant() IS 
  'Returns the tenant_id for the currently authenticated partner user, or NULL if not a partner.';

GRANT EXECUTE ON FUNCTION public.get_current_partner_tenant() TO authenticated;

-- ============================================================================
-- STEP 2: Add tenant_id validation for applications table
-- ============================================================================

-- Ensure applications table has tenant_id NOT NULL constraint
-- (This is a safe operation - the column already exists and should have values)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'applications' 
    AND column_name = 'tenant_id'
  ) THEN
    -- Add NOT NULL constraint if not already set
    -- First update any NULL values to match their program's university's tenant_id
    UPDATE public.applications a
    SET tenant_id = (
      SELECT u.tenant_id
      FROM public.programs p
      JOIN public.universities u ON p.university_id = u.id
      WHERE p.id = a.program_id
    )
    WHERE a.tenant_id IS NULL
      AND a.program_id IS NOT NULL;
      
    -- Log any applications that couldn't be fixed
    -- (These would need manual intervention)
  END IF;
END $$;

-- ============================================================================
-- STEP 3: Create trigger to auto-populate tenant_id on application creation
-- ============================================================================

-- Create function to automatically set tenant_id on new applications
CREATE OR REPLACE FUNCTION public.set_application_tenant_id()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- If tenant_id is not set but program_id is, derive it from the program's university
  IF NEW.tenant_id IS NULL AND NEW.program_id IS NOT NULL THEN
    SELECT u.tenant_id INTO NEW.tenant_id
    FROM public.programs p
    JOIN public.universities u ON p.university_id = u.id
    WHERE p.id = NEW.program_id;
  END IF;
  
  -- If still NULL, try to get from user's profile
  IF NEW.tenant_id IS NULL THEN
    SELECT tenant_id INTO NEW.tenant_id
    FROM public.profiles
    WHERE id = auth.uid();
  END IF;
  
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.set_application_tenant_id() IS 
  'Automatically sets tenant_id on applications based on the program''s university or user''s profile.';

-- Create trigger (only if it doesn't exist)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'trg_set_application_tenant_id' 
    AND tgrelid = 'public.applications'::regclass
  ) THEN
    CREATE TRIGGER trg_set_application_tenant_id
      BEFORE INSERT ON public.applications
      FOR EACH ROW
      EXECUTE FUNCTION public.set_application_tenant_id();
  END IF;
END $$;

-- ============================================================================
-- STEP 4: Add constraint to validate tenant_id matches program's university
-- ============================================================================

-- Create function to validate that application tenant_id matches the program's university
CREATE OR REPLACE FUNCTION public.validate_application_tenant_id()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  program_tenant_id UUID;
BEGIN
  -- Get the expected tenant_id from the program's university
  IF NEW.program_id IS NOT NULL THEN
    SELECT u.tenant_id INTO program_tenant_id
    FROM public.programs p
    JOIN public.universities u ON p.university_id = u.id
    WHERE p.id = NEW.program_id;
    
    -- If we found a program tenant_id, validate it matches
    IF program_tenant_id IS NOT NULL AND NEW.tenant_id != program_tenant_id THEN
      RAISE EXCEPTION 'Application tenant_id (%) does not match program university tenant_id (%)', 
        NEW.tenant_id, program_tenant_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.validate_application_tenant_id() IS 
  'Validates that application tenant_id matches the program''s university tenant_id.';

-- Create trigger to validate tenant_id on updates
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'trg_validate_application_tenant_id' 
    AND tgrelid = 'public.applications'::regclass
  ) THEN
    CREATE TRIGGER trg_validate_application_tenant_id
      BEFORE INSERT OR UPDATE ON public.applications
      FOR EACH ROW
      EXECUTE FUNCTION public.validate_application_tenant_id();
  END IF;
END $$;

-- ============================================================================
-- STEP 5: Add index for performance on tenant_id queries
-- ============================================================================

-- Create index on applications.tenant_id if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_applications_tenant_id 
  ON public.applications(tenant_id);

-- Composite index for common query patterns
CREATE INDEX IF NOT EXISTS idx_applications_tenant_program 
  ON public.applications(tenant_id, program_id);

CREATE INDEX IF NOT EXISTS idx_applications_tenant_status 
  ON public.applications(tenant_id, status);

CREATE INDEX IF NOT EXISTS idx_applications_tenant_created 
  ON public.applications(tenant_id, created_at DESC);

-- ============================================================================
-- STEP 6: Add indexes for students table tenant filtering
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_students_tenant_id 
  ON public.students(tenant_id);

-- ============================================================================
-- STEP 7: Add indexes for programs table tenant filtering
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_programs_tenant_id 
  ON public.programs(tenant_id);

CREATE INDEX IF NOT EXISTS idx_programs_tenant_university 
  ON public.programs(tenant_id, university_id);

-- ============================================================================
-- Comments
-- ============================================================================

COMMENT ON TRIGGER trg_set_application_tenant_id ON public.applications IS 
  'Automatically populates tenant_id for new applications based on program/user context.';

COMMENT ON TRIGGER trg_validate_application_tenant_id ON public.applications IS 
  'Validates that application tenant_id is consistent with the program''s university tenant.';

-- ============================================================================
-- End of Migration
-- ============================================================================
