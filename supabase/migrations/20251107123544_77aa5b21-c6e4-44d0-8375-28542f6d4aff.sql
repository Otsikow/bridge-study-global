-- Add username column to profiles table
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS username TEXT;

-- Create unique index on username
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username) WHERE username IS NOT NULL;

-- Add missing RPC functions
CREATE OR REPLACE FUNCTION public.mark_conversation_read(conversation_uuid UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE conversation_participants
  SET last_read_at = now()
  WHERE conversation_id = conversation_uuid AND user_id = auth.uid();
END;
$$;

COMMENT ON FUNCTION public.mark_conversation_read IS 'Marks a conversation as read for the current user';