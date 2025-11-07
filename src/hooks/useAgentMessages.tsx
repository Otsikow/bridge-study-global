import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';
import type {
  Conversation,
  ConversationParticipant,
  Message,
  MessageAttachment,
  TypingIndicator,
  SendMessagePayload,
} from './useMessages';
import type { Tables } from '@/integrations/supabase/types';
import { toast as sonnerToast } from '@/components/ui/sonner';

type MessageRow = Tables<'messages'> & {
  sender?: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
  } | null;
};

type ApplicationRow = {
  id: string;
  created_at: string | null;
  updated_at: string | null;
  student?: {
    profile?: {
      id: string;
      full_name: string | null;
      avatar_url: string | null;
    } | null;
  } | null;
  program?: {
    name: string | null;
    level: string | null;
    university?: {
      name: string | null;
    } | null;
  } | null;
};

interface ZoePresenceState {
  full_name?: string;
  typing?: boolean;
  lastTypedAt?: string;
}

const LAST_SEEN_STORAGE_KEY = (userId: string | undefined) =>
  `agent-messaging:lastSeen:${userId ?? 'anonymous'}`;

const LAST_CONVERSATION_KEY = 'messages:lastConversation';

const createAttachmentId = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
};

const parseAttachments = (input: unknown): MessageAttachment[] => {
  if (!input) return [];

  let payload: unknown = input;

  if (typeof input === 'string') {
    try {
      payload = JSON.parse(input);
    } catch (error) {
      console.warn('Failed to parse message attachments payload', error);
      return [];
    }
  }

  if (!Array.isArray(payload)) {
    return [];
  }

  return payload
    .map((rawAttachment: any) => {
      if (!rawAttachment || typeof rawAttachment !== 'object') {
        return null;
      }

      const url = typeof rawAttachment.url === 'string' ? rawAttachment.url : null;
      if (!url) {
        return null;
      }

      const inferType = () => {
        if (typeof rawAttachment.type === 'string') {
          return rawAttachment.type;
        }
        const mimeType: string | undefined =
          typeof rawAttachment.mime_type === 'string'
            ? rawAttachment.mime_type
            : typeof rawAttachment.mimeType === 'string'
              ? rawAttachment.mimeType
              : undefined;
        if (!mimeType) return 'file';
        if (mimeType.startsWith('image/')) return 'image';
        if (mimeType.startsWith('video/')) return 'video';
        if (mimeType.startsWith('audio/')) return 'audio';
        return 'file';
      };

      const normalizeSize = () => {
        if (typeof rawAttachment.size === 'number') return rawAttachment.size;
        if (typeof rawAttachment.file_size === 'number') return rawAttachment.file_size;
        if (typeof rawAttachment.size === 'string') {
          const parsed = Number(rawAttachment.size);
          return Number.isNaN(parsed) ? null : parsed;
        }
        return null;
      };

      const normalized: MessageAttachment = {
        id:
          (typeof rawAttachment.id === 'string' && rawAttachment.id) ||
          createAttachmentId(),
        type: inferType(),
        url,
        name:
          typeof rawAttachment.name === 'string'
            ? rawAttachment.name
            : typeof rawAttachment.file_name === 'string'
              ? rawAttachment.file_name
              : null,
        size: normalizeSize(),
        mime_type:
          typeof rawAttachment.mime_type === 'string'
            ? rawAttachment.mime_type
            : typeof rawAttachment.mimeType === 'string'
              ? rawAttachment.mimeType
              : null,
        preview_url:
          typeof rawAttachment.preview_url === 'string'
            ? rawAttachment.preview_url
            : typeof rawAttachment.previewUrl === 'string'
              ? rawAttachment.previewUrl
              : url,
        storage_path:
          typeof rawAttachment.storage_path === 'string'
            ? rawAttachment.storage_path
            : typeof rawAttachment.storagePath === 'string'
              ? rawAttachment.storagePath
              : typeof rawAttachment.meta === 'object' &&
                    rawAttachment.meta &&
                    typeof rawAttachment.meta.storagePath === 'string'
                ? rawAttachment.meta.storagePath
                : null,
        duration_ms:
          typeof rawAttachment.duration_ms === 'number'
            ? rawAttachment.duration_ms
            : typeof rawAttachment.durationMs === 'number'
              ? rawAttachment.durationMs
              : typeof rawAttachment.meta === 'object' &&
                    rawAttachment.meta &&
                    typeof rawAttachment.meta.durationMs === 'number'
                ? rawAttachment.meta.durationMs
                : null,
        meta: (rawAttachment.meta as Record<string, unknown> | null | undefined) ?? null,
      };

      return normalized;
    })
    .filter((attachment): attachment is MessageAttachment => Boolean(attachment));
};

