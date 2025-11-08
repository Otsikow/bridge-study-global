
ALTER TABLE public.agents
ADD COLUMN team_invite_code TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS agents_team_invite_code_key ON public.agents (team_invite_code);

-- Backfill existing agents with a unique team invite code
UPDATE public.agents
SET team_invite_code = substring(extensions.uuid_generate_v4()::text from 1 for 8)
WHERE team_invite_code IS NULL;

ALTER TABLE public.agents
ALTER COLUMN team_invite_code SET NOT NULL;
