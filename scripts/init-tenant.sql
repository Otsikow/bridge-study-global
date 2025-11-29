-- ============================================================================
-- CRITICAL: Initialize Default Tenant for UniDoxia Platform
-- ============================================================================
-- This script MUST be run in the Supabase SQL Editor to fix authentication
-- 
-- ISSUE: The authentication system fails because no tenant exists in the database.
-- The handle_new_user() trigger requires a tenant to create user profiles.
-- Without this tenant, users can sign up but won't get profiles, breaking login.
--
-- HOW TO RUN:
-- 1. Go to your Supabase project dashboard
-- 2. Navigate to SQL Editor
-- 3. Paste and run this entire script
-- ============================================================================

-- Insert default tenant (will not fail if already exists)
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
  'UniDoxia',
  'udx',
  'noreply@unidoxia.com',
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

-- Fix any auth users that don't have profiles (backfill)
DO $$
DECLARE
  auth_user RECORD;
  default_tenant_id uuid := '00000000-0000-0000-0000-000000000001'::uuid;
BEGIN
  FOR auth_user IN 
    SELECT au.id, au.email, au.raw_user_meta_data
    FROM auth.users au
    LEFT JOIN public.profiles p ON au.id = p.id
    WHERE p.id IS NULL
  LOOP
    -- Create profile
    INSERT INTO public.profiles (
      id,
      tenant_id,
      email,
      full_name,
      role
    )
    VALUES (
      auth_user.id,
      default_tenant_id,
      auth_user.email,
      COALESCE(auth_user.raw_user_meta_data->>'full_name', 'User'),
      COALESCE((auth_user.raw_user_meta_data->>'role')::app_role, 'student'::app_role)
    )
    ON CONFLICT (id) DO NOTHING;

    -- Create user_roles entry
    INSERT INTO public.user_roles (user_id, role)
    VALUES (
      auth_user.id,
      COALESCE((auth_user.raw_user_meta_data->>'role')::app_role, 'student'::app_role)
    )
    ON CONFLICT (user_id, role) DO NOTHING;

    -- Create student record if role is student
    IF COALESCE((auth_user.raw_user_meta_data->>'role')::app_role, 'student'::app_role) = 'student'::app_role THEN
      INSERT INTO public.students (tenant_id, profile_id)
      VALUES (default_tenant_id, auth_user.id)
      ON CONFLICT (profile_id) DO NOTHING;
    END IF;

    -- Create agent record if role is agent  
    IF COALESCE((auth_user.raw_user_meta_data->>'role')::app_role, 'agent'::app_role) = 'agent'::app_role THEN
      INSERT INTO public.agents (tenant_id, profile_id)
      VALUES (default_tenant_id, auth_user.id)
      ON CONFLICT (profile_id) DO NOTHING;
    END IF;
  END LOOP;
END $$;

-- Verify the tenant was created
SELECT 
  'Tenant created successfully!' as status,
  id,
  name,
  slug
FROM public.tenants
WHERE id = '00000000-0000-0000-0000-000000000001'::uuid;
