-- Rebuild messaging schema for reliable real-time conversations with media support
-- This migration normalizes the messaging tables, adds read receipts, and refreshes
-- supporting functions, triggers, storage policies, and RLS rules.

BEGIN;

-- Ensure conversations table has the expected columns and constraints
ALTER TABLE public.conversations
  ADD COLUMN IF NOT EXISTS title TEXT,
  ADD COLUMN IF NOT EXISTS avatar_url TEXT,
  ADD COLUMN IF NOT EXISTS is_group BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS type TEXT NOT NULL DEFAULT 'direct',
  ADD COLUMN IF NOT EXISTS created_by UUID,
  ADD COLUMN IF NOT EXISTS metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS last_message_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.conversations
  ALTER COLUMN type SET DEFAULT 'direct';

-- Align foreign keys with profiles table
ALTER TABLE public.conversations
  DROP CONSTRAINT IF EXISTS conversations_created_by_fkey,
  ADD CONSTRAINT conversations_created_by_fkey
    FOREIGN KEY (created_by) REFERENCES public.profiles (id) ON DELETE SET NULL;

ALTER TABLE public.conversations
  DROP CONSTRAINT IF EXISTS conversations_tenant_id_fkey,
  ADD CONSTRAINT conversations_tenant_id_fkey
    FOREIGN KEY (tenant_id) REFERENCES public.tenants (id) ON DELETE CASCADE;

-- Ensure consistent updated_at behavior
DROP TRIGGER IF EXISTS conversations_updated_at ON public.conversations;

CREATE OR REPLACE FUNCTION public.touch_conversation_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER conversations_updated_at
  BEFORE UPDATE ON public.conversations
  FOR EACH ROW
  EXECUTE FUNCTION public.touch_conversation_updated_at();

-- Conversation participants adjustments
ALTER TABLE public.conversation_participants
  ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'member',
  ADD COLUMN IF NOT EXISTS last_read_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

ALTER TABLE public.conversation_participants ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.conversation_participants
  DROP CONSTRAINT IF EXISTS conversation_participants_conversation_id_fkey,
  ADD CONSTRAINT conversation_participants_conversation_id_fkey
    FOREIGN KEY (conversation_id) REFERENCES public.conversations (id) ON DELETE CASCADE;

ALTER TABLE public.conversation_participants
  DROP CONSTRAINT IF EXISTS conversation_participants_user_id_fkey,
  ADD CONSTRAINT conversation_participants_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES public.profiles (id) ON DELETE CASCADE;

ALTER TABLE public.conversation_participants
  ALTER COLUMN joined_at SET DEFAULT NOW(),
  ALTER COLUMN last_read_at SET DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_conversation_participants_user
  ON public.conversation_participants (user_id);

CREATE INDEX IF NOT EXISTS idx_conversation_participants_conversation
  ON public.conversation_participants (conversation_id);

-- Conversation messages adjustments
ALTER TABLE public.conversation_messages
  ADD COLUMN IF NOT EXISTS metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS edited_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS reply_to_id UUID,
  ALTER COLUMN attachments SET DEFAULT '[]'::jsonb,
  ALTER COLUMN created_at SET DEFAULT NOW(),
  ALTER COLUMN updated_at SET DEFAULT NOW();

ALTER TABLE public.conversation_messages ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.conversation_messages
  DROP CONSTRAINT IF EXISTS conversation_messages_conversation_id_fkey,
  ADD CONSTRAINT conversation_messages_conversation_id_fkey
    FOREIGN KEY (conversation_id) REFERENCES public.conversations (id) ON DELETE CASCADE;

ALTER TABLE public.conversation_messages
  DROP CONSTRAINT IF EXISTS conversation_messages_sender_id_fkey,
  ADD CONSTRAINT conversation_messages_sender_id_fkey
    FOREIGN KEY (sender_id) REFERENCES public.profiles (id) ON DELETE CASCADE;

ALTER TABLE public.conversation_messages
  DROP CONSTRAINT IF EXISTS conversation_messages_reply_to_id_fkey;

