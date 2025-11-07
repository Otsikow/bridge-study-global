-- Drop and recreate staff_profiles view with additional columns
DROP VIEW IF EXISTS public.staff_profiles CASCADE;

CREATE OR REPLACE VIEW public.staff_profiles AS
SELECT 
  p.id,
  p.full_name,
  p.email,
  p.phone,
  p.role,
  p.active,
  p.created_at,
  p.updated_at,
  p.tenant_id,
  p.avatar_url,
  p.locale,
  p.timezone,
  '' AS title, -- Default empty title
  ARRAY[]::text[] AS permissions, -- Default empty permissions array
  'active' AS status -- Default status
FROM public.profiles p
WHERE p.role IN ('admin', 'staff', 'counselor', 'finance', 'verifier');

-- Grant permissions
GRANT SELECT ON public.staff_profiles TO authenticated;

-- Enable security invoker
ALTER VIEW public.staff_profiles SET (security_invoker = true);

-- Create document_requests table for tracking document verification requests
CREATE TABLE IF NOT EXISTS public.document_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  requested_by UUID REFERENCES public.profiles(id),
  document_type TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'submitted', 'approved', 'rejected')),
  due_date TIMESTAMP WITH TIME ZONE,
  submitted_at TIMESTAMP WITH TIME ZONE,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by UUID REFERENCES public.profiles(id),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_document_requests_student_id ON public.document_requests(student_id);
CREATE INDEX IF NOT EXISTS idx_document_requests_status ON public.document_requests(status);
CREATE INDEX IF NOT EXISTS idx_document_requests_tenant_id ON public.document_requests(tenant_id);

-- Enable RLS
ALTER TABLE public.document_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Students can view their document requests"
  ON public.document_requests
  FOR SELECT
  USING (
    student_id IN (
      SELECT id FROM public.students WHERE profile_id = auth.uid()
    )
    OR is_admin_or_staff(auth.uid())
  );

CREATE POLICY "Staff can manage document requests"
  ON public.document_requests
  FOR ALL
  USING (is_admin_or_staff(auth.uid()))
  WITH CHECK (is_admin_or_staff(auth.uid()));

-- Add trigger for updated_at
CREATE TRIGGER update_document_requests_updated_at
  BEFORE UPDATE ON public.document_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

COMMENT ON TABLE public.document_requests IS 'Tracks document verification requests for students';