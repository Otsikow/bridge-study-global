-- Fix university profile isolation issues
-- 1. Add UNIQUE constraint on tenant_id to prevent multiple universities per tenant
-- 2. Update RLS policies to allow students to view all university profiles

-- First, clean up any duplicate universities per tenant (keep the most recently updated one)
DO $$
DECLARE
  duplicate_tenant RECORD;
  university_to_keep UUID;
  universities_to_delete UUID[];
BEGIN
  -- Find tenants with multiple universities
  FOR duplicate_tenant IN
    SELECT tenant_id, COUNT(*) as uni_count
    FROM public.universities
    GROUP BY tenant_id
    HAVING COUNT(*) > 1
  LOOP
    -- Get the ID of the most recently updated university for this tenant
    SELECT id INTO university_to_keep
    FROM public.universities
    WHERE tenant_id = duplicate_tenant.tenant_id
    ORDER BY updated_at DESC NULLS LAST, created_at DESC
    LIMIT 1;

    -- Get IDs of all other universities for this tenant
    SELECT ARRAY_AGG(id) INTO universities_to_delete
    FROM public.universities
    WHERE tenant_id = duplicate_tenant.tenant_id
      AND id != university_to_keep;

    -- Update all references to point to the university we're keeping
    IF universities_to_delete IS NOT NULL AND array_length(universities_to_delete, 1) > 0 THEN
      -- Update programs
      UPDATE public.programs
      SET university_id = university_to_keep
      WHERE university_id = ANY(universities_to_delete);

      -- Update scholarships (if table exists)
      UPDATE public.scholarships
      SET university_id = university_to_keep
      WHERE university_id = ANY(universities_to_delete);

      -- Update intake_calendars
      UPDATE public.intake_calendars
      SET university_id = university_to_keep
      WHERE university_id = ANY(universities_to_delete);

      -- Note: applications table doesn't have university_id column
      -- It links to universities through programs.university_id

      -- Delete the duplicate universities
      DELETE FROM public.universities
      WHERE id = ANY(universities_to_delete);

      RAISE NOTICE 'Cleaned up % duplicate universities for tenant %',
        array_length(universities_to_delete, 1), duplicate_tenant.tenant_id;
    END IF;
  END LOOP;
END$$;

-- Add UNIQUE constraint on tenant_id to prevent future duplicates
ALTER TABLE public.universities
ADD CONSTRAINT universities_tenant_id_unique UNIQUE (tenant_id);

-- Update the upsert conflict target in code to use tenant_id
-- This allows upsert to work correctly: INSERT or UPDATE based on tenant_id

-- Drop the old restrictive SELECT policy
DROP POLICY IF EXISTS "Anyone can view universities in their tenant" ON public.universities;

-- Create new SELECT policy that allows:
-- 1. Public read access to active universities (for students to browse)
-- 2. Full access for users in the same tenant (for partners/staff)
-- 3. Full access for admins
CREATE POLICY "Public can view active universities"
  ON public.universities FOR SELECT
  USING (
    active = true
    OR tenant_id = get_user_tenant(auth.uid())
    OR is_admin_or_staff(auth.uid())
  );

-- Ensure admins still have full control (this policy should already exist)
DROP POLICY IF EXISTS "Admins can manage universities" ON public.universities;
CREATE POLICY "Admins can manage universities"
  ON public.universities FOR ALL
  USING (is_admin_or_staff(auth.uid()))
  WITH CHECK (is_admin_or_staff(auth.uid()));

COMMENT ON CONSTRAINT universities_tenant_id_unique ON public.universities IS
  'Ensures each tenant can only have one university profile, preventing cross-contamination';
