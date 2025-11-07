-- Add explicit deny policies to protect security audit data
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'security_audit_logs'
      AND policyname = 'Deny updates on security_audit_logs'
  ) THEN
    CREATE POLICY "Deny updates on security_audit_logs"
    AS RESTRICTIVE
    ON public.security_audit_logs
    FOR UPDATE
    USING (false);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'security_audit_logs'
      AND policyname = 'Deny deletes on security_audit_logs'
  ) THEN
    CREATE POLICY "Deny deletes on security_audit_logs"
    AS RESTRICTIVE
    ON public.security_audit_logs
    FOR DELETE
    USING (false);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'security_alerts'
      AND policyname = 'Deny deletes on security_alerts'
  ) THEN
    CREATE POLICY "Deny deletes on security_alerts"
    AS RESTRICTIVE
    ON public.security_alerts
    FOR DELETE
    USING (false);
  END IF;
END
$$;
