-- Create staff_profiles view for admin user management
CREATE OR REPLACE VIEW public.staff_profiles AS
SELECT 
  p.id,
  p.full_name,
  p.email,
  p.phone,
  p.role,
  p.active,
  p.created_at,
  p.updated_at,
  p.tenant_id,
  p.avatar_url,
  p.locale,
  p.timezone
FROM public.profiles p
WHERE p.role IN ('admin', 'staff');

-- Grant permissions on the view
GRANT SELECT ON public.staff_profiles TO authenticated;

-- Enable RLS on the view (inherits from profiles table)
ALTER VIEW public.staff_profiles SET (security_invoker = true);

COMMENT ON VIEW public.staff_profiles IS 'View of staff and admin profiles for user management';