-- UniDoxia Platform Database Schema with RLS
-- Version: 1.0.0

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create ENUM types
CREATE TYPE app_role AS ENUM ('student', 'agent', 'partner', 'staff', 'admin');
CREATE TYPE application_status AS ENUM (
  'draft', 'submitted', 'screening', 
  'conditional_offer', 'unconditional_offer', 
  'cas_loa', 'visa', 'enrolled', 
  'withdrawn', 'deferred'
);
CREATE TYPE document_type AS ENUM (
  'passport', 'transcript', 'ielts', 'toefl', 
  'sop', 'cv', 'lor', 'portfolio', 'other'
);
CREATE TYPE offer_type AS ENUM ('conditional', 'unconditional');
CREATE TYPE payment_status AS ENUM ('pending', 'succeeded', 'failed', 'refunded');
CREATE TYPE payment_purpose AS ENUM ('application_fee', 'service_fee', 'deposit', 'tuition', 'other');
CREATE TYPE commission_status AS ENUM ('pending', 'approved', 'paid', 'clawback');
CREATE TYPE notification_channel AS ENUM ('email', 'sms', 'whatsapp', 'in_app');
CREATE TYPE notification_status AS ENUM ('pending', 'sent', 'failed', 'delivered');
CREATE TYPE message_type AS ENUM ('text', 'system', 'document');
CREATE TYPE task_status AS ENUM ('open', 'in_progress', 'done', 'blocked');

