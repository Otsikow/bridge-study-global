-- Create security event type enum
CREATE TYPE security_event_type AS ENUM (
  'failed_authentication',
  'privilege_escalation_attempt',
  'suspicious_activity',
  'policy_violation',
  'custom'
);

-- Create security event severity enum
CREATE TYPE security_event_severity AS ENUM (
  'low',
  'medium',
  'high',
  'critical'
);

-- Create security_audit_logs table
CREATE TABLE public.security_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id),
  user_id UUID,
  actor_email TEXT,
  event_type security_event_type NOT NULL,
  severity security_event_severity NOT NULL,
  description TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create security_alerts table
CREATE TABLE public.security_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id),
  source_event_id UUID REFERENCES security_audit_logs(id),
  event_type TEXT NOT NULL,
  severity security_event_severity NOT NULL,
  summary TEXT NOT NULL,
  details TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  acknowledged BOOLEAN DEFAULT false,
  acknowledged_at TIMESTAMP WITH TIME ZONE,
  acknowledged_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create application_drafts table
CREATE TABLE public.application_drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  student_id UUID NOT NULL,
  program_id UUID REFERENCES programs(id),
  form_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  last_step INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE(student_id)
);

-- Enable RLS
ALTER TABLE public.security_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.application_drafts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for security_audit_logs
CREATE POLICY "Staff can view security audit logs"
ON public.security_audit_logs
FOR SELECT
USING (is_admin_or_staff(auth.uid()));

-- RLS Policies for security_alerts
CREATE POLICY "Staff can view security alerts"
ON public.security_alerts
FOR SELECT
USING (is_admin_or_staff(auth.uid()));

CREATE POLICY "Staff can acknowledge alerts"
ON public.security_alerts
FOR UPDATE
USING (is_admin_or_staff(auth.uid()));

-- RLS Policies for application_drafts
CREATE POLICY "Students can manage their own drafts"
ON public.application_drafts
FOR ALL
USING (
  student_id IN (
    SELECT id FROM students WHERE profile_id = auth.uid()
  )
)
WITH CHECK (
  student_id IN (
    SELECT id FROM students WHERE profile_id = auth.uid()
  )
);

CREATE POLICY "Staff can view all drafts"
ON public.application_drafts
FOR SELECT
USING (is_admin_or_staff(auth.uid()));

-- Create indexes for better performance
CREATE INDEX idx_security_audit_logs_tenant ON security_audit_logs(tenant_id);
CREATE INDEX idx_security_audit_logs_event_type ON security_audit_logs(event_type);
CREATE INDEX idx_security_audit_logs_created_at ON security_audit_logs(created_at);
CREATE INDEX idx_security_audit_logs_metadata_identifier ON security_audit_logs((metadata->>'identifier'));

CREATE INDEX idx_security_alerts_tenant ON security_alerts(tenant_id);
CREATE INDEX idx_security_alerts_acknowledged ON security_alerts(acknowledged);

CREATE INDEX idx_application_drafts_student ON application_drafts(student_id);
CREATE INDEX idx_application_drafts_updated_at ON application_drafts(updated_at);

-- Trigger for application_drafts updated_at
CREATE TRIGGER update_application_drafts_updated_at
BEFORE UPDATE ON public.application_drafts
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();