-- Migration: Add unique tracking codes to universities
-- Purpose: Enable unique identification of universities for application tracking
-- This migration safely adds the code field without altering existing data

-- Add the code column if it doesn't exist
ALTER TABLE public.universities
ADD COLUMN IF NOT EXISTS code TEXT;

-- Create a function to generate unique university codes
-- Format: UNI-XXXXX (where X is alphanumeric)
CREATE OR REPLACE FUNCTION public.generate_university_code()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_code TEXT;
  code_exists BOOLEAN;
BEGIN
  LOOP
    -- Generate a random 5-character alphanumeric code
    new_code := 'UNI-' || upper(substring(md5(random()::text || clock_timestamp()::text) from 1 for 5));
    
    -- Check if code already exists
    SELECT EXISTS(SELECT 1 FROM public.universities WHERE code = new_code) INTO code_exists;
    
    -- Exit loop if code is unique
    EXIT WHEN NOT code_exists;
  END LOOP;
  
  RETURN new_code;
END;
$$;

-- Generate codes for existing universities that don't have one
UPDATE public.universities
SET code = public.generate_university_code()
WHERE code IS NULL;

-- Add unique constraint on code (after populating existing rows)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'universities_code_unique'
  ) THEN
    ALTER TABLE public.universities
    ADD CONSTRAINT universities_code_unique UNIQUE (code);
  END IF;
END $$;

-- Create trigger to auto-generate code on insert
CREATE OR REPLACE FUNCTION public.set_university_code()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.code IS NULL THEN
    NEW.code := public.generate_university_code();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_set_university_code ON public.universities;
CREATE TRIGGER trigger_set_university_code
  BEFORE INSERT ON public.universities
  FOR EACH ROW
  EXECUTE FUNCTION public.set_university_code();

-- Create index on code for fast lookups
CREATE INDEX IF NOT EXISTS idx_universities_code ON public.universities(code);

-- Create a function to get application counts per university
-- This leverages the existing applications table structure
CREATE OR REPLACE FUNCTION public.get_university_application_stats(p_tenant_id UUID DEFAULT NULL)
RETURNS TABLE (
  university_id UUID,
  university_name TEXT,
  university_code TEXT,
  university_country TEXT,
  total_applications BIGINT,
  submitted_applications BIGINT,
  pending_applications BIGINT,
  successful_applications BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.id AS university_id,
    u.name AS university_name,
    u.code AS university_code,
    u.country AS university_country,
    COALESCE(COUNT(a.id), 0)::BIGINT AS total_applications,
    COALESCE(COUNT(a.id) FILTER (WHERE a.status NOT IN ('draft')), 0)::BIGINT AS submitted_applications,
    COALESCE(COUNT(a.id) FILTER (WHERE a.status IN ('submitted', 'screening')), 0)::BIGINT AS pending_applications,
    COALESCE(COUNT(a.id) FILTER (WHERE a.status IN ('conditional_offer', 'unconditional_offer', 'cas_loa', 'visa', 'enrolled')), 0)::BIGINT AS successful_applications
  FROM public.universities u
  LEFT JOIN public.programs p ON p.university_id = u.id
  LEFT JOIN public.applications a ON a.program_id = p.id
  WHERE (p_tenant_id IS NULL OR u.tenant_id = p_tenant_id)
  GROUP BY u.id, u.name, u.code, u.country
  ORDER BY total_applications DESC, u.name ASC;
END;
$$;

-- Grant execute permission on the stats function
GRANT EXECUTE ON FUNCTION public.get_university_application_stats(UUID) TO authenticated;

-- Create a simpler function for partners to get their own university's application count
CREATE OR REPLACE FUNCTION public.get_my_university_applications_count()
RETURNS TABLE (
  total_applications BIGINT,
  submitted_applications BIGINT,
  pending_review BIGINT,
  offers_made BIGINT,
  enrolled BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
DECLARE
  v_tenant_id UUID;
BEGIN
  -- Get the current user's tenant_id
  SELECT tenant_id INTO v_tenant_id
  FROM public.profiles
  WHERE id = auth.uid();
  
  IF v_tenant_id IS NULL THEN
    RETURN QUERY SELECT 0::BIGINT, 0::BIGINT, 0::BIGINT, 0::BIGINT, 0::BIGINT;
    RETURN;
  END IF;
  
  RETURN QUERY
  SELECT 
    COALESCE(COUNT(a.id), 0)::BIGINT AS total_applications,
    COALESCE(COUNT(a.id) FILTER (WHERE a.status NOT IN ('draft')), 0)::BIGINT AS submitted_applications,
    COALESCE(COUNT(a.id) FILTER (WHERE a.status IN ('submitted', 'screening')), 0)::BIGINT AS pending_review,
    COALESCE(COUNT(a.id) FILTER (WHERE a.status IN ('conditional_offer', 'unconditional_offer')), 0)::BIGINT AS offers_made,
    COALESCE(COUNT(a.id) FILTER (WHERE a.status = 'enrolled'), 0)::BIGINT AS enrolled
  FROM public.universities u
  INNER JOIN public.programs p ON p.university_id = u.id
  INNER JOIN public.applications a ON a.program_id = p.id
  WHERE u.tenant_id = v_tenant_id;
END;
$$;

-- Grant execute permission on partner function
GRANT EXECUTE ON FUNCTION public.get_my_university_applications_count() TO authenticated;

COMMENT ON COLUMN public.universities.code IS 'Unique tracking code for the university (auto-generated, format: UNI-XXXXX)';
COMMENT ON FUNCTION public.generate_university_code() IS 'Generates a unique university tracking code';
COMMENT ON FUNCTION public.get_university_application_stats(UUID) IS 'Returns application statistics per university for admin visibility';
COMMENT ON FUNCTION public.get_my_university_applications_count() IS 'Returns application counts for the current partner user''s university';
