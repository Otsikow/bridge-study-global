-- Create scholarships table
CREATE TABLE public.scholarships (
  id UUID NOT NULL DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  university_id UUID REFERENCES public.universities(id) ON DELETE CASCADE,
  program_id UUID REFERENCES public.programs(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  amount_cents INTEGER,
  currency TEXT DEFAULT 'USD',
  coverage_type TEXT CHECK (coverage_type IN ('full', 'partial', 'tuition_only', 'living_expenses', 'other')),
  eligibility_criteria JSONB,
  application_deadline DATE,
  renewable BOOLEAN DEFAULT false,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.scholarships ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can view active scholarships in their tenant"
ON public.scholarships
FOR SELECT
USING (tenant_id = get_user_tenant(auth.uid()) AND active = true);

CREATE POLICY "Admins can manage scholarships"
ON public.scholarships
FOR ALL
USING (is_admin_or_staff(auth.uid()));

-- Add trigger for updated_at
CREATE TRIGGER update_scholarships_updated_at
BEFORE UPDATE ON public.scholarships
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add index for performance
CREATE INDEX idx_scholarships_university ON public.scholarships(university_id);
CREATE INDEX idx_scholarships_program ON public.scholarships(program_id);
CREATE INDEX idx_scholarships_active ON public.scholarships(active) WHERE active = true;