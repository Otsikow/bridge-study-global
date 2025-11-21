-- Allow agents to submit applications on behalf of students and track submissions

-- Track whether an application was submitted by an agent
ALTER TABLE public.applications
ADD COLUMN IF NOT EXISTS submitted_by_agent BOOLEAN NOT NULL DEFAULT false;

-- Allow agents to manage drafts for students they are linked to
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'application_drafts'
      AND policyname = 'Agents can manage drafts for linked students'
  ) THEN
    CREATE POLICY "Agents can manage drafts for linked students"
      ON public.application_drafts
      FOR ALL
      USING (
        student_id IN (
          SELECT asl.student_id
          FROM public.agent_student_links asl
          JOIN public.agents ag ON ag.id = asl.agent_id
          WHERE ag.profile_id = auth.uid()
        )
      )
      WITH CHECK (
        student_id IN (
          SELECT asl.student_id
          FROM public.agent_student_links asl
          JOIN public.agents ag ON ag.id = asl.agent_id
          WHERE ag.profile_id = auth.uid()
        )
      );
  END IF;
END $$;

-- Allow agents to insert and update applications for their linked students
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'applications'
      AND policyname = 'Agents can create applications for linked students'
  ) THEN
    CREATE POLICY "Agents can create applications for linked students"
      ON public.applications
      FOR INSERT
      WITH CHECK (
        agent_id IN (
          SELECT ag.id FROM public.agents ag WHERE ag.profile_id = auth.uid()
        )
        AND student_id IN (
          SELECT asl.student_id
          FROM public.agent_student_links asl
          JOIN public.agents ag ON ag.id = asl.agent_id
          WHERE ag.profile_id = auth.uid()
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'applications'
      AND policyname = 'Agents can update their applications'
  ) THEN
    CREATE POLICY "Agents can update their applications"
      ON public.applications
      FOR UPDATE
      USING (
        agent_id IN (
          SELECT ag.id FROM public.agents ag WHERE ag.profile_id = auth.uid()
        )
      )
      WITH CHECK (
        agent_id IN (
          SELECT ag.id FROM public.agents ag WHERE ag.profile_id = auth.uid()
        )
      );
  END IF;
END $$;
