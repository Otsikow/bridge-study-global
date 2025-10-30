-- Refine students policy to reference agent_student_links directly
-- This avoids invoking helper functions that could trigger recursion detection

-- Remove previous helper-based policy
DROP POLICY IF EXISTS "Agents can view their students" ON public.students;
DROP FUNCTION IF EXISTS public.agent_can_view_student(requester_id UUID, target_student_id UUID);

-- Recreate the policy using the precomputed link table
CREATE POLICY "Agents can view their students"
ON public.students
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.agent_student_links asl
    WHERE asl.student_id = students.id
      AND asl.agent_profile_id = auth.uid()
  )
);

-- Ensure fast lookups when checking agent access
CREATE INDEX IF NOT EXISTS idx_agent_student_links_student
  ON public.agent_student_links (student_id);

CREATE INDEX IF NOT EXISTS idx_agent_student_links_agent
  ON public.agent_student_links (agent_profile_id);