ALTER TABLE public.conversation_messages
  ADD CONSTRAINT conversation_messages_reply_to_id_fkey
    FOREIGN KEY (reply_to_id) REFERENCES public.conversation_messages (id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_conversation_messages_conversation_created
  ON public.conversation_messages (conversation_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_conversation_messages_sender
  ON public.conversation_messages (sender_id);

-- Trigger to maintain updated_at on messages
DROP TRIGGER IF EXISTS conversation_messages_updated_at ON public.conversation_messages;

CREATE OR REPLACE FUNCTION public.touch_conversation_message_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER conversation_messages_updated_at
  BEFORE UPDATE ON public.conversation_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.touch_conversation_message_updated_at();

-- Trigger to keep conversation timestamps in sync and auto-create sender receipt
-- Message receipts table for read indicators (must exist before triggers/functions)
CREATE TABLE IF NOT EXISTS public.message_receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES public.conversation_messages (id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  read_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (message_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_message_receipts_message
  ON public.message_receipts (message_id);

CREATE INDEX IF NOT EXISTS idx_message_receipts_user
  ON public.message_receipts (user_id);

ALTER TABLE public.message_receipts ENABLE ROW LEVEL SECURITY;

DROP TRIGGER IF EXISTS conversation_messages_after_insert ON public.conversation_messages;

CREATE OR REPLACE FUNCTION public.handle_conversation_message_insert()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.conversations
     SET last_message_at = NEW.created_at,
         updated_at = GREATEST(COALESCE(updated_at, NEW.created_at), NEW.created_at)
   WHERE id = NEW.conversation_id;

  INSERT INTO public.message_receipts (message_id, user_id, read_at)
  VALUES (NEW.id, NEW.sender_id, NEW.created_at)
  ON CONFLICT (message_id, user_id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER conversation_messages_after_insert
  AFTER INSERT ON public.conversation_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_conversation_message_insert();

-- Typing indicators cleanup
ALTER TABLE public.typing_indicators
  ALTER COLUMN started_at SET DEFAULT NOW(),
  ALTER COLUMN expires_at SET DEFAULT (NOW() + INTERVAL '10 seconds');

ALTER TABLE public.typing_indicators ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.typing_indicators
  DROP CONSTRAINT IF EXISTS typing_indicators_conversation_id_fkey,
  ADD CONSTRAINT typing_indicators_conversation_id_fkey
    FOREIGN KEY (conversation_id) REFERENCES public.conversations (id) ON DELETE CASCADE;

ALTER TABLE public.typing_indicators
  DROP CONSTRAINT IF EXISTS typing_indicators_user_id_fkey,
  ADD CONSTRAINT typing_indicators_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES public.profiles (id) ON DELETE CASCADE;

-- Presence table normalization
CREATE TABLE IF NOT EXISTS public.user_presence (
  user_id UUID PRIMARY KEY REFERENCES public.profiles (id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'offline',
  last_seen TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.user_presence ENABLE ROW LEVEL SECURITY;

DROP TRIGGER IF EXISTS user_presence_updated_at ON public.user_presence;

CREATE TRIGGER user_presence_updated_at
  BEFORE UPDATE ON public.user_presence
  FOR EACH ROW
  EXECUTE FUNCTION public.touch_conversation_message_updated_at();

-- Utility function to clean up expired typing indicators
CREATE OR REPLACE FUNCTION public.cleanup_expired_typing_indicators()
RETURNS VOID AS $$
BEGIN
  DELETE FROM public.typing_indicators WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Function to mark a conversation as read for the current user
CREATE OR REPLACE FUNCTION public.mark_conversation_read(p_conversation_id UUID)
RETURNS VOID
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_user_id UUID := auth.uid();
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;

  UPDATE public.conversation_participants
     SET last_read_at = NOW()
   WHERE conversation_id = p_conversation_id
     AND user_id = v_user_id;

  INSERT INTO public.message_receipts (message_id, user_id, read_at)
  SELECT m.id, v_user_id, NOW()
    FROM public.conversation_messages m
   WHERE m.conversation_id = p_conversation_id
     AND NOT EXISTS (
       SELECT 1 FROM public.message_receipts r
        WHERE r.message_id = m.id AND r.user_id = v_user_id
     );
END;
$$;

-- Function to compute unread counts using receipts
CREATE OR REPLACE FUNCTION public.get_unread_count(
  p_user_id UUID,
  p_conversation_id UUID
)
RETURNS INTEGER
LANGUAGE sql
STABLE
AS $$
  SELECT COUNT(*)::INTEGER
    FROM public.conversation_messages m
    WHERE m.conversation_id = p_conversation_id
      AND m.sender_id <> p_user_id
      AND NOT EXISTS (
        SELECT 1 FROM public.message_receipts r
         WHERE r.message_id = m.id AND r.user_id = p_user_id
      );
$$;

-- Function to get or create a direct conversation between two users
CREATE OR REPLACE FUNCTION public.get_or_create_conversation(
  p_user_id UUID,
  p_other_user_id UUID,
  p_tenant_id UUID
)
RETURNS UUID
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_conversation_id UUID;
BEGIN
  SELECT c.id INTO v_conversation_id
    FROM public.conversations c
   WHERE c.tenant_id = p_tenant_id
     AND c.is_group = FALSE
     AND EXISTS (
       SELECT 1 FROM public.conversation_participants cp1
        WHERE cp1.conversation_id = c.id AND cp1.user_id = p_user_id
     )
     AND EXISTS (
       SELECT 1 FROM public.conversation_participants cp2
        WHERE cp2.conversation_id = c.id AND cp2.user_id = p_other_user_id
     )
   ORDER BY c.last_message_at DESC NULLS LAST, c.created_at DESC
   LIMIT 1;

  IF v_conversation_id IS NOT NULL THEN
    RETURN v_conversation_id;
  END IF;

  INSERT INTO public.conversations (tenant_id, created_by, is_group, type)
  VALUES (p_tenant_id, p_user_id, FALSE, 'direct')
  RETURNING id INTO v_conversation_id;

  INSERT INTO public.conversation_participants (conversation_id, user_id, role)
  VALUES
    (v_conversation_id, p_user_id, 'owner'),
    (v_conversation_id, p_other_user_id, 'member')
  ON CONFLICT DO NOTHING;

  RETURN v_conversation_id;
END;
$$;

-- Storage bucket for message attachments
INSERT INTO storage.buckets (id, name, public)
VALUES ('message-attachments', 'message-attachments', TRUE)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for message attachments
DO $$
BEGIN
  EXECUTE $$DROP POLICY IF EXISTS "Message attachments public read" ON storage.objects$$;
  EXECUTE $$DROP POLICY IF EXISTS "Authenticated message uploads" ON storage.objects$$;
END;$$;

CREATE POLICY "Message attachments public read"
ON storage.objects
FOR SELECT
USING (bucket_id = 'message-attachments');

CREATE POLICY "Authenticated message uploads"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'message-attachments');

CREATE POLICY "Authenticated message updates"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'message-attachments');

CREATE POLICY "Authenticated message deletes"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'message-attachments');

-- RLS policies cleanup before recreation
DO $$
BEGIN
  EXECUTE $$DROP POLICY IF EXISTS "Users can view their conversations" ON public.conversations$$;
  EXECUTE $$DROP POLICY IF EXISTS "Users can view conversations they participate in" ON public.conversations$$;
  EXECUTE $$DROP POLICY IF EXISTS "Users can create conversations" ON public.conversations$$;
  EXECUTE $$DROP POLICY IF EXISTS "Users can update conversations" ON public.conversations$$;
  EXECUTE $$DROP POLICY IF EXISTS "Users can view conversation participants" ON public.conversation_participants$$;
  EXECUTE $$DROP POLICY IF EXISTS "Users can join conversations" ON public.conversation_participants$$;
  EXECUTE $$DROP POLICY IF EXISTS "Users can update their participation" ON public.conversation_participants$$;
  EXECUTE $$DROP POLICY IF EXISTS "Users can leave conversations" ON public.conversation_participants$$;
  EXECUTE $$DROP POLICY IF EXISTS "Users can view their conversation messages" ON public.conversation_messages$$;
  EXECUTE $$DROP POLICY IF EXISTS "Users can send messages to their conversations" ON public.conversation_messages$$;
  EXECUTE $$DROP POLICY IF EXISTS "Users can view typing in their conversations" ON public.typing_indicators$$;
  EXECUTE $$DROP POLICY IF EXISTS "Users can manage their typing indicators" ON public.typing_indicators$$;
  EXECUTE $$DROP POLICY IF EXISTS "Users can view presence of others in their tenant" ON public.user_presence$$;
  EXECUTE $$DROP POLICY IF EXISTS "Users can update their own presence" ON public.user_presence$$;
  EXECUTE $$DROP POLICY IF EXISTS "Users can view message receipts" ON public.message_receipts$$;
  EXECUTE $$DROP POLICY IF EXISTS "Users manage their message receipts" ON public.message_receipts$$;
END; $$;

-- Conversations policies
CREATE POLICY "Users view conversations they belong to"
ON public.conversations
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.conversation_participants cp
    WHERE cp.conversation_id = conversations.id
      AND cp.user_id = auth.uid()
  )
);

CREATE POLICY "Conversation creators"
ON public.conversations
FOR INSERT
WITH CHECK (
  created_by = auth.uid()
);

CREATE POLICY "Conversation owners update"
ON public.conversations
FOR UPDATE
USING (
  created_by = auth.uid()
);

-- Conversation participants policies
CREATE POLICY "View participants in own conversations"
ON public.conversation_participants
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.conversation_participants cp
    WHERE cp.conversation_id = conversation_participants.conversation_id
      AND cp.user_id = auth.uid()
  )
);

