-- The issue is circular dependencies between students and applications tables

-- Ensure applications table stores a direct reference to the student profile
ALTER TABLE public.applications
  ADD COLUMN IF NOT EXISTS student_profile_id UUID;

-- Backfill the profile reference for existing rows
UPDATE public.applications a
SET student_profile_id = s.profile_id
FROM public.students s
WHERE a.student_id = s.id
  AND (a.student_profile_id IS DISTINCT FROM s.profile_id OR a.student_profile_id IS NULL);

-- Enforce presence of the new reference and maintain referential integrity
ALTER TABLE public.applications
  ALTER COLUMN student_profile_id SET NOT NULL;

ALTER TABLE public.applications
  DROP CONSTRAINT IF EXISTS applications_student_profile_id_fkey;

ALTER TABLE public.applications
  ADD CONSTRAINT applications_student_profile_id_fkey
  FOREIGN KEY (student_profile_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Keep student_profile_id in sync whenever the student_id changes
CREATE OR REPLACE FUNCTION public.set_application_student_profile_id()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  SELECT profile_id
    INTO NEW.student_profile_id
  FROM public.students
  WHERE id = NEW.student_id;

  IF NEW.student_profile_id IS NULL THEN
    RAISE EXCEPTION 'No student profile found for student %', NEW.student_id;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_set_application_student_profile_id ON public.applications;

CREATE TRIGGER trg_set_application_student_profile_id
  BEFORE INSERT OR UPDATE OF student_id ON public.applications
  FOR EACH ROW
  EXECUTE FUNCTION public.set_application_student_profile_id();

-- Drop all problematic policies
DROP POLICY IF EXISTS "Students can view their own applications" ON public.applications;
DROP POLICY IF EXISTS "Students can create and update their applications" ON public.applications;
DROP POLICY IF EXISTS "Students can create applications" ON public.applications;
DROP POLICY IF EXISTS "Students can update their draft applications" ON public.applications;
DROP POLICY IF EXISTS "Agents can view their students' applications" ON public.applications;
DROP POLICY IF EXISTS "Partners can view applications to their university" ON public.applications;
DROP POLICY IF EXISTS "Staff can manage all applications" ON public.applications;

DROP POLICY IF EXISTS "Students can view their own record" ON public.students;
DROP POLICY IF EXISTS "Students can update their own record" ON public.students;
DROP POLICY IF EXISTS "Agents can view their students" ON public.students;
DROP POLICY IF EXISTS "Staff can view all students" ON public.students;
DROP POLICY IF EXISTS "Staff can manage students" ON public.students;

DROP POLICY IF EXISTS "Students can manage docs for their applications" ON public.application_documents;
DROP POLICY IF EXISTS "Agents can view docs for their applications" ON public.application_documents;
DROP POLICY IF EXISTS "Staff can manage all docs" ON public.application_documents;

DROP POLICY IF EXISTS "Users can view messages for their applications" ON public.messages;
DROP POLICY IF EXISTS "Users can send messages on their applications" ON public.messages;

DROP POLICY IF EXISTS "Students can view their payments" ON public.payments;
DROP POLICY IF EXISTS "Staff can manage payments" ON public.payments;

DROP POLICY IF EXISTS "Students can view offers for their applications" ON public.offers;
DROP POLICY IF EXISTS "Staff can manage offers" ON public.offers;

DROP POLICY IF EXISTS "Students can view their CAS/LOA" ON public.cas_loa;
DROP POLICY IF EXISTS "Staff can manage CAS/LOA" ON public.cas_loa;

-- ============================================================================
-- STUDENTS TABLE POLICIES (NO CIRCULAR REFERENCES)
-- ============================================================================

-- Students can only see their own record
CREATE POLICY "Students can view their own record"
ON public.students
FOR SELECT
USING (profile_id = auth.uid());

-- Students can only update their own record
CREATE POLICY "Students can update their own record"
ON public.students
FOR UPDATE
USING (profile_id = auth.uid());

-- Staff can view all students (no circular reference)
CREATE POLICY "Staff can view all students"
ON public.students
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'staff')
  )
);

-- Staff can manage all students
CREATE POLICY "Staff can manage students"
ON public.students
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'staff')
  )
);

-- Agents can view their students (no circular reference - direct join)
CREATE POLICY "Agents can view their students"
ON public.students
FOR SELECT
USING (
  EXISTS (
    SELECT 1 
    FROM public.agents ag
    INNER JOIN public.applications a ON a.agent_id = ag.id
    WHERE ag.profile_id = auth.uid()
    AND a.student_id = students.id
  )
);

-- ============================================================================
-- APPLICATIONS TABLE POLICIES (NO CIRCULAR REFERENCES)
-- ============================================================================

-- Students can view their own applications (direct join, no subquery to students)
CREATE POLICY "Students can view their own applications"
ON public.applications
FOR SELECT
USING (
  student_profile_id = auth.uid()
);

