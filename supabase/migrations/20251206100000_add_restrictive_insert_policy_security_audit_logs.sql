-- Add RESTRICTIVE INSERT policy on security_audit_logs to prevent authenticated users
-- from directly inserting false security events.
-- Only service_role (edge functions) and SECURITY DEFINER functions should be able to insert.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'security_audit_logs'
      AND policyname = 'Deny direct inserts on security_audit_logs'
  ) THEN
    -- This RESTRICTIVE policy blocks all INSERT attempts where the role is 'authenticated'.
    -- Even if a permissive policy would allow the insert, this restrictive policy
    -- ensures authenticated users cannot directly insert security events.
    -- The log_security_event() function uses SECURITY DEFINER and bypasses RLS,
    -- so it will still work correctly for legitimate security logging.
    CREATE POLICY "Deny direct inserts on security_audit_logs"
    AS RESTRICTIVE
    ON public.security_audit_logs
    FOR INSERT
    WITH CHECK (auth.role() != 'authenticated');
  END IF;
END
$$;
