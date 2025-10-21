-- Fix infinite recursion in students table RLS policies
-- Drop existing policies
DROP POLICY IF EXISTS "Agents can view their students" ON public.students;
DROP POLICY IF EXISTS "Staff can manage students" ON public.students;
DROP POLICY IF EXISTS "Staff can view all students" ON public.students;
DROP POLICY IF EXISTS "Students can update their own record" ON public.students;
DROP POLICY IF EXISTS "Students can view their own record" ON public.students;

-- Recreate policies with proper structure to avoid recursion
CREATE POLICY "Students can view their own record"
ON public.students
FOR SELECT
USING (profile_id = auth.uid());

CREATE POLICY "Students can update their own record"
ON public.students
FOR UPDATE
USING (profile_id = auth.uid());

CREATE POLICY "Staff can view all students"
ON public.students
FOR SELECT
USING (is_admin_or_staff(auth.uid()));

CREATE POLICY "Staff can manage students"
ON public.students
FOR ALL
USING (is_admin_or_staff(auth.uid()));

CREATE POLICY "Agents can view their students"
ON public.students
FOR SELECT
USING (
  id IN (
    SELECT a.student_id 
    FROM applications a
    INNER JOIN agents ag ON ag.id = a.agent_id
    WHERE ag.profile_id = auth.uid()
  )
);