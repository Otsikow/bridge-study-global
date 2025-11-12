import { useCallback, useEffect, useRef, useState } from "react";
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
    role: string | null;
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

const createAttachmentId = () =>
  typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

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
  const messagesRef = useRef<Message[]>([]);
  const currentConversationRef = useRef<string | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const reportedConfigIssueRef = useRef(false);
  const notificationsPermissionRef = useRef<NotificationPermission | null>(
    typeof window !== "undefined" && "Notification" in window ? Notification.permission : null
  );

  const conversationsChannelRef = useRef<RealtimeChannel | null>(null);
  const messagesChannelRef = useRef<RealtimeChannel | null>(null);
  const typingChannelRef = useRef<RealtimeChannel | null>(null);

  const messagingUnavailableMessage =
    "Messaging is currently unavailable because the messaging service is not configured. Please contact your administrator.";

  type ParticipantProfile = {
    id: string;
    full_name: string;
    avatar_url: string | null;
    role?: string | null;
  };

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

  const fetchProfilesByIds = useCallback(
    async (userIds: string[]): Promise<Record<string, ParticipantProfile>> => {
      const uniqueIds = Array.from(
        new Set(
          userIds.filter((id): id is string => typeof id === "string" && id.trim().length > 0)
        )
      );

      if (!isSupabaseConfigured || uniqueIds.length === 0) {
        return {};
      }

      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("id, full_name, avatar_url, role")
          .in("id", uniqueIds);

        if (error) throw error;

        const entries = (data || []).map((item) => {
          const profile: ParticipantProfile = {
            id: item.id,
            full_name: item.full_name ?? "",
            avatar_url: item.avatar_url ?? null,
            role: item.role ?? null,
          };
          return [item.id, profile] as const;
        });

        return Object.fromEntries(entries) as Record<string, ParticipantProfile>;
      } catch (profileError) {
        console.warn("Unable to load participant profiles", profileError);
        return {};
      }
    },
    []
  );

  const transformMessage = useCallback(
    (msg: RawMessage): Message => ({
      ...msg,
      attachments: parseAttachments(msg.attachments),
      metadata: parseMetadata(msg.metadata),
    }),
    []
  );

  const transformParticipant = useCallback(
    (participant: RawParticipant): ConversationParticipant => ({
      ...participant,
      profile: participant.profile
        ? {
            id: participant.profile.id,
            full_name: participant.profile.full_name,
            avatar_url: participant.profile.avatar_url,
            role: participant.profile.role,
          }
        : undefined,
    }),
    []
  );

  const resolveSenderProfile = useCallback(
    (
      senderId: string,
      conversationId?: string,
      participants?: ConversationParticipant[]
    ) => {
      if (!senderId) return undefined;

      const participantList =
        participants ??
        conversationsRef.current.find((conv) => conv.id === conversationId)?.participants ??
        [];

      const participant = participantList.find((item) => item.user_id === senderId);
      if (participant?.profile) {
        return {
          id: participant.profile.id,
          full_name: participant.profile.full_name,
          avatar_url: participant.profile.avatar_url,
        };
      }

      if (profile && senderId === profile.id) {
        return {
          id: profile.id,
          full_name: profile.full_name,
          avatar_url: profile.avatar_url ?? null,
        };
      }

      if (user?.id === senderId) {
        return {
          id: user.id,
          full_name:
            profile?.full_name ||
            (typeof user.user_metadata?.full_name === "string"
              ? user.user_metadata.full_name
              : user.email ?? "You"),
          avatar_url: profile?.avatar_url ?? null,
        };
      }

      return undefined;
    },
    [profile, user]
  );

  const attachSenderDetails = useCallback(
    (
      message: Message,
      conversationId?: string,
      participants?: ConversationParticipant[]
    ): Message => {
      if (message.sender) return message;

      const senderProfile = resolveSenderProfile(
        message.sender_id,
        conversationId,
        participants
      );
      if (!senderProfile) return message;

      return {
        ...message,
        sender: senderProfile,
      };
    },
    [resolveSenderProfile]
  );

  const transformConversation = useCallback(
    (conversation: RawConversation): Conversation => {
      const participants = (conversation.participants || []).map((participant) =>
        transformParticipant(participant)
      );
      const lastMessage =
        Array.isArray(conversation.lastMessage) && conversation.lastMessage.length > 0
          ? transformMessage(conversation.lastMessage[0])
          : undefined;
      const enrichedLastMessage = lastMessage
        ? attachSenderDetails(lastMessage, conversation.id, participants)
        : undefined;

      return {
        ...conversation,
        metadata: parseMetadata(conversation.metadata),
        participants,
        lastMessage: enrichedLastMessage,
      };
    },
    [attachSenderDetails, transformMessage, transformParticipant]
  );

  const transformTypingIndicator = useCallback(
    (indicator: RawTypingIndicator): TypingIndicator => ({
      ...indicator,
      profile: indicator.profile
        ? {
            full_name: indicator.profile.full_name,
          }
        : undefined,
    }),
    []
  );

  const playNotificationSound = useCallback(async () => {
    if (typeof window === "undefined") return;
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

  const ensureNotificationPermission = useCallback(async (): Promise<NotificationPermission> => {
    if (typeof window === "undefined" || !("Notification" in window)) return "denied";
    const current = notificationsPermissionRef.current ?? Notification.permission;
    if (current === "granted" || current === "denied") {
      notificationsPermissionRef.current = current;
      return current;
    }
    try {
      const permission = await Notification.requestPermission();
      notificationsPermissionRef.current = permission;
      return permission;
    } catch (error) {
      console.warn("Unable to request notification permission", error);
      notificationsPermissionRef.current = "denied";
      return "denied";
    }
  }, []);

  const showDesktopNotification = useCallback(
    async (conversationId: string, message: Message) => {
      if (typeof window === "undefined" || !("Notification" in window)) return;
      if (typeof document === "undefined") return;
      if (document.visibilityState !== "hidden") return;

      const permission = await ensureNotificationPermission();
      if (permission !== "granted") return;

      try {
        const conv = conversationsRef.current.find((c) => c.id === conversationId);
        const other = conv?.participants?.find((p) => p.user_id !== user?.id);
        const title = conv?.name || other?.profile?.full_name || "New message";
        const description = message.content || (message.attachments.length > 0 ? "[Attachment]" : "");
        const notification = new Notification(title, {
          body: description || "You have a new message",
          tag: conversationId,
          icon: conv?.avatar_url || other?.profile?.avatar_url || undefined,
        });

        notification.onclick = () => {
          window.focus();
          setCurrentConversation(conversationId);
          notification.close();
        };
      } catch (error) {
        console.warn("Unable to show desktop notification", error);
      }
    },
    [ensureNotificationPermission, user?.id]
  );

  const showNewMessageToast = useCallback(
    (conversationId: string, message: Message) => {
      const conv = conversationsRef.current.find((c) => c.id === conversationId);
      const other = conv?.participants?.find((p) => p.user_id !== user?.id);
      const title = conv?.name || other?.profile?.full_name || "New message";
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
      void showDesktopNotification(conversationId, message);
    },
    [playNotificationSound, showDesktopNotification, user?.id]
  );

  const markConversationRead = useCallback(
    async (conversationId: string) => {
      try {
        await supabase.rpc("mark_conversation_read", { conversation_uuid: conversationId });
      } catch (rpcError) {
        console.warn("Unable to mark conversation as read", rpcError);
      }

      setConversations((prev) => {
        const updated = prev.map((conversation) =>
          conversation.id === conversationId
            ? {
                ...conversation,
                unreadCount: 0,
              }
            : conversation
        );
        conversationsRef.current = updated;
        return updated;
      });
    },
    []
  );

  const fetchTypingIndicators = useCallback(
    async (conversationId: string) => {
      if (!user?.id || !conversationId || !isSupabaseConfigured) return;

      try {
        const { data, error } = await supabase
          .from("typing_indicators")
          .select(
            `
            id,
            conversation_id,
            user_id,
            started_at,
            expires_at
          `
          )
          .eq("conversation_id", conversationId)
          .neq("user_id", user.id);

        if (error) throw error;

        const rawIndicators = (data || []) as RawTypingIndicator[];
        const profileMap = await fetchProfilesByIds(
          rawIndicators.map((indicator) => indicator.user_id)
        );

        const enrichedIndicators = rawIndicators.map((indicator) => {
          const profile = profileMap[indicator.user_id];
          if (!profile) return indicator;
          return {
            ...indicator,
            profile: {
              full_name: profile.full_name,
            },
          };
        });

        const transformed = enrichedIndicators.map((indicator) =>
          transformTypingIndicator(indicator)
        );
        setTypingUsers(transformed);
      } catch (fetchError) {
        console.warn("Unable to fetch typing indicators", fetchError);
      }
    },
    [fetchProfilesByIds, transformTypingIndicator, user?.id]
  );

  const fetchMessages = useCallback(
    async (conversationId: string) => {
      if (!isSupabaseConfigured) {
        flagMessagingUnavailable();
        return;
      }

      if (!conversationId || !user?.id) {
        console.debug("fetchMessages: Missing conversationId or user.id", {
          conversationId,
          userId: user?.id,
        });
        return;
      }

      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(conversationId)) {
        console.error("fetchMessages: Invalid conversationId format", { conversationId });
        return;
      }

      const shouldShowLoader =
        messagesRef.current.length === 0 || currentConversationRef.current !== conversationId;
      if (shouldShowLoader) setLoading(true);
      
      try {
        console.debug("fetchMessages: Querying messages", {
          conversationId,
          userId: user.id,
        });

        let result = await supabase
          .from("conversation_messages")
          .select(
            `
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
            created_at
          `
          )
          .eq("conversation_id", conversationId)
          .order("created_at", { ascending: true });
        
        const isSchemaMismatch = (err: any) => {
          if (!err) return false;
          return (
            err.code === "42703" ||
            err.code?.startsWith("PGRST") ||
            /column .* does not exist|missing FROM-clause|relationship .* does not exist/i.test(err.message || "")
          );
        };

        if (result.error && isSchemaMismatch(result.error)) {
          console.warn("fetchMessages: Schema mismatch detected, retrying with minimal columns", {
            error: result.error.message,
            code: result.error.code,
          });
          
          result = await supabase
            .from("conversation_messages")
            .select(
              `
              id,
              conversation_id,
              sender_id,
              content,
              message_type,
              attachments,
              created_at
            `
            )
            .eq("conversation_id", conversationId)
            .order("created_at", { ascending: true });
        }

        if (result.error) {
          if (result.error.code === "42P17") {
            console.error("RLS infinite recursion detected", result.error);
            toast({
              title: "Database configuration error",
              description: "Messaging policies need to be fixed. Please contact support.",
              variant: "destructive",
            });
            return;
          }
          throw result.error;
        }

        const transformed = (result.data || []).map((message) => {
          const base = transformMessage(message as RawMessage);
          return attachSenderDetails(base, conversationId);
        });
        setMessages(transformed);
        messagesRef.current = transformed;
        await markConversationRead(conversationId);
        void fetchTypingIndicators(conversationId);
      } catch (fetchError: any) {
        console.error("Error fetching messages", {
          error: fetchError,
          message: fetchError?.message,
          code: fetchError?.code,
          details: fetchError?.details,
          hint: fetchError?.hint,
          conversationId,
          userId: user.id,
        });
        
        const isDev = import.meta.env.DEV;
        toast({
          title: "Unable to load messages",
          description: isDev && fetchError?.message 
            ? `${fetchError.message}${fetchError.hint ? ` (${fetchError.hint})` : ""}`
            : "Please try again later.",
          variant: "destructive",
        });
      } finally {
        if (shouldShowLoader) setLoading(false);
      }
    },
    [
      attachSenderDetails,
      fetchTypingIndicators,
      flagMessagingUnavailable,
      markConversationRead,
      toast,
      transformMessage,
      user?.id,
    ]
  );

  const enhanceConversations = useCallback(
    async (rawConversations: RawConversation[]) => {
      const transformed = rawConversations.map((conversation) =>
        transformConversation(conversation)
      );

      if (!user?.id) return transformed;

      const withUnread = await Promise.all(
        transformed.map(async (conversation) => {
          try {
            const { data: unreadCount, error: unreadError } = await supabase.rpc(
              "get_unread_count",
              {
                p_user_id: user.id,
                p_conversation_id: conversation.id,
              }
            );
            if (unreadError) throw unreadError;
            return {
              ...conversation,
              unreadCount: unreadCount ?? 0,
            };
          } catch (rpcError) {
            console.warn("Unable to fetch unread count", rpcError);
            return conversation;
          }
        })
      );

      return withUnread;
    },
    [transformConversation, user?.id]
  );

  const fetchConversations = useCallback(async () => {
    if (!isSupabaseConfigured) {
      flagMessagingUnavailable();
      return;
    }

    if (!user?.id) return;

    try {
      let result = await supabase
        .from("conversation_participants")
        .select(
          `
          conversation:conversations (
            id,
            tenant_id,
            title,
            type,
            is_group,
            created_at,
            updated_at,
            last_message_at,
            metadata,
            avatar_url,
            participants:conversation_participants (
              id,
              conversation_id,
              user_id,
              joined_at,
              last_read_at,
              role
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
              created_at
            )
          )
        `
        )
        .eq("user_id", user.id)
        .order("last_message_at", {
          foreignTable: "conversations",
          ascending: false,
          nullsFirst: false,
        })
        .order("updated_at", { foreignTable: "conversations", ascending: false });

      const isSchemaMismatch = (err: any) => {
        if (!err) return false;
        return (
          err.code === "42703" ||
          err.code?.startsWith("PGRST") ||
          /column .* does not exist|missing FROM-clause|relationship .* does not exist/i.test(err.message || "")
        );
      };

      if (result.error && isSchemaMismatch(result.error)) {
        console.warn("fetchConversations: Schema mismatch detected, retrying with minimal columns", {
          error: result.error.message,
          code: result.error.code,
        });
        
        result = await supabase
          .from("conversation_participants")
          .select(
            `
            conversation:conversations (
              id,
              tenant_id,
              title,
              type,
              is_group,
              created_at,
              updated_at,
              last_message_at,
              avatar_url,
              participants:conversation_participants (
                id,
                conversation_id,
                user_id,
                joined_at,
                last_read_at
              ),
              lastMessage:conversation_messages!conversation_messages_conversation_id_fkey (
                id,
                conversation_id,
                sender_id,
                content,
                message_type,
                attachments,
                created_at
              )
            )
          `
          )
          .eq("user_id", user.id)
          .order("last_message_at", {
            foreignTable: "conversations",
            ascending: false,
            nullsFirst: false,
          })
          .order("updated_at", { foreignTable: "conversations", ascending: false });
      }

      if (result.error) {
        if (result.error.code === "42P17") {
          console.error("RLS infinite recursion detected", result.error);
          toast({
            title: "Database configuration error",
            description: "Messaging policies need to be fixed. Please contact support.",
            variant: "destructive",
          });
          return;
        }
        throw result.error;
      }

      const conversationsData = (result.data || [])
        .map((item) => item.conversation)
        .filter(Boolean) as RawConversation[];

      const participantProfiles = await fetchProfilesByIds(
        conversationsData.flatMap((conversation) =>
          (conversation.participants || []).map((participant) => participant.user_id)
        )
      );

      const conversationsWithProfiles = conversationsData.map((conversation) => ({
        ...conversation,
        participants: (conversation.participants || []).map((participant) => {
          const existingProfile = participant.profile;
          const loadedProfile = participantProfiles[participant.user_id];

          if (!existingProfile && !loadedProfile) {
            return participant;
          }

          const profileSource = loadedProfile ?? existingProfile;

          return {
            ...participant,
            profile: profileSource
              ? {
                  id: profileSource.id,
                  full_name: profileSource.full_name,
                  avatar_url: profileSource.avatar_url ?? null,
                  role: profileSource.role ?? null,
                }
              : undefined,
          };
        }),
      }));

      const enhanced = await enhanceConversations(conversationsWithProfiles);
      enhanced.sort((a, b) => {
        const aDate = a.last_message_at || a.updated_at || a.created_at || "";
        const bDate = b.last_message_at || b.updated_at || b.created_at || "";
        return new Date(bDate).getTime() - new Date(aDate).getTime();
      });

      conversationsRef.current = enhanced;
      setConversations(enhanced);
      setError(null);
    } catch (fetchError) {
      console.error("Error fetching conversations", fetchError);
      toast({
        title: "Unable to load conversations",
        description: "Messaging is temporarily unavailable.",
        variant: "destructive",
      });
    }
  }, [
    enhanceConversations,
    fetchProfilesByIds,
    flagMessagingUnavailable,
    toast,
    user?.id,
  ]);

  const sendMessage = useCallback(
    async (conversationId: string, payload: SendMessagePayload) => {
      if (!isSupabaseConfigured) {
        flagMessagingUnavailable();
        return;
      }

      if (!conversationId || !user?.id) return;

      try {
        const { data, error } = await supabase
          .from("conversation_messages")
          .insert(
            {
              conversation_id: conversationId,
              sender_id: user.id,
              content: payload.content,
              message_type: payload.messageType ?? "text",
              attachments: payload.attachments ?? [],
              metadata: payload.metadata ?? {},
            },
            { count: "none" }
          )
          .select(
            `
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
            created_at
          `
          )
          .single();

        if (error) throw error;

        if (data) {
          const message = transformMessage(data as RawMessage);
          const enrichedMessage = attachSenderDetails(message, conversationId);
          setMessages((prev) => {
            const exists = prev.find((item) => item.id === enrichedMessage.id);
            if (exists) {
              return prev.map((item) =>
                item.id === enrichedMessage.id ? enrichedMessage : item
              );
            }
            return [...prev, enrichedMessage];
          });
          conversationsRef.current = conversationsRef.current.map((conversation) =>
            conversation.id === conversationId
              ? {
                  ...conversation,
                  lastMessage: enrichedMessage,
                  last_message_at: enrichedMessage.created_at,
                  unreadCount: 0,
                }
              : conversation
          );
          setConversations(conversationsRef.current);
        }
      } catch (sendError) {
        console.error("Error sending message", sendError);
        toast({
          title: "Unable to send message",
          description: "Please try again.",
          variant: "destructive",
        });
      }
    },
    [attachSenderDetails, flagMessagingUnavailable, toast, transformMessage, user?.id]
  );

  const startTyping = useCallback(
    async (conversationId?: string | null) => {
      if (!conversationId || !user?.id || !isSupabaseConfigured) return;

      try {
        await supabase
          .from("typing_indicators")
          .delete()
          .eq("conversation_id", conversationId)
          .eq("user_id", user.id);

        await supabase.from("typing_indicators").insert({
          conversation_id: conversationId,
          user_id: user.id,
          started_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 10_000).toISOString(),
        });
      } catch (typingError) {
        console.warn("Unable to start typing indicator", typingError);
      }
    },
    [user?.id]
  );

  const stopTyping = useCallback(
    async (conversationId?: string | null) => {
      if (!conversationId || !user?.id || !isSupabaseConfigured) return;

      try {
        await supabase
          .from("typing_indicators")
          .delete()
          .eq("conversation_id", conversationId)
          .eq("user_id", user.id);
      } catch (typingError) {
        console.warn("Unable to clear typing indicator", typingError);
      }
    },
    [user?.id]
  );

  const getOrCreateConversation = useCallback(
    async (otherUserId: string) => {
      if (!isSupabaseConfigured) {
        flagMessagingUnavailable();
        return null;
      }

      if (!user?.id || !profile?.tenant_id) {
        toast({
          title: "Cannot start chat",
          description: "Missing user context. Please refresh and try again.",
          variant: "destructive",
        });
        return null;
      }

      try {
        const { data, error } = await supabase.rpc("get_or_create_conversation", {
          p_user_id: user.id,
          p_other_user_id: otherUserId,
          p_tenant_id: profile.tenant_id,
        });

        if (error) throw error;

        if (data) {
          await fetchConversations();
          return data as string;
        }
        return null;
      } catch (rpcError) {
        console.error("Error creating conversation", rpcError);
        toast({
          title: "Unable to start conversation",
          description: "Please try again later.",
          variant: "destructive",
        });
        return null;
      }
    },
    [fetchConversations, flagMessagingUnavailable, profile?.tenant_id, toast, user?.id]
  );

  useEffect(() => {
    currentConversationRef.current = currentConversation;
  }, [currentConversation]);

  useEffect(() => {
    conversationsRef.current = conversations;
  }, [conversations]);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      flagMessagingUnavailable();
      return;
    }

    if (!user?.id) return;

    void fetchConversations();

    const channel = supabase
      .channel(`messaging:user:${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "conversation_participants",
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          void fetchConversations();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "conversations",
        },
        () => {
          void fetchConversations();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "conversation_messages",
        },
        async (payload) => {
          const newMessage = payload.new as RawMessage | null;
          const conversationId = newMessage?.conversation_id;
          if (!conversationId) return;

          if (conversationId !== currentConversationRef.current && newMessage?.sender_id !== user.id) {
            try {
              const { data } = await supabase
                .from("conversation_messages")
                .select(
                  `
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
                  created_at
                `
                )
                .eq("id", newMessage.id)
                .maybeSingle();

              if (data) {
                const message = transformMessage(data as RawMessage);
                const enrichedMessage = attachSenderDetails(message, conversationId);
                showNewMessageToast(conversationId, enrichedMessage);
              }
            } catch (notifyError) {
              console.warn("Unable to fetch message for notification", notifyError);
            }
          }

          void fetchConversations();
        }
      )
      .subscribe();

    conversationsChannelRef.current = channel;

    return () => {
      if (channel) {
        void supabase.removeChannel(channel);
      }
    };
  }, [
    attachSenderDetails,
    fetchConversations,
    flagMessagingUnavailable,
    showNewMessageToast,
    transformMessage,
    user?.id,
  ]);

  useEffect(() => {
    if (messagesChannelRef.current) {
      void supabase.removeChannel(messagesChannelRef.current);
      messagesChannelRef.current = null;
    }

    if (typingChannelRef.current) {
      void supabase.removeChannel(typingChannelRef.current);
      typingChannelRef.current = null;
    }

    if (!isSupabaseConfigured) {
      flagMessagingUnavailable();
      return;
    }

    if (!currentConversation) {
      setMessages([]);
      messagesRef.current = [];
      setTypingUsers([]);
      return;
    }

    void fetchMessages(currentConversation);

    const messageChannel = supabase
      .channel(`conversation:${currentConversation}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "conversation_messages",
          filter: `conversation_id=eq.${currentConversation}`,
        },
        () => {
          void fetchMessages(currentConversation);
        }
      )
      .subscribe();

    const typingChannel = supabase
      .channel(`typing:${currentConversation}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "typing_indicators",
          filter: `conversation_id=eq.${currentConversation}`,
        },
        () => {
          void fetchTypingIndicators(currentConversation);
        }
      )
      .subscribe();

    messagesChannelRef.current = messageChannel;
    typingChannelRef.current = typingChannel;

    return () => {
      if (messageChannel) {
        void supabase.removeChannel(messageChannel);
      }
      if (typingChannel) {
        void supabase.removeChannel(typingChannel);
      }
    };
  }, [currentConversation, fetchMessages, fetchTypingIndicators, flagMessagingUnavailable]);

  useEffect(() => {
    return () => {
      if (conversationsChannelRef.current) {
        void supabase.removeChannel(conversationsChannelRef.current);
      }
      if (messagesChannelRef.current) {
        void supabase.removeChannel(messagesChannelRef.current);
      }
      if (typingChannelRef.current) {
        void supabase.removeChannel(typingChannelRef.current);
      }
    };
  }, []);

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
