-- Application drafts server-side storage

CREATE TABLE IF NOT EXISTS public.application_drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  program_id UUID REFERENCES public.programs(id) ON DELETE SET NULL,
  form_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  last_step INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS application_drafts_student_id_key
  ON public.application_drafts(student_id);

CREATE INDEX IF NOT EXISTS application_drafts_tenant_student_idx
  ON public.application_drafts(tenant_id, student_id);

ALTER TABLE public.application_drafts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can manage their drafts"
  ON public.application_drafts
  FOR ALL
  USING (
    public.is_student_owner(auth.uid(), student_id)
    AND tenant_id = public.get_user_tenant(auth.uid())
  )
  WITH CHECK (
    public.is_student_owner(auth.uid(), student_id)
    AND tenant_id = public.get_user_tenant(auth.uid())
  );

CREATE POLICY "Admins and staff can manage application drafts"
  ON public.application_drafts
  FOR ALL
  USING (public.is_admin_or_staff(auth.uid()))
  WITH CHECK (public.is_admin_or_staff(auth.uid()));

CREATE TRIGGER update_application_drafts_updated_at
  BEFORE UPDATE ON public.application_drafts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
