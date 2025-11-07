-- Allow agents to view students linked to them even before any applications exist
ALTER POLICY "Agents can view their students" ON public.students
USING (
  EXISTS (
    SELECT 1
    FROM public.agent_student_links asl
    WHERE asl.student_id = students.id
      AND asl.agent_profile_id = auth.uid()
  )
);
