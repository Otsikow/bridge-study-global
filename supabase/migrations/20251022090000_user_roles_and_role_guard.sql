-- User roles table and role hardening migration
-- Create dedicated user_roles table, move role logic out of profiles,
-- add helper functions, triggers, and update policies to prevent escalation.

-- 1) user_roles table
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, role)
);

CREATE INDEX IF NOT EXISTS idx_user_roles_user ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON public.user_roles(role);

-- Enable RLS and lock down writes to admins/staff
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'user_roles' AND policyname = 'Users can view their own roles'
  ) THEN
    CREATE POLICY "Users can view their own roles"
    ON public.user_roles FOR SELECT
    USING (user_id = auth.uid() OR is_admin_or_staff(auth.uid()));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'user_roles' AND policyname = 'Admins can manage user roles'
  ) THEN
    CREATE POLICY "Admins can manage user roles"
    ON public.user_roles FOR ALL
    USING (is_admin_or_staff(auth.uid()))
    WITH CHECK (is_admin_or_staff(auth.uid()));
  END IF;
END $$;

-- 2) Backfill roles from profiles (idempotent)
INSERT INTO public.user_roles (user_id, role)
SELECT id, role FROM public.profiles
ON CONFLICT DO NOTHING;

-- 3) Helper functions
CREATE OR REPLACE FUNCTION public.has_role(p_user_id UUID, p_role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = p_user_id AND ur.role = p_role
  );
$$;

CREATE OR REPLACE FUNCTION public.get_primary_role(p_user_id UUID)
RETURNS app_role
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT COALESCE((
    SELECT ur.role
    FROM public.user_roles ur
    WHERE ur.user_id = p_user_id
    ORDER BY
      CASE ur.role
        WHEN 'admin' THEN 1
        WHEN 'staff' THEN 2
        WHEN 'partner' THEN 3
        WHEN 'agent' THEN 4
        WHEN 'counselor' THEN 5
        WHEN 'verifier' THEN 6
        WHEN 'finance' THEN 7
        WHEN 'school_rep' THEN 8
        ELSE 9
      END
    LIMIT 1
  ), 'student'::app_role);
$$;

-- Backwards-compat function names used across policies
CREATE OR REPLACE FUNCTION public.get_user_role(user_id UUID)
RETURNS app_role
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT public.get_primary_role(user_id);
$$;

CREATE OR REPLACE FUNCTION public.is_admin_or_staff(user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT public.has_role(user_id, 'admin'::app_role) OR public.has_role(user_id, 'staff'::app_role);
$$;

-- 4) Keep profiles.role in sync (for compatibility) and prevent direct changes
CREATE OR REPLACE FUNCTION public.sync_profile_role_from_user_roles()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  affected_user_id UUID;
BEGIN
  affected_user_id := COALESCE(NEW.user_id, OLD.user_id);
  -- Bypass the guard trigger when we are syncing from user_roles
  PERFORM set_config('app.bypass_role_guard', 'true', true);
  UPDATE public.profiles
  SET role = public.get_primary_role(affected_user_id),
      updated_at = NOW()
  WHERE id = affected_user_id;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_profile_role_after_change ON public.user_roles;
CREATE TRIGGER trg_sync_profile_role_after_change
AFTER INSERT OR UPDATE OR DELETE ON public.user_roles
FOR EACH ROW
EXECUTE FUNCTION public.sync_profile_role_from_user_roles();

-- Guard against direct changes to profiles.role
CREATE OR REPLACE FUNCTION public.prevent_direct_role_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  bypass TEXT;
BEGIN
  bypass := current_setting('app.bypass_role_guard', true);
  IF (TG_OP = 'UPDATE') AND NEW.role IS DISTINCT FROM OLD.role THEN
    IF bypass = 'true' THEN
      RETURN NEW; -- allow sync function to proceed
    END IF;
    RAISE EXCEPTION 'Direct updates to profiles.role are not allowed. Use user_roles instead.'
      USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_direct_role_update ON public.profiles;
CREATE TRIGGER trg_prevent_direct_role_update
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.prevent_direct_role_update();

-- 5) Update signup trigger to insert into user_roles too
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  default_tenant_id uuid;
  new_role app_role;
BEGIN
  SELECT id INTO default_tenant_id FROM public.tenants LIMIT 1;

  IF default_tenant_id IS NULL THEN
    RAISE WARNING 'No tenant found, profile creation skipped';
    RETURN NEW;
  END IF;

  new_role := COALESCE((NEW.raw_user_meta_data->>'role')::app_role, 'student'::app_role);

  INSERT INTO public.profiles (
    id, tenant_id, email, full_name, role
  ) VALUES (
    NEW.id, default_tenant_id, NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
    new_role
  );

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, new_role)
  ON CONFLICT (user_id, role) DO NOTHING;

  IF new_role = 'student'::app_role THEN
    INSERT INTO public.students (tenant_id, profile_id)
    VALUES (default_tenant_id, NEW.id);
  END IF;

  IF new_role = 'agent'::app_role THEN
    INSERT INTO public.agents (tenant_id, profile_id)
    VALUES (default_tenant_id, NEW.id);
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 6) Ensure any profiles without a user_roles row get one (idempotent)
INSERT INTO public.user_roles (user_id, role)
SELECT p.id, p.role
FROM public.profiles p
LEFT JOIN public.user_roles ur ON ur.user_id = p.id AND ur.role = p.role
WHERE ur.user_id IS NULL;

-- 7) Replace policy that referenced profiles.role with has_role()
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'applications' AND policyname = 'Partners can view applications to their university'
  ) THEN
    DROP POLICY "Partners can view applications to their university" ON public.applications;
  END IF;
END $$;

CREATE POLICY "Partners can view applications to their university"
ON public.applications FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.programs p
    JOIN public.universities u ON p.university_id = u.id
    WHERE p.id = applications.program_id
      AND public.has_role(auth.uid(), 'partner'::app_role)
    -- Additional partner-university link would go here
  )
);
