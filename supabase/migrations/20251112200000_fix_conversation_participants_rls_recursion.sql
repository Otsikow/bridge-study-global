
DROP POLICY IF EXISTS "View messages in own conversations" ON public.conversation_participants;
DROP POLICY IF EXISTS "participants: view own rows" ON public.conversation_participants;

CREATE POLICY "participants: view own rows"
ON public.conversation_participants
FOR SELECT
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "View messages in own conversations" ON public.conversation_messages;
DROP POLICY IF EXISTS "messages: view in own conversations" ON public.conversation_messages;

CREATE POLICY "messages: view in own conversations"
ON public.conversation_messages
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.conversation_participants cp
    WHERE cp.conversation_id = conversation_messages.conversation_id
      AND cp.user_id = auth.uid()
  )
);

COMMENT ON POLICY "participants: view own rows" ON public.conversation_participants IS 
  'Simple non-recursive policy: users can only view their own participant records. Fixes 42P17 infinite recursion error.';

COMMENT ON POLICY "messages: view in own conversations" ON public.conversation_messages IS 
  'Users can view messages in conversations where they are participants. Uses EXISTS subquery to avoid recursion.';
