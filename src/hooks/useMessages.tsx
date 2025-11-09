import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { PostgrestError, RealtimeChannel } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
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

type RawParticipant = Omit<ConversationParticipant, "profile">;
type RawConversation = Omit<Conversation, "participants" | "lastMessage"> & {
  participants: RawParticipant[];
  lastMessage?: RawMessage[];
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

  const isAgent = profile?.role === "agent";
  const isStudent = profile?.role === "student";

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [typingUsers, setTypingUsers] = useState<TypingIndicator[]>([]);
  const [loading, setLoading] = useState(false);

  const conversationsRef = useRef<Conversation[]>([]);
  const currentConversationRef = useRef<string | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  const conversationsChannelRef = useRef<RealtimeChannel | null>(null);
  const messagesChannelRef = useRef<RealtimeChannel | null>(null);
  const typingChannelRef = useRef<RealtimeChannel | null>(null);

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

  /* ----------------------------- Fetch messages ---------------------------- */
  const fetchMessages = useCallback(
    async (conversationId: string) => {
      if (!user?.id) return;
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from("conversation_messages")
          .select("*")
          .eq("conversation_id", conversationId)
          .order("created_at", { ascending: true });
        if (error) throw error;
        const formatted = (data || []).map((m: any) => transformMessage(m));
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
    [transformMessage, toast, user?.id]
  );

  /* --------------------------- Fetch conversations -------------------------- */
  const fetchConversations = useCallback(async () => {
    if (!user?.id) return;
    try {
      const { data, error } = await supabase
        .from("conversations")
        .select("*")
        .order("updated_at", { ascending: false });
      if (error) throw error;
      setConversations(data as Conversation[]);
    } catch (err) {
      console.error("Error loading conversations:", err);
      toast({
        title: "Error",
        description: "Failed to load conversations",
        variant: "destructive",
      });
    }
  }, [toast, user?.id]);

  /* ----------------------------- Send message ------------------------------ */
  const sendMessage = useCallback(
    async (conversationId: string, payload: SendMessagePayload) => {
      if (!user?.id) return;
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
          .select("*")
          .single();
        if (error) throw error;
        const msg = transformMessage(data);
        setMessages((prev) => [...prev, msg]);
      } catch (err) {
        console.error("Error sending message:", err);
        toast({
          title: "Error",
          description: "Failed to send message",
          variant: "destructive",
        });
      }
    },
    [transformMessage, toast, user?.id]
  );

  /* ------------------------------ Typing events ----------------------------- */
  const startTyping = useCallback(
    async (conversationId: string) => {
      if (!user?.id) return;
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
    [user?.id]
  );

  const stopTyping = useCallback(
    async (conversationId: string) => {
      if (!user?.id) return;
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
    [user?.id]
  );

  /* --------------------------- Realtime listeners -------------------------- */
  useEffect(() => {
    if (!user?.id) return;
    fetchConversations();

    const convChannel = supabase
      .channel(`conversations-${user.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "conversation_messages" },
        (payload) => {
          if (payload.eventType === "INSERT") {
            const raw = payload.new as RawMessage;
            const msg = transformMessage(raw);
            const conversationId = msg.conversation_id;
            if (currentConversationRef.current === conversationId) {
              setMessages((prev) => [...prev, msg]);
            } else {
              showNewMessageToast(conversationId, msg);
            }
          }
        }
      )
      .subscribe();

    messagesChannelRef.current = convChannel;

    return () => {
      supabase.removeChannel(convChannel);
    };
  }, [fetchConversations, transformMessage, showNewMessageToast, user?.id]);

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

  /* ------------------------------- RETURN ---------------------------------- */
  return {
    conversations,
    currentConversation,
    setCurrentConversation,
    messages,
    typingUsers,
    loading,
    sendMessage,
    startTyping,
    stopTyping,
    fetchConversations,
    fetchMessages,
  };
}
