-- Add missing columns to agent_student_links
ALTER TABLE public.agent_student_links 
ADD COLUMN IF NOT EXISTS application_count INTEGER DEFAULT 0;

-- Add missing columns to conversations
ALTER TABLE public.conversations
ADD COLUMN IF NOT EXISTS avatar_url TEXT,
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- Add missing columns to conversation_messages
ALTER TABLE public.conversation_messages
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- Create resource_library table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.resource_library (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  file_url TEXT,
  file_type TEXT,
  access_level TEXT DEFAULT 'staff',
  category TEXT,
  tags TEXT[] DEFAULT '{}',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on resource_library
ALTER TABLE public.resource_library ENABLE ROW LEVEL SECURITY;

-- RLS policies for resource_library
CREATE POLICY "Staff can view resources"
ON public.resource_library
FOR SELECT
TO authenticated
USING (is_admin_or_staff(auth.uid()));

CREATE POLICY "Staff can manage resources"
ON public.resource_library
FOR ALL
TO authenticated
USING (is_admin_or_staff(auth.uid()))
WITH CHECK (is_admin_or_staff(auth.uid()));

-- Create ensure_agent_team_invite_code function
CREATE OR REPLACE FUNCTION public.ensure_agent_team_invite_code(
  p_agent_profile_id UUID,
  p_regenerate BOOLEAN DEFAULT false
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_agent_id UUID;
  v_code TEXT;
BEGIN
  -- Get agent_id from profile_id
  SELECT id INTO v_agent_id
  FROM public.agents
  WHERE profile_id = p_agent_profile_id;

  IF v_agent_id IS NULL THEN
    RAISE EXCEPTION 'Agent not found for profile_id: %', p_agent_profile_id;
  END IF;

  -- Check if referral code exists
  SELECT code INTO v_code
  FROM public.referrals
  WHERE agent_id = v_agent_id AND active = true
  LIMIT 1;

  -- If regenerate requested or no code exists, create new one
  IF v_code IS NULL OR p_regenerate THEN
    -- Deactivate old codes if regenerating
    IF p_regenerate THEN
      UPDATE public.referrals
      SET active = false
      WHERE agent_id = v_agent_id;
    END IF;

    -- Generate new code
    v_code := upper(substring(md5(random()::text || v_agent_id::text) from 1 for 8));

    -- Insert new referral code
    INSERT INTO public.referrals (tenant_id, agent_id, code, active)
    SELECT tenant_id, v_agent_id, v_code, true
    FROM public.agents
    WHERE id = v_agent_id;
  END IF;

  RETURN v_code;
END;
$$;

-- Create get_students_by_tenant function
CREATE OR REPLACE FUNCTION public.get_students_by_tenant(
  p_tenant_id UUID
)
RETURNS TABLE (
  student_id UUID,
  application_count INTEGER,
  student JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id as student_id,
    COALESCE((
      SELECT COUNT(*)::INTEGER
      FROM public.applications a
      WHERE a.student_id = s.id
    ), 0) as application_count,
    jsonb_build_object(
      'id', s.id,
      'tenant_id', s.tenant_id,
      'profile_id', s.profile_id,
      'legal_name', s.legal_name,
      'preferred_name', s.preferred_name,
      'contact_email', s.contact_email,
      'contact_phone', s.contact_phone,
      'current_country', s.current_country,
      'created_at', s.created_at,
      'updated_at', s.updated_at,
      'profile', (
        SELECT jsonb_build_object(
          'id', p.id,
          'full_name', p.full_name,
          'email', p.email,
          'phone', p.phone,
          'country', p.country,
          'onboarded', p.onboarded,
          'username', p.username
        )
        FROM public.profiles p
        WHERE p.id = s.profile_id
      )
    ) as student
  FROM public.students s
  WHERE s.tenant_id = p_tenant_id;
END;
$$;

-- Create featured_listing_status enum type if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'featured_listing_status') THEN
    CREATE TYPE featured_listing_status AS ENUM ('active', 'pending', 'expired', 'cancelled');
  END IF;
END $$;