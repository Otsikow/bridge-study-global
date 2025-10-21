-- Function to handle new user profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  default_tenant_id uuid;
BEGIN
  -- Get the default tenant (first tenant in the system)
  SELECT id INTO default_tenant_id FROM public.tenants LIMIT 1;
  
  -- If no tenant exists, return early
  IF default_tenant_id IS NULL THEN
    RAISE WARNING 'No tenant found, profile creation skipped';
    RETURN NEW;
  END IF;

  -- Insert profile with data from auth.users metadata
  INSERT INTO public.profiles (
    id,
    tenant_id,
    email,
    full_name,
    role
  )
  VALUES (
    NEW.id,
    default_tenant_id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
    COALESCE((NEW.raw_user_meta_data->>'role')::app_role, 'student'::app_role)
  );

  -- If role is student, create student record
  IF COALESCE((NEW.raw_user_meta_data->>'role')::app_role, 'student'::app_role) = 'student'::app_role THEN
    INSERT INTO public.students (tenant_id, profile_id)
    VALUES (default_tenant_id, NEW.id);
  END IF;

  -- If role is agent, create agent record
  IF (NEW.raw_user_meta_data->>'role')::app_role = 'agent'::app_role THEN
    INSERT INTO public.agents (tenant_id, profile_id)
    VALUES (default_tenant_id, NEW.id);
  END IF;

  RETURN NEW;
END;
$$;

-- Trigger to automatically create profile on user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Create profiles for any existing auth users that don't have profiles
DO $$
DECLARE
  auth_user RECORD;
  default_tenant_id uuid;
BEGIN
  -- Get default tenant
  SELECT id INTO default_tenant_id FROM public.tenants LIMIT 1;
  
  -- Skip if no tenant
  IF default_tenant_id IS NULL THEN
    RETURN;
  END IF;

  -- Loop through auth users without profiles
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
    );

    -- Create student record if role is student
    IF COALESCE((auth_user.raw_user_meta_data->>'role')::app_role, 'student'::app_role) = 'student'::app_role THEN
      INSERT INTO public.students (tenant_id, profile_id)
      VALUES (default_tenant_id, auth_user.id)
      ON CONFLICT DO NOTHING;
    END IF;
  END LOOP;
END $$;