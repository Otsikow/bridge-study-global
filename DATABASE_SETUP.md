# Database Setup for Authentication Fix

The authentication system is currently broken because there's no default tenant in the database. Follow these steps to fix it:

## 1. Create Default Tenant

Run this SQL in your Supabase SQL editor:

```sql
-- Create default tenant
INSERT INTO public.tenants (id, name, slug, email_from, active, brand_colors, settings)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'UniDoxia',
  'udx',
  'noreply@unidoxia.com',
  true,
  '{"primary": "#1e40af", "secondary": "#3b82f6"}',
  '{}'
)
ON CONFLICT (id) DO NOTHING;
```

## 2. Update handle_new_user Function

```sql
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
  -- Get the default tenant
  SELECT id INTO default_tenant_id FROM public.tenants WHERE slug = 'udx' LIMIT 1;
  
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
```

## 3. Set Up Trigger

```sql
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

## 4. Add Policies

```sql
-- Allow profile creation during signup
CREATE POLICY IF NOT EXISTS "Allow profile creation during signup"
  ON public.profiles FOR INSERT
  WITH CHECK (true);

-- Allow user_roles creation during signup
CREATE POLICY IF NOT EXISTS "Allow user_roles creation during signup"
  ON public.user_roles FOR INSERT
  WITH CHECK (true);

-- Allow students creation during signup
CREATE POLICY IF NOT EXISTS "Allow students creation during signup"
  ON public.students FOR INSERT
  WITH CHECK (true);

-- Allow agents creation during signup
CREATE POLICY IF NOT EXISTS "Allow agents creation during signup"
  ON public.agents FOR INSERT
  WITH CHECK (true);
```

## 5. Fix Existing Users

If you have existing users without profiles:

```sql
-- Ensure all existing users have proper role assignments
INSERT INTO public.user_roles (user_id, role)
SELECT p.id, p.role
FROM public.profiles p
LEFT JOIN public.user_roles ur ON ur.user_id = p.id AND ur.role = p.role
WHERE ur.user_id IS NULL;

-- Ensure all existing students have student records
INSERT INTO public.students (tenant_id, profile_id)
SELECT p.tenant_id, p.id
FROM public.profiles p
LEFT JOIN public.students s ON s.profile_id = p.id
WHERE p.role = 'student' AND s.id IS NULL;

-- Ensure all existing agents have agent records
INSERT INTO public.agents (tenant_id, profile_id)
SELECT p.tenant_id, p.id
FROM public.profiles p
LEFT JOIN public.agents a ON a.profile_id = p.id
WHERE p.role = 'agent' AND a.id IS NULL;
```

## Testing

After running these SQL commands:

1. Try signing up a new user
2. Check if a profile is created in the `profiles` table
3. Check if the appropriate role-specific record is created
4. Try signing in with the new user

The authentication system should now work properly for all user roles (students, agents, staff).