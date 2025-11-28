-- Migration: Add comprehensive messaging contacts function for all user roles
-- This function returns all users that the current user can message based on their role

BEGIN;

-- Create function to get messaging contacts based on user role
CREATE OR REPLACE FUNCTION public.get_messaging_contacts(
  p_search text DEFAULT NULL,
  p_limit integer DEFAULT 50
)
RETURNS TABLE (
  profile_id uuid,
  full_name text,
  email text,
  avatar_url text,
  role app_role,
  contact_type text,
  headline text
)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_user_role app_role;
  v_tenant_id uuid;
  v_search_filter text := NULL;
  v_student_id uuid;
BEGIN
  -- Check authentication
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;

  -- Get current user's role and tenant
  SELECT role, tenant_id
    INTO v_user_role, v_tenant_id
  FROM public.profiles
  WHERE id = v_user_id;

  IF v_user_role IS NULL THEN
    RAISE EXCEPTION 'profile not found';
  END IF;

  -- Prepare search filter
  IF p_search IS NOT NULL AND trim(p_search) != '' THEN
    v_search_filter := '%' || trim(p_search) || '%';
  END IF;

  -- Return contacts based on role
  IF v_user_role = 'agent'::app_role OR v_user_role = 'partner'::app_role THEN
    -- Agents/Partners can message:
    -- 1. Students assigned to them
    -- 2. Staff (staff, admin, counselor)
    -- 3. Universities (school_rep)

    -- Return assigned students
    RETURN QUERY
    SELECT
      p.id,
      p.full_name,
      p.email,
      p.avatar_url,
      p.role,
      'student'::text as contact_type,
      COALESCE(s.headline, '')::text as headline
    FROM public.students s
    JOIN public.agent_student_links asl
      ON asl.student_id = s.id
     AND asl.agent_profile_id = v_user_id
    JOIN public.profiles p
      ON p.id = s.profile_id
    WHERE p.tenant_id = v_tenant_id
      AND (v_search_filter IS NULL OR p.full_name ILIKE v_search_filter OR p.email ILIKE v_search_filter)
    ORDER BY p.full_name
    LIMIT p_limit;

    -- Return staff members
    RETURN QUERY
    SELECT
      p.id,
      p.full_name,
      p.email,
      p.avatar_url,
      p.role,
      'staff'::text as contact_type,
      ''::text as headline
    FROM public.profiles p
    WHERE p.tenant_id = v_tenant_id
      AND p.role IN ('staff'::app_role, 'admin'::app_role, 'counselor'::app_role)
      AND p.id != v_user_id
      AND (v_search_filter IS NULL OR p.full_name ILIKE v_search_filter OR p.email ILIKE v_search_filter)
    ORDER BY p.full_name
    LIMIT p_limit;

    -- Return university representatives
    RETURN QUERY
    SELECT
      p.id,
      p.full_name,
      p.email,
      p.avatar_url,
      p.role,
      'university'::text as contact_type,
      ''::text as headline
    FROM public.profiles p
    WHERE p.tenant_id = v_tenant_id
      AND p.role = 'school_rep'::app_role
      AND p.id != v_user_id
      AND (v_search_filter IS NULL OR p.full_name ILIKE v_search_filter OR p.email ILIKE v_search_filter)
    ORDER BY p.full_name
    LIMIT p_limit;

  ELSIF v_user_role = 'staff'::app_role THEN
    -- Staff can message:
    -- 1. Other staff members
    -- 2. Agents
    -- 3. Universities
    -- 4. Students assigned to them

    -- Return other staff
    RETURN QUERY
    SELECT
      p.id,
      p.full_name,
      p.email,
      p.avatar_url,
      p.role,
      'staff'::text as contact_type,
      ''::text as headline
    FROM public.profiles p
    WHERE p.tenant_id = v_tenant_id
      AND p.role IN ('staff'::app_role, 'admin'::app_role, 'counselor'::app_role)
      AND p.id != v_user_id
      AND (v_search_filter IS NULL OR p.full_name ILIKE v_search_filter OR p.email ILIKE v_search_filter)
    ORDER BY p.full_name
    LIMIT p_limit;

    -- Return agents
    RETURN QUERY
    SELECT
      p.id,
      p.full_name,
      p.email,
      p.avatar_url,
      p.role,
      'agent'::text as contact_type,
      ''::text as headline
    FROM public.profiles p
    WHERE p.tenant_id = v_tenant_id
      AND p.role IN ('agent'::app_role, 'partner'::app_role)
      AND p.id != v_user_id
      AND (v_search_filter IS NULL OR p.full_name ILIKE v_search_filter OR p.email ILIKE v_search_filter)
    ORDER BY p.full_name
    LIMIT p_limit;

    -- Return universities
    RETURN QUERY
    SELECT
      p.id,
      p.full_name,
      p.email,
      p.avatar_url,
      p.role,
      'university'::text as contact_type,
      ''::text as headline
    FROM public.profiles p
    WHERE p.tenant_id = v_tenant_id
      AND p.role = 'school_rep'::app_role
      AND p.id != v_user_id
      AND (v_search_filter IS NULL OR p.full_name ILIKE v_search_filter OR p.email ILIKE v_search_filter)
    ORDER BY p.full_name
    LIMIT p_limit;

    -- Return students (all students in tenant for staff)
    RETURN QUERY
    SELECT
      p.id,
      p.full_name,
      p.email,
      p.avatar_url,
      p.role,
      'student'::text as contact_type,
      COALESCE(s.headline, '')::text as headline
    FROM public.students s
    JOIN public.profiles p
      ON p.id = s.profile_id
    WHERE p.tenant_id = v_tenant_id
      AND (v_search_filter IS NULL OR p.full_name ILIKE v_search_filter OR p.email ILIKE v_search_filter)
    ORDER BY p.full_name
    LIMIT p_limit;

  ELSIF v_user_role = 'school_rep'::app_role THEN
    -- Universities can message:
    -- 1. Staff
    -- 2. Agents
    -- 3. Students who have applied to their courses

    -- Return staff
    RETURN QUERY
    SELECT
      p.id,
      p.full_name,
      p.email,
      p.avatar_url,
      p.role,
      'staff'::text as contact_type,
      ''::text as headline
    FROM public.profiles p
    WHERE p.tenant_id = v_tenant_id
      AND p.role IN ('staff'::app_role, 'admin'::app_role, 'counselor'::app_role)
      AND p.id != v_user_id
      AND (v_search_filter IS NULL OR p.full_name ILIKE v_search_filter OR p.email ILIKE v_search_filter)
    ORDER BY p.full_name
    LIMIT p_limit;

    -- Return agents
    RETURN QUERY
    SELECT
      p.id,
      p.full_name,
      p.email,
      p.avatar_url,
      p.role,
      'agent'::text as contact_type,
      ''::text as headline
    FROM public.profiles p
    WHERE p.tenant_id = v_tenant_id
      AND p.role IN ('agent'::app_role, 'partner'::app_role)
      AND p.id != v_user_id
      AND (v_search_filter IS NULL OR p.full_name ILIKE v_search_filter OR p.email ILIKE v_search_filter)
    ORDER BY p.full_name
    LIMIT p_limit;

    -- Return students who have applied (for now, return all students - can be refined later)
    RETURN QUERY
    SELECT
      p.id,
      p.full_name,
      p.email,
      p.avatar_url,
      p.role,
      'student'::text as contact_type,
      COALESCE(s.headline, '')::text as headline
    FROM public.students s
    JOIN public.profiles p
      ON p.id = s.profile_id
    WHERE p.tenant_id = v_tenant_id
      AND (v_search_filter IS NULL OR p.full_name ILIKE v_search_filter OR p.email ILIKE v_search_filter)
    ORDER BY p.full_name
    LIMIT p_limit;

  ELSIF v_user_role = 'student'::app_role THEN
    -- Students can message:
    -- 1. UniDoxia staff (staff, admin, counselor)
    -- 2. Their assigned agent (if any)

    -- Return staff
    RETURN QUERY
    SELECT
      p.id,
      p.full_name,
      p.email,
      p.avatar_url,
      p.role,
      'staff'::text as contact_type,
      ''::text as headline
    FROM public.profiles p
    WHERE p.tenant_id = v_tenant_id
      AND p.role IN ('staff'::app_role, 'admin'::app_role, 'counselor'::app_role)
      AND (v_search_filter IS NULL OR p.full_name ILIKE v_search_filter OR p.email ILIKE v_search_filter)
    ORDER BY p.full_name
    LIMIT p_limit;

    -- Get student ID
    SELECT s.id INTO v_student_id
    FROM public.students s
    WHERE s.profile_id = v_user_id;

    -- Return assigned agent
    IF v_student_id IS NOT NULL THEN
      RETURN QUERY
      SELECT
        p.id,
        p.full_name,
        p.email,
        p.avatar_url,
        p.role,
        'agent'::text as contact_type,
        ''::text as headline
      FROM public.agent_student_links asl
      JOIN public.profiles p
        ON p.id = asl.agent_profile_id
      WHERE asl.student_id = v_student_id
        AND p.tenant_id = v_tenant_id
        AND (v_search_filter IS NULL OR p.full_name ILIKE v_search_filter OR p.email ILIKE v_search_filter)
      ORDER BY p.full_name
      LIMIT p_limit;
    END IF;

  ELSIF v_user_role = 'counselor'::app_role THEN
    -- Counselors can message everyone
    RETURN QUERY
    SELECT
      p.id,
      p.full_name,
      p.email,
      p.avatar_url,
      p.role,
      CASE
        WHEN p.role = 'student' THEN 'student'
        WHEN p.role IN ('agent', 'partner') THEN 'agent'
        WHEN p.role = 'school_rep' THEN 'university'
        ELSE 'staff'
      END::text as contact_type,
      COALESCE((SELECT s.headline FROM public.students s WHERE s.profile_id = p.id), '')::text as headline
    FROM public.profiles p
    WHERE p.tenant_id = v_tenant_id
      AND p.id != v_user_id
      AND (v_search_filter IS NULL OR p.full_name ILIKE v_search_filter OR p.email ILIKE v_search_filter)
    ORDER BY p.full_name
    LIMIT p_limit;

  ELSIF v_user_role = 'admin'::app_role THEN
    -- Admins can message everyone
    RETURN QUERY
    SELECT
      p.id,
      p.full_name,
      p.email,
      p.avatar_url,
      p.role,
      CASE
        WHEN p.role = 'student' THEN 'student'
        WHEN p.role IN ('agent', 'partner') THEN 'agent'
        WHEN p.role = 'school_rep' THEN 'university'
        ELSE 'staff'
      END::text as contact_type,
      COALESCE((SELECT s.headline FROM public.students s WHERE s.profile_id = p.id), '')::text as headline
    FROM public.profiles p
    WHERE p.tenant_id = v_tenant_id
      AND p.id != v_user_id
      AND (v_search_filter IS NULL OR p.full_name ILIKE v_search_filter OR p.email ILIKE v_search_filter)
    ORDER BY p.full_name
    LIMIT p_limit;

  ELSE
    -- Default: can message staff and admins
    RETURN QUERY
    SELECT
      p.id,
      p.full_name,
      p.email,
      p.avatar_url,
      p.role,
      'staff'::text as contact_type,
      ''::text as headline
    FROM public.profiles p
    WHERE p.tenant_id = v_tenant_id
      AND p.role IN ('staff'::app_role, 'admin'::app_role, 'counselor'::app_role)
      AND (v_search_filter IS NULL OR p.full_name ILIKE v_search_filter OR p.email ILIKE v_search_filter)
    ORDER BY p.full_name
    LIMIT p_limit;
  END IF;

  RETURN;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_messaging_contacts(text, integer) TO authenticated;

COMMENT ON FUNCTION public.get_messaging_contacts IS 'Returns all users that the current user can message based on their role and relationships';

COMMIT;
