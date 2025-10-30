-- Ensure student-linked tables reference profiles directly to avoid RLS recursion

-- Add student_profile_id columns where missing
ALTER TABLE public.education_records
  ADD COLUMN IF NOT EXISTS student_profile_id UUID;

ALTER TABLE public.test_scores
  ADD COLUMN IF NOT EXISTS student_profile_id UUID;

ALTER TABLE public.student_documents
  ADD COLUMN IF NOT EXISTS student_profile_id UUID;

ALTER TABLE public.student_assignments
  ADD COLUMN IF NOT EXISTS student_profile_id UUID;

-- Backfill profile references using the students table
UPDATE public.education_records er
SET student_profile_id = s.profile_id
FROM public.students s
WHERE er.student_id = s.id
  AND (er.student_profile_id IS DISTINCT FROM s.profile_id OR er.student_profile_id IS NULL);

UPDATE public.test_scores ts
SET student_profile_id = s.profile_id
FROM public.students s
WHERE ts.student_id = s.id
  AND (ts.student_profile_id IS DISTINCT FROM s.profile_id OR ts.student_profile_id IS NULL);

UPDATE public.student_documents sd
SET student_profile_id = s.profile_id
FROM public.students s
WHERE sd.student_id = s.id
  AND (sd.student_profile_id IS DISTINCT FROM s.profile_id OR sd.student_profile_id IS NULL);

UPDATE public.student_assignments sa
SET student_profile_id = s.profile_id
FROM public.students s
WHERE sa.student_id = s.id
  AND (sa.student_profile_id IS DISTINCT FROM s.profile_id OR sa.student_profile_id IS NULL);

-- Enforce the new references
ALTER TABLE public.education_records
  ALTER COLUMN student_profile_id SET NOT NULL;

ALTER TABLE public.test_scores
  ALTER COLUMN student_profile_id SET NOT NULL;

ALTER TABLE public.student_documents
  ALTER COLUMN student_profile_id SET NOT NULL;

ALTER TABLE public.student_assignments
  ALTER COLUMN student_profile_id SET NOT NULL;

ALTER TABLE public.education_records
  DROP CONSTRAINT IF EXISTS education_records_student_profile_id_fkey;

