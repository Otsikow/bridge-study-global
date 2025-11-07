import { useMemo } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { useAuth } from './useAuth';
import {
  useMessages,
  type Conversation,
  type Message,
  type TypingIndicator,
  type SendMessagePayload,
} from './useMessages';

const PARTNER_MESSAGING_ROLES = new Set(['agent', 'partner', 'staff', 'admin']);

const noopSetConversation: Dispatch<SetStateAction<string | null>> = (_value) => undefined;
const noopTyping = async (_conversationId?: string) => undefined;
const noopSendMessage = async (_conversationId: string, _payload: SendMessagePayload) => undefined;
const noopGetOrCreateConversation = async (_otherUserId: string) => null;
const noopFetchConversations = async () => undefined;

export function useAgentMessages() {
  const { profile } = useAuth();
  const messaging = useMessages();

  const enabled = useMemo(() => {
    const role = profile?.role;
    if (!role) return false;
    return PARTNER_MESSAGING_ROLES.has(role);
  }, [profile?.role]);

  const {
    conversations,
    currentConversation,
    setCurrentConversation,
    messages,
    typingUsers,
    loading,
    sendMessage,
    startTyping,
    stopTyping,
    getOrCreateConversation,
    fetchConversations,
  } = messaging;

  return {
    enabled,
    conversations: enabled ? conversations : ([] as Conversation[]),
    currentConversation: enabled ? currentConversation : null,
    setCurrentConversation: enabled ? setCurrentConversation : noopSetConversation,
    messages: enabled ? messages : ([] as Message[]),
    typingUsers: enabled ? typingUsers : ([] as TypingIndicator[]),
    loading: enabled ? loading : false,
    sendMessage: enabled ? sendMessage : noopSendMessage,
    startTyping: enabled ? startTyping : noopTyping,
    stopTyping: enabled ? stopTyping : noopTyping,
    getOrCreateConversation: enabled ? getOrCreateConversation : noopGetOrCreateConversation,
    fetchConversations: enabled ? fetchConversations : noopFetchConversations,
  };
}
