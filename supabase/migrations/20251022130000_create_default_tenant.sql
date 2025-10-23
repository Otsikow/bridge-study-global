-- Create default tenant for GEG Platform
-- This ensures that new user registrations work correctly

-- Insert default tenant (idempotent)
INSERT INTO public.tenants (
  id,
  name,
  slug,
  email_from,
  brand_colors,
  active,
  settings
)
VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'Global Education Gateway',
  'geg',
  'noreply@globaleducationgateway.com',
  '{"primary": "#1e40af", "secondary": "#3b82f6"}'::jsonb,
  true,
  '{
    "features": {
      "ai_recommendations": true,
      "visa_calculator": true,
      "document_verification": true,
      "multi_language": true
    },
    "limits": {
      "max_applications_per_student": 10,
      "max_agents": 1000
    }
  }'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  email_from = EXCLUDED.email_from,
  updated_at = NOW();

-- Backfill any existing profiles without a tenant_id
UPDATE public.profiles
SET tenant_id = '00000000-0000-0000-0000-000000000001'::uuid
WHERE tenant_id IS NULL;

-- Backfill any existing students without a tenant_id
UPDATE public.students
SET tenant_id = '00000000-0000-0000-0000-000000000001'::uuid
WHERE tenant_id IS NULL;

-- Backfill any existing agents without a tenant_id
UPDATE public.agents
SET tenant_id = '00000000-0000-0000-0000-000000000001'::uuid
WHERE tenant_id IS NULL;
