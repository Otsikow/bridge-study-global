-- Update conversations and conversation_participants RLS policies
-- to require proper authorization instead of permissive WITH CHECK (true)
-- This migration ensures only authorized users can create conversations
-- and add participants.

BEGIN;

-- Drop existing permissive policies on conversations (INSERT/UPDATE)
DROP POLICY IF EXISTS "Users can create conversations" ON public.conversations;
DROP POLICY IF EXISTS "Conversation creators" ON public.conversations;
DROP POLICY IF EXISTS "Conversation owners update" ON public.conversations;

-- Drop existing permissive policies on conversation_participants (INSERT)
DROP POLICY IF EXISTS "Users can join conversations" ON public.conversation_participants;
DROP POLICY IF EXISTS "Join conversations when invited" ON public.conversation_participants;
DROP POLICY IF EXISTS "Users can view participants of their conversations" ON public.conversation_participants;
DROP POLICY IF EXISTS "View participants in own conversations" ON public.conversation_participants;

-- ============================================================
-- CONVERSATIONS TABLE POLICIES
-- ============================================================

-- Users can create conversations only if they are the creator
-- and the tenant_id matches their profile's tenant
CREATE POLICY "conversations_insert_policy"
ON public.conversations
FOR INSERT
TO authenticated
WITH CHECK (
  created_by = auth.uid()
  AND tenant_id IN (
    SELECT tenant_id FROM public.profiles WHERE id = auth.uid()
  )
);

-- Users can update conversations they created
CREATE POLICY "conversations_update_policy"
ON public.conversations
FOR UPDATE
TO authenticated
USING (
  created_by = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.conversation_participants cp
    WHERE cp.conversation_id = conversations.id
      AND cp.user_id = auth.uid()
      AND cp.role = 'owner'
  )
);

-- ============================================================
-- CONVERSATION_PARTICIPANTS TABLE POLICIES
-- ============================================================

-- Users can view participants of conversations they are part of
CREATE POLICY "conversation_participants_select_policy"
ON public.conversation_participants
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.conversation_participants cp
    WHERE cp.conversation_id = conversation_participants.conversation_id
      AND cp.user_id = auth.uid()
  )
);

-- Users can add participants only if:
-- 1. They are the conversation creator, OR
-- 2. They are an owner/admin of the conversation, OR
-- 3. They are adding themselves to a conversation created for them
--    (e.g., via get_or_create_conversation which uses SECURITY DEFINER)
CREATE POLICY "conversation_participants_insert_policy"
ON public.conversation_participants
FOR INSERT
TO authenticated
WITH CHECK (
  -- The conversation creator can add participants
  EXISTS (
    SELECT 1 FROM public.conversations c
    WHERE c.id = conversation_participants.conversation_id
      AND c.created_by = auth.uid()
  )
  OR
  -- Existing owners/admins of the conversation can add participants
  EXISTS (
    SELECT 1 FROM public.conversation_participants cp
    WHERE cp.conversation_id = conversation_participants.conversation_id
      AND cp.user_id = auth.uid()
      AND cp.role IN ('owner', 'admin')
  )
);

COMMIT;