ALTER TABLE public.education_records
  ADD CONSTRAINT education_records_student_profile_id_fkey
  FOREIGN KEY (student_profile_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.test_scores
  DROP CONSTRAINT IF EXISTS test_scores_student_profile_id_fkey;

ALTER TABLE public.test_scores
  ADD CONSTRAINT test_scores_student_profile_id_fkey
  FOREIGN KEY (student_profile_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.student_documents
  DROP CONSTRAINT IF EXISTS student_documents_student_profile_id_fkey;

ALTER TABLE public.student_documents
  ADD CONSTRAINT student_documents_student_profile_id_fkey
  FOREIGN KEY (student_profile_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.student_assignments
  DROP CONSTRAINT IF EXISTS student_assignments_student_profile_id_fkey;

ALTER TABLE public.student_assignments
  ADD CONSTRAINT student_assignments_student_profile_id_fkey
  FOREIGN KEY (student_profile_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Generic helper to keep student_profile_id in sync
CREATE OR REPLACE FUNCTION public.sync_student_profile_id()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.student_id IS NULL THEN
    NEW.student_profile_id := NULL;
    RETURN NEW;
  END IF;

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

-- Triggers for each table that stores a student reference
DROP TRIGGER IF EXISTS trg_education_records_sync_student_profile ON public.education_records;
CREATE TRIGGER trg_education_records_sync_student_profile
  BEFORE INSERT OR UPDATE OF student_id ON public.education_records
  FOR EACH ROW EXECUTE FUNCTION public.sync_student_profile_id();

DROP TRIGGER IF EXISTS trg_test_scores_sync_student_profile ON public.test_scores;
CREATE TRIGGER trg_test_scores_sync_student_profile
  BEFORE INSERT OR UPDATE OF student_id ON public.test_scores
  FOR EACH ROW EXECUTE FUNCTION public.sync_student_profile_id();

DROP TRIGGER IF EXISTS trg_student_documents_sync_student_profile ON public.student_documents;
CREATE TRIGGER trg_student_documents_sync_student_profile
  BEFORE INSERT OR UPDATE OF student_id ON public.student_documents
  FOR EACH ROW EXECUTE FUNCTION public.sync_student_profile_id();

DROP TRIGGER IF EXISTS trg_student_assignments_sync_student_profile ON public.student_assignments;
CREATE TRIGGER trg_student_assignments_sync_student_profile
  BEFORE INSERT OR UPDATE OF student_id ON public.student_assignments
  FOR EACH ROW EXECUTE FUNCTION public.sync_student_profile_id();

-- Replace policies to rely on the direct profile reference
DROP POLICY IF EXISTS "Students can manage their own education records" ON public.education_records;
CREATE POLICY "Students can manage their own education records"
ON public.education_records
FOR ALL
USING (student_profile_id = auth.uid())
WITH CHECK (student_profile_id = auth.uid());

DROP POLICY IF EXISTS "Students can manage their own test scores" ON public.test_scores;
CREATE POLICY "Students can manage their own test scores"
ON public.test_scores
FOR ALL
USING (student_profile_id = auth.uid())
WITH CHECK (student_profile_id = auth.uid());

DROP POLICY IF EXISTS "Students can manage their own documents" ON public.student_documents;
CREATE POLICY "Students can manage their own documents"
ON public.student_documents
FOR ALL
USING (student_profile_id = auth.uid())
WITH CHECK (student_profile_id = auth.uid());

DROP POLICY IF EXISTS "Students can view their assignments" ON public.student_assignments;
CREATE POLICY "Students can view their assignments"
ON public.student_assignments
FOR SELECT
USING (student_profile_id = auth.uid());

-- Counselor and staff policies remain the same but drop/recreate to ensure consistency
DROP POLICY IF EXISTS "Counselors can view assigned students' education records" ON public.education_records;
CREATE POLICY "Counselors can view assigned students' education records"
ON public.education_records
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.student_assignments sa
    WHERE sa.student_id = education_records.student_id
      AND sa.counselor_id = auth.uid()
  )
  OR is_admin_or_staff(auth.uid())
);

DROP POLICY IF EXISTS "Counselors can view assigned students' test scores" ON public.test_scores;
CREATE POLICY "Counselors can view assigned students' test scores"
ON public.test_scores
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.student_assignments sa
    WHERE sa.student_id = test_scores.student_id
      AND sa.counselor_id = auth.uid()
  )
  OR is_admin_or_staff(auth.uid())
);

DROP POLICY IF EXISTS "Counselors can view and verify assigned students' documents" ON public.student_documents;
CREATE POLICY "Counselors can view and verify assigned students' documents"
ON public.student_documents
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.student_assignments sa
    WHERE sa.student_id = student_documents.student_id
      AND sa.counselor_id = auth.uid()
  )
  OR is_admin_or_staff(auth.uid())
);

DROP POLICY IF EXISTS "Staff can verify documents" ON public.student_documents;
CREATE POLICY "Staff can verify documents"
ON public.student_documents
FOR UPDATE
USING (is_admin_or_staff(auth.uid()));

DROP POLICY IF EXISTS "Counselors can view their assignments" ON public.student_assignments;
CREATE POLICY "Counselors can view their assignments"
ON public.student_assignments
FOR SELECT
USING (counselor_id = auth.uid() OR is_admin_or_staff(auth.uid()));

DROP POLICY IF EXISTS "Staff can manage assignments" ON public.student_assignments;
CREATE POLICY "Staff can manage assignments"
ON public.student_assignments
FOR ALL
USING (is_admin_or_staff(auth.uid()))
WITH CHECK (is_admin_or_staff(auth.uid()));
