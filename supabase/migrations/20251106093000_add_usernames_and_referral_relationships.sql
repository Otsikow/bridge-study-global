-- Add username and referral tracking columns to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS username TEXT,
  ADD COLUMN IF NOT EXISTS referrer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS referred_by TEXT;

-- Backfill usernames for existing profiles if missing
UPDATE public.profiles
SET username = 'user_' || SUBSTRING(id::text, 1, 12)
WHERE username IS NULL OR TRIM(username) = '';

-- Enforce lowercase usernames for consistency
UPDATE public.profiles
SET username = LOWER(username);

-- Ensure uniqueness (case insensitive) and non-null usernames
ALTER TABLE public.profiles
  ALTER COLUMN username SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_indexes
    WHERE schemaname = 'public'
      AND indexname = 'profiles_username_ci_key'
  ) THEN
    EXECUTE 'CREATE UNIQUE INDEX profiles_username_ci_key ON public.profiles (LOWER(username))';
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_profiles_referrer_id ON public.profiles(referrer_id);

-- Add username column to agents and backfill from related profile usernames
ALTER TABLE public.agents
  ADD COLUMN IF NOT EXISTS username TEXT;

UPDATE public.agents a
SET username = p.username
FROM public.profiles p
WHERE a.profile_id = p.id
  AND (a.username IS NULL OR TRIM(a.username) = '');

UPDATE public.agents
SET username = LOWER(username);

ALTER TABLE public.agents
  ALTER COLUMN username SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE schemaname = 'public'
      AND indexname = 'agents_username_ci_key'
  ) THEN
    EXECUTE 'CREATE UNIQUE INDEX agents_username_ci_key ON public.agents (LOWER(username))';
  END IF;
END $$;

-- Create referral_relations table to track multi-level referrals
CREATE TABLE IF NOT EXISTS public.referral_relations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  referrer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  referred_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  level SMALLINT NOT NULL CHECK (level IN (1, 2)),
  amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (referrer_id, referred_user_id, level)
);

CREATE INDEX IF NOT EXISTS idx_referral_relations_referrer
  ON public.referral_relations(referrer_id, level);

CREATE INDEX IF NOT EXISTS idx_referral_relations_referred
  ON public.referral_relations(referred_user_id);

ALTER TABLE public.referral_relations ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'referral_relations'
      AND policyname = 'Users can view their referral data'
  ) THEN
    EXECUTE $$
      CREATE POLICY "Users can view their referral data"
      ON public.referral_relations FOR SELECT
      USING (
        referrer_id = auth.uid() OR referred_user_id = auth.uid()
      );
    $$;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'referral_relations'
      AND policyname = 'Service role manages referral data'
  ) THEN
    EXECUTE $$
      CREATE POLICY "Service role manages referral data"
      ON public.referral_relations FOR ALL
      USING (auth.role() = 'service_role')
      WITH CHECK (auth.role() = 'service_role');
    $$;
  END IF;
END $$;

-- Update handle_new_user trigger to populate username/referral metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  default_tenant_id UUID;
  new_role app_role;
  new_username TEXT;
  provided_phone TEXT;
  provided_country TEXT;
  referrer_username TEXT;
  referrer_profile_id UUID;
  level_two_referrer_id UUID;
BEGIN
  SELECT id INTO default_tenant_id FROM public.tenants LIMIT 1;

  IF default_tenant_id IS NULL THEN
    RAISE WARNING 'No tenant found, profile creation skipped';
    RETURN NEW;
  END IF;

  new_role := COALESCE((NEW.raw_user_meta_data->>'role')::app_role, 'student'::app_role);
  new_username := NEW.raw_user_meta_data->>'username';
  provided_phone := NULLIF(NEW.raw_user_meta_data->>'phone', '');
  provided_country := NULLIF(NEW.raw_user_meta_data->>'country', '');
  referrer_username := NEW.raw_user_meta_data->>'referrer_username';

  IF new_username IS NULL OR LENGTH(TRIM(new_username)) = 0 THEN
    new_username := 'user_' || SUBSTRING(NEW.id::text, 1, 12);
  ELSE
    new_username := LOWER(REGEXP_REPLACE(new_username, '\s+', '', 'g'));
  END IF;

  -- Prevent collisions by appending part of the UUID if needed
  IF EXISTS (
    SELECT 1 FROM public.profiles WHERE LOWER(username) = new_username
  ) THEN
    new_username := new_username || '_' || SUBSTRING(NEW.id::text, 1, 6);
  END IF;

  IF NEW.raw_user_meta_data ? 'referrer_id' THEN
    BEGIN
      referrer_profile_id := (NEW.raw_user_meta_data->>'referrer_id')::uuid;
    EXCEPTION WHEN OTHERS THEN
      referrer_profile_id := NULL;
    END;
  END IF;

  IF referrer_profile_id IS NULL AND referrer_username IS NOT NULL THEN
    SELECT id INTO referrer_profile_id
    FROM public.profiles
    WHERE LOWER(username) = LOWER(referrer_username)
    LIMIT 1;
  END IF;

  INSERT INTO public.profiles (
    id,
    tenant_id,
    email,
    full_name,
    role,
    phone,
    country,
    username,
    referrer_id,
    referred_by
  ) VALUES (
    NEW.id,
    default_tenant_id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
    new_role,
    provided_phone,
    provided_country,
    new_username,
    referrer_profile_id,
    CASE
      WHEN referrer_profile_id IS NOT NULL THEN (
        SELECT username FROM public.profiles WHERE id = referrer_profile_id
      )
      ELSE NULL
    END
  );

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, new_role)
  ON CONFLICT (user_id, role) DO NOTHING;

  IF new_role = 'student'::app_role THEN
    INSERT INTO public.students (tenant_id, profile_id)
    VALUES (default_tenant_id, NEW.id);
  END IF;

  IF new_role = 'agent'::app_role THEN
    INSERT INTO public.agents (tenant_id, profile_id, username)
    VALUES (default_tenant_id, NEW.id, new_username);
  END IF;

  IF referrer_profile_id IS NOT NULL THEN
    INSERT INTO public.referral_relations (referrer_id, referred_user_id, level)
    VALUES (referrer_profile_id, NEW.id, 1)
    ON CONFLICT DO NOTHING;

    SELECT referrer_id INTO level_two_referrer_id
    FROM public.profiles
    WHERE id = referrer_profile_id;

    IF level_two_referrer_id IS NOT NULL THEN
      INSERT INTO public.referral_relations (referrer_id, referred_user_id, level)
      VALUES (level_two_referrer_id, NEW.id, 2)
      ON CONFLICT DO NOTHING;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Recreate trigger to ensure latest definition is active
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