const mapMessageRow = (row: MessageRow): Message => {
  const attachments = parseAttachments(row.attachments);
  const createdAt = row.created_at ?? new Date().toISOString();
  const seenBy = Array.isArray(row.read_by) ? [...row.read_by] : [];

  if (!seenBy.includes(row.sender_id)) {
    seenBy.push(row.sender_id);
  }

  const receipts = seenBy.map((userId) => ({
    message_id: row.id,
    user_id: userId,
    read_at: createdAt,
    profile:
      row.sender && row.sender.id === userId
        ? {
            id: row.sender.id,
            full_name: row.sender.full_name ?? 'Unknown User',
            avatar_url: row.sender.avatar_url ?? null,
          }
        : undefined,
  }));

  return {
    id: row.id,
    conversation_id: row.application_id,
    sender_id: row.sender_id,
    content: row.body ?? '',
    message_type: row.message_type ?? 'text',
    attachments,
    metadata: null,
    reply_to_id: null,
    edited_at: null,
    deleted_at: null,
    created_at: createdAt,
    receipts,
    sender: row.sender
      ? {
          id: row.sender.id,
          full_name: row.sender.full_name ?? 'Unknown User',
          avatar_url: row.sender.avatar_url ?? null,
        }
      : undefined,
  };
};

export function useAgentMessages() {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const isAgent = profile?.role === 'agent' || profile?.role === 'partner';

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [typingUsers, setTypingUsers] = useState<TypingIndicator[]>([]);
  const [loading, setLoading] = useState(false);

  const conversationsRef = useRef<Conversation[]>([]);
  const messagesCacheRef = useRef<Record<string, Message[]>>({});
  const lastSeenRef = useRef<Record<string, string>>({});
  const typingChannelRef = useRef<RealtimeChannel | null>(null);
  const messagesChannelRef = useRef<RealtimeChannel | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const initialConversationRef = useRef<string | null>(null);
  const currentConversationRef = useRef<string | null>(null);

  useEffect(() => {
    currentConversationRef.current = currentConversation;
  }, [currentConversation]);

  useEffect(() => {
    conversationsRef.current = conversations;
  }, [conversations]);

  useEffect(() => {
    if (!isAgent) {
      setConversations([]);
      setMessages([]);
      setTypingUsers([]);
      setCurrentConversation(null);
      lastSeenRef.current = {};
      messagesCacheRef.current = {};
      return;
    }

    if (typeof window === 'undefined') {
      return;
    }

    // Load previously opened conversation once per session
    if (!initialConversationRef.current) {
      initialConversationRef.current = window.localStorage.getItem(LAST_CONVERSATION_KEY);
    }

    // Load last seen timestamps
    const key = LAST_SEEN_STORAGE_KEY(user?.id);
    try {
      const stored = window.localStorage.getItem(key);
      if (stored) {
        const parsed = JSON.parse(stored) as Record<string, string>;
        if (parsed && typeof parsed === 'object') {
          lastSeenRef.current = parsed;
        }
      }
    } catch (error) {
      console.warn('Failed to parse stored last-seen map', error);
      lastSeenRef.current = {};
    }
  }, [isAgent, user?.id]);

  const persistLastSeen = useCallback(
    (next: Record<string, string>) => {
      if (!isAgent || typeof window === 'undefined') return;
      const key = LAST_SEEN_STORAGE_KEY(user?.id);
      try {
        window.localStorage.setItem(key, JSON.stringify(next));
      } catch (error) {
        console.warn('Unable to persist last-seen state', error);
      }
    },
    [isAgent, user?.id]
  );

  const updateLastSeen = useCallback(
    (conversationId: string, timestamp: string) => {
      const next = { ...lastSeenRef.current, [conversationId]: timestamp };
      lastSeenRef.current = next;
      persistLastSeen(next);
    },
    [persistLastSeen]
  );

  const playNotificationSound = useCallback(async () => {
    if (typeof window === 'undefined') return;
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;

    try {
      let ctx = audioContextRef.current;
      if (!ctx) {
        ctx = new AudioCtx();
        audioContextRef.current = ctx;
      }

      if (ctx.state === 'suspended') {
        await ctx.resume();
      }

      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();

      oscillator.type = 'triangle';
      oscillator.frequency.setValueAtTime(750, ctx.currentTime);

      gain.gain.setValueAtTime(0.0001, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.08, ctx.currentTime + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.28);

      oscillator.connect(gain);
      gain.connect(ctx.destination);
      oscillator.start();
      oscillator.stop(ctx.currentTime + 0.32);
    } catch (error) {
      console.warn('Unable to play notification sound', error);
    }
  }, []);

  const showNewMessageToast = useCallback(
    (conversationId: string, message: Message) => {
      if (!isAgent) return;

      const conversation = conversationsRef.current.find((conv) => conv.id === conversationId);
      const metadata = (conversation?.metadata ?? {}) as Record<string, unknown>;
      const studentName = typeof metadata.studentName === 'string' ? metadata.studentName : undefined;
      const title =
        conversation?.name ||
        conversation?.title ||
        studentName ||
        'New partner message';

      let description = message.content?.trim();
      if (!description && message.attachments.length > 0) {
        description =
          message.attachments.length === 1
            ? 'Sent an attachment'
            : `Sent ${message.attachments.length} attachments`;
      }

      sonnerToast(title, {
        description: description || 'You received a new partner message.',
        duration: 6000,
        action: {
          label: 'Open',
          onClick: () => {
            setCurrentConversation(conversationId);
          },
        },
      });

      void playNotificationSound();
    },
    [isAgent, playNotificationSound, setCurrentConversation]
  );

  const markThreadRead = useCallback(
    (conversationId: string, threadMessages?: Message[]) => {
      if (!isAgent || !user?.id) return;

      const existing = threadMessages ?? messagesCacheRef.current[conversationId] ?? [];
      if (existing.length === 0) {
        updateLastSeen(conversationId, new Date().toISOString());
        return;
      }

      const lastMessage = existing[existing.length - 1];
      const lastTimestamp = lastMessage?.created_at ?? new Date().toISOString();

      updateLastSeen(conversationId, lastTimestamp);

      const agentProfileForReceipt = profile
        ? {
            id: profile.id,
            full_name: profile.full_name ?? profile.email ?? 'You',
            avatar_url: profile.avatar_url ?? null,
          }
        : undefined;

      let hasChanges = false;
      const updatedMessages = existing.map((message) => {
        if (message.sender_id === user.id) return message;
        if (message.receipts.some((receipt) => receipt.user_id === user.id)) return message;

        hasChanges = true;
        return {
          ...message,
          receipts: [
            ...message.receipts,
            {
              message_id: message.id,
              user_id: user.id,
              read_at: new Date().toISOString(),
              profile: agentProfileForReceipt,
            },
          ],
        };
      });

      if (hasChanges) {
        messagesCacheRef.current[conversationId] = updatedMessages;
        if (currentConversationRef.current === conversationId) {
          setMessages(updatedMessages);
        }
      }

      const unreadMessages = updatedMessages.filter(
        (message) =>
          message.sender_id !== user.id &&
          !message.receipts.some((receipt) => receipt.user_id === user.id)
      );

      if (unreadMessages.length > 0) {
        void Promise.all(
          unreadMessages.map((message) =>
            supabase
              .from('messages')
              .update({
                read_by: [...message.receipts.map((receipt) => receipt.user_id), user.id],
              })
              .eq('id', message.id)
          )
        ).catch((error) => {
          console.warn('Unable to persist read acknowledgements', error);
        });
      }

      setConversations((prev) =>
        prev.map((conversation) =>
          conversation.id === conversationId
            ? {
                ...conversation,
                unreadCount: 0,
                participants: (conversation.participants || []).map((participant) =>
                  participant.user_id === user.id
                    ? { ...participant, last_read_at: lastTimestamp }
                    : participant
                ),
              }
            : conversation
        )
      );
    },
    [isAgent, profile, supabase, updateLastSeen, user?.id]
  );

  const fetchThreadMessages = useCallback(
    async (conversationId: string) => {
      if (!isAgent || !user?.id) return;
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('messages')
          .select(
            `
            id,
            application_id,
            sender_id,
            body,
            message_type,
            attachments,
            created_at,
            read_by,
            sender:profiles (
              id,
              full_name,
              avatar_url
            )
          `
          )
          .eq('application_id', conversationId)
          .order('created_at', { ascending: true });

        if (error) throw error;

        const mapped = (data as MessageRow[] | null)?.map(mapMessageRow) ?? [];
        messagesCacheRef.current[conversationId] = mapped;
        if (currentConversationRef.current === conversationId) {
          setMessages(mapped);
        }
        markThreadRead(conversationId, mapped);
      } catch (error) {
        console.error('Error loading agent conversation', error);
        toast({
          title: 'Error',
          description: 'Failed to load this conversation. Please try again.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    },
    [isAgent, markThreadRead, supabase, toast, user?.id]
  );

  const loadConversations = useCallback(async () => {
    if (!isAgent || !user?.id) return;

    try {
      const { data: agentRecord, error: agentError } = await supabase
        .from('agents')
        .select('id')
        .eq('profile_id', user.id)
        .maybeSingle();

      if (agentError) throw agentError;
      if (!agentRecord?.id) {
        setConversations([]);
        conversationsRef.current = [];
        setCurrentConversation(null);
        return;
      }

      const { data: applications, error: applicationsError } = await supabase
        .from('applications')
        .select(
          `
          id,
          created_at,
          updated_at,
          student:students(
            profile:profiles (
              id,
              full_name,
              avatar_url
            )
          ),
          program:programs(
            name,
            level,
            university:universities(name)
          )
        `
        )
        .eq('agent_id', agentRecord.id)
        .order('updated_at', { ascending: false, nullsLast: true });

      if (applicationsError) throw applicationsError;

      const applicationRows = (applications || []) as ApplicationRow[];

      const conversationPromises = applicationRows.map(async (application) => {
        const lastMessagePromise = supabase
          .from('messages')
          .select(
            `
            id,
            application_id,
            sender_id,
            body,
            message_type,
            attachments,
            created_at,
            read_by,
            sender:profiles (
              id,
              full_name,
              avatar_url
            )
          `
          )
          .eq('application_id', application.id)
          .order('created_at', { ascending: false })
          .limit(1);

        const lastSeen = lastSeenRef.current[application.id];
        let unreadQuery = supabase
          .from('messages')
          .select('id', { count: 'exact', head: true })
          .eq('application_id', application.id)
          .neq('sender_id', user.id);

        if (lastSeen) {
          unreadQuery = unreadQuery.gt('created_at', lastSeen);
        }

        const [{ data: lastMessageData, error: lastMessageError }, { count: unreadCount, error: unreadError }] =
          await Promise.all([lastMessagePromise, unreadQuery]);

        if (lastMessageError) throw lastMessageError;
        if (unreadError) throw unreadError;

        const lastMessageRow = (lastMessageData as MessageRow[] | null)?.[0];
        const lastMessage = lastMessageRow ? mapMessageRow(lastMessageRow) : undefined;

        const studentProfile = application.student?.profile;
        const studentName = studentProfile?.full_name ?? 'Student';
        const programName = application.program?.name ?? '';
        const universityName = application.program?.university?.name ?? '';

        const subtitleParts = [programName, universityName].filter(Boolean);
        const subtitle = subtitleParts.join(' • ');

        const participants: ConversationParticipant[] = [
          {
            id: `${application.id}-${user.id}`,
            conversation_id: application.id,
            user_id: user.id,
            joined_at: application.created_at ?? new Date().toISOString(),
            last_read_at:
              lastSeenRef.current[application.id] ??
              application.updated_at ??
              application.created_at ??
              new Date().toISOString(),
            is_admin: true,
            role: 'agent',
            profile: profile
              ? {
                  id: profile.id,
                  full_name: profile.full_name ?? profile.email ?? 'You',
                  avatar_url: profile.avatar_url ?? null,
                  role: profile.role ?? 'agent',
                }
              : undefined,
          },
        ];

        if (studentProfile?.id) {
          participants.push({
            id: `${application.id}-${studentProfile.id}`,
            conversation_id: application.id,
            user_id: studentProfile.id,
            joined_at: application.created_at ?? new Date().toISOString(),
            last_read_at: application.updated_at ?? application.created_at ?? new Date().toISOString(),
            is_admin: false,
            role: 'student',
            profile: {
              id: studentProfile.id,
              full_name: studentProfile.full_name ?? 'Student',
              avatar_url: studentProfile.avatar_url ?? null,
              role: 'student',
            },
          });
        }

        const updatedAt =
          lastMessage?.created_at ?? application.updated_at ?? application.created_at ?? new Date().toISOString();

        const conversation: Conversation = {
          id: application.id,
          tenant_id: profile?.tenant_id ?? '',
          title: studentName,
          type: 'direct',
          is_group: false,
          created_at: application.created_at ?? new Date().toISOString(),
          updated_at: updatedAt,
          last_message_at: lastMessage?.created_at ?? null,
          participants,
          lastMessage,
          unreadCount: unreadCount ?? 0,
          name: studentName,
          avatar_url: studentProfile?.avatar_url ?? null,
          metadata: {
            applicationId: application.id,
            studentName,
            programName,
            universityName,
            subtitle,
          },
        };

        return conversation;
      });

      const mappedConversations = await Promise.all(conversationPromises);
      mappedConversations.sort((a, b) => {
        const aTime = a.updated_at ? new Date(a.updated_at).getTime() : 0;
        const bTime = b.updated_at ? new Date(b.updated_at).getTime() : 0;
        return bTime - aTime;
      });

      setConversations(mappedConversations);
      conversationsRef.current = mappedConversations;

      if (!mappedConversations.some((conversation) => conversation.id === currentConversationRef.current)) {
        let nextConversation: string | null = mappedConversations[0]?.id ?? null;
        if (initialConversationRef.current) {
          const saved = initialConversationRef.current;
          if (mappedConversations.some((conversation) => conversation.id === saved)) {
            nextConversation = saved;
          }
          initialConversationRef.current = null;
        }
        setCurrentConversation(nextConversation);
      }
    } catch (error) {
      console.error('Error loading agent conversations', error);
      toast({
        title: 'Error',
        description: 'Unable to load conversations right now.',
        variant: 'destructive',
      });
    }
  }, [isAgent, profile, supabase, toast, user?.id]);

  useEffect(() => {
    if (!isAgent) return;
    loadConversations();
  }, [isAgent, loadConversations]);

  useEffect(() => {
    if (typeof window === 'undefined' || !isAgent) return;

    if (currentConversation) {
      window.localStorage.setItem(LAST_CONVERSATION_KEY, currentConversation);
    } else {
      window.localStorage.removeItem(LAST_CONVERSATION_KEY);
    }
  }, [currentConversation, isAgent]);

  useEffect(() => {
    if (!isAgent) {
      setMessages([]);
      return;
    }

    if (!currentConversation) {
      setMessages([]);
      setTypingUsers([]);
      return;
    }

    const cached = messagesCacheRef.current[currentConversation];
    if (cached) {
      setMessages(cached);
      markThreadRead(currentConversation, cached);
    } else {
      void fetchThreadMessages(currentConversation);
    }
  }, [currentConversation, fetchThreadMessages, isAgent, markThreadRead]);

  const conversationIdsKey = useMemo(() => {
    return conversations
      .map((conversation) => conversation.id)
      .sort()
      .join(',');
  }, [conversations]);

  useEffect(() => {
    if (!isAgent || !user?.id) {
      if (messagesChannelRef.current) {
        supabase.removeChannel(messagesChannelRef.current);
        messagesChannelRef.current = null;
      }
      return;
    }

    const conversationIds = conversationIdsKey
      .split(',')
      .map((id) => id.trim())
      .filter(Boolean);

    if (conversationIds.length === 0) {
      if (messagesChannelRef.current) {
        supabase.removeChannel(messagesChannelRef.current);
        messagesChannelRef.current = null;
      }
      return;
    }

    if (messagesChannelRef.current) {
      supabase.removeChannel(messagesChannelRef.current);
      messagesChannelRef.current = null;
    }

    const filter =
      conversationIds.length === 1
        ? `application_id=eq.${conversationIds[0]}`
        : `application_id=in.(${conversationIds.join(',')})`;

    const channel = supabase
      .channel(`agent-messages-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter,
        },
        (payload) => {
          const row = payload.new as MessageRow;
          const conversationId = row.application_id;
          const formatted = mapMessageRow(row);
          const isOwnMessage = row.sender_id === user.id;

          const existingThread = messagesCacheRef.current[conversationId] ?? [];
          if (!existingThread.some((message) => message.id === formatted.id)) {
            const nextThread = [...existingThread, formatted];
            messagesCacheRef.current[conversationId] = nextThread;

            if (currentConversationRef.current === conversationId) {
              setMessages(nextThread);
              if (!isOwnMessage) {
                markThreadRead(conversationId, nextThread);
              }
            }
          }

          setConversations((prev) => {
            const exists = prev.some((conversation) => conversation.id === conversationId);
            if (!exists) {
              void loadConversations();
              return prev;
            }

            const updated = prev
              .map((conversation) =>
                conversation.id === conversationId
                  ? {
                      ...conversation,
                      lastMessage: formatted,
                      updated_at: formatted.created_at,
                      last_message_at: formatted.created_at,
                      unreadCount:
                        isOwnMessage || currentConversationRef.current === conversationId
                          ? 0
                          : (conversation.unreadCount ?? 0) + 1,
                    }
                  : conversation
              )
              .sort((a, b) => {
                const aTime = a.updated_at ? new Date(a.updated_at).getTime() : 0;
                const bTime = b.updated_at ? new Date(b.updated_at).getTime() : 0;
                return bTime - aTime;
              });

            return updated;
          });

          if (
            !isOwnMessage &&
            (currentConversationRef.current !== conversationId ||
              (typeof document !== 'undefined' && document.visibilityState === 'hidden'))
          ) {
            showNewMessageToast(conversationId, formatted);
          }
        }
      )
      .subscribe();

    messagesChannelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
      messagesChannelRef.current = null;
    };
  }, [
    conversationIdsKey,
    isAgent,
    loadConversations,
    markThreadRead,
    showNewMessageToast,
    supabase,
    user?.id,
  ]);

  const syncTypingState = useCallback(
    (state: Record<string, ZoePresenceState[]>, conversationId: string) => {
      if (!isAgent) {
        setTypingUsers([]);
        return;
      }

      const indicators: TypingIndicator[] = [];
      Object.entries(state).forEach(([userId, entries]) => {
        if (userId === user?.id) return;
        entries.forEach((entry) => {
          if (entry.typing) {
            const startedAt = entry.lastTypedAt ?? new Date().toISOString();
            const expiresAt = new Date(new Date(startedAt).getTime() + 4000).toISOString();
            indicators.push({
              user_id: userId,
              conversation_id: conversationId,
              started_at: startedAt,
              expires_at: expiresAt,
              profile: entry.full_name ? { full_name: entry.full_name } : undefined,
            });
          }
        });
      });

      setTypingUsers(indicators);
    },
    [isAgent, user?.id]
  );

  const updateTypingPresence = useCallback(
    async (typing: boolean) => {
      if (!isAgent || !typingChannelRef.current || !user?.id) return;
      const payload: ZoePresenceState = {
        full_name: profile?.full_name ?? profile?.email ?? 'Agent',
        typing,
        lastTypedAt: new Date().toISOString(),
      };
      try {
        await typingChannelRef.current.track(payload);
      } catch (error) {
        console.warn('Failed to update typing presence', error);
      }
    },
    [isAgent, profile?.email, profile?.full_name, user?.id]
  );

  useEffect(() => {
    if (!isAgent || !user?.id) {
      if (typingChannelRef.current) {
        supabase.removeChannel(typingChannelRef.current);
        typingChannelRef.current = null;
      }
      setTypingUsers([]);
      return;
    }

    if (!currentConversation) {
      if (typingChannelRef.current) {
        supabase.removeChannel(typingChannelRef.current);
        typingChannelRef.current = null;
      }
      setTypingUsers([]);
      return;
    }

    if (typingChannelRef.current) {
      supabase.removeChannel(typingChannelRef.current);
      typingChannelRef.current = null;
    }

    const channel = supabase.channel(`agent-messages-typing-${currentConversation}`, {
      config: { presence: { key: user.id } },
    });

    channel.on('presence', { event: 'sync' }, () => {
      syncTypingState(channel.presenceState() as Record<string, ZoePresenceState[]>, currentConversation);
    });
    channel.on('presence', { event: 'join' }, () => {
      syncTypingState(channel.presenceState() as Record<string, ZoePresenceState[]>, currentConversation);
    });
    channel.on('presence', { event: 'leave' }, () => {
      syncTypingState(channel.presenceState() as Record<string, ZoePresenceState[]>, currentConversation);
    });

    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        typingChannelRef.current = channel;
        void channel.track({
          full_name: profile?.full_name ?? profile?.email ?? 'Agent',
          typing: false,
          lastTypedAt: new Date().toISOString(),
        });
      }
    });

    return () => {
      supabase.removeChannel(channel);
      if (typingChannelRef.current === channel) {
        typingChannelRef.current = null;
      }
      setTypingUsers([]);
    };
  }, [currentConversation, isAgent, profile?.email, profile?.full_name, supabase, syncTypingState, user?.id]);

  const startTyping = useCallback((_: string | undefined = undefined) => {
    if (!isAgent) return;
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    void updateTypingPresence(true);
    typingTimeoutRef.current = setTimeout(() => {
      typingTimeoutRef.current = null;
      void updateTypingPresence(false);
    }, 3000);
  }, [isAgent, updateTypingPresence]);

  const stopTyping = useCallback((_: string | undefined = undefined) => {
    if (!isAgent) return;
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
    void updateTypingPresence(false);
  }, [isAgent, updateTypingPresence]);

  const sendMessage = useCallback(
    async (conversationId: string, payload: SendMessagePayload) => {
      if (!isAgent || !user?.id) return;

      const attachments = (payload.attachments ?? []).map((attachment) => ({
        id: attachment.id,
        type: attachment.type,
        url: attachment.url,
        name: attachment.name ?? null,
        size: attachment.size ?? null,
        mime_type: attachment.mime_type ?? null,
        preview_url: attachment.preview_url ?? null,
        storage_path: attachment.storage_path ?? null,
        meta: attachment.meta ?? null,
      }));

      const trimmedContent = payload.content?.trim() ?? '';
      const hasContent = trimmedContent.length > 0;
      const hasAttachments = attachments.length > 0;

      if (!hasContent && !hasAttachments) {
        return;
      }

      const inferredType = () => {
        if (payload.messageType) return payload.messageType;
        if (!hasAttachments) return 'text';
        if (attachments.every((attachment) => attachment.type === 'image')) return 'image';
        if (attachments.every((attachment) => attachment.type === 'audio')) return 'audio';
        if (attachments.every((attachment) => attachment.type === 'video')) return 'video';
        return attachments[0]?.type ?? 'file';
      };

      const messageType = inferredType();
      const fallbackContent = () => {
        if (messageType === 'image') return '[Image]';
        if (messageType === 'video') return '[Video]';
        if (messageType === 'audio') return '[Audio]';
        if (messageType === 'file') return '[File]';
        return '[Attachment]';
      };

      const contentToSend = hasContent ? trimmedContent : fallbackContent();

      try {
        const { data, error } = await supabase
          .from('messages')
          .insert({
            application_id: conversationId,
            sender_id: user.id,
            body: contentToSend,
            message_type: messageType,
            attachments,
            read_by: [user.id],
          })
          .select(
            `
            id,
            application_id,
            sender_id,
            body,
            message_type,
            attachments,
            created_at,
            read_by,
            sender:profiles (
              id,
              full_name,
              avatar_url
            )
          `
          )
          .single();

        if (error) throw error;

        const formatted = mapMessageRow(data as MessageRow);
        const existingThread = messagesCacheRef.current[conversationId] ?? [];
        const nextThread = [...existingThread, formatted];
        messagesCacheRef.current[conversationId] = nextThread;

        if (currentConversationRef.current === conversationId) {
          setMessages(nextThread);
        }
        markThreadRead(conversationId, nextThread);

        setConversations((prev) =>
          prev
            .map((conversation) =>
              conversation.id === conversationId
                ? {
                    ...conversation,
                    lastMessage: formatted,
                    updated_at: formatted.created_at,
                    last_message_at: formatted.created_at,
                    unreadCount: 0,
                  }
                : conversation
            )
            .sort((a, b) => {
              const aTime = a.updated_at ? new Date(a.updated_at).getTime() : 0;
              const bTime = b.updated_at ? new Date(b.updated_at).getTime() : 0;
              return bTime - aTime;
            })
        );
      } catch (error) {
        console.error('Error sending agent message', error);
        toast({
          title: 'Error',
          description: 'Unable to send your message. Please try again.',
          variant: 'destructive',
        });
      }
    },
    [isAgent, markThreadRead, supabase, toast, user?.id]
  );

  const getOrCreateConversation = useCallback(
    async (conversationId: string) => {
      if (!isAgent) return null;
      const exists = conversationsRef.current.some((conversation) => conversation.id === conversationId);
      if (exists) {
        setCurrentConversation(conversationId);
        return conversationId;
      }
      return null;
    },
    [isAgent]
  );

  useEffect(() => {
    return () => {
      if (typingChannelRef.current) {
        supabase.removeChannel(typingChannelRef.current);
        typingChannelRef.current = null;
      }
      if (messagesChannelRef.current) {
        supabase.removeChannel(messagesChannelRef.current);
        messagesChannelRef.current = null;
      }
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => undefined);
        audioContextRef.current = null;
      }
    };
  }, [supabase]);

  return {
    enabled: isAgent,
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
  };
}

