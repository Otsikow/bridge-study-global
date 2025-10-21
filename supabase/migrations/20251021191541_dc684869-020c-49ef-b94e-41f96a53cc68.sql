-- Extend app_role enum with new roles
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'counselor';
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'verifier';
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'finance';
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'school_rep';

-- Create education_records table
CREATE TABLE public.education_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  level TEXT NOT NULL, -- high_school, undergraduate, postgraduate
  institution_name TEXT NOT NULL,
  country TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE,
  grade_scale TEXT, -- GPA 4.0, Percentage, UK Classification, etc
  gpa NUMERIC(4,2),
  transcript_url TEXT,
  certificate_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create test_scores table
CREATE TABLE public.test_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  test_type TEXT NOT NULL, -- IELTS, TOEFL, Duolingo, SAT, GMAT, GRE
  total_score NUMERIC(5,2) NOT NULL,
  subscores_json JSONB, -- listening, reading, writing, speaking
  test_date DATE NOT NULL,
  report_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create documents table (general document vault)
CREATE TABLE public.student_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL, -- passport, transcript, sop, lor, cv, bank_statement, sponsor_letter, portfolio
  file_name TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  verified_status TEXT DEFAULT 'pending', -- pending, verified, rejected
  verified_by UUID REFERENCES public.profiles(id),
  verified_at TIMESTAMPTZ,
  verification_notes TEXT,
  checksum TEXT, -- for duplicate detection
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create intakes table
CREATE TABLE public.intakes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id UUID NOT NULL REFERENCES public.programs(id) ON DELETE CASCADE,
  term TEXT NOT NULL, -- Fall 2026, Spring 2027, etc
  start_date DATE NOT NULL,
  app_deadline DATE NOT NULL,
  visa_cutoff_date DATE,
  seats_available INTEGER,
  seats_json JSONB, -- total, filled, reserved
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create student_assignments table (counselor assignments)
CREATE TABLE public.student_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  counselor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ DEFAULT now(),
  notes TEXT,
  UNIQUE(student_id, counselor_id)
);

-- Update students table with new fields
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS legal_name TEXT;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS preferred_name TEXT;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS contact_email TEXT;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS contact_phone TEXT;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS current_country TEXT;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS passport_expiry DATE;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS visa_history_json JSONB;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS finances_json JSONB;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS consent_flags_json JSONB;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS profile_completeness INTEGER DEFAULT 0;

-- Update programs table with new fields
ALTER TABLE public.programs ADD COLUMN IF NOT EXISTS app_fee NUMERIC(10,2);
ALTER TABLE public.programs ADD COLUMN IF NOT EXISTS requirements_json JSONB;
ALTER TABLE public.programs ADD COLUMN IF NOT EXISTS docs_required_json JSONB;

-- Update universities table with partnership fields
ALTER TABLE public.universities ADD COLUMN IF NOT EXISTS partnership_status TEXT DEFAULT 'active';
ALTER TABLE public.universities ADD COLUMN IF NOT EXISTS submission_mode TEXT DEFAULT 'manual_portal';
ALTER TABLE public.universities ADD COLUMN IF NOT EXISTS submission_config_json JSONB;
ALTER TABLE public.universities ADD COLUMN IF NOT EXISTS commission_terms_json JSONB;

-- Update applications table with new fields
ALTER TABLE public.applications ADD COLUMN IF NOT EXISTS intake_id UUID REFERENCES public.intakes(id);
ALTER TABLE public.applications ADD COLUMN IF NOT EXISTS submission_channel TEXT;
ALTER TABLE public.applications ADD COLUMN IF NOT EXISTS app_number TEXT;
ALTER TABLE public.applications ADD COLUMN IF NOT EXISTS fees_json JSONB;
ALTER TABLE public.applications ADD COLUMN IF NOT EXISTS decision_json JSONB;
ALTER TABLE public.applications ADD COLUMN IF NOT EXISTS timeline_json JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.applications ADD COLUMN IF NOT EXISTS risk_flags_json JSONB;

