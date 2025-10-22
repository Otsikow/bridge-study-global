-- Secure search_path for security-definer helper functions
-- Ensures they cannot be hijacked via attacker-controlled schemas

-- get_user_role
CREATE OR REPLACE FUNCTION public.get_user_role(user_id UUID)
RETURNS app_role
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE id = user_id;
$$;

-- is_admin_or_staff
CREATE OR REPLACE FUNCTION public.is_admin_or_staff(user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT role IN ('admin', 'staff') FROM public.profiles WHERE id = user_id;
$$;

-- get_user_tenant
CREATE OR REPLACE FUNCTION public.get_user_tenant(user_id UUID)
RETURNS UUID
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT tenant_id FROM public.profiles WHERE id = user_id;
$$;
