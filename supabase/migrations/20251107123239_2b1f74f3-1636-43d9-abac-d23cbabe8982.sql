-- Create agent_student_links junction table
CREATE TABLE IF NOT EXISTS public.agent_student_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  agent_id UUID NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  notes TEXT,
  UNIQUE(agent_id, student_id)
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_agent_student_links_agent_id ON public.agent_student_links(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_student_links_student_id ON public.agent_student_links(student_id);
CREATE INDEX IF NOT EXISTS idx_agent_student_links_tenant_id ON public.agent_student_links(tenant_id);

-- Enable RLS
ALTER TABLE public.agent_student_links ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Agents can view their student links"
  ON public.agent_student_links
  FOR SELECT
  USING (
    agent_id IN (
      SELECT id FROM public.agents WHERE profile_id = auth.uid()
    )
    OR is_admin_or_staff(auth.uid())
  );

CREATE POLICY "Agents can create student links"
  ON public.agent_student_links
  FOR INSERT
  WITH CHECK (
    agent_id IN (
      SELECT id FROM public.agents WHERE profile_id = auth.uid()
    )
    OR is_admin_or_staff(auth.uid())
  );

CREATE POLICY "Staff can manage all student links"
  ON public.agent_student_links
  FOR ALL
  USING (is_admin_or_staff(auth.uid()))
  WITH CHECK (is_admin_or_staff(auth.uid()));

-- Add trigger for updated_at
CREATE OR REPLACE FUNCTION update_agent_student_links_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_agent_student_links_updated_at
  BEFORE UPDATE ON public.agent_student_links
  FOR EACH ROW
  EXECUTE FUNCTION update_agent_student_links_updated_at();

-- Comment on table
COMMENT ON TABLE public.agent_student_links IS 'Junction table linking agents to students they are managing';