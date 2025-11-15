import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "./useAuth";
import { useToast } from "./use-toast";
import {
  registerDirectoryProfile,
  findDirectoryProfileById,
  getDefaultProfileForRole,
  getPlaceholderIdForRole,
  type DirectoryProfile,
} from "@/lib/messaging/directory";
import { DEFAULT_TENANT_ID } from "@/lib/messaging/data";
import {
  initializeMockMessagingState,
  sortConversations,
} from "@/lib/messaging/mockService";
import type {
  Conversation,
  ConversationParticipant,
  Message,
  TypingIndicator,
  MessageAttachment,
  SendMessagePayload,
} from "@/types/messaging";

const createId = (prefix: string) =>
  typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

const normalizeAttachment = (attachment: MessageAttachment, index: number): MessageAttachment => ({
  id: attachment.id ?? createId(`attachment-${index}`),
  type: attachment.type ?? "file",
  url: attachment.url,
  name: attachment.name ?? null,
  size: attachment.size ?? null,
  mime_type: attachment.mime_type ?? null,
  preview_url: attachment.preview_url ?? attachment.url,
  storage_path: attachment.storage_path ?? null,
  duration_ms: attachment.duration_ms ?? null,
  meta: attachment.meta ?? null,
});

const buildParticipant = (
  profile: DirectoryProfile,
  conversationId: string,
  lastRead: string,
): ConversationParticipant => ({
  id: `${conversationId}-${profile.id}`,
  conversation_id: conversationId,
  user_id: profile.id,
  joined_at: lastRead,
  last_read_at: lastRead,
  profile: {
    id: profile.id,
    full_name: profile.full_name,
    avatar_url: profile.avatar_url,
    role: profile.role,
  },
});

const resolveDirectoryProfile = (
  profile: DirectoryProfile | null,
  fallbackRole: DirectoryProfile["role"],
) => {
  if (profile) return profile;
  return (
    getDefaultProfileForRole(fallbackRole) ??
    getDefaultProfileForRole("student") ?? {
      id: "demo-student",
      full_name: "Demo Student",
      email: "student@example.com",
      avatar_url: null,
      role: fallbackRole,
      tenant_id: DEFAULT_TENANT_ID,
    }
  );
};

