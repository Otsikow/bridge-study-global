-- Grant agents permission to update their own record to set the team invite code.
CREATE POLICY "Agents can update their own agent record"
ON public.agents
FOR UPDATE
USING (profile_id = auth.uid())
WITH CHECK (profile_id = auth.uid());

-- The ensure_agent_team_invite_code function must run as the calling user
-- so that RLS policies for SELECT and UPDATE are correctly applied.
ALTER FUNCTION public.ensure_agent_team_invite_code(p_agent_profile_id UUID, p_regenerate BOOLEAN)
SECURITY INVOKER;
