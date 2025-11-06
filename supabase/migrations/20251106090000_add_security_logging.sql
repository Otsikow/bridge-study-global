-- Security logging and monitoring structures

-- Create enums for event categorization
CREATE TYPE security_event_type AS ENUM (
  'failed_authentication',
  'privilege_escalation_attempt',
  'suspicious_activity',
  'policy_violation',
  'custom'
);

CREATE TYPE security_event_severity AS ENUM ('low', 'medium', 'high', 'critical');

CREATE TYPE security_alert_status AS ENUM ('open', 'acknowledged', 'resolved', 'dismissed');

-- Security audit log table stores all security-sensitive events
CREATE TABLE security_audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE SET NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  actor_email TEXT,
  event_type security_event_type NOT NULL,
  severity security_event_severity NOT NULL DEFAULT 'low',
  description TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- Alerts table for elevated security notifications
CREATE TABLE security_alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE SET NULL,
  source_event_id UUID REFERENCES security_audit_logs(id) ON DELETE CASCADE,
  event_type security_event_type NOT NULL,
  severity security_event_severity NOT NULL,
  status security_alert_status NOT NULL DEFAULT 'open',
  summary TEXT NOT NULL,
  details TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  acknowledged_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ
);

-- Helpful indexes for querying security data
CREATE INDEX idx_security_audit_logs_event_type ON security_audit_logs (event_type);
CREATE INDEX idx_security_audit_logs_severity ON security_audit_logs (severity);
CREATE INDEX idx_security_audit_logs_created_at ON security_audit_logs (created_at DESC);
CREATE INDEX idx_security_audit_logs_tenant ON security_audit_logs (tenant_id);
CREATE INDEX idx_security_audit_logs_user ON security_audit_logs (user_id);

CREATE INDEX idx_security_alerts_status ON security_alerts (status);
CREATE INDEX idx_security_alerts_created_at ON security_alerts (created_at DESC);
CREATE INDEX idx_security_alerts_tenant ON security_alerts (tenant_id);

-- Enable row level security for both tables
ALTER TABLE security_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_alerts ENABLE ROW LEVEL SECURITY;

-- Service role (edge functions) have unrestricted access
CREATE POLICY "Service role full access to security logs"
  ON security_audit_logs
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service role full access to security alerts"
  ON security_alerts
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Authenticated users can read security events limited to their tenant
CREATE POLICY "Users read tenant security logs"
  ON security_audit_logs
  FOR SELECT
  USING (
    auth.role() = 'authenticated'
    AND (
      tenant_id IS NULL
      OR tenant_id = get_user_tenant(auth.uid())
    )
  );

CREATE POLICY "Users read tenant security alerts"
  ON security_alerts
  FOR SELECT
  USING (
    auth.role() = 'authenticated'
    AND (
      tenant_id IS NULL
      OR tenant_id = get_user_tenant(auth.uid())
    )
  );

-- Helper function for inserting security log entries safely
CREATE OR REPLACE FUNCTION log_security_event(
  p_tenant_id UUID,
  p_user_id UUID,
  p_actor_email TEXT,
  p_event_type security_event_type,
  p_severity security_event_severity DEFAULT 'low',
  p_description TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb,
  p_ip_address INET DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO security_audit_logs (
    tenant_id,
    user_id,
    actor_email,
    event_type,
    severity,
    description,
    metadata,
    ip_address,
    user_agent
  )
  VALUES (
    p_tenant_id,
    p_user_id,
    p_actor_email,
    p_event_type,
    p_severity,
    p_description,
    COALESCE(p_metadata, '{}'::jsonb),
    p_ip_address,
    p_user_agent
  )
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

GRANT EXECUTE ON FUNCTION log_security_event(UUID, UUID, TEXT, security_event_type, security_event_severity, TEXT, JSONB, INET, TEXT)
  TO authenticated;

