-- Create a restricted view for agents to access student data
-- This view excludes sensitive fields like passport_number, passport_expiry, 
-- visa_history_json, and finances_json to protect student privacy

-- Drop the view if it already exists
DROP VIEW IF EXISTS public.agent_student_data_view CASCADE;

-- Create the restricted view
CREATE OR REPLACE VIEW public.agent_student_data_view AS
SELECT 
  s.id,
  s.tenant_id,
  s.profile_id,
  s.date_of_birth,
  s.nationality,
  -- passport_number is excluded (sensitive)
  s.address,
  s.education_history,
  s.test_scores,
  s.guardian,
  s.created_at,
  s.updated_at,
  s.legal_name,
  s.preferred_name,
  s.contact_email,
  s.contact_phone,
  s.current_country,
  -- passport_expiry is excluded (sensitive - passport related)
  -- visa_history_json is excluded (sensitive)
  -- finances_json is excluded (sensitive)
  s.consent_flags_json,
  s.profile_completeness
FROM public.students s;

-- Add comment describing the view purpose
COMMENT ON VIEW public.agent_student_data_view IS 
  'Restricted view for agents to access student data without sensitive fields (passport_number, passport_expiry, visa_history_json, finances_json)';

-- Grant SELECT access to authenticated users
-- The view will inherit RLS policies from the underlying students table
GRANT SELECT ON public.agent_student_data_view TO authenticated;

-- Enable security_invoker so RLS policies from the students table are respected
-- This ensures agents can only see students they are linked to
ALTER VIEW public.agent_student_data_view SET (security_invoker = true);

-- Create an index-friendly function to check if a user is an agent
-- This helps with efficient RLS policy evaluation
CREATE OR REPLACE FUNCTION public.is_agent(user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = user_id AND role = 'agent'
  );
$$;

-- Create a helper function for agents to get their linked students
-- This function returns only non-sensitive student data
CREATE OR REPLACE FUNCTION public.get_agent_linked_students(agent_profile_id UUID)
RETURNS TABLE (
  student_id UUID,
  tenant_id UUID,
  profile_id UUID,
  date_of_birth DATE,
  nationality TEXT,
  address JSONB,
  education_history JSONB,
  test_scores JSONB,
  guardian JSONB,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  legal_name TEXT,
  preferred_name TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  current_country TEXT,
  consent_flags_json JSONB,
  profile_completeness INTEGER,
  link_status TEXT,
  application_count INTEGER
)
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT 
    s.id AS student_id,
    s.tenant_id,
    s.profile_id,
    s.date_of_birth,
    s.nationality,
    s.address,
    s.education_history,
    s.test_scores,
    s.guardian,
    s.created_at,
    s.updated_at,
    s.legal_name,
    s.preferred_name,
    s.contact_email,
    s.contact_phone,
    s.current_country,
    s.consent_flags_json,
    s.profile_completeness,
    asl.status AS link_status,
    COALESCE(asl.application_count, 0)::INTEGER AS application_count
  FROM public.students s
  INNER JOIN public.agent_student_links asl ON asl.student_id = s.id
  INNER JOIN public.agents a ON a.id = asl.agent_id
  WHERE a.profile_id = agent_profile_id;
$$;

COMMENT ON FUNCTION public.get_agent_linked_students(UUID) IS 
  'Returns non-sensitive student data for students linked to the specified agent. Excludes passport_number, passport_expiry, visa_history_json, and finances_json.';
