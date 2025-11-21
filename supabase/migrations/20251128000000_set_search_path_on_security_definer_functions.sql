-- Harden SECURITY DEFINER functions by enforcing a safe search_path
ALTER FUNCTION public.get_students_by_tenant(uuid) SET search_path = public;
ALTER FUNCTION public.ensure_agent_team_invite_code(uuid, boolean) SET search_path = public;