CREATE POLICY "Join conversations when invited"
ON public.conversation_participants
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.conversations c
    WHERE c.id = conversation_participants.conversation_id
      AND c.created_by = auth.uid()
  )
  OR conversation_participants.user_id = auth.uid()
);

CREATE POLICY "Update own participant record"
ON public.conversation_participants
FOR UPDATE
USING (user_id = auth.uid());

CREATE POLICY "Leave conversations"
ON public.conversation_participants
FOR DELETE
USING (user_id = auth.uid());

-- Conversation messages policies
CREATE POLICY "View messages in own conversations"
ON public.conversation_messages
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.conversation_participants cp
    WHERE cp.conversation_id = conversation_messages.conversation_id
      AND cp.user_id = auth.uid()
  )
);

CREATE POLICY "Send messages to joined conversations"
ON public.conversation_messages
FOR INSERT
WITH CHECK (
  sender_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.conversation_participants cp
    WHERE cp.conversation_id = conversation_messages.conversation_id
      AND cp.user_id = auth.uid()
  )
);

CREATE POLICY "Edit own messages"
ON public.conversation_messages
FOR UPDATE
USING (sender_id = auth.uid());

CREATE POLICY "Delete own messages"
ON public.conversation_messages
FOR DELETE
USING (sender_id = auth.uid());

