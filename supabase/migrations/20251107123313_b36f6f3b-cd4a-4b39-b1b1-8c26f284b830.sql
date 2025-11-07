-- Fix search_path for all functions to prevent SQL injection
-- This addresses the security linter warnings

-- Fix update_agent_student_links_updated_at function
DROP FUNCTION IF EXISTS update_agent_student_links_updated_at CASCADE;
CREATE OR REPLACE FUNCTION update_agent_student_links_updated_at()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_agent_student_links_updated_at
  BEFORE UPDATE ON public.agent_student_links
  FOR EACH ROW
  EXECUTE FUNCTION update_agent_student_links_updated_at();

-- Fix update_updated_at_column function if it exists
DROP FUNCTION IF EXISTS public.update_updated_at_column CASCADE;
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER  
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Recreate triggers that use this function
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN 
    SELECT DISTINCT trigger_schema, event_object_table
    FROM information_schema.triggers
    WHERE trigger_name LIKE '%_updated_at'
      AND trigger_schema = 'public'
      AND event_object_table != 'agent_student_links'
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS update_%I_updated_at ON public.%I CASCADE', 
                   r.event_object_table, r.event_object_table);
    EXECUTE format('CREATE TRIGGER update_%I_updated_at BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column()',
                   r.event_object_table, r.event_object_table);
  END LOOP;
END;
$$;