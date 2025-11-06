-- Fix infinite recursion in conversation_participants RLS policies
-- Drop the problematic policy
DROP POLICY IF EXISTS "Users can view participants of their conversations" ON conversation_participants;

-- Create a simpler, non-recursive policy
-- Users can see participants in conversations where they are also participants
CREATE POLICY "Users can view conversation participants"
ON conversation_participants
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM conversation_participants cp
    WHERE cp.conversation_id = conversation_participants.conversation_id
    AND cp.user_id = auth.uid()
  )
);

-- Also ensure conversations policies are optimal
DROP POLICY IF EXISTS "Users can view conversations they participate in" ON conversations;

CREATE POLICY "Users can view their conversations"
ON conversations
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM conversation_participants cp
    WHERE cp.conversation_id = conversations.id
    AND cp.user_id = auth.uid()
  )
);

-- Ensure typing indicators work properly
DROP POLICY IF EXISTS "Users can view typing indicators in their conversations" ON typing_indicators;

CREATE POLICY "Users can view typing in their conversations"
ON typing_indicators
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM conversation_participants cp
    WHERE cp.conversation_id = typing_indicators.conversation_id
    AND cp.user_id = auth.uid()
  )
);

-- Ensure messages policies are optimal
DROP POLICY IF EXISTS "Users can view messages in their conversations" ON conversation_messages;
DROP POLICY IF EXISTS "Users can send messages to their conversations" ON conversation_messages;

CREATE POLICY "Users can view their conversation messages"
ON conversation_messages
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM conversation_participants cp
    WHERE cp.conversation_id = conversation_messages.conversation_id
    AND cp.user_id = auth.uid()
  )
);

CREATE POLICY "Users can send messages to their conversations"
ON conversation_messages
FOR INSERT
WITH CHECK (
  sender_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM conversation_participants cp
    WHERE cp.conversation_id = conversation_messages.conversation_id
    AND cp.user_id = auth.uid()
  )
);