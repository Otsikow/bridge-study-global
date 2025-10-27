-- Fix SECURITY DEFINER functions to prevent search_path attacks
-- Add SET search_path = public to all notification system functions

-- Fix create_notification function
CREATE OR REPLACE FUNCTION create_notification(
  p_tenant_id UUID,
  p_user_id UUID,
  p_type TEXT,
  p_title TEXT,
  p_content TEXT,
  p_metadata JSONB DEFAULT '{}',
  p_action_url TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_notification_id UUID;
BEGIN
  INSERT INTO notifications (tenant_id, user_id, type, title, content, metadata, action_url)
  VALUES (p_tenant_id, p_user_id, p_type, p_title, p_content, p_metadata, p_action_url)
  RETURNING id INTO v_notification_id;
  
  RETURN v_notification_id;
END;
$$;

-- Fix notify_application_status_change function
CREATE OR REPLACE FUNCTION notify_application_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_student_profile_id UUID;
  v_agent_profile_id UUID;
  v_program_name TEXT;
  v_university_name TEXT;
  v_tenant_id UUID;
BEGIN
  SELECT 
    s.profile_id, 
    a.profile_id,
    p.name,
    u.name,
    apps.tenant_id
  INTO 
    v_student_profile_id, 
    v_agent_profile_id,
    v_program_name,
    v_university_name,
    v_tenant_id
  FROM applications apps
  JOIN students s ON apps.student_id = s.id
  LEFT JOIN agents ag ON apps.agent_id = ag.id
  LEFT JOIN profiles a ON ag.profile_id = a.id
  JOIN programs p ON apps.program_id = p.id
  JOIN universities u ON p.university_id = u.id
  WHERE apps.id = NEW.id;

  IF NEW.status IS DISTINCT FROM OLD.status THEN
    PERFORM create_notification(
      v_tenant_id,
      v_student_profile_id,
      'application_status',
      'Application Status Updated',
      'Your application to ' || v_program_name || ' at ' || v_university_name || ' is now ' || NEW.status || '.',
      jsonb_build_object(
        'application_id', NEW.id,
        'old_status', OLD.status,
        'new_status', NEW.status,
        'program_name', v_program_name,
        'university_name', v_university_name
      ),
      '/student/applications'
    );

    IF v_agent_profile_id IS NOT NULL THEN
      PERFORM create_notification(
        v_tenant_id,
        v_agent_profile_id,
        'application_status',
        'Application Status Updated',
        'Application to ' || v_program_name || ' at ' || v_university_name || ' is now ' || NEW.status || '.',
        jsonb_build_object(
          'application_id', NEW.id,
          'old_status', OLD.status,
          'new_status', NEW.status,
          'program_name', v_program_name,
          'university_name', v_university_name
        ),
        '/dashboard/applications'
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Fix notify_new_message function
CREATE OR REPLACE FUNCTION notify_new_message()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_student_profile_id UUID;
  v_agent_profile_id UUID;
  v_staff_ids UUID[];
  v_sender_name TEXT;
  v_tenant_id UUID;
  v_recipient_id UUID;
BEGIN
  SELECT full_name INTO v_sender_name
  FROM profiles
  WHERE id = NEW.sender_id;

  SELECT 
    s.profile_id,
    ag.profile_id,
    apps.tenant_id
  INTO 
    v_student_profile_id,
    v_agent_profile_id,
    v_tenant_id
  FROM applications apps
  JOIN students s ON apps.student_id = s.id
  LEFT JOIN agents ag ON apps.agent_id = ag.id
  WHERE apps.id = NEW.application_id;

  IF NEW.sender_id != v_student_profile_id THEN
    PERFORM create_notification(
      v_tenant_id,
      v_student_profile_id,
      'message',
      'New Message',
      v_sender_name || ' sent you a message.',
      jsonb_build_object(
        'message_id', NEW.id,
        'application_id', NEW.application_id,
        'sender_id', NEW.sender_id,
        'sender_name', v_sender_name
      ),
      '/student/messages'
    );
  END IF;

  IF v_agent_profile_id IS NOT NULL AND NEW.sender_id != v_agent_profile_id THEN
    PERFORM create_notification(
      v_tenant_id,
      v_agent_profile_id,
      'message',
      'New Message',
      v_sender_name || ' sent you a message.',
      jsonb_build_object(
        'message_id', NEW.id,
        'application_id', NEW.application_id,
        'sender_id', NEW.sender_id,
        'sender_name', v_sender_name
      ),
      '/dashboard/messages'
    );
  END IF;

  RETURN NEW;
END;
$$;

-- Fix notify_commission_change function
CREATE OR REPLACE FUNCTION notify_commission_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_agent_profile_id UUID;
  v_tenant_id UUID;
  v_amount_display TEXT;
BEGIN
  SELECT 
    ag.profile_id,
    c.tenant_id
  INTO 
    v_agent_profile_id,
    v_tenant_id
  FROM commissions c
  JOIN agents ag ON c.agent_id = ag.id
  WHERE c.id = NEW.id;

  v_amount_display := (NEW.amount_cents / 100.0)::TEXT || ' ' || NEW.currency;

  IF NEW.status = 'paid' AND (OLD.status IS NULL OR OLD.status != 'paid') THEN
    PERFORM create_notification(
      v_tenant_id,
      v_agent_profile_id,
      'commission',
      'Commission Paid',
      'Your commission of ' || v_amount_display || ' has been paid.',
      jsonb_build_object(
        'commission_id', NEW.id,
        'amount_cents', NEW.amount_cents,
        'currency', NEW.currency,
        'old_status', OLD.status,
        'new_status', NEW.status
      ),
      '/dashboard/commissions'
    );
  END IF;

  IF NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status != 'approved') THEN
    PERFORM create_notification(
      v_tenant_id,
      v_agent_profile_id,
      'commission',
      'Commission Approved',
      'Your commission of ' || v_amount_display || ' has been approved.',
      jsonb_build_object(
        'commission_id', NEW.id,
        'amount_cents', NEW.amount_cents,
        'currency', NEW.currency,
        'old_status', OLD.status,
        'new_status', NEW.status
      ),
      '/dashboard/commissions'
    );
  END IF;

  RETURN NEW;
END;
$$;

-- Fix notify_course_recommendation function
CREATE OR REPLACE FUNCTION notify_course_recommendation(
  p_student_id UUID,
  p_program_id UUID,
  p_reason TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_student_profile_id UUID;
  v_program_name TEXT;
  v_university_name TEXT;
  v_tenant_id UUID;
  v_notification_id UUID;
BEGIN
  SELECT 
    s.profile_id,
    p.name,
    u.name,
    s.tenant_id
  INTO 
    v_student_profile_id,
    v_program_name,
    v_university_name,
    v_tenant_id
  FROM students s
  JOIN programs p ON p.id = p_program_id
  JOIN universities u ON p.university_id = u.id
  WHERE s.id = p_student_id;

  v_notification_id := create_notification(
    v_tenant_id,
    v_student_profile_id,
    'course_recommendation',
    'New Course Recommendation',
    'We recommend ' || v_program_name || ' at ' || v_university_name || 
    CASE WHEN p_reason IS NOT NULL THEN '. ' || p_reason ELSE '.' END,
    jsonb_build_object(
      'program_id', p_program_id,
      'program_name', v_program_name,
      'university_name', v_university_name,
      'reason', p_reason
    ),
    '/search?program=' || p_program_id
  );

  RETURN v_notification_id;
END;
$$;

-- Fix mark_notification_read function
CREATE OR REPLACE FUNCTION mark_notification_read(p_notification_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE notifications
  SET read = TRUE
  WHERE id = p_notification_id AND user_id = auth.uid();
  
  RETURN FOUND;
END;
$$;

-- Fix mark_all_notifications_read function
CREATE OR REPLACE FUNCTION mark_all_notifications_read(p_user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  UPDATE notifications
  SET read = TRUE
  WHERE user_id = p_user_id AND user_id = auth.uid() AND read = FALSE;
  
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;