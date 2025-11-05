-- Drop existing problematic policies
DROP POLICY IF EXISTS "Agents can view their students" ON students;
DROP POLICY IF EXISTS "Students can view their own applications" ON applications;
DROP POLICY IF EXISTS "Agents can view their students' applications" ON applications;

-- Create security definer function to check if user is a student
CREATE OR REPLACE FUNCTION public.is_student_owner(_user_id uuid, _student_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.students
    WHERE id = _student_id
    AND profile_id = _user_id
  )
$$;

-- Create security definer function to check if user is an agent for a student
CREATE OR REPLACE FUNCTION public.is_agent_for_student(_user_id uuid, _student_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.applications a
    INNER JOIN public.agents ag ON ag.id = a.agent_id
    WHERE a.student_id = _student_id
    AND ag.profile_id = _user_id
  )
$$;

-- Create security definer function to check if user is an agent for an application
CREATE OR REPLACE FUNCTION public.is_agent_for_application(_user_id uuid, _application_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.applications a
    INNER JOIN public.agents ag ON ag.id = a.agent_id
    WHERE a.id = _application_id
    AND ag.profile_id = _user_id
  )
$$;

-- Recreate students policies without circular dependencies
CREATE POLICY "Agents can view their students"
ON students FOR SELECT
USING (
  public.is_agent_for_student(auth.uid(), id) OR is_admin_or_staff(auth.uid())
);

-- Recreate applications policies without circular dependencies
CREATE POLICY "Students can view their own applications"
ON applications FOR SELECT
USING (
  public.is_student_owner(auth.uid(), student_id) OR is_admin_or_staff(auth.uid())
);

CREATE POLICY "Agents can view their students' applications"
ON applications FOR SELECT
USING (
  public.is_agent_for_application(auth.uid(), id) OR is_admin_or_staff(auth.uid())
);