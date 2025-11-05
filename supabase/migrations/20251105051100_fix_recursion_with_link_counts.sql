-- Step 1: Add the application_count column to agent_student_links
ALTER TABLE public.agent_student_links
ADD COLUMN application_count INTEGER NOT NULL DEFAULT 0;

-- Step 2: Backfill the counts for existing links.
WITH counts AS (
  SELECT
    ag.profile_id AS agent_profile_id,
    a.student_id,
    COUNT(a.id) AS count
  FROM public.applications a
  JOIN public.agents ag ON ag.id = a.agent_id
  WHERE a.agent_id IS NOT NULL AND a.student_id IS NOT NULL
  GROUP BY ag.profile_id, a.student_id
)
UPDATE public.agent_student_links asl
SET application_count = counts.count
FROM counts
WHERE asl.agent_profile_id = counts.agent_profile_id
  AND asl.student_id = counts.student_id;

-- Step 3: Update the ensure_agent_student_link function to use counts
CREATE OR REPLACE FUNCTION public.ensure_agent_student_link()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_agent_profile UUID;
BEGIN
  IF NEW.agent_id IS NULL OR NEW.student_id IS NULL THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' AND
     NEW.agent_id IS NOT DISTINCT FROM OLD.agent_id AND
     NEW.student_id IS NOT DISTINCT FROM OLD.student_id
  THEN
    RETURN NEW;
  END IF;

  SELECT ag.profile_id INTO v_agent_profile
  FROM public.agents ag
  WHERE ag.id = NEW.agent_id;

  IF v_agent_profile IS NOT NULL THEN
    INSERT INTO public.agent_student_links (agent_profile_id, student_id, application_count)
    VALUES (v_agent_profile, NEW.student_id, 1)
    ON CONFLICT (agent_profile_id, student_id)
    DO UPDATE SET application_count = agent_student_links.application_count + 1;
  END IF;

  RETURN NEW;
END;
$$;

-- Step 4: Update the cleanup_agent_student_link function to use counts
CREATE OR REPLACE FUNCTION public.cleanup_agent_student_link()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_agent_profile UUID;
BEGIN
  IF OLD.agent_id IS NULL OR OLD.student_id IS NULL THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  IF TG_OP = 'UPDATE' AND
     OLD.agent_id IS NOT DISTINCT FROM NEW.agent_id AND
     OLD.student_id IS NOT DISTINCT FROM NEW.student_id
  THEN
    RETURN NEW;
  END IF;

  SELECT ag.profile_id INTO v_agent_profile
  FROM public.agents ag
  WHERE ag.id = OLD.agent_id;

  IF v_agent_profile IS NOT NULL THEN
    UPDATE public.agent_student_links
    SET application_count = application_count - 1
    WHERE agent_profile_id = v_agent_profile
      AND student_id = OLD.student_id;

    DELETE FROM public.agent_student_links
    WHERE agent_profile_id = v_agent_profile
      AND student_id = OLD.student_id
      AND application_count <= 0;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Step 5: Update the students RLS policy to check the count
ALTER POLICY "Agents can view their students" ON public.students
USING (
  EXISTS (
    SELECT 1
    FROM public.agent_student_links asl
    WHERE asl.student_id = students.id
      AND asl.agent_profile_id = auth.uid()
      AND asl.application_count > 0
  )
);
