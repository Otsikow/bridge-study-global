-- Fix authentication system by ensuring default tenant exists and improving user creation
-- This migration addresses the broken sign-up/sign-in functionality

-- 1. Create default tenant if it doesn't exist
INSERT INTO public.tenants (id, name, slug, email_from, active)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'UniDoxia',
  'geg',
  'noreply@globaleducationgateway.com',
  true
)
ON CONFLICT (id) DO NOTHING;

-- 2. Update the handle_new_user function to be more robust
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  default_tenant_id uuid;
  new_role app_role;
  profile_created boolean := false;
BEGIN
  -- Get the default tenant (should always exist after this migration)
  SELECT id INTO default_tenant_id FROM public.tenants WHERE slug = 'geg' LIMIT 1;
  
  -- If still no tenant, create one as fallback
  IF default_tenant_id IS NULL THEN
    INSERT INTO public.tenants (id, name, slug, email_from, active)
    VALUES (
      gen_random_uuid(),
      'Default Tenant',
      'default',
      'noreply@example.com',
      true
    )
    RETURNING id INTO default_tenant_id;
  END IF;

  -- Determine role from metadata or default to student
  new_role := COALESCE((NEW.raw_user_meta_data->>'role')::app_role, 'student'::app_role);

  -- Create profile
  INSERT INTO public.profiles (
    id, tenant_id, email, full_name, role, onboarded
  ) VALUES (
    NEW.id, 
    default_tenant_id, 
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
    new_role,
    false
  );
  
  profile_created := true;

  -- Create user role entry
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, new_role)
  ON CONFLICT (user_id, role) DO NOTHING;

  -- Create role-specific records
  IF new_role = 'student'::app_role THEN
    INSERT INTO public.students (tenant_id, profile_id)
    VALUES (default_tenant_id, NEW.id)
    ON CONFLICT (profile_id) DO NOTHING;
  END IF;

  IF new_role = 'agent'::app_role THEN
    INSERT INTO public.agents (tenant_id, profile_id)
    VALUES (default_tenant_id, NEW.id)
    ON CONFLICT (profile_id) DO NOTHING;
  END IF;

  -- Log successful profile creation
  IF profile_created THEN
    RAISE LOG 'Successfully created profile for user % with role %', NEW.id, new_role;
  END IF;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't fail the auth user creation
    RAISE LOG 'Error creating profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;

-- 3. Ensure the trigger is properly set up
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. Add a policy to allow profile creation during signup
CREATE POLICY "Allow profile creation during signup"
  ON public.profiles FOR INSERT
  WITH CHECK (true);

-- 5. Add a policy to allow user_roles creation during signup
CREATE POLICY "Allow user_roles creation during signup"
  ON public.user_roles FOR INSERT
  WITH CHECK (true);

-- 6. Add a policy to allow students table creation during signup
CREATE POLICY "Allow students creation during signup"
  ON public.students FOR INSERT
  WITH CHECK (true);

-- 7. Add a policy to allow agents table creation during signup
CREATE POLICY "Allow agents creation during signup"
  ON public.agents FOR INSERT
  WITH CHECK (true);

-- 8. Update the signup function to handle role selection properly
-- This will be handled in the frontend by passing role in metadata

-- 9. Ensure all existing users have proper role assignments
INSERT INTO public.user_roles (user_id, role)
SELECT p.id, p.role
FROM public.profiles p
LEFT JOIN public.user_roles ur ON ur.user_id = p.id AND ur.role = p.role
WHERE ur.user_id IS NULL;

-- 10. Ensure all existing students have student records
INSERT INTO public.students (tenant_id, profile_id)
SELECT p.tenant_id, p.id
FROM public.profiles p
LEFT JOIN public.students s ON s.profile_id = p.id
WHERE p.role = 'student' AND s.id IS NULL;

-- 11. Ensure all existing agents have agent records
INSERT INTO public.agents (tenant_id, profile_id)
SELECT p.tenant_id, p.id
FROM public.profiles p
LEFT JOIN public.agents a ON a.profile_id = p.id
WHERE p.role = 'agent' AND a.id IS NULL;