-- Enable RLS on new tables
ALTER TABLE public.education_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.intakes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_assignments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for education_records
CREATE POLICY "Students can manage their own education records"
ON public.education_records FOR ALL
USING (student_id IN (SELECT id FROM public.students WHERE profile_id = auth.uid()))
WITH CHECK (student_id IN (SELECT id FROM public.students WHERE profile_id = auth.uid()));

CREATE POLICY "Counselors can view assigned students' education records"
ON public.education_records FOR SELECT
USING (
  student_id IN (
    SELECT sa.student_id FROM public.student_assignments sa
    WHERE sa.counselor_id = auth.uid()
  ) OR is_admin_or_staff(auth.uid())
);

-- RLS Policies for test_scores
CREATE POLICY "Students can manage their own test scores"
ON public.test_scores FOR ALL
USING (student_id IN (SELECT id FROM public.students WHERE profile_id = auth.uid()))
WITH CHECK (student_id IN (SELECT id FROM public.students WHERE profile_id = auth.uid()));

CREATE POLICY "Counselors can view assigned students' test scores"
ON public.test_scores FOR SELECT
USING (
  student_id IN (
    SELECT sa.student_id FROM public.student_assignments sa
    WHERE sa.counselor_id = auth.uid()
  ) OR is_admin_or_staff(auth.uid())
);

-- RLS Policies for student_documents
CREATE POLICY "Students can manage their own documents"
ON public.student_documents FOR ALL
USING (student_id IN (SELECT id FROM public.students WHERE profile_id = auth.uid()))
WITH CHECK (student_id IN (SELECT id FROM public.students WHERE profile_id = auth.uid()));

CREATE POLICY "Counselors can view and verify assigned students' documents"
ON public.student_documents FOR SELECT
USING (
  student_id IN (
    SELECT sa.student_id FROM public.student_assignments sa
    WHERE sa.counselor_id = auth.uid()
  ) OR is_admin_or_staff(auth.uid())
);

CREATE POLICY "Staff can verify documents"
ON public.student_documents FOR UPDATE
USING (is_admin_or_staff(auth.uid()));

-- RLS Policies for intakes
CREATE POLICY "Anyone can view active intakes"
ON public.intakes FOR SELECT
USING (true);

CREATE POLICY "Staff can manage intakes"
ON public.intakes FOR ALL
USING (is_admin_or_staff(auth.uid()))
WITH CHECK (is_admin_or_staff(auth.uid()));

-- RLS Policies for student_assignments
CREATE POLICY "Counselors can view their assignments"
ON public.student_assignments FOR SELECT
USING (counselor_id = auth.uid() OR is_admin_or_staff(auth.uid()));

CREATE POLICY "Students can view their assignments"
ON public.student_assignments FOR SELECT
USING (student_id IN (SELECT id FROM public.students WHERE profile_id = auth.uid()));

CREATE POLICY "Staff can manage assignments"
ON public.student_assignments FOR ALL
USING (is_admin_or_staff(auth.uid()))
WITH CHECK (is_admin_or_staff(auth.uid()));

-- Create updated_at trigger for new tables
CREATE TRIGGER update_education_records_updated_at
BEFORE UPDATE ON public.education_records
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_test_scores_updated_at
BEFORE UPDATE ON public.test_scores
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_student_documents_updated_at
BEFORE UPDATE ON public.student_documents
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_intakes_updated_at
BEFORE UPDATE ON public.intakes
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for common queries
CREATE INDEX idx_education_records_student ON public.education_records(student_id);
CREATE INDEX idx_test_scores_student ON public.test_scores(student_id);
CREATE INDEX idx_student_documents_student ON public.student_documents(student_id);
CREATE INDEX idx_student_documents_checksum ON public.student_documents(checksum);
CREATE INDEX idx_intakes_program ON public.intakes(program_id);
CREATE INDEX idx_student_assignments_student ON public.student_assignments(student_id);
CREATE INDEX idx_student_assignments_counselor ON public.student_assignments(counselor_id);