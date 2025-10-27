-- Refine students policy to avoid recursion by using a security definer helper
-- This ensures the agent check no longer triggers RLS on applications

-- Helper function to check if an agent (by profile id) is linked to a student
CREATE OR REPLACE FUNCTION public.agent_can_view_student(requester_id UUID, target_student_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.agents ag
    INNER JOIN public.applications a ON a.agent_id = ag.id
    WHERE ag.profile_id = requester_id
      AND a.student_id = target_student_id
  );
END;
$$;

-- Update the students policy to rely on the helper instead of a direct subquery
DROP POLICY IF EXISTS "Agents can view their students" ON public.students;

CREATE POLICY "Agents can view their students"
ON public.students
FOR SELECT
USING (
  public.agent_can_view_student(auth.uid(), students.id)
);
