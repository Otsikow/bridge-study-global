import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { PostgrestError, RealtimeChannel } from "@supabase/supabase-js";
import { isSupabaseConfigured, supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useToast } from "./use-toast";
import { toast as sonnerToast } from "@/components/ui/sonner";

/* -------------------------------------------------------------------------- */
/*                                   TYPES                                    */
/* -------------------------------------------------------------------------- */

export interface Conversation {
  id: string;
  tenant_id: string;
  title: string | null;
  type: string | null;
  is_group: boolean | null;
  created_at: string | null;
  updated_at: string | null;
  last_message_at?: string | null;
  name?: string | null;
  avatar_url?: string | null;
  metadata?: Record<string, unknown> | null;
  participants?: ConversationParticipant[];
  lastMessage?: Message;
  unreadCount?: number;
}

export interface ConversationParticipant {
  id: string;
  conversation_id: string;
  user_id: string;
  joined_at: string | null;
  last_read_at: string;
  role?: string | null;
  profile?: {
    id: string;
    full_name: string;
    avatar_url: string | null;
    role: string;
  };
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  message_type: string | null;
  attachments: MessageAttachment[];
  metadata?: Record<string, unknown> | null;
  reply_to_id: string | null;
  edited_at: string | null;
  deleted_at: string | null;
  created_at: string;
  sender?: {
    id: string;
    full_name: string;
    avatar_url: string | null;
  };
}

export interface TypingIndicator {
  user_id: string;
  conversation_id: string;
  started_at: string | null;
  expires_at?: string;
  profile?: {
    full_name: string;
  };
}

export interface MessageAttachment {
  id: string;
  type: "image" | "file" | "audio" | "video" | string;
  url: string;
  name?: string | null;
  size?: number | null;
  mime_type?: string | null;
  preview_url?: string | null;
  storage_path?: string | null;
  duration_ms?: number | null;
  meta?: Record<string, unknown> | null;
}

export interface SendMessagePayload {
  content: string;
  attachments?: MessageAttachment[];
  messageType?: string;
  metadata?: Record<string, unknown> | null;
}

type RawMessage = Omit<Message, "attachments" | "metadata"> & {
  attachments: unknown;
  metadata: unknown;
};

type RawParticipant = Omit<ConversationParticipant, "profile"> & {
  profile?: ConversationParticipant["profile"] | null;
};
type RawConversation = Omit<Conversation, "participants" | "lastMessage" | "metadata"> & {
  participants: RawParticipant[];
  lastMessage?: RawMessage[];
  metadata: unknown;
};

type RawTypingIndicator = Omit<TypingIndicator, "profile"> & {
  profile?: TypingIndicator["profile"] | null;
};

type SupabaseError =
  | PostgrestError
  | Error
  | { message?: string; details?: string | null; hint?: string | null }
  | null;

/* -------------------------------------------------------------------------- */
/*                             UTILITY FUNCTIONS                              */
/* -------------------------------------------------------------------------- */

const createAttachmentId = () => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
};

const parseAttachments = (attachments: unknown): MessageAttachment[] => {
  if (!attachments) return [];
  try {
    const arr = typeof attachments === "string" ? JSON.parse(attachments) : attachments;
    if (!Array.isArray(arr)) return [];
    return arr
      .map((item: any): MessageAttachment | null => {
        if (!item || typeof item !== "object" || !item.url) return null;
        return {
          id: item.id ?? createAttachmentId(),
          type: item.type ?? "file",
          url: item.url,
          name: item.name ?? null,
          size: item.size ?? null,
          mime_type: item.mime_type ?? item.mimeType ?? null,
          preview_url: item.preview_url ?? item.previewUrl ?? item.url,
          storage_path: item.storage_path ?? item.storagePath ?? null,
          duration_ms: item.duration_ms ?? item.durationMs ?? null,
          meta: item.meta ?? item.metadata ?? null,
        };
      })
      .filter(Boolean) as MessageAttachment[];
  } catch {
    return [];
  }
};

const parseMetadata = (metadata: unknown): Record<string, unknown> | null => {
  if (!metadata) return null;
  if (typeof metadata === "string") {
    try {
      const parsed = JSON.parse(metadata);
      return typeof parsed === "object" && parsed ? parsed : null;
    } catch {
      return null;
    }
  }
  return metadata as Record<string, unknown>;
};

