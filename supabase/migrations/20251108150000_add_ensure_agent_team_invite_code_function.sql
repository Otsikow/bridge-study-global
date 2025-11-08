
CREATE OR REPLACE FUNCTION ensure_agent_team_invite_code(p_agent_profile_id UUID, p_regenerate BOOLEAN DEFAULT FALSE)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_invite_code TEXT;
BEGIN
  -- Check if a code already exists for the given agent
  SELECT team_invite_code INTO v_invite_code
  FROM public.agents
  WHERE profile_id = p_agent_profile_id;

  -- If no code exists, or if regeneration is requested, generate a new one
  IF v_invite_code IS NULL OR p_regenerate THEN
    v_invite_code := substring(extensions.uuid_generate_v4()::text from 1 for 8);
    UPDATE public.agents
    SET team_invite_code = v_invite_code
    WHERE profile_id = p_agent_profile_id;
  END IF;

  RETURN v_invite_code;
END;
$$;