-- Students can create applications (direct join)
CREATE POLICY "Students can create applications"
ON public.applications
FOR INSERT
WITH CHECK (
  student_profile_id = auth.uid()
);

-- Students can update their draft applications (direct join)
CREATE POLICY "Students can update their draft applications"
ON public.applications
FOR UPDATE
USING (
  student_profile_id = auth.uid()
  AND status = 'draft'
);

-- Agents can view their students' applications
CREATE POLICY "Agents can view their students applications"
ON public.applications
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.agents ag
    WHERE ag.id = applications.agent_id
    AND ag.profile_id = auth.uid()
  )
);

-- Partners can view applications to their programs
CREATE POLICY "Partners can view applications to their programs"
ON public.applications
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles prof
    WHERE prof.id = auth.uid()
    AND prof.role = 'partner'
  )
);

-- Staff can manage all applications
CREATE POLICY "Staff can manage all applications"
ON public.applications
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'staff')
  )
);

-- ============================================================================
-- APPLICATION DOCUMENTS POLICIES
-- ============================================================================

CREATE POLICY "Students can manage docs for their applications"
ON public.application_documents
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.applications a
    INNER JOIN public.students s ON a.student_id = s.id
    WHERE a.id = application_documents.application_id
    AND s.profile_id = auth.uid()
  )
);

CREATE POLICY "Agents can view docs for their applications"
ON public.application_documents
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.applications a
    INNER JOIN public.agents ag ON a.agent_id = ag.id
    WHERE a.id = application_documents.application_id
    AND ag.profile_id = auth.uid()
  )
);

CREATE POLICY "Staff can manage all docs"
ON public.application_documents
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'staff')
  )
);

-- ============================================================================
-- MESSAGES POLICIES
-- ============================================================================

CREATE POLICY "Users can view messages for their applications"
ON public.messages
FOR SELECT
USING (
  -- Student owns the application
  EXISTS (
    SELECT 1 FROM public.applications a
    INNER JOIN public.students s ON a.student_id = s.id
    WHERE a.id = messages.application_id
    AND s.profile_id = auth.uid()
  )
  OR
  -- Agent is assigned to the application
  EXISTS (
    SELECT 1 FROM public.applications a
    INNER JOIN public.agents ag ON a.agent_id = ag.id
    WHERE a.id = messages.application_id
    AND ag.profile_id = auth.uid()
  )
  OR
  -- User is staff
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'staff')
  )
);

CREATE POLICY "Users can send messages on their applications"
ON public.messages
FOR INSERT
WITH CHECK (
  sender_id = auth.uid()
  AND (
    -- Student owns the application
    EXISTS (
      SELECT 1 FROM public.applications a
      INNER JOIN public.students s ON a.student_id = s.id
      WHERE a.id = messages.application_id
      AND s.profile_id = auth.uid()
    )
    OR
    -- Agent is assigned to the application
    EXISTS (
      SELECT 1 FROM public.applications a
      INNER JOIN public.agents ag ON a.agent_id = ag.id
      WHERE a.id = messages.application_id
      AND ag.profile_id = auth.uid()
    )
    OR
    -- User is staff
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'staff')
    )
  )
);

-- ============================================================================
-- PAYMENTS POLICIES
-- ============================================================================

CREATE POLICY "Students can view their payments"
ON public.payments
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.applications a
    INNER JOIN public.students s ON a.student_id = s.id
    WHERE a.id = payments.application_id
    AND s.profile_id = auth.uid()
  )
);

CREATE POLICY "Staff can manage payments"
ON public.payments
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'staff')
  )
);

-- ============================================================================
-- OFFERS POLICIES
-- ============================================================================

CREATE POLICY "Students can view offers for their applications"
ON public.offers
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.applications a
    INNER JOIN public.students s ON a.student_id = s.id
    WHERE a.id = offers.application_id
    AND s.profile_id = auth.uid()
  )
);

CREATE POLICY "Students can accept offers"
ON public.offers
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.applications a
    INNER JOIN public.students s ON a.student_id = s.id
    WHERE a.id = offers.application_id
    AND s.profile_id = auth.uid()
  )
);

CREATE POLICY "Staff can manage offers"
ON public.offers
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'staff')
  )
);

-- ============================================================================
-- CAS/LOA POLICIES
-- ============================================================================

CREATE POLICY "Students can view their CAS LOA"
ON public.cas_loa
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.applications a
    INNER JOIN public.students s ON a.student_id = s.id
    WHERE a.id = cas_loa.application_id
    AND s.profile_id = auth.uid()
  )
);

CREATE POLICY "Staff can manage CAS LOA"
ON public.cas_loa
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'staff')
  )
);

-- Add comment to track fix
COMMENT ON TABLE students IS 'Fixed infinite recursion in RLS policies on 2025-10-27';
COMMENT ON TABLE applications IS 'Fixed infinite recursion in RLS policies on 2025-10-27';
