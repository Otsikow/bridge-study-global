-- Task auto-generation engine and task update policies

-- Ensure unique per (application_id, title)
CREATE UNIQUE INDEX IF NOT EXISTS ux_tasks_app_title ON public.tasks(application_id, title);

-- Create a helper function to generate stage-based tasks for an application
CREATE OR REPLACE FUNCTION public.generate_tasks_for_application(app_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  app_record RECORD;
  student_profile_id UUID;
  app_tenant_id UUID;
  stage TEXT;
  intake_dt DATE;
  due_base TIMESTAMPTZ := NOW();
BEGIN
  -- Load application details and context
  SELECT a.*, s.profile_id AS student_profile_id, a.tenant_id AS t_id
  INTO app_record
  FROM public.applications a
  JOIN public.students s ON s.id = a.student_id
  WHERE a.id = app_id;

  IF app_record.id IS NULL THEN
    RAISE NOTICE 'Application % not found', app_id;
    RETURN;
  END IF;

  student_profile_id := app_record.student_profile_id;
  app_tenant_id := app_record.t_id;
  stage := app_record.status::TEXT;
  intake_dt := MAKE_DATE(app_record.intake_year, GREATEST(1, LEAST(12, app_record.intake_month)), 1);

  -- Base tasks for a new/draft application
  IF stage IN ('draft') THEN
    INSERT INTO public.tasks (tenant_id, application_id, assignee_id, title, description, due_at, priority, status)
    SELECT app_tenant_id, app_id, student_profile_id, t.title, t.description, t.due_at, t.priority, 'open'
    FROM (
      SELECT 'Complete profile'::TEXT AS title, 'Fill in personal info, education, and test scores'::TEXT AS description, due_base + INTERVAL '3 days' AS due_at, 'high'::TEXT AS priority
      UNION ALL
      SELECT 'Upload passport', 'Upload a clear photo of your passport biodata page', due_base + INTERVAL '2 days', 'high'
      UNION ALL
      SELECT 'Upload transcripts', 'Provide your latest academic transcripts', due_base + INTERVAL '5 days', 'medium'
      UNION ALL
      SELECT 'Add language test score', 'Add IELTS/TOEFL/Duolingo score if available', due_base + INTERVAL '7 days', 'medium'
    ) t
    ON CONFLICT (application_id, title) DO NOTHING;
  END IF;

  -- Tasks for submitted stage
  IF stage IN ('submitted', 'screening') THEN
    INSERT INTO public.tasks (tenant_id, application_id, assignee_id, title, description, due_at, priority, status)
    SELECT app_tenant_id, app_id, student_profile_id, t.title, t.description, t.due_at, t.priority, 'open'
    FROM (
      SELECT 'Track application status', 'We will update you; check weekly for updates', due_base + INTERVAL '7 days', 'low'
      UNION ALL
      SELECT 'Prepare financial proofs', 'Collect bank statements and sponsorship letters', due_base + INTERVAL '14 days', 'medium'
      UNION ALL
      SELECT 'Prepare for interview (if required)', 'Review common credibility interview questions', due_base + INTERVAL '10 days', 'medium'
    ) t
    ON CONFLICT (application_id, title) DO NOTHING;
  END IF;

  -- Tasks for conditional offer
  IF stage = 'conditional_offer' THEN
    INSERT INTO public.tasks (tenant_id, application_id, assignee_id, title, description, due_at, priority, status)
    SELECT app_tenant_id, app_id, student_profile_id, t.title, t.description, t.due_at, t.priority, 'open'
    FROM (
      SELECT 'Satisfy offer conditions', 'Upload any missing documents and meet conditions', due_base + INTERVAL '10 days', 'high'
      UNION ALL
      SELECT 'Pay deposit', 'Pay the required program/university deposit', due_base + INTERVAL '7 days', 'high'
    ) t
    ON CONFLICT (application_id, title) DO NOTHING;
  END IF;

  -- Tasks for unconditional offer and CAS/LOA
  IF stage IN ('unconditional_offer', 'cas_loa') THEN
    INSERT INTO public.tasks (tenant_id, application_id, assignee_id, title, description, due_at, priority, status)
    SELECT app_tenant_id, app_id, student_profile_id, t.title, t.description, t.due_at, t.priority, 'open'
    FROM (
      SELECT 'Prepare visa documents', 'Gather financials, CAS/LOA, and other visa documents', due_base + INTERVAL '14 days', 'high'
      UNION ALL
      SELECT 'Book visa appointment', 'Schedule embassy/consulate appointment (if applicable)', due_base + INTERVAL '21 days', 'medium'
    ) t
    ON CONFLICT (application_id, title) DO NOTHING;
  END IF;

  -- Tasks for visa stage
  IF stage = 'visa' THEN
    INSERT INTO public.tasks (tenant_id, application_id, assignee_id, title, description, due_at, priority, status)
    SELECT app_tenant_id, app_id, student_profile_id, t.title, t.description, t.due_at, t.priority, 'open'
    FROM (
      SELECT 'Arrange accommodation', 'Secure housing near your university', due_base + INTERVAL '21 days', 'medium'
      UNION ALL
      SELECT 'Book travel', 'Book your flight and plan arrival', due_base + INTERVAL '30 days', 'low'
    ) t
    ON CONFLICT (application_id, title) DO NOTHING;
  END IF;
END;
$$;

-- Wrapper trigger function to invoke generation after insert/update
CREATE OR REPLACE FUNCTION public.on_application_stage_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.generate_tasks_for_application(NEW.id);
  RETURN NEW;
END;
$$;

-- Create triggers for applications
DROP TRIGGER IF EXISTS trg_generate_tasks_after_insert ON public.applications;
CREATE TRIGGER trg_generate_tasks_after_insert
AFTER INSERT ON public.applications
FOR EACH ROW
EXECUTE FUNCTION public.on_application_stage_change();

DROP TRIGGER IF EXISTS trg_generate_tasks_after_status_update ON public.applications;
CREATE TRIGGER trg_generate_tasks_after_status_update
AFTER UPDATE OF status ON public.applications
FOR EACH ROW
WHEN (OLD.status IS DISTINCT FROM NEW.status)
EXECUTE FUNCTION public.on_application_stage_change();

-- Allow assignees (students/agents) to update their own tasks
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'tasks' AND policyname = 'Assignees can update their tasks'
  ) THEN
    CREATE POLICY "Assignees can update their tasks"
    ON public.tasks
    FOR UPDATE
    USING (assignee_id = auth.uid() OR is_admin_or_staff(auth.uid()))
    WITH CHECK (assignee_id = auth.uid() OR is_admin_or_staff(auth.uid()));
  END IF;
END $$;