-- Tenants Table
CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  logo_url TEXT,
  brand_colors JSONB DEFAULT '{"primary": "#1e40af", "secondary": "#3b82f6"}',
  email_from TEXT NOT NULL,
  active BOOLEAN DEFAULT TRUE,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Profiles Table (extends auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'student',
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  avatar_url TEXT,
  locale TEXT DEFAULT 'en',
  timezone TEXT DEFAULT 'UTC',
  onboarded BOOLEAN DEFAULT FALSE,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Agents Table
CREATE TABLE agents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL UNIQUE,
  company_name TEXT,
  verification_status TEXT DEFAULT 'pending',
  verification_document_url TEXT,
  payout_account JSONB,
  commission_rate_l1 NUMERIC(5,2) DEFAULT 15.00,
  commission_rate_l2 NUMERIC(5,2) DEFAULT 10.00,
  parent_agent_id UUID REFERENCES agents(id) ON DELETE SET NULL,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Universities Table
CREATE TABLE universities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  country TEXT NOT NULL,
  city TEXT,
  logo_url TEXT,
  website TEXT,
  ranking JSONB,
  description TEXT,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Programs Table
CREATE TABLE programs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
  university_id UUID REFERENCES universities(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  level TEXT NOT NULL, -- Bachelor, Master, PhD, Diploma
  discipline TEXT NOT NULL,
  duration_months INTEGER NOT NULL,
  tuition_currency TEXT DEFAULT 'USD',
  tuition_amount NUMERIC(12,2) NOT NULL,
  intake_months INTEGER[] DEFAULT ARRAY[1, 9], -- Jan, Sept
  entry_requirements JSONB,
  ielts_overall NUMERIC(3,1),
  toefl_overall INTEGER,
  seats_available INTEGER,
  description TEXT,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Students Table
CREATE TABLE students (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL UNIQUE,
  date_of_birth DATE,
  nationality TEXT,
  passport_number TEXT,
  address JSONB,
  education_history JSONB,
  test_scores JSONB,
  guardian JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Applications Table
CREATE TABLE applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE NOT NULL,
  program_id UUID REFERENCES programs(id) ON DELETE CASCADE NOT NULL,
  agent_id UUID REFERENCES agents(id) ON DELETE SET NULL,
  status application_status DEFAULT 'draft',
  intake_month INTEGER NOT NULL,
  intake_year INTEGER NOT NULL,
  notes TEXT,
  internal_notes TEXT,
  submitted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id, program_id, intake_year, intake_month)
);

-- Application Documents Table
CREATE TABLE application_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  application_id UUID REFERENCES applications(id) ON DELETE CASCADE NOT NULL,
  document_type document_type NOT NULL,
  storage_path TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  version INTEGER DEFAULT 1,
  verified BOOLEAN DEFAULT FALSE,
  verifier_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  verification_notes TEXT,
  uploaded_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Offers Table
CREATE TABLE offers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  application_id UUID REFERENCES applications(id) ON DELETE CASCADE NOT NULL,
  offer_type offer_type NOT NULL,
  letter_url TEXT NOT NULL,
  conditions JSONB,
  expiry_date DATE,
  accepted BOOLEAN,
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- CAS/LOA Table
CREATE TABLE cas_loa (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  application_id UUID REFERENCES applications(id) ON DELETE CASCADE NOT NULL UNIQUE,
  cas_number TEXT,
  issue_date DATE NOT NULL,
  file_url TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Messages Table
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  application_id UUID REFERENCES applications(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  message_type message_type DEFAULT 'text',
  body TEXT NOT NULL,
  attachments JSONB DEFAULT '[]',
  read_by UUID[] DEFAULT ARRAY[]::UUID[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tasks Table
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
  application_id UUID REFERENCES applications(id) ON DELETE CASCADE,
  assignee_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  due_at TIMESTAMPTZ,
  status task_status DEFAULT 'open',
  priority TEXT DEFAULT 'medium',
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payments Table
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
  application_id UUID REFERENCES applications(id) ON DELETE SET NULL,
  stripe_payment_intent TEXT UNIQUE,
  amount_cents INTEGER NOT NULL,
  currency TEXT DEFAULT 'USD',
  status payment_status DEFAULT 'pending',
  purpose payment_purpose NOT NULL,
  receipt_url TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Referrals Table
CREATE TABLE referrals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
  code TEXT UNIQUE NOT NULL,
  agent_id UUID REFERENCES agents(id) ON DELETE CASCADE NOT NULL,
  parent_agent_id UUID REFERENCES agents(id) ON DELETE SET NULL,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Attributions Table
CREATE TABLE attributions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE NOT NULL,
  referral_id UUID REFERENCES referrals(id) ON DELETE SET NULL,
  touch TEXT DEFAULT 'first',
  source TEXT,
  medium TEXT,
  campaign TEXT,
  landing_page TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Commissions Table
CREATE TABLE commissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
  application_id UUID REFERENCES applications(id) ON DELETE CASCADE NOT NULL,
  agent_id UUID REFERENCES agents(id) ON DELETE CASCADE NOT NULL,
  level SMALLINT NOT NULL CHECK (level IN (1, 2)),
  rate_percent NUMERIC(5,2) NOT NULL,
  amount_cents INTEGER NOT NULL,
  currency TEXT DEFAULT 'USD',
  status commission_status DEFAULT 'pending',
  notes TEXT,
  approved_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Audit Logs Table
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity TEXT NOT NULL,
  entity_id UUID,
  changes JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Feature Flags Table
CREATE TABLE feature_flags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
  flag_key TEXT NOT NULL,
  enabled BOOLEAN DEFAULT FALSE,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, flag_key)
);

-- Intake Calendars Table
CREATE TABLE intake_calendars (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
  university_id UUID REFERENCES universities(id) ON DELETE CASCADE NOT NULL,
  program_id UUID REFERENCES programs(id) ON DELETE CASCADE,
  intake_month INTEGER NOT NULL,
  intake_year INTEGER NOT NULL,
  deadline_date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notifications Table
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  channel notification_channel DEFAULT 'email',
  template_key TEXT NOT NULL,
  subject TEXT,
  body TEXT NOT NULL,
  payload JSONB,
  status notification_status DEFAULT 'pending',
  sent_at TIMESTAMPTZ,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Saved Views Table
CREATE TABLE saved_views (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  context TEXT NOT NULL,
  name TEXT NOT NULL,
  filters JSONB DEFAULT '{}',
  columns TEXT[] DEFAULT ARRAY[]::TEXT[],
  sort JSONB,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_profiles_tenant ON profiles(tenant_id);
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_agents_tenant ON agents(tenant_id);
CREATE INDEX idx_universities_tenant ON universities(tenant_id);
CREATE INDEX idx_programs_tenant_university ON programs(tenant_id, university_id);
CREATE INDEX idx_programs_active ON programs(active);
CREATE INDEX idx_students_tenant ON students(tenant_id);
CREATE INDEX idx_applications_tenant ON applications(tenant_id);
CREATE INDEX idx_applications_student ON applications(student_id);
CREATE INDEX idx_applications_program ON applications(program_id);
CREATE INDEX idx_applications_agent ON applications(agent_id);
CREATE INDEX idx_applications_status ON applications(status);
CREATE INDEX idx_messages_application ON messages(application_id);
CREATE INDEX idx_tasks_tenant ON tasks(tenant_id);
CREATE INDEX idx_tasks_assignee ON tasks(assignee_id);
CREATE INDEX idx_payments_tenant ON payments(tenant_id);
CREATE INDEX idx_commissions_agent ON commissions(agent_id);
CREATE INDEX idx_audit_logs_tenant ON audit_logs(tenant_id);
CREATE INDEX idx_notifications_user ON notifications(user_id);

-- Enable Row Level Security on all tables
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE universities ENABLE ROW LEVEL SECURITY;
ALTER TABLE programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE application_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE cas_loa ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE attributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE feature_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE intake_calendars ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_views ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Helper function to check user role
CREATE OR REPLACE FUNCTION public.get_user_role(user_id UUID)
RETURNS app_role
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT role FROM public.profiles WHERE id = user_id;
$$;

-- Helper function to check if user is admin or staff
CREATE OR REPLACE FUNCTION public.is_admin_or_staff(user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT role IN ('admin', 'staff') FROM public.profiles WHERE id = user_id;
$$;

-- Helper function to get user's tenant
CREATE OR REPLACE FUNCTION public.get_user_tenant(user_id UUID)
RETURNS UUID
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT tenant_id FROM public.profiles WHERE id = user_id;
$$;

-- Tenants RLS
CREATE POLICY "Users can view their tenant"
  ON tenants FOR SELECT
  USING (id = get_user_tenant(auth.uid()));

CREATE POLICY "Admins can manage tenants"
  ON tenants FOR ALL
  USING (is_admin_or_staff(auth.uid()));

-- Profiles RLS
CREATE POLICY "Users can view profiles in their tenant"
  ON profiles FOR SELECT
  USING (tenant_id = get_user_tenant(auth.uid()));

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (id = auth.uid());

CREATE POLICY "Admins can manage all profiles"
  ON profiles FOR ALL
  USING (is_admin_or_staff(auth.uid()));

-- Agents RLS
CREATE POLICY "Agents can view their own record"
  ON agents FOR SELECT
  USING (profile_id = auth.uid() OR is_admin_or_staff(auth.uid()));

CREATE POLICY "Admins can manage agents"
  ON agents FOR ALL
  USING (is_admin_or_staff(auth.uid()));

-- Universities RLS (Public read in tenant)
CREATE POLICY "Anyone can view universities in their tenant"
  ON universities FOR SELECT
  USING (tenant_id = get_user_tenant(auth.uid()));

CREATE POLICY "Admins can manage universities"
  ON universities FOR ALL
  USING (is_admin_or_staff(auth.uid()));

-- Programs RLS (Public read in tenant)
CREATE POLICY "Anyone can view active programs in their tenant"
  ON programs FOR SELECT
  USING (tenant_id = get_user_tenant(auth.uid()) AND active = TRUE);

CREATE POLICY "Admins can manage programs"
  ON programs FOR ALL
  USING (is_admin_or_staff(auth.uid()));

-- Students RLS
CREATE POLICY "Students can view their own record"
  ON students FOR SELECT
  USING (profile_id = auth.uid());

CREATE POLICY "Students can update their own record"
  ON students FOR UPDATE
  USING (profile_id = auth.uid());

CREATE POLICY "Agents can view their students"
  ON students FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM applications a
      JOIN agents ag ON a.agent_id = ag.id
      WHERE a.student_id = students.id AND ag.profile_id = auth.uid()
    )
  );

CREATE POLICY "Staff can view all students"
  ON students FOR SELECT
  USING (is_admin_or_staff(auth.uid()));

CREATE POLICY "Staff can manage students"
  ON students FOR ALL
  USING (is_admin_or_staff(auth.uid()));

-- Applications RLS
CREATE POLICY "Students can view their own applications"
  ON applications FOR SELECT
  USING (
    student_id IN (SELECT id FROM students WHERE profile_id = auth.uid())
  );

CREATE POLICY "Students can create and update their applications"
  ON applications FOR INSERT
  WITH CHECK (
    student_id IN (SELECT id FROM students WHERE profile_id = auth.uid())
  );

CREATE POLICY "Students can update their draft applications"
  ON applications FOR UPDATE
  USING (
    student_id IN (SELECT id FROM students WHERE profile_id = auth.uid())
    AND status = 'draft'
  );

CREATE POLICY "Agents can view their students' applications"
  ON applications FOR SELECT
  USING (
    agent_id IN (SELECT id FROM agents WHERE profile_id = auth.uid())
  );

CREATE POLICY "Partners can view applications to their university"
  ON applications FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM programs p
      JOIN universities u ON p.university_id = u.id
      JOIN profiles prof ON prof.id = auth.uid()
      WHERE p.id = applications.program_id
      AND prof.role = 'partner'
      -- Additional partner-university link would go here
    )
  );

CREATE POLICY "Staff can manage all applications"
  ON applications FOR ALL
  USING (is_admin_or_staff(auth.uid()));

-- Application Documents RLS
CREATE POLICY "Students can manage docs for their applications"
  ON application_documents FOR ALL
  USING (
    application_id IN (
      SELECT a.id FROM applications a
      JOIN students s ON a.student_id = s.id
      WHERE s.profile_id = auth.uid()
    )
  );

CREATE POLICY "Agents can view docs for their applications"
  ON application_documents FOR SELECT
  USING (
    application_id IN (
      SELECT a.id FROM applications a
      JOIN agents ag ON a.agent_id = ag.id
      WHERE ag.profile_id = auth.uid()
    )
  );

CREATE POLICY "Staff can manage all docs"
  ON application_documents FOR ALL
  USING (is_admin_or_staff(auth.uid()));

-- Messages RLS
CREATE POLICY "Users can view messages for their applications"
  ON messages FOR SELECT
  USING (
    application_id IN (
      SELECT a.id FROM applications a
      JOIN students s ON a.student_id = s.id
      WHERE s.profile_id = auth.uid()
    )
    OR application_id IN (
      SELECT a.id FROM applications a
      JOIN agents ag ON a.agent_id = ag.id
      WHERE ag.profile_id = auth.uid()
    )
    OR is_admin_or_staff(auth.uid())
  );

CREATE POLICY "Users can send messages on their applications"
  ON messages FOR INSERT
  WITH CHECK (sender_id = auth.uid());

-- Tasks RLS
CREATE POLICY "Users can view their assigned tasks"
  ON tasks FOR SELECT
  USING (assignee_id = auth.uid() OR is_admin_or_staff(auth.uid()));

CREATE POLICY "Staff can manage tasks"
  ON tasks FOR ALL
  USING (is_admin_or_staff(auth.uid()));

-- Payments RLS
CREATE POLICY "Students can view their payments"
  ON payments FOR SELECT
  USING (
    application_id IN (
      SELECT a.id FROM applications a
      JOIN students s ON a.student_id = s.id
      WHERE s.profile_id = auth.uid()
    )
  );

CREATE POLICY "Staff can manage payments"
  ON payments FOR ALL
  USING (is_admin_or_staff(auth.uid()));

-- Commissions RLS
CREATE POLICY "Agents can view their commissions"
  ON commissions FOR SELECT
  USING (
    agent_id IN (SELECT id FROM agents WHERE profile_id = auth.uid())
  );

CREATE POLICY "Staff can manage commissions"
  ON commissions FOR ALL
  USING (is_admin_or_staff(auth.uid()));

-- Notifications RLS
CREATE POLICY "Users can view their own notifications"
  ON notifications FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can update their notifications (mark read)"
  ON notifications FOR UPDATE
  USING (user_id = auth.uid());

-- Audit Logs RLS (Admins only)
CREATE POLICY "Admins can view audit logs"
  ON audit_logs FOR SELECT
  USING (is_admin_or_staff(auth.uid()));

-- Feature Flags RLS
CREATE POLICY "Users can view feature flags for their tenant"
  ON feature_flags FOR SELECT
  USING (tenant_id = get_user_tenant(auth.uid()));

CREATE POLICY "Admins can manage feature flags"
  ON feature_flags FOR ALL
  USING (is_admin_or_staff(auth.uid()));

-- Saved Views RLS
CREATE POLICY "Users can manage their own saved views"
  ON saved_views FOR ALL
  USING (user_id = auth.uid());

-- Referrals RLS
CREATE POLICY "Agents can view their referrals"
  ON referrals FOR SELECT
  USING (
    agent_id IN (SELECT id FROM agents WHERE profile_id = auth.uid())
    OR is_admin_or_staff(auth.uid())
  );

CREATE POLICY "Staff can manage referrals"
  ON referrals FOR ALL
  USING (is_admin_or_staff(auth.uid()));

-- Attributions RLS
CREATE POLICY "Staff can view attributions"
  ON attributions FOR SELECT
  USING (is_admin_or_staff(auth.uid()));

-- Offers RLS
CREATE POLICY "Students can view offers for their applications"
  ON offers FOR SELECT
  USING (
    application_id IN (
      SELECT a.id FROM applications a
      JOIN students s ON a.student_id = s.id
      WHERE s.profile_id = auth.uid()
    )
  );

CREATE POLICY "Staff can manage offers"
  ON offers FOR ALL
  USING (is_admin_or_staff(auth.uid()));

-- CAS/LOA RLS
CREATE POLICY "Students can view their CAS/LOA"
  ON cas_loa FOR SELECT
  USING (
    application_id IN (
      SELECT a.id FROM applications a
      JOIN students s ON a.student_id = s.id
      WHERE s.profile_id = auth.uid()
    )
  );

CREATE POLICY "Staff can manage CAS/LOA"
  ON cas_loa FOR ALL
  USING (is_admin_or_staff(auth.uid()));

-- Intake Calendars RLS
CREATE POLICY "Anyone can view intake calendars in their tenant"
  ON intake_calendars FOR SELECT
  USING (tenant_id = get_user_tenant(auth.uid()));

CREATE POLICY "Admins can manage intake calendars"
  ON intake_calendars FOR ALL
  USING (is_admin_or_staff(auth.uid()));

-- Function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_tenants_updated_at BEFORE UPDATE ON tenants
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_agents_updated_at BEFORE UPDATE ON agents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_universities_updated_at BEFORE UPDATE ON universities
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_programs_updated_at BEFORE UPDATE ON programs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_students_updated_at BEFORE UPDATE ON students
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_applications_updated_at BEFORE UPDATE ON applications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_offers_updated_at BEFORE UPDATE ON offers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_commissions_updated_at BEFORE UPDATE ON commissions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_feature_flags_updated_at BEFORE UPDATE ON feature_flags
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_saved_views_updated_at BEFORE UPDATE ON saved_views
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();