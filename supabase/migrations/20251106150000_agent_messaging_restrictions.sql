BEGIN;

CREATE OR REPLACE FUNCTION public.get_or_create_conversation(
  p_user_id uuid,
  p_other_user_id uuid,
  p_tenant_id uuid
)
RETURNS uuid
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_current_user uuid := auth.uid();
  v_conversation_id uuid;
  v_current_role app_role;
  v_current_tenant uuid;
  v_other_role app_role;
  v_other_tenant uuid;
  v_student_id uuid;
BEGIN
  IF v_current_user IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;

  IF p_user_id IS NOT NULL AND p_user_id <> v_current_user THEN
    RAISE EXCEPTION 'cannot act on behalf of another user';
  END IF;

  SELECT role, tenant_id
    INTO v_current_role, v_current_tenant
  FROM public.profiles
  WHERE id = v_current_user;

  IF v_current_role IS NULL THEN
    RAISE EXCEPTION 'profile not found for current user';
  END IF;

  SELECT role, tenant_id
    INTO v_other_role, v_other_tenant
  FROM public.profiles
  WHERE id = p_other_user_id;

  IF v_other_role IS NULL THEN
    RAISE EXCEPTION 'recipient profile not found';
  END IF;

  IF v_current_tenant IS NULL OR v_other_tenant IS NULL OR v_current_tenant <> v_other_tenant THEN
    RAISE EXCEPTION 'users must belong to the same tenant';
  END IF;

  IF p_tenant_id IS NOT NULL AND p_tenant_id <> v_current_tenant THEN
    RAISE EXCEPTION 'tenant mismatch';
  END IF;

  IF v_current_role = 'agent'::app_role AND v_other_role = 'student'::app_role THEN
    SELECT s.id INTO v_student_id
    FROM public.students s
    WHERE s.profile_id = p_other_user_id;

    IF v_student_id IS NULL THEN
      RAISE EXCEPTION 'student record not found';
    END IF;

    IF NOT EXISTS (
      SELECT 1
      FROM public.agent_student_links asl
      WHERE asl.agent_profile_id = v_current_user
        AND asl.student_id = v_student_id
    ) THEN
      RAISE EXCEPTION 'agents can only message students assigned to them';
    END IF;
  ELSIF v_current_role = 'student'::app_role AND v_other_role = 'agent'::app_role THEN
    SELECT s.id INTO v_student_id
    FROM public.students s
    WHERE s.profile_id = v_current_user;

    IF v_student_id IS NULL THEN
      RAISE EXCEPTION 'student record not found';
    END IF;

    IF NOT EXISTS (
      SELECT 1
      FROM public.agent_student_links asl
      WHERE asl.agent_profile_id = p_other_user_id
        AND asl.student_id = v_student_id
    ) THEN
      RAISE EXCEPTION 'students can only message their assigned agent';
    END IF;
  END IF;

  SELECT c.id INTO v_conversation_id
  FROM public.conversations c
  WHERE c.tenant_id = v_current_tenant
    AND c.is_group = FALSE
    AND EXISTS (
      SELECT 1 FROM public.conversation_participants cp1
      WHERE cp1.conversation_id = c.id
        AND cp1.user_id = v_current_user
    )
    AND EXISTS (
      SELECT 1 FROM public.conversation_participants cp2
      WHERE cp2.conversation_id = c.id
        AND cp2.user_id = p_other_user_id
    )
  ORDER BY c.last_message_at DESC NULLS LAST, c.created_at DESC
  LIMIT 1;

  IF v_conversation_id IS NOT NULL THEN
    RETURN v_conversation_id;
  END IF;

  INSERT INTO public.conversations (tenant_id, created_by, is_group, type)
  VALUES (v_current_tenant, v_current_user, FALSE, 'direct')
  RETURNING id INTO v_conversation_id;

  INSERT INTO public.conversation_participants (conversation_id, user_id, role)
  VALUES
    (v_conversation_id, v_current_user, 'owner'),
    (v_conversation_id, p_other_user_id, 'member')
  ON CONFLICT DO NOTHING;

  RETURN v_conversation_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.search_agent_contacts(p_search text DEFAULT NULL)
RETURNS TABLE (
  profile_id uuid,
  full_name text,
  email text,
  avatar_url text,
  role app_role,
  contact_type text
)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_agent_id uuid := auth.uid();
  v_tenant_id uuid;
  v_filter text := NULL;
BEGIN
  IF v_agent_id IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;

  SELECT tenant_id INTO v_tenant_id
  FROM public.profiles
  WHERE id = v_agent_id
    AND role = 'agent'::app_role;

  IF v_tenant_id IS NULL THEN
    RAISE EXCEPTION 'agent profile not found';
  END IF;

  IF p_search IS NOT NULL THEN
    v_filter := '%' || trim(p_search) || '%';
  END IF;

  RETURN QUERY
  SELECT p.id, p.full_name, p.email, p.avatar_url, p.role, 'student'::text
  FROM public.students s
  JOIN public.agent_student_links asl
    ON asl.student_id = s.id
   AND asl.agent_profile_id = v_agent_id
  JOIN public.profiles p
    ON p.id = s.profile_id
  WHERE p.tenant_id = v_tenant_id
    AND (v_filter IS NULL OR p.full_name ILIKE v_filter OR p.email ILIKE v_filter)
  ORDER BY p.full_name
  LIMIT 50;

  RETURN QUERY
  SELECT p.id, p.full_name, p.email, p.avatar_url, p.role, 'staff'::text
  FROM public.profiles p
  WHERE p.tenant_id = v_tenant_id
    AND p.role IN ('staff'::app_role, 'admin'::app_role)
    AND (v_filter IS NULL OR p.full_name ILIKE v_filter OR p.email ILIKE v_filter)
  ORDER BY p.full_name
  LIMIT 50;

END;
$$;

COMMIT;