export function useMessages() {
  const { user, profile } = useAuth();
  const { toast } = useToast();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messagesById, setMessagesById] = useState<Record<string, Message[]>>({});
  const [currentConversation, setCurrentConversationState] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [typingUsers, setTypingUsers] = useState<TypingIndicator[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const conversationsRef = useRef<Conversation[]>([]);
  const messagesRef = useRef<Record<string, Message[]>>({});
  const typingTimeoutsRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const resolvedProfile = useMemo<DirectoryProfile>(() => {
    if (profile) {
      const normalized: DirectoryProfile = {
        id: profile.id,
        full_name: profile.full_name || profile.email || "You",
        email: profile.email,
        avatar_url: profile.avatar_url ?? null,
        role: profile.role as DirectoryProfile["role"],
        tenant_id: profile.tenant_id ?? DEFAULT_TENANT_ID,
      };
      registerDirectoryProfile(normalized);
      return normalized;
    }

    const inferredRole = (user?.user_metadata?.role as DirectoryProfile["role"]) ?? "student";
    if (user?.id) {
      const existing = findDirectoryProfileById(user.id);
      if (existing) {
        registerDirectoryProfile(existing);
        return existing;
      }
      const generated: DirectoryProfile = {
        id: user.id,
        full_name: user.email ?? "Bridge Global User",
        email: user.email ?? "user@example.com",
        avatar_url: null,
        role: inferredRole,
        tenant_id: DEFAULT_TENANT_ID,
      };
      registerDirectoryProfile(generated);
      return generated;
    }

    const fallback = resolveDirectoryProfile(null, inferredRole);
    registerDirectoryProfile(fallback);
    return fallback;
  }, [profile, user]);

  const tenantId = profile?.tenant_id ?? resolvedProfile.tenant_id ?? DEFAULT_TENANT_ID;
  const currentUserId = resolvedProfile.id;

  const aliasMap = useMemo(() => {
    const placeholder = getPlaceholderIdForRole(resolvedProfile.role);
    if (placeholder && placeholder !== resolvedProfile.id) {
      return { [placeholder]: resolvedProfile.id };
    }
    return {};
  }, [resolvedProfile.id, resolvedProfile.role]);

  useEffect(() => {
    setLoading(true);
    setError(null);
    const state = initializeMockMessagingState(currentUserId, tenantId, {
      currentProfile: resolvedProfile,
      aliasMap,
    });

    conversationsRef.current = state.conversations;
    messagesRef.current = state.messagesById;
    setConversations(state.conversations);
    setMessagesById(state.messagesById);
    setCurrentConversationState((previous) => {
      if (previous && state.conversations.some((item) => item.id === previous)) {
        return previous;
      }
      return state.conversations[0]?.id ?? null;
    });
    setLoading(false);
  }, [aliasMap, currentUserId, resolvedProfile, tenantId]);

  useEffect(() => {
    if (!currentConversation) {
      setMessages([]);
      return;
    }
    setMessages(messagesRef.current[currentConversation] ?? []);
  }, [currentConversation, messagesById]);

  useEffect(() => {
    return () => {
      Object.values(typingTimeoutsRef.current).forEach((timeout) => {
        clearTimeout(timeout);
      });
      typingTimeoutsRef.current = {};
    };
  }, []);

  const setCurrentConversation = useCallback((conversationId: string | null) => {
    setCurrentConversationState(conversationId);
    if (conversationId) {
      setMessages(messagesRef.current[conversationId] ?? []);
    } else {
      setMessages([]);
    }
  }, []);

  const sendMessage = useCallback(
    async (conversationId: string, payload: SendMessagePayload) => {
      if (!conversationId || !currentUserId) return;
      const trimmed = payload.content?.trim();
      const hasAttachments = Boolean(payload.attachments && payload.attachments.length > 0);
      if (!trimmed && !hasAttachments) return;

      const createdAt = new Date().toISOString();
      const attachments = (payload.attachments ?? []).map((attachment, index) =>
        normalizeAttachment(attachment, index),
      );

      const message: Message = {
        id: createId("msg"),
        conversation_id: conversationId,
        sender_id: currentUserId,
        content: trimmed ?? "",
        message_type: payload.messageType ?? "text",
        attachments,
        metadata: payload.metadata ?? null,
        reply_to_id: null,
        edited_at: null,
        deleted_at: null,
        created_at: createdAt,
        sender: {
          id: resolvedProfile.id,
          full_name: resolvedProfile.full_name,
          avatar_url: resolvedProfile.avatar_url,
        },
      };

      setMessagesById((previous) => {
        const existing = previous[conversationId] ?? [];
        const nextMessages = [...existing, message];
        const next = { ...previous, [conversationId]: nextMessages };
        messagesRef.current = next;
        if (currentConversation === conversationId) {
          setMessages(nextMessages);
        }
        return next;
      });

      setConversations((previous) => {
        const next = previous.map((conversation) => {
          if (conversation.id !== conversationId) return conversation;
          const updatedParticipants = (conversation.participants ?? []).map((participant) =>
            participant.user_id === currentUserId
              ? { ...participant, last_read_at: createdAt }
              : participant,
          );
          return {
            ...conversation,
            participants: updatedParticipants,
            lastMessage: message,
            last_message_at: createdAt,
            updated_at: createdAt,
            unreadCount: 0,
          };
        });
        const sorted = sortConversations(next);
        conversationsRef.current = sorted;
        return sorted;
      });
    },
    [currentConversation, currentUserId, resolvedProfile],
  );

  const startTyping = useCallback(
    async (conversationId?: string) => {
      if (!conversationId) return;
      const conversation = conversationsRef.current.find((item) => item.id === conversationId);
      if (!conversation) return;
      const others = (conversation.participants ?? []).filter((participant) => participant.user_id !== currentUserId);
      if (others.length === 0) return;
      const participant = others[Math.floor(Math.random() * others.length)];
      const indicator: TypingIndicator = {
        user_id: participant.user_id,
        conversation_id: conversationId,
        started_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 4000).toISOString(),
        profile: { full_name: participant.profile?.full_name ?? "Participant" },
      };
      setTypingUsers((previous) => {
        const filtered = previous.filter(
          (item) => item.user_id !== indicator.user_id || item.conversation_id !== conversationId,
        );
        return [...filtered, indicator];
      });
      const timeoutKey = `${conversationId}-${indicator.user_id}`;
      if (typingTimeoutsRef.current[timeoutKey]) {
        clearTimeout(typingTimeoutsRef.current[timeoutKey]);
      }
      typingTimeoutsRef.current[timeoutKey] = setTimeout(() => {
        setTypingUsers((previous) =>
          previous.filter((item) => item.user_id !== indicator.user_id || item.conversation_id !== conversationId),
        );
        delete typingTimeoutsRef.current[timeoutKey];
      }, 4000);
    },
    [currentUserId],
  );

  const stopTyping = useCallback(async (conversationId?: string) => {
    if (!conversationId) return;
    setTypingUsers((previous) => previous.filter((item) => item.conversation_id !== conversationId));
    Object.entries(typingTimeoutsRef.current).forEach(([key, timeout]) => {
      if (key.startsWith(`${conversationId}-`)) {
        clearTimeout(timeout);
        delete typingTimeoutsRef.current[key];
      }
    });
  }, []);

  const getOrCreateConversation = useCallback(
    async (otherUserId: string) => {
      const otherProfile = findDirectoryProfileById(otherUserId);
      if (!otherProfile) return null;

      const existing = conversationsRef.current.find((conversation) => {
        if (conversation.is_group) return false;
        const participants = conversation.participants ?? [];
        return (
          participants.some((participant) => participant.user_id === otherUserId) &&
          participants.some((participant) => participant.user_id === currentUserId)
        );
      });

      if (existing) {
        setCurrentConversation(existing.id);
        return existing.id;
      }

      const conversationId = createId("conv");
      const createdAt = new Date().toISOString();
      const participants = [
        buildParticipant(resolvedProfile, conversationId, createdAt),
        buildParticipant(otherProfile, conversationId, createdAt),
      ];
      const conversation: Conversation = {
        id: conversationId,
        tenant_id: tenantId,
        title: null,
        type: "direct",
        is_group: false,
        created_at: createdAt,
        updated_at: createdAt,
        last_message_at: null,
        name: null,
        avatar_url: otherProfile.avatar_url,
        metadata: otherProfile.headline ? { subtitle: otherProfile.headline } : null,
        participants,
        unreadCount: 0,
      };

      setConversations((previous) => {
        const next = sortConversations([...previous, conversation]);
        conversationsRef.current = next;
        return next;
      });
      setMessagesById((previous) => {
        const next = { ...previous, [conversationId]: [] };
        messagesRef.current = next;
        return next;
      });
      setCurrentConversation(conversationId);
      toast({
        title: "Conversation created",
        description: `You can now message ${otherProfile.full_name}.`,
      });
      return conversationId;
    },
    [currentUserId, resolvedProfile, setCurrentConversation, tenantId, toast],
  );

  const fetchConversations = useCallback(async () => {
    setLoading(true);
    await new Promise((resolve) => {
      setTimeout(() => {
        setConversations((previous) => {
          const sorted = sortConversations(previous);
          conversationsRef.current = sorted;
          return sorted;
        });
        setLoading(false);
        resolve(undefined);
      }, 140);
    });
  }, []);

  const fetchMessages = useCallback(async (conversationId?: string) => {
    if (!conversationId) return;
    await new Promise((resolve) => setTimeout(resolve, 120));
    setMessages(messagesRef.current[conversationId] ?? []);
  }, []);

  const markConversationAsRead = useCallback(
    async (conversationId: string) => {
      setConversations((previous) => {
        const next = previous.map((conversation) => {
          if (conversation.id !== conversationId) return conversation;
          const updatedParticipants = (conversation.participants ?? []).map((participant) =>
            participant.user_id === currentUserId
              ? { ...participant, last_read_at: new Date().toISOString() }
              : participant,
          );
          return { ...conversation, participants: updatedParticipants, unreadCount: 0 };
        });
        const sorted = sortConversations(next);
        conversationsRef.current = sorted;
        return sorted;
      });
      return Promise.resolve();
    },
    [currentUserId],
  );

  const removeConversation = useCallback(
    async (conversationId: string) => {
      setConversations((previous) => {
        const next = previous.filter((conversation) => conversation.id !== conversationId);
        conversationsRef.current = next;
        return next;
      });
      setMessagesById((previous) => {
        const { [conversationId]: _removed, ...rest } = previous;
        messagesRef.current = rest;
        return rest;
      });
      if (currentConversation === conversationId) {
        setCurrentConversationState(null);
        setMessages([]);
      }
      return Promise.resolve();
    },
    [currentConversation],
  );

  return {
    conversations,
    currentConversation,
    setCurrentConversation,
    messages,
    typingUsers,
    loading,
    error,
    sendMessage,
    startTyping,
    stopTyping,
    getOrCreateConversation,
    fetchConversations,
    fetchMessages,
    markConversationAsRead,
    removeConversation,
  };
}

export type {
  Conversation,
  ConversationParticipant,
  Message,
  TypingIndicator,
  MessageAttachment,
  SendMessagePayload,
} from "@/types/messaging";
