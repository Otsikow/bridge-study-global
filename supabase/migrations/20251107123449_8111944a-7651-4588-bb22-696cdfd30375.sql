-- Update staff_profiles view with all required columns
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
  '' AS title,
  '' AS position,
  'active' AS status,
  'active' AS account_status,
  ARRAY[]::text[] AS permissions,
  ARRAY[]::text[] AS dashboard_permissions,
  p.created_at AS last_active_at,
  p.created_at AS activity_last_seen,
  0 AS total_logins,
  0 AS login_count,
  0 AS tasks_completed,
  0 AS completed_tasks,
  0 AS active_sessions,
  0 AS activity_score
FROM public.profiles p
WHERE p.role IN ('admin', 'staff', 'counselor', 'finance', 'verifier');

GRANT SELECT ON public.staff_profiles TO authenticated;
ALTER VIEW public.staff_profiles SET (security_invoker = true);

-- Add missing columns to document_requests table
ALTER TABLE public.document_requests 
  ADD COLUMN IF NOT EXISTS request_type TEXT,
  ADD COLUMN IF NOT EXISTS requested_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  ADD COLUMN IF NOT EXISTS document_url TEXT,
  ADD COLUMN IF NOT EXISTS uploaded_file_url TEXT,
  ADD COLUMN IF NOT EXISTS file_url TEXT,
  ADD COLUMN IF NOT EXISTS storage_path TEXT;

-- Update request_type to have document_type as default if empty
UPDATE public.document_requests 
SET request_type = document_type 
WHERE request_type IS NULL;

COMMENT ON COLUMN public.document_requests.request_type IS 'Type of document being requested';
COMMENT ON COLUMN public.document_requests.requested_at IS 'When the document was requested';
COMMENT ON COLUMN public.document_requests.storage_path IS 'Path to stored document in storage bucket';