/* -------------------------------------------------------------------------- */
/*                              MAIN HOOK LOGIC                               */
/* -------------------------------------------------------------------------- */

export function useMessages() {
  const { user, profile } = useAuth();
  const { toast } = useToast();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [typingUsers, setTypingUsers] = useState<TypingIndicator[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const conversationsRef = useRef<Conversation[]>([]);
  const currentConversationRef = useRef<string | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const reportedConfigIssueRef = useRef(false);

  const conversationsChannelRef = useRef<RealtimeChannel | null>(null);
  const messagesChannelRef = useRef<RealtimeChannel | null>(null);
  const typingChannelRef = useRef<RealtimeChannel | null>(null);

  const messagingUnavailableMessage =
    "Messaging is currently unavailable because the messaging service is not configured. Please contact your administrator.";

  const flagMessagingUnavailable = useCallback(() => {
    if (!reportedConfigIssueRef.current) {
      reportedConfigIssueRef.current = true;
      toast({
        title: "Messaging unavailable",
        description:
          "We couldn't connect to the messaging service. Other parts of the dashboard remain available while we restore chat.",
        variant: "destructive",
      });
    }
    setError(messagingUnavailableMessage);
  }, [toast]);

  const conversationIdsKey = useMemo(
    () => conversations.map((conv) => conv.id).sort().join(","),
    [conversations]
  );

  const transformMessage = useCallback((msg: RawMessage): Message => {
    return {
      ...msg,
      attachments: parseAttachments(msg.attachments),
      metadata: parseMetadata(msg.metadata),
    };
  }, []);

  const transformParticipant = useCallback(
    (participant: RawParticipant): ConversationParticipant => {
      return {
        ...participant,
        profile: participant.profile
          ? {
              id: participant.profile.id,
              full_name: participant.profile.full_name,
              avatar_url: participant.profile.avatar_url,
              role: participant.profile.role,
            }
          : undefined,
      };
    },
    [],
  );

  const transformConversation = useCallback(
    (conversation: RawConversation): Conversation => {
      const participants = (conversation.participants || []).map((participant) =>
        transformParticipant(participant),
      );
      const lastMessage = Array.isArray(conversation.lastMessage) && conversation.lastMessage.length > 0
        ? transformMessage(conversation.lastMessage[0])
        : undefined;

      return {
        ...conversation,
        metadata: parseMetadata(conversation.metadata),
        participants,
        lastMessage,
      };
    },
    [transformMessage, transformParticipant],
  );

  const transformTypingIndicator = useCallback(
    (indicator: RawTypingIndicator): TypingIndicator => {
      return {
        ...indicator,
        profile: indicator.profile
          ? {
              full_name: indicator.profile.full_name,
            }
          : undefined,
      };
    },
    [],
  );

  const playNotificationSound = useCallback(async () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      let ctx = audioContextRef.current;
      if (!ctx) ctx = new AudioCtx();
      if (ctx.state === "suspended") await ctx.resume();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(760, ctx.currentTime);
      gain.gain.setValueAtTime(0.001, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.1, ctx.currentTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    } catch {
      console.warn("Unable to play notification sound");
    }
  }, []);

  const showNewMessageToast = useCallback(
    (conversationId: string, message: Message) => {
      const conv = conversationsRef.current.find((c) => c.id === conversationId);
      const other = conv?.participants?.find((p) => p.user_id !== user?.id);
      const title =
        conv?.name || other?.profile?.full_name || "New message";
      const desc = message.content || (message.attachments.length > 0 ? "[Attachment]" : "");
      sonnerToast(title, {
        description: desc || "You have a new message",
        duration: 6000,
        action: {
          label: "Open",
          onClick: () => setCurrentConversation(conversationId),
        },
      });
      playNotificationSound();
    },
    [playNotificationSound, user?.id]
  );

  useEffect(() => {
    conversationsRef.current = conversations;
  }, [conversationIdsKey, conversations]);

  useEffect(() => {
    currentConversationRef.current = currentConversation;
  }, [currentConversation]);

  useEffect(() => {
    if (!user?.id || !isSupabaseConfigured) {
      setConversations([]);
      setCurrentConversation(null);
      setMessages([]);
      setTypingUsers([]);
      if (!isSupabaseConfigured) {
        flagMessagingUnavailable();
      }
    }
  }, [flagMessagingUnavailable, user?.id]);

  const fetchTypingUsers = useCallback(
    async (conversationId: string) => {
      if (!conversationId || !user?.id || !isSupabaseConfigured) {
        setTypingUsers([]);
        if (!isSupabaseConfigured) {
          flagMessagingUnavailable();
        }
        return;
      }

      try {
        const { data, error } = await supabase
          .from("typing_indicators")
          .select(
            `
              user_id,
              conversation_id,
              started_at,
              expires_at,
              profile:profiles (
                full_name
              )
            `
          )
          .eq("conversation_id", conversationId)
          .neq("user_id", user.id);

        if (error) throw error;

        const formatted = (data ?? [])
          .map((item) => transformTypingIndicator(item as RawTypingIndicator))
          .filter((indicator) => {
            if (!indicator.expires_at) return true;
            return new Date(indicator.expires_at).getTime() > Date.now();
          });

        setTypingUsers(formatted);
      } catch (err) {
        console.error("Error fetching typing indicators:", err);
      }
    },
    [flagMessagingUnavailable, transformTypingIndicator, user?.id]
  );

  /* ----------------------------- Fetch messages ---------------------------- */
  const fetchMessages = useCallback(
    async (conversationId: string) => {
      if (!conversationId || !user?.id) return;
      if (!isSupabaseConfigured) {
        flagMessagingUnavailable();
        return;
      }
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from("conversation_messages")
          .select(
            `
              *,
              sender:profiles (
                id,
                full_name,
                avatar_url
              )
            `
          )
          .eq("conversation_id", conversationId)
          .order("created_at", { ascending: true });
        if (error) throw error;
        const formatted = (data || []).map((m) => transformMessage(m as RawMessage));
        setMessages(formatted);
      } catch (err) {
        console.error("Error fetching messages:", err);
        toast({
          title: "Error",
          description: "Failed to load messages",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    },
    [flagMessagingUnavailable, transformMessage, toast, user?.id]
  );

  const getUnreadCount = useCallback(
    async (conversationId: string): Promise<number> => {
      if (!user?.id) return 0;
      if (!isSupabaseConfigured) {
        flagMessagingUnavailable();
        return 0;
      }
      try {
        const { data, error } = await supabase.rpc("get_unread_count", {
          p_conversation_id: conversationId,
          p_user_id: user.id,
        });
        if (error) throw error;
        return typeof data === "number" ? data : 0;
      } catch (err) {
        console.error("Error fetching unread count:", err);
        return 0;
      }
    },
    [flagMessagingUnavailable, user?.id]
  );

  /* --------------------------- Fetch conversations -------------------------- */
  const fetchConversations = useCallback(async () => {
    if (!user?.id) {
      setConversations([]);
      return;
    }
    if (!isSupabaseConfigured) {
      flagMessagingUnavailable();
      setConversations([]);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("conversations")
        .select(
          `
            id,
            tenant_id,
            title,
            type,
            is_group,
            created_at,
            updated_at,
            last_message_at,
            name,
            avatar_url,
            metadata,
            participants:conversation_participants!inner (
              id,
              conversation_id,
              user_id,
              joined_at,
              last_read_at,
              role,
              profile:profiles (
                id,
                full_name,
                avatar_url,
                role
              )
            ),
            lastMessage:conversation_messages!conversation_messages_conversation_id_fkey (
              id,
              conversation_id,
              sender_id,
              content,
              message_type,
              attachments,
              metadata,
              reply_to_id,
              edited_at,
              deleted_at,
              created_at,
              sender:profiles (
                id,
                full_name,
                avatar_url
              )
            )
          `
        )
        .eq("participants.user_id", user.id)
        .order("last_message_at", { ascending: false, nullsLast: true })
        .order("created_at", { referencedTable: "conversation_messages", ascending: false })
        .limit(1, { foreignTable: "conversation_messages" });

      if (error) throw error;

      const formatted = await Promise.all(
        (data ?? []).map(async (conversation) => {
          const transformed = transformConversation(conversation as RawConversation);
          const unreadCount = await getUnreadCount(transformed.id);
          return {
            ...transformed,
            unreadCount,
          };
        })
      );

      setConversations(formatted);
    } catch (err) {
      console.error("Error loading conversations:", err);
      toast({
        title: "Error",
        description: "Failed to load conversations",
        variant: "destructive",
      });
    }
  }, [flagMessagingUnavailable, getUnreadCount, toast, transformConversation, user?.id]);

  /* ----------------------------- Send message ------------------------------ */
  const sendMessage = useCallback(
    async (conversationId: string, payload: SendMessagePayload) => {
      if (!conversationId || !user?.id) return;
      if (!isSupabaseConfigured) {
        flagMessagingUnavailable();
        return;
      }
      const hasContent = payload.content?.trim();
      const hasFiles = payload.attachments?.length;
      if (!hasContent && !hasFiles) return;
      try {
        const { data, error } = await supabase
          .from("conversation_messages")
          .insert([
            {
              conversation_id: conversationId,
              sender_id: user.id,
              content: hasContent ? payload.content : "[Attachment]",
              message_type: payload.messageType ?? "text",
              attachments: payload.attachments ?? [],
              metadata: payload.metadata ?? null,
            },
          ])
          .select(
            `
              *,
              sender:profiles (
                id,
                full_name,
                avatar_url
              )
            `
          )
          .single();
        if (error) throw error;
        const msg = transformMessage(data as RawMessage);
        const enriched = {
          ...msg,
          sender:
            msg.sender ?? {
              id: user.id,
              full_name: profile?.full_name ?? "You",
              avatar_url: profile?.avatar_url ?? null,
            },
        };
        setMessages((prev) => [...prev, enriched]);
        await stopTyping(conversationId);
      } catch (err) {
        console.error("Error sending message:", err);
        toast({
          title: "Error",
          description: "Failed to send message",
          variant: "destructive",
        });
      }
    },
    [
      flagMessagingUnavailable,
      profile?.avatar_url,
      profile?.full_name,
      stopTyping,
      transformMessage,
      toast,
      user?.id,
    ]
  );

  /* ------------------------------ Typing events ----------------------------- */
  const startTyping = useCallback(
    async (conversationId?: string) => {
      if (!conversationId || !user?.id) return;
      if (!isSupabaseConfigured) {
        flagMessagingUnavailable();
        return;
      }
      try {
        const expires = new Date(Date.now() + 4000).toISOString();
        await supabase.from("typing_indicators").upsert({
          conversation_id: conversationId,
          user_id: user.id,
          started_at: new Date().toISOString(),
          expires_at: expires,
        });
      } catch (err) {
        console.error("Typing start failed:", err);
      }
    },
    [flagMessagingUnavailable, user?.id]
  );

  const stopTyping = useCallback(
    async (conversationId?: string) => {
      if (!conversationId || !user?.id) return;
      if (!isSupabaseConfigured) {
        flagMessagingUnavailable();
        return;
      }
      try {
        await supabase
          .from("typing_indicators")
          .delete()
          .eq("conversation_id", conversationId)
          .eq("user_id", user.id);
      } catch (err) {
        console.error("Typing stop failed:", err);
      }
    },
    [flagMessagingUnavailable, user?.id]
  );

  useEffect(() => {
    if (!currentConversation) {
      setMessages([]);
      setTypingUsers([]);
      return;
    }

    void fetchMessages(currentConversation);
    void fetchTypingUsers(currentConversation);
  }, [currentConversation, fetchMessages, fetchTypingUsers]);

  useEffect(() => {
    if (!currentConversation) return;
    setConversations((prev) =>
      prev.map((conversation) =>
        conversation.id === currentConversation
          ? { ...conversation, unreadCount: 0 }
          : conversation
      )
    );
  }, [currentConversation]);

  useEffect(() => {
    if (!currentConversation || !user?.id) return;
    if (!isSupabaseConfigured) {
      flagMessagingUnavailable();
      return;
    }
    supabase
      .rpc("mark_conversation_read", { conversation_uuid: currentConversation })
      .then(() => fetchConversations())
      .catch((err) => {
        console.error("Failed to mark conversation as read:", err);
      });
  }, [currentConversation, fetchConversations, flagMessagingUnavailable, user?.id]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setTypingUsers((prev) =>
        prev.filter((indicator) => {
          if (!indicator.expires_at) return true;
          return new Date(indicator.expires_at).getTime() > Date.now();
        })
      );
    }, 2000);

    return () => {
      window.clearInterval(interval);
    };
  }, []);

  const getOrCreateConversation = useCallback(
    async (otherUserId: string): Promise<string | null> => {
      if (!user?.id) return null;
      if (!isSupabaseConfigured) {
        flagMessagingUnavailable();
        return null;
      }
      if (!profile?.tenant_id) {
        toast({
          title: "Unable to start conversation",
          description: "Missing tenant information for your profile.",
          variant: "destructive",
        });
        return null;
      }

      try {
        const { data, error } = await supabase.rpc("get_or_create_conversation", {
          p_other_user_id: otherUserId,
          p_user_id: user.id,
          p_tenant_id: profile.tenant_id,
        });

        if (error) throw error;
        if (typeof data === "string") {
          await fetchConversations();
          return data;
        }

        return null;
      } catch (err) {
        console.error("Error creating conversation:", err);
        toast({
          title: "Unable to start conversation",
          description: "Please try again later.",
          variant: "destructive",
        });
        return null;
      }
    },
    [
      fetchConversations,
      flagMessagingUnavailable,
      profile?.tenant_id,
      toast,
      user?.id,
    ]
  );

  /* --------------------------- Realtime listeners -------------------------- */
  useEffect(() => {
    if (!user?.id) return;
    if (!isSupabaseConfigured) {
      flagMessagingUnavailable();
      return;
    }

    void fetchConversations();

    const messagesChannel = supabase
      .channel(`messages-${user.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "conversation_messages" },
        async (payload) => {
          const conversationId =
            ((payload.new as RawMessage | null)?.conversation_id ||
              (payload.old as RawMessage | null)?.conversation_id) ?? null;
          if (!conversationId) return;

          if (payload.eventType === "INSERT") {
            const msg = transformMessage(payload.new as RawMessage);
            if (currentConversationRef.current === conversationId) {
              await fetchMessages(conversationId);
            } else {
              showNewMessageToast(conversationId, msg);
            }
          } else if (currentConversationRef.current === conversationId) {
            await fetchMessages(conversationId);
          }

          await fetchConversations();
        }
      )
      .subscribe();

    messagesChannelRef.current = messagesChannel;

    const conversationChannel = supabase
      .channel(`conversation-meta-${user.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "conversations" },
        () => {
          void fetchConversations();
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "conversation_participants" },
        () => {
          void fetchConversations();
        }
      )
      .subscribe();

    conversationsChannelRef.current = conversationChannel;

    const typingChannel = supabase
      .channel(`typing-${user.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "typing_indicators" },
        (payload) => {
          const conversationId =
            ((payload.new as RawTypingIndicator | null)?.conversation_id ||
              (payload.old as RawTypingIndicator | null)?.conversation_id) ?? null;
          if (!conversationId) return;
          if (currentConversationRef.current === conversationId) {
            void fetchTypingUsers(conversationId);
          }
        }
      )
      .subscribe();

    typingChannelRef.current = typingChannel;

    return () => {
      if (messagesChannel) supabase.removeChannel(messagesChannel);
      if (conversationChannel) supabase.removeChannel(conversationChannel);
      if (typingChannel) supabase.removeChannel(typingChannel);
    };
  }, [
    fetchConversations,
    fetchMessages,
    fetchTypingUsers,
    showNewMessageToast,
    flagMessagingUnavailable,
    transformMessage,
    user?.id,
  ]);

  /* ------------------------------ Cleanup ----------------------------------- */
  useEffect(() => {
    return () => {
      [messagesChannelRef, conversationsChannelRef, typingChannelRef].forEach((ref) => {
        if (ref.current) supabase.removeChannel(ref.current);
      });
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => undefined);
        audioContextRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      flagMessagingUnavailable();
      setLoading(false);
    }
  }, [flagMessagingUnavailable]);

  /* ------------------------------- RETURN ---------------------------------- */
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
  };
}
