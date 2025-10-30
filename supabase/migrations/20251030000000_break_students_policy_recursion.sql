-- Break remaining recursion in students RLS policies by avoiding live queries to applications
-- Introduce a dedicated agent_student_links table that is maintained via triggers

CREATE TABLE IF NOT EXISTS public.agent_student_links (
  agent_profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  PRIMARY KEY (agent_profile_id, student_id)
);

-- This table is only referenced inside security definer helpers. RLS would re-introduce recursion, so keep it disabled.
ALTER TABLE public.agent_student_links DISABLE ROW LEVEL SECURITY;

-- Seed initial agent/student links from existing applications
INSERT INTO public.agent_student_links (agent_profile_id, student_id)
SELECT DISTINCT ag.profile_id, a.student_id
FROM public.applications a
JOIN public.agents ag ON ag.id = a.agent_id
WHERE a.agent_id IS NOT NULL
  AND a.student_id IS NOT NULL
ON CONFLICT DO NOTHING;

-- Helper to ensure a link exists for the current application row
CREATE OR REPLACE FUNCTION public.ensure_agent_student_link()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_agent_profile UUID;
BEGIN
  IF NEW.agent_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT ag.profile_id INTO v_agent_profile
  FROM public.agents ag
  WHERE ag.id = NEW.agent_id;

  IF v_agent_profile IS NULL THEN
    RETURN NEW;
  END IF;

  INSERT INTO public.agent_student_links (agent_profile_id, student_id)
  VALUES (v_agent_profile, NEW.student_id)
  ON CONFLICT (agent_profile_id, student_id) DO NOTHING;

  RETURN NEW;
END;
$$;

-- Helper to clean up links when assignments change or are removed
CREATE OR REPLACE FUNCTION public.cleanup_agent_student_link()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_agent_profile UUID;
  v_excluded_application UUID := NULL;
BEGIN
  IF TG_OP = 'UPDATE' THEN
    IF (OLD.agent_id IS NOT DISTINCT FROM NEW.agent_id) AND (OLD.student_id IS NOT DISTINCT FROM NEW.student_id) THEN
      RETURN NEW;
    END IF;
    v_excluded_application := NEW.id;
  END IF;

  IF OLD.agent_id IS NULL THEN
    IF TG_OP = 'UPDATE' THEN
      RETURN NEW;
    ELSE
      RETURN OLD;
    END IF;
  END IF;

  SELECT ag.profile_id INTO v_agent_profile
  FROM public.agents ag
  WHERE ag.id = OLD.agent_id;

  IF v_agent_profile IS NULL THEN
    IF TG_OP = 'UPDATE' THEN
      RETURN NEW;
    ELSE
      RETURN OLD;
    END IF;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.applications a
    WHERE a.agent_id = OLD.agent_id
      AND a.student_id = OLD.student_id
      AND (v_excluded_application IS NULL OR a.id <> v_excluded_application)
  ) THEN
    DELETE FROM public.agent_student_links
    WHERE agent_profile_id = v_agent_profile
      AND student_id = OLD.student_id;
  END IF;

  IF TG_OP = 'UPDATE' THEN
    RETURN NEW;
  END IF;

  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS trg_applications_ensure_agent_student_link ON public.applications;
CREATE TRIGGER trg_applications_ensure_agent_student_link
AFTER INSERT OR UPDATE OF agent_id, student_id ON public.applications
FOR EACH ROW
EXECUTE FUNCTION public.ensure_agent_student_link();

DROP TRIGGER IF EXISTS trg_applications_cleanup_agent_student_link ON public.applications;
CREATE TRIGGER trg_applications_cleanup_agent_student_link
AFTER UPDATE OF agent_id, student_id OR DELETE ON public.applications
FOR EACH ROW
EXECUTE FUNCTION public.cleanup_agent_student_link();

-- Update helper to rely on the dedicated link table instead of querying applications directly
CREATE OR REPLACE FUNCTION public.agent_can_view_student(requester_id UUID, target_student_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.agent_student_links asl
    WHERE asl.agent_profile_id = requester_id
      AND asl.student_id = target_student_id
  );
$$;
