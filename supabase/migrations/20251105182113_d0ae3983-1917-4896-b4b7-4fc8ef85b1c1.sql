-- Add missing column to conversation_messages
ALTER TABLE public.conversation_messages
ADD COLUMN IF NOT EXISTS edited_at TIMESTAMPTZ;