-- Typing indicators policies
CREATE POLICY "View typing indicators in own conversations"
ON public.typing_indicators
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.conversation_participants cp
    WHERE cp.conversation_id = typing_indicators.conversation_id
      AND cp.user_id = auth.uid()
  )
);

CREATE POLICY "Manage own typing indicator"
ON public.typing_indicators
FOR ALL
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Presence policies
CREATE POLICY "View tenant presence"
ON public.user_presence
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = user_presence.user_id
      AND p.tenant_id = (
        SELECT tenant_id FROM public.profiles WHERE id = auth.uid()
      )
  )
);

CREATE POLICY "Manage own presence"
ON public.user_presence
FOR ALL
USING (user_presence.user_id = auth.uid())
WITH CHECK (user_presence.user_id = auth.uid());

CREATE POLICY "View message receipts in own conversations"
ON public.message_receipts
FOR SELECT
USING (
  EXISTS (
    SELECT 1
      FROM public.conversation_messages m
      JOIN public.conversation_participants cp
        ON cp.conversation_id = m.conversation_id
     WHERE m.id = message_receipts.message_id
       AND cp.user_id = auth.uid()
  )
);

CREATE POLICY "Manage own message receipts"
ON public.message_receipts
FOR ALL
USING (message_receipts.user_id = auth.uid())
WITH CHECK (message_receipts.user_id = auth.uid());

-- Ensure realtime publication is aware of message_receipts
ALTER PUBLICATION supabase_realtime ADD TABLE public.message_receipts;

COMMIT;
