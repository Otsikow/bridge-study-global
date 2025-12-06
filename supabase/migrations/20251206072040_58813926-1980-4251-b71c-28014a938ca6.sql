-- Fix security: Deny direct INSERT on security_audit_logs from authenticated users
-- Only the service role (via security-logger edge function) should insert logs

-- First, check if policy exists and drop it
DROP POLICY IF EXISTS "Deny direct inserts on security_audit_logs" ON public.security_audit_logs;

-- Create RESTRICTIVE policy to deny INSERT from authenticated users
-- This ensures only service_role can insert (via edge functions)
CREATE POLICY "Deny direct inserts on security_audit_logs"
ON public.security_audit_logs
AS RESTRICTIVE
FOR INSERT
TO authenticated
WITH CHECK (false);

-- Also ensure UPDATE and DELETE are denied for authenticated users
DROP POLICY IF EXISTS "Deny direct updates on security_audit_logs" ON public.security_audit_logs;
CREATE POLICY "Deny direct updates on security_audit_logs"
ON public.security_audit_logs
AS RESTRICTIVE
FOR UPDATE
TO authenticated
USING (false);

DROP POLICY IF EXISTS "Deny direct deletes on security_audit_logs" ON public.security_audit_logs;
CREATE POLICY "Deny direct deletes on security_audit_logs"
ON public.security_audit_logs
AS RESTRICTIVE
FOR DELETE
TO authenticated
USING (false);

-- Similarly, protect security_alerts table from direct manipulation
DROP POLICY IF EXISTS "Deny direct inserts on security_alerts" ON public.security_alerts;
CREATE POLICY "Deny direct inserts on security_alerts"
ON public.security_alerts
AS RESTRICTIVE
FOR INSERT
TO authenticated
WITH CHECK (false);

DROP POLICY IF EXISTS "Deny direct deletes on security_alerts" ON public.security_alerts;
CREATE POLICY "Deny direct deletes on security_alerts"
ON public.security_alerts
AS RESTRICTIVE
FOR DELETE
TO authenticated
USING (false);