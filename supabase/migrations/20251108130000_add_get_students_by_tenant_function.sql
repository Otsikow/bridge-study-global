
CREATE OR REPLACE FUNCTION get_students_by_tenant(p_tenant_id UUID)
RETURNS TABLE (
  student_id UUID,
  application_count BIGINT,
  student JSON
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT
    s.id as student_id,
    COUNT(a.id) as application_count,
    json_build_object(
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
        SELECT json_build_object(
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
  LEFT JOIN public.applications a ON s.id = a.student_id
  WHERE s.tenant_id = p_tenant_id
  GROUP BY s.id;
$$;
