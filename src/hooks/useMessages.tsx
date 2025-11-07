import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { PostgrestError, RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

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
  is_admin?: boolean | null;
  profile?: {
    id: string;
    full_name: string;
    avatar_url: string | null;
    role: string;
  };
}

export interface MessageReceipt {
  message_id: string;
  user_id: string;
  read_at: string;
  profile?: {
    id: string;
    full_name: string;
    avatar_url: string | null;
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
  receipts: MessageReceipt[];
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
  type: 'image' | 'file' | 'audio' | 'video' | string;
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

type RawMessage = {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  message_type: string | null;
  attachments: unknown;
  metadata: unknown;
  reply_to_id: string | null;
  edited_at: string | null;
  deleted_at: string | null;
  created_at: string;
  sender?: {
    id: string;
    full_name: string;
    avatar_url: string | null;
  } | null;
  receipts?: RawReceipt[] | null;
};

type RawReceipt = {
  message_id: string;
  user_id: string;
  read_at: string;
};

type RawParticipant = {
  id: string;
  conversation_id: string;
  user_id: string;
  joined_at: string | null;
  last_read_at: string;
  is_admin?: boolean | null;
  role?: string | null;
};

type RawConversation = {
  id: string;
  tenant_id: string;
  name?: string | null;
  title?: string | null;
  type?: string | null;
  is_group: boolean | null;
  avatar_url?: string | null;
  created_by?: string | null;
  created_at: string | null;
  updated_at: string | null;
  last_message_at?: string | null;
  metadata?: unknown;
  participants: RawParticipant[];
  lastMessage?: RawMessage[];
};

type RawTypingIndicator = {
  user_id: string;
  conversation_id: string;
  started_at: string | null;
  expires_at: string;
  profile?: {
    full_name: string;
  } | null;
};

type DirectConversationCandidate = {
  conversation_id: string;
  conversation: {
    is_group: boolean | null;
  } | null;
};

type SupabaseError =
  | PostgrestError
  | Error
  | { message?: string; details?: string | null; hint?: string | null }
  | null;

const createAttachmentId = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
};

const normalizeAttachment = (attachment: unknown): MessageAttachment | null => {
  if (!attachment || typeof attachment !== 'object') {
    return null;
  }

  const record = attachment as Record<string, any>;
  const url = typeof record.url === 'string' ? record.url : null;
  if (!url) {
    return null;
  }

  const inferredType = () => {
    if (typeof record.type === 'string') return record.type;
    if (typeof record.mime_type === 'string') {
      if (record.mime_type.startsWith('image/')) return 'image';
      if (record.mime_type.startsWith('audio/')) return 'audio';
      if (record.mime_type.startsWith('video/')) return 'video';
      return 'file';
    }
    if (typeof record.mimeType === 'string') {
      if (record.mimeType.startsWith('image/')) return 'image';
      if (record.mimeType.startsWith('audio/')) return 'audio';
      if (record.mimeType.startsWith('video/')) return 'video';
      return 'file';
    }
    return 'file';
  };

  const sizeValue = () => {
    if (typeof record.size === 'number') return record.size;
    if (typeof record.file_size === 'number') return record.file_size;
    if (typeof record.fileSize === 'number') return record.fileSize;
    if (typeof record.size === 'string') {
      const parsed = Number(record.size);
      return Number.isNaN(parsed) ? null : parsed;
    }
    return null;
  };

  return {
    id: typeof record.id === 'string' && record.id ? record.id : createAttachmentId(),
    type: inferredType(),
    url,
    name:
      typeof record.name === 'string'
        ? record.name
        : typeof record.file_name === 'string'
          ? record.file_name
          : typeof record.fileName === 'string'
            ? record.fileName
            : null,
    size: sizeValue(),
    mime_type:
      typeof record.mime_type === 'string'
        ? record.mime_type
        : typeof record.mimeType === 'string'
          ? record.mimeType
          : null,
    preview_url:
      typeof record.preview_url === 'string'
        ? record.preview_url
        : typeof record.previewUrl === 'string'
          ? record.previewUrl
          : url,
    storage_path:
      typeof record.storage_path === 'string'
        ? record.storage_path
        : typeof record.storagePath === 'string'
          ? record.storagePath
          : typeof record.meta === 'object' && record.meta && typeof record.meta.storagePath === 'string'
            ? (record.meta.storagePath as string)
            : null,
    duration_ms:
      typeof record.duration_ms === 'number'
        ? record.duration_ms
        : typeof record.durationMs === 'number'
          ? record.durationMs
          : typeof record.meta === 'object' && record.meta && typeof record.meta.durationMs === 'number'
            ? (record.meta.durationMs as number)
            : null,
    meta: (record.meta as Record<string, unknown> | null | undefined) ?? record.metadata ?? null,
  };
};

const parseAttachments = (attachments: unknown): MessageAttachment[] => {
  if (!attachments) return [];

  let parsed: unknown = attachments;

  if (typeof attachments === 'string') {
    try {
      parsed = JSON.parse(attachments);
    } catch (error) {
      console.warn('Failed to parse attachments payload', error);
      return [];
    }
  }

  if (!Array.isArray(parsed)) {
    return [];
  }

  return parsed
    .map(normalizeAttachment)
    .filter((attachment): attachment is MessageAttachment => Boolean(attachment && attachment.url));
};

const parseMetadata = (metadata: unknown): Record<string, unknown> | null => {
  if (!metadata || typeof metadata !== 'object') {
    if (typeof metadata === 'string') {
      try {
        const parsed = JSON.parse(metadata);
        return typeof parsed === 'object' && parsed ? (parsed as Record<string, unknown>) : null;
      } catch {
        return null;
      }
    }
    return null;
  }

  if (metadata instanceof Date) {
    return { timestamp: metadata.toISOString() };
  }

  return metadata as Record<string, unknown>;
};

const getErrorMessage = (error: SupabaseError) => {
  if (!error) return '';

  if (error instanceof Error) {
    return error.message || '';
  }

  if (error && typeof error === 'object' && 'message' in error) {
    return (error.message as string) || '';
  }

  return '';
};

const getErrorDetails = (error: SupabaseError) => {
  if (!error || error instanceof Error) return '';

  if (error && typeof error === 'object' && 'details' in error) {
    return (error.details as string | null) || '';
  }

  return '';
};

const getErrorHint = (error: SupabaseError) => {
  if (!error || error instanceof Error) return '';

  if (error && typeof error === 'object' && 'hint' in error) {
    return (error.hint as string | null) || '';
  }

  return '';
};

const getErrorSummary = (error: SupabaseError) => {
  const parts = [getErrorMessage(error), getErrorDetails(error), getErrorHint(error)]
    .map((part) => (typeof part === 'string' ? part.trim() : ''))
    .filter(Boolean);
  return parts.join(' ').toLowerCase();
};

const isMissingColumnError = (error: SupabaseError, columnName: string) => {
  if (!error) return false;
  const summary = getErrorSummary(error);
  if (!summary) return false;

  const normalized = columnName.toLowerCase();
  return (
    summary.includes(`column "${normalized}"`) ||
    summary.includes(`column ${normalized}`) ||
    summary.includes(`"${normalized}" does not exist`) ||
    summary.includes(`${normalized} does not exist`)
  );
};

const isMissingRelationError = (error: SupabaseError, relationName: string) => {
  if (!error) return false;
  const summary = getErrorSummary(error);
  if (!summary) return false;

  const normalized = relationName.toLowerCase();
  return (
    summary.includes(`relation "${normalized}"`) ||
    summary.includes(`relation ${normalized}`) ||
    summary.includes(`"${normalized}" does not exist`) ||
    summary.includes(`${normalized} does not exist`)
  );
};

const isMissingRpcFunctionError = (error: SupabaseError) => {
  const message = `${getErrorMessage(error)} ${getErrorDetails(error)}`.toLowerCase();

  if (!message) return false;

  return (
    message.includes('no matches were found in the schema cache') ||
    message.includes('function get_or_create_conversation') ||
    message.includes('function public.get_or_create_conversation')
  );
};

const getErrorDescription = (error: SupabaseError, fallback: string) => {
  if (!error) return fallback;

  if (error instanceof Error) {
    return error.message || fallback;
  }

  const supabaseError = error as PostgrestError | { message?: string; details?: string | null; hint?: string | null };
  if (supabaseError && typeof supabaseError === 'object' && 'message' in supabaseError && supabaseError.message) {
    const { message, details, hint } = supabaseError;
    if (details) return details;
    if (hint) return `${message} (${hint})`;
    return message;
  }

  return fallback;
};

export function useMessages() {
  const { user, profile } = useAuth();
    const isAgent = profile?.role === 'agent';
    const isStudent = profile?.role === 'student';
    const { toast } = useToast();
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [currentConversation, setCurrentConversation] = useState<string | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [typingUsers, setTypingUsers] = useState<TypingIndicator[]>([]);
    const [loading, setLoading] = useState(false);

  const conversationsChannelRef = useRef<RealtimeChannel | null>(null);
  const messagesChannelRef = useRef<RealtimeChannel | null>(null);
  const typingChannelRef = useRef<RealtimeChannel | null>(null);
  const messageReceiptsChannelRef = useRef<RealtimeChannel | null>(null);
  const initialConversationIdRef = useRef<string | null>(
    typeof window !== 'undefined' ? localStorage.getItem('messages:lastConversation') : null
  );
  const conversationsRef = useRef<Conversation[]>([]);

    const conversationIdsKey = useMemo(() => {
      return conversations.map(conv => conv.id).sort().join(',');
    }, [conversations]);

    useEffect(() => {
      if (typeof window === 'undefined') {
        return;
      }

      if (user?.id) {
        if (!initialConversationIdRef.current) {
          initialConversationIdRef.current = localStorage.getItem('messages:lastConversation');
        }
      } else {
        initialConversationIdRef.current = localStorage.getItem('messages:lastConversation');
      }
    }, [user?.id]);

const transformMessage = useCallback((message: RawMessage): Message => {
  const receipts: MessageReceipt[] = (message.receipts || [])
    .filter((receipt): receipt is RawReceipt => Boolean(receipt && receipt.user_id))
    .map((receipt) => ({
      message_id: receipt.message_id || message.id,
      user_id: receipt.user_id,
      read_at: receipt.read_at,
    }))
    .sort((a, b) => new Date(a.read_at).getTime() - new Date(b.read_at).getTime());

  return {
    id: message.id,
    conversation_id: message.conversation_id,
    sender_id: message.sender_id,
    content: message.content,
    message_type: message.message_type,
    attachments: parseAttachments(message.attachments),
    metadata: parseMetadata(message.metadata),
    reply_to_id: message.reply_to_id,
    edited_at: message.edited_at,
    deleted_at: message.deleted_at,
    created_at: message.created_at,
    receipts,
    sender: message.sender
      ? {
          id: message.sender.id,
          full_name: message.sender.full_name,
          avatar_url: message.sender.avatar_url,
        }
      : undefined,
  };
}, []);

const markConversationAsRead = useCallback(async (conversationId: string) => {
  if (!user?.id) return;

  const nowIso = new Date().toISOString();

  try {
    const { error } = await supabase.rpc('mark_conversation_read', {
      p_conversation_id: conversationId,
    });

    if (error) throw error;

    setConversations(prev =>
      prev.map(conv =>
        conv.id === conversationId
          ? {
              ...conv,
              unreadCount: 0,
              participants: (conv.participants || []).map(participant =>
                participant.user_id === user.id
                  ? { ...participant, last_read_at: nowIso }
                  : participant
              ),
            }
          : conv
      )
    );

    const currentConversation = conversationsRef.current.find((conv) => conv.id === conversationId);
    const currentProfile = currentConversation?.participants?.find((participant) => participant.user_id === user.id)?.profile;

    setMessages((prev) =>
      prev.map((message) => {
        if (message.conversation_id !== conversationId) return message;
        if (message.receipts.some((receipt) => receipt.user_id === user.id)) {
          return message;
        }
        return {
          ...message,
          receipts: [
            ...message.receipts,
            {
              message_id: message.id,
              user_id: user.id,
              read_at: nowIso,
              profile: currentProfile,
            },
          ],
        };
      })
    );
    } catch (error) {
      console.error('Error marking message thread as read:', error);
  }
}, [supabase, user?.id]);

  const fetchTypingIndicators = useCallback(async (conversationId: string) => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from('typing_indicators')
        .select('user_id, conversation_id, started_at, expires_at')
        .eq('conversation_id', conversationId)
        .gt('expires_at', new Date().toISOString());

      if (error) throw error;

      // Fetch profiles separately
      const userIds = (data || [])
        .map((indicator: any) => indicator.user_id)
        .filter((id: string | null | undefined): id is string => Boolean(id));

      let profilesMap = new Map<string, { id: string; full_name: string }>();

      if (userIds.length > 0) {
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('id, full_name')
          .in('id', userIds);

        if (profilesError) {
          console.error('Error fetching typing indicator profiles:', profilesError);
        } else {
          profilesMap = new Map(
            (profilesData || []).map((p: any) => [p.id, p])
          );
        }
      }

      const formatted: TypingIndicator[] = (data || [])
        .filter((indicator: any) => indicator.user_id !== user.id)
        .map((indicator: any) => ({
          user_id: indicator.user_id,
          conversation_id: indicator.conversation_id,
          started_at: indicator.started_at,
          expires_at: indicator.expires_at,
          profile: profilesMap.get(indicator.user_id)
            ? {
              full_name: profilesMap.get(indicator.user_id)!.full_name,
            }
          : undefined,
        }));

      setTypingUsers(formatted);
    } catch (error) {
      console.error('Error fetching typing indicators:', error);
    }
  }, [user?.id]);

  const fetchMessages = useCallback(async (conversationId: string) => {
    if (!user?.id) return;

    try {
      setLoading(true);

    const fullMessageSelect =
      'id, conversation_id, sender_id, content, message_type, attachments, metadata, reply_to_id, edited_at, deleted_at, created_at';
    const fallbackWithoutMetadata =
      'id, conversation_id, sender_id, content, message_type, attachments, created_at';
    const fallbackMinimal =
      'id, conversation_id, sender_id, content, message_type, created_at';

    const buildBaseQuery = (selectColumns: string) =>
      supabase
        .from('conversation_messages')
        .select(selectColumns)
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

    let { data, error } = await buildBaseQuery(fullMessageSelect);

    if (error) {
      if (
        isMissingColumnError(error, 'metadata') ||
        isMissingColumnError(error, 'reply_to_id') ||
        isMissingColumnError(error, 'edited_at') ||
        isMissingColumnError(error, 'deleted_at')
      ) {
        const fallbackResult = await buildBaseQuery(fallbackWithoutMetadata);
        data = fallbackResult.data;
        error = fallbackResult.error;
      }
    }

    if (error && isMissingColumnError(error, 'attachments')) {
      const fallbackResult = await buildBaseQuery(fallbackMinimal);
      data = fallbackResult.data;
      error = fallbackResult.error;
    }

    if (error) throw error;

    const messageRows = (data || []) as Partial<RawMessage>[];
    const messageIds = messageRows
      .map((msg) => msg?.id)
      .filter((id): id is string => Boolean(id));
    const senderIds = new Set<string>();

    messageRows.forEach((msg) => {
      if (msg?.sender_id) senderIds.add(msg.sender_id);
    });

    // Fetch receipts for the messages in this conversation
    let receiptsByMessage = new Map<string, RawReceipt[]>();
    if (messageIds.length > 0) {
      const { data: receiptsData, error: receiptsError } = await supabase
        .from('message_receipts')
        .select('message_id, user_id, read_at')
        .in('message_id', messageIds);

      if (receiptsError) {
        if (!isMissingRelationError(receiptsError, 'message_receipts')) {
          console.error('Error fetching message receipts:', receiptsError);
        }
      } else if (receiptsData) {
        receiptsByMessage =
          receiptsData.reduce((map, receipt) => {
            const arr = map.get(receipt.message_id) || [];
            arr.push(receipt as RawReceipt);
            map.set(receipt.message_id, arr);
            senderIds.add(receipt.user_id);
            return map;
          }, new Map<string, RawReceipt[]>()) ?? new Map();
      }
    }

    // Fetch profiles for senders and recipients (for receipts)
    const uniqueUserIds = Array.from(senderIds).filter(Boolean);
    let profilesMap = new Map<string, { id: string; full_name: string; avatar_url: string | null }>();

    if (uniqueUserIds.length > 0) {
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url')
        .in('id', uniqueUserIds);

      if (profilesError) {
        console.error('Error fetching message profiles:', profilesError);
      } else if (profilesData) {
        profilesMap = new Map(
          (profilesData || []).map((p: any) => [p.id, p])
        );
      }
    }

    const formatted = messageRows
      .map((rawMessage) => {
        if (!rawMessage?.id || !rawMessage.conversation_id || !rawMessage.sender_id || !rawMessage.created_at) {
          return null;
        }

        const senderProfile = profilesMap.get(rawMessage.sender_id);
        const messageWithRelations: RawMessage = {
          id: rawMessage.id,
          conversation_id: rawMessage.conversation_id,
          sender_id: rawMessage.sender_id,
          content: rawMessage.content ?? '',
          message_type: rawMessage.message_type ?? null,
          attachments: rawMessage.attachments ?? [],
          metadata: rawMessage.metadata ?? null,
          reply_to_id: rawMessage.reply_to_id ?? null,
          edited_at: rawMessage.edited_at ?? null,
          deleted_at: rawMessage.deleted_at ?? null,
          created_at: rawMessage.created_at,
          sender: senderProfile
            ? {
                id: senderProfile.id,
                full_name: senderProfile.full_name,
                avatar_url: senderProfile.avatar_url,
              }
            : {
                id: rawMessage.sender_id,
                full_name: 'Unknown User',
                avatar_url: null,
              },
          receipts: receiptsByMessage.get(rawMessage.id) || [],
        };

        return transformMessage(messageWithRelations);
      })
      .filter((message): message is Message => Boolean(message));

    // Enhance receipts with profile data now that messages are transformed
    const messagesWithReceiptProfiles = formatted.map((message) => ({
      ...message,
      receipts: message.receipts.map((receipt) => ({
        ...receipt,
        profile: profilesMap.get(receipt.user_id) || receipt.profile,
      })),
    }));

    setMessages(messagesWithReceiptProfiles);
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast({
        title: 'Error',
        description: 'Failed to load messages',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [supabase, transformMessage, toast, user?.id]);

    const fetchConversations = useCallback(async () => {
      if (!user?.id) {
        setConversations([]);
        return;
      }

      try {
        const { data: userParticipations, error: partError } = await supabase
          .from('conversation_participants')
          .select('conversation_id')
          .eq('user_id', user.id);

        if (partError) throw partError;

        const conversationIds = (userParticipations || [])
          .map((record) => record?.conversation_id)
          .filter((id): id is string => Boolean(id));

        if (conversationIds.length === 0) {
          setConversations([]);
          return;
        }

        const baseConversationSelect =
          'id, tenant_id, title, type, is_group, avatar_url, created_by, metadata, created_at, updated_at, last_message_at';
        const fallbackConversationSelect =
          'id, tenant_id, title, type, is_group, avatar_url, created_at, updated_at';

        const runConversationQuery = async (
          selectString: string,
          includeLastMessageOrder: boolean
        ) => {
          let query = supabase
            .from('conversations')
            .select(selectString)
            .in('id', conversationIds);

          if (includeLastMessageOrder) {
            query = query.order('last_message_at', { ascending: false, nullsLast: true });
          }

          return query.order('updated_at', { ascending: false, nullsLast: true });
        };

        let { data: conversationRows, error: convError } = await runConversationQuery(
          baseConversationSelect,
          true
        );

        if (convError) {
          if (isMissingColumnError(convError, 'last_message_at')) {
            ({ data: conversationRows, error: convError } = await runConversationQuery(
              baseConversationSelect,
              false
            ));
          }
        }

        if (convError && isMissingColumnError(convError, 'updated_at')) {
          ({ data: conversationRows, error: convError } = await supabase
            .from('conversations')
            .select(baseConversationSelect)
            .in('id', conversationIds)
            .order('created_at', { ascending: false, nullsLast: true }));
        }

        if (
          convError &&
          (isMissingColumnError(convError, 'metadata') ||
            isMissingColumnError(convError, 'avatar_url') ||
            isMissingColumnError(convError, 'title') ||
            isMissingColumnError(convError, 'type'))
        ) {
          ({ data: conversationRows, error: convError } = await runConversationQuery(
            fallbackConversationSelect,
            false
          ));
        }

        if (convError) throw convError;

        const sanitizedConversations = (conversationRows || []).map((row: any) => ({
          id: row.id as string,
          tenant_id: row.tenant_id as string,
          title: typeof row.title === 'string' ? row.title : null,
          type: typeof row.type === 'string' ? row.type : null,
          is_group: typeof row.is_group === 'boolean' ? row.is_group : Boolean(row.is_group),
          avatar_url: typeof row.avatar_url === 'string' ? row.avatar_url : null,
          created_by: typeof row.created_by === 'string' ? row.created_by : null,
          created_at: row.created_at ?? null,
          updated_at: row.updated_at ?? row.created_at ?? null,
          last_message_at: row.last_message_at ?? null,
          metadata: row.metadata ?? null,
          participants: [],
          lastMessage: [],
        })) as RawConversation[];

        const baseParticipantSelect =
          'id, conversation_id, user_id, joined_at, last_read_at, is_admin, role';
        const fallbackParticipantSelect =
          'id, conversation_id, user_id, joined_at, is_admin';

        let { data: participantRows, error: participantsError } = await supabase
          .from('conversation_participants')
          .select(baseParticipantSelect)
          .in('conversation_id', conversationIds);

        if (
          participantsError &&
          (isMissingColumnError(participantsError, 'last_read_at') ||
            isMissingColumnError(participantsError, 'role'))
        ) {
          const fallbackResult = await supabase
            .from('conversation_participants')
            .select(fallbackParticipantSelect)
            .in('conversation_id', conversationIds);
          participantRows = fallbackResult.data;
          participantsError = fallbackResult.error;
        }

        if (participantsError) throw participantsError;

        const baseMessageSelect =
          'id, conversation_id, sender_id, content, message_type, attachments, metadata, reply_to_id, edited_at, deleted_at, created_at';
        const fallbackMessageSelect =
          'id, conversation_id, sender_id, content, message_type, attachments, created_at';
        const minimalMessageSelect =
          'id, conversation_id, sender_id, content, message_type, created_at';

        const runLastMessageQuery = async (selectString: string) =>
          supabase
            .from('conversation_messages')
            .select(selectString)
            .in('conversation_id', conversationIds)
            .order('created_at', { ascending: false });

        let { data: lastMessageRows, error: lastMessageError } = await runLastMessageQuery(
          baseMessageSelect
        );

        if (lastMessageError) {
          if (
            isMissingColumnError(lastMessageError, 'metadata') ||
            isMissingColumnError(lastMessageError, 'reply_to_id') ||
            isMissingColumnError(lastMessageError, 'edited_at') ||
            isMissingColumnError(lastMessageError, 'deleted_at')
          ) {
            const fallbackResult = await runLastMessageQuery(fallbackMessageSelect);
            lastMessageRows = fallbackResult.data;
            lastMessageError = fallbackResult.error;
          }
        }

        if (lastMessageError && isMissingColumnError(lastMessageError, 'attachments')) {
          const fallbackResult = await runLastMessageQuery(minimalMessageSelect);
          lastMessageRows = fallbackResult.data;
          lastMessageError = fallbackResult.error;
        }

        if (lastMessageError) throw lastMessageError;

        const lastMessageMap = new Map<string, RawMessage>();
        lastMessageRows?.forEach((row: any) => {
          if (!row?.conversation_id || lastMessageMap.has(row.conversation_id)) {
            return;
          }

          if (!row.id || !row.sender_id || !row.created_at) {
            return;
          }

          lastMessageMap.set(row.conversation_id, {
            id: row.id,
            conversation_id: row.conversation_id,
            sender_id: row.sender_id,
            content: row.content ?? '',
            message_type: row.message_type ?? null,
            attachments: row.attachments ?? [],
            metadata: row.metadata ?? null,
            reply_to_id: row.reply_to_id ?? null,
            edited_at: row.edited_at ?? null,
            deleted_at: row.deleted_at ?? null,
            created_at: row.created_at,
          });
        });

        const typedData = sanitizedConversations.map((conversation) => ({
          ...conversation,
          participants: (participantRows || []).filter(
            (participant: any) => participant?.conversation_id === conversation.id
          ),
          lastMessage: lastMessageMap.has(conversation.id)
            ? [lastMessageMap.get(conversation.id) as RawMessage]
            : [],
        })) as unknown as RawConversation[];

        const participantIds = new Set<string>();
        typedData.forEach((conversation) => {
          (conversation.participants || []).forEach((participant) => {
            if (participant?.user_id) {
              participantIds.add(participant.user_id);
            }
          });

          const rawLastMessage = conversation.lastMessage?.[0];
          if (rawLastMessage?.sender_id) {
            participantIds.add(rawLastMessage.sender_id);
          }
        });

        let profilesMap = new Map<
          string,
          { id: string; full_name: string; avatar_url: string | null; role?: string | null }
        >();
        if (participantIds.size > 0) {
          const ids = Array.from(participantIds);
          const { data: profilesData, error: profilesError } = await supabase
            .from('profiles')
            .select('id, full_name, avatar_url, role')
            .in('id', ids);

          if (profilesError) {
            console.error('Error fetching participant profiles:', profilesError);
          } else if (profilesData) {
            profilesMap = new Map(
              profilesData.map((profile: any) => [
                profile.id,
                {
                  id: profile.id,
                  full_name: profile.full_name,
                  avatar_url: profile.avatar_url ?? null,
                  role: profile.role ?? null,
                },
              ])
            );
          }
        }

        const formatted = typedData.map((conversation) => {
          const participants: ConversationParticipant[] = (conversation.participants || []).map(
            (participant) => {
              const profileRecord = profilesMap.get(participant.user_id);
              return {
                id: participant.id,
                conversation_id: participant.conversation_id,
                user_id: participant.user_id,
                joined_at: participant.joined_at,
                last_read_at:
                  participant.last_read_at ??
                  participant.joined_at ??
                  new Date().toISOString(),
                is_admin: participant.is_admin,
                role: participant.role ?? profileRecord?.role ?? 'member',
                profile: profileRecord
                  ? {
                      id: profileRecord.id,
                      full_name: profileRecord.full_name,
                      avatar_url: profileRecord.avatar_url,
                      role: profileRecord.role ?? 'student',
                    }
                  : undefined,
              };
            }
          );

          const rawLastMessage = conversation.lastMessage?.[0];
          let lastMessage: Message | undefined;
          if (rawLastMessage) {
            const senderProfile = profilesMap.get(rawLastMessage.sender_id);
            const messageWithProfile = {
              ...rawLastMessage,
              metadata: rawLastMessage.metadata ?? null,
              sender: senderProfile
                ? {
                    id: senderProfile.id,
                    full_name: senderProfile.full_name,
                    avatar_url: senderProfile.avatar_url,
                  }
                : undefined,
            };
            lastMessage = transformMessage(messageWithProfile as RawMessage);
          }

          const updatedAtCandidate = conversation.last_message_at ?? conversation.updated_at;

          const isGroup = Boolean(conversation.is_group);
          const otherParticipant = !isGroup
            ? participants.find((participant) => participant.user_id !== user?.id)
            : undefined;

          const displayName =
            conversation.title ??
            (isGroup
              ? 'Group Message'
              : otherParticipant?.profile?.full_name ?? 'Direct Message');

          const displayAvatar = isGroup
            ? conversation.avatar_url ?? null
            : otherParticipant?.profile?.avatar_url ?? conversation.avatar_url ?? null;

          return {
            id: conversation.id,
            tenant_id: conversation.tenant_id,
            title: conversation.title ?? null,
            type: conversation.type ?? (isGroup ? 'group' : 'direct'),
            is_group: conversation.is_group,
            created_at: conversation.created_at,
            updated_at: updatedAtCandidate,
            last_message_at: conversation.last_message_at,
            participants,
            lastMessage,
            unreadCount: 0,
            name: displayName,
            avatar_url: displayAvatar,
            metadata: parseMetadata(conversation.metadata),
          } as Conversation;
        });

        const unreadCounts = await Promise.all(
          formatted.map(async (conversation) => {
            try {
              const { data: unreadData, error: unreadError } = await supabase.rpc(
                'get_unread_count',
                {
                  p_user_id: user.id,
                  p_conversation_id: conversation.id,
                }
              );

              if (unreadError) throw unreadError;
              return (unreadData as number | null) ?? 0;
            } catch (rpcError) {
              console.error('Error fetching unread count:', rpcError);
              return 0;
            }
          })
        );

        const withUnread = formatted.map((conversation, index) => ({
          ...conversation,
          unreadCount: unreadCounts[index] ?? 0,
        }));

        withUnread.sort((a, b) => {
          const aTime = a.updated_at ? new Date(a.updated_at).getTime() : 0;
          const bTime = b.updated_at ? new Date(b.updated_at).getTime() : 0;
          return bTime - aTime;
        });

        setConversations(withUnread);
      } catch (error) {
        console.error('Error loading messages list:', error);
        toast({
          title: 'Error',
          description: 'Failed to load messages',
          variant: 'destructive',
        });
      }
    }, [supabase, toast, transformMessage, user?.id]);

    const sendMessage = useCallback(async (conversationId: string, payload: SendMessagePayload) => {
      if (!user?.id) return;

      const attachments = (payload.attachments ?? []).map((attachment) => ({
        ...attachment,
      id: attachment.id ?? createAttachmentId(),
      }));

      const trimmedContent = payload.content?.trim() ?? '';
      const hasContent = trimmedContent.length > 0;
      const hasAttachments = attachments.length > 0;

      if (!hasContent && !hasAttachments) {
        return;
      }

      const inferredMessageType = () => {
        if (payload.messageType) return payload.messageType;
        if (hasAttachments) {
          const firstType = attachments[0]?.type;
          if (attachments.every((attachment) => attachment.type === 'image')) {
            return 'image';
          }
          return firstType || 'file';
        }
        return 'text';
      };

      const messageType = inferredMessageType();

      const fallbackContent = () => {
        if (messageType === 'image') return '[Image]';
        if (messageType === 'video') return '[Video]';
        if (messageType === 'audio') return '[Audio]';
      if (messageType === 'file') return '[File]';
        return '[Attachment]';
      };

      const contentToSend = hasContent ? trimmedContent : fallbackContent();

      try {
      const serializedAttachments = attachments.map((attachment) => ({
        id: attachment.id,
        type: attachment.type,
        url: attachment.url,
        name: attachment.name ?? null,
        size: attachment.size ?? null,
        mime_type: attachment.mime_type ?? null,
        preview_url: attachment.preview_url ?? null,
        storage_path: attachment.storage_path ?? null,
        duration_ms: attachment.duration_ms ?? null,
        meta: attachment.meta ?? null,
      }));

        const { data, error } = await supabase
          .from('conversation_messages')
          .insert([{
            conversation_id: conversationId,
            sender_id: user.id,
            content: contentToSend,
            message_type: messageType,
          attachments: serializedAttachments as any,
          metadata: payload.metadata ?? null,
          }])
          .select(`
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
          `)
          .single();

        if (error) throw error;

        const { data: profileData } = await supabase
          .from('profiles')
          .select('id, full_name, avatar_url')
          .eq('id', user.id)
          .single();

        const messageWithProfile = {
          ...data,
          sender: profileData || {
            id: user.id,
            full_name: 'Unknown User',
            avatar_url: null,
          },
          receipts: [{ message_id: data.id, user_id: user.id, read_at: data.created_at }],
        };

        const formatted = transformMessage(messageWithProfile as RawMessage);
        const formattedWithProfile: Message = {
          ...formatted,
          receipts: formatted.receipts.map((receipt) => ({
            ...receipt,
            profile: receipt.user_id === user.id
              ? {
                  id: user.id,
                  full_name: profileData?.full_name ?? user.email ?? 'You',
                  avatar_url: profileData?.avatar_url ?? null,
                }
              : receipt.profile,
          })),
        };

        if (currentConversation === conversationId) {
          setMessages((prev) => [...prev, formattedWithProfile]);
        }

        setConversations((prev) =>
          prev
            .map((conv) =>
              conv.id === conversationId
                ? {
                    ...conv,
                    lastMessage: formattedWithProfile,
                    unreadCount: 0,
                    updated_at: formattedWithProfile.created_at,
                    last_message_at: formattedWithProfile.created_at,
                  }
                : conv
            )
            .sort((a, b) => {
              const aTime = a.updated_at ? new Date(a.updated_at).getTime() : 0;
              const bTime = b.updated_at ? new Date(b.updated_at).getTime() : 0;
              return bTime - aTime;
            })
        );
      } catch (error) {
        console.error('Error sending message:', error);
        toast({
          title: 'Error',
          description: 'Failed to send message',
          variant: 'destructive',
        });
      }
  }, [currentConversation, supabase, transformMessage, toast, user?.id]);

  const startTyping = useCallback(async (conversationId: string) => {
    if (!user?.id) return;

    try {
      const expiresAt = new Date(Date.now() + 5000).toISOString();
      await supabase
        .from('typing_indicators')
        .upsert({
          conversation_id: conversationId,
          user_id: user.id,
          started_at: new Date().toISOString(),
          expires_at: expiresAt,
        });
    } catch (error) {
      console.error('Error starting typing indicator:', error);
    }
  }, [user?.id]);

  const stopTyping = useCallback(async (conversationId: string) => {
    if (!user?.id) return;

    try {
      await supabase
        .from('typing_indicators')
        .delete()
        .eq('conversation_id', conversationId)
        .eq('user_id', user.id);
    } catch (error) {
      console.error('Error stopping typing indicator:', error);
    }
  }, [user?.id]);

  const createConversationFallback = useCallback(
    async (otherUserId: string) => {
      if (!user?.id || !profile?.tenant_id) {
        return null;
      }

        try {
          if (isAgent) {
            const { data: targetStudent, error: targetStudentError } = await supabase
              .from('students')
              .select('id')
              .eq('profile_id', otherUserId)
              .maybeSingle();

            if (targetStudentError) throw targetStudentError;

            if (targetStudent) {
              const { data: link, error: linkError } = await supabase
                .from('agent_student_links')
                .select('student_id')
                .eq('agent_profile_id', user.id)
                .eq('student_id', targetStudent.id)
                .maybeSingle();

              if (linkError) throw linkError;

              if (!link) {
                throw new Error('You can only message students assigned to you.');
              }
            }
          } else if (isStudent) {
            const { data: currentStudent, error: currentStudentError } = await supabase
              .from('students')
              .select('id')
              .eq('profile_id', user.id)
              .maybeSingle();

            if (currentStudentError) throw currentStudentError;

            if (currentStudent) {
              const { data: link, error: linkError } = await supabase
                .from('agent_student_links')
                .select('student_id')
                .eq('agent_profile_id', otherUserId)
                .eq('student_id', currentStudent.id)
                .maybeSingle();

              if (linkError) throw linkError;

              if (!link) {
                throw new Error('You can only message your assigned agent.');
              }
            }
          }

          const { data: candidates, error: candidatesError } = await supabase
            .from('conversation_participants')
            .select('conversation_id, conversation:conversations ( is_group )')
            .eq('user_id', user.id);

          if (candidatesError) throw candidatesError;

        const directConversationIds = ((candidates || []) as DirectConversationCandidate[])
          .filter(candidate => candidate.conversation?.is_group === false)
          .map(candidate => candidate.conversation_id)
          .filter(Boolean) as string[];

        if (directConversationIds.length > 0) {
          const { data: shared, error: sharedError } = await supabase
            .from('conversation_participants')
            .select('conversation_id')
            .in('conversation_id', directConversationIds)
            .eq('user_id', otherUserId)
            .limit(1);

          if (sharedError) throw sharedError;

          const sharedData = (shared || []) as { conversation_id?: string }[];
          const existingConversationId = sharedData[0]?.conversation_id;
          if (existingConversationId) {
            return existingConversationId;
          }
        }

          const { data: conversation, error: conversationError } = await supabase
            .from('conversations')
            .insert({
              tenant_id: profile.tenant_id,
              is_group: false,
              type: 'direct',
            })
          .select('id')
          .single();

        if (conversationError) throw conversationError;

        const conversationId = conversation?.id as string | undefined;
        if (!conversationId) {
          throw new Error('Failed to create message thread');
        }

        const { error: participantsError } = await supabase
          .from('conversation_participants')
          .insert([
            {
              conversation_id: conversationId,
              user_id: user.id,
              is_admin: true,
            },
            {
              conversation_id: conversationId,
              user_id: otherUserId,
            },
          ]);

        if (participantsError) throw participantsError;

        return conversationId;
      } catch (fallbackError) {
        console.error('Fallback message thread creation failed:', fallbackError);
        throw fallbackError;
      }
    },
      [isAgent, isStudent, profile?.tenant_id, user?.id]
  );

  const getOrCreateConversation = useCallback(
    async (otherUserId: string) => {
      if (!user?.id || !profile?.tenant_id) {
          toast({
            title: 'Unable to start messaging',
          description: 'Please try again after signing in.',
          variant: 'destructive',
        });
        return null;
      }

      try {
        const { data, error } = await supabase.rpc('get_or_create_conversation', {
          p_user_id: user.id,
          p_other_user_id: otherUserId,
          p_tenant_id: profile.tenant_id,
        });

        if (error) {
          if (isMissingRpcFunctionError(error)) {
              console.warn(
                'get_or_create_conversation RPC not available. Falling back to client-side message thread creation.'
              );
            const conversationId = await createConversationFallback(otherUserId);
            if (conversationId) {
              await fetchConversations();
              return conversationId;
            }
          }

          throw error;
        }

        if (data) {
          await fetchConversations();
          return data as string;
        }
        } catch (error) {
          console.error('Error getting or creating message thread:', error);

          const fallbackMessage = isMissingRpcFunctionError(error as SupabaseError)
            ? 'Messaging is almost ready. Please ensure the latest database migrations have been applied.'
            : 'An unexpected error occurred while starting the message.';

        const description = getErrorDescription(error as SupabaseError, fallbackMessage);
          toast({
            title: 'Unable to start messaging',
          description,
          variant: 'destructive',
        });
      }

      return null;
    },
    [
      createConversationFallback,
      fetchConversations,
      profile?.tenant_id,
      toast,
      user?.id,
    ]
  );

    useEffect(() => {
      if (!user?.id) {
        setConversations([]);
        setMessages([]);
        setTypingUsers([]);
        setCurrentConversation(null);
        return;
      }

      fetchConversations();
    }, [fetchConversations, user?.id]);

  useEffect(() => {
    conversationsRef.current = conversations;
  }, [conversations]);


    useEffect(() => {
      if (!user?.id || conversations.length === 0) {
        return;
      }

      if (initialConversationIdRef.current) {
        const savedId = initialConversationIdRef.current;
        if (conversations.some((conversation) => conversation.id === savedId)) {
          setCurrentConversation((prev) => prev ?? savedId);
          initialConversationIdRef.current = null;
          return;
        }
        initialConversationIdRef.current = null;
      }

      setCurrentConversation((prev) => prev ?? conversations[0]?.id ?? null);
    }, [conversations, setCurrentConversation, user?.id]);

    useEffect(() => {
      if (typeof window === 'undefined') {
        return;
      }

      if (currentConversation) {
        localStorage.setItem('messages:lastConversation', currentConversation);
      } else if (user?.id) {
        localStorage.removeItem('messages:lastConversation');
      }
    }, [currentConversation, user?.id]);

  useEffect(() => {
    if (!currentConversation) {
      setMessages([]);
      setTypingUsers([]);
      return;
    }

    fetchMessages(currentConversation);
    fetchTypingIndicators(currentConversation);
    markConversationAsRead(currentConversation);
  }, [currentConversation, fetchMessages, fetchTypingIndicators, markConversationAsRead]);

  useEffect(() => {
    if (!user?.id) {
      if (messageReceiptsChannelRef.current) {
        supabase.removeChannel(messageReceiptsChannelRef.current);
        messageReceiptsChannelRef.current = null;
      }
      return;
    }

    if (messageReceiptsChannelRef.current) {
      supabase.removeChannel(messageReceiptsChannelRef.current);
      messageReceiptsChannelRef.current = null;
    }

    const channel = supabase
      .channel(`message-receipts-${user.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'message_receipts',
      }, (payload) => {
        const receipt = payload.new as RawReceipt;
        if (!receipt?.message_id || !receipt?.user_id) {
          return;
        }

        let conversationId: string | null = null;
        let profileForReceipt: MessageReceipt['profile'] | undefined;

        setMessages(prev => {
          let updated = false;
          const next = prev.map(message => {
            if (message.id !== receipt.message_id) return message;
            conversationId = message.conversation_id;
            if (message.receipts.some(r => r.user_id === receipt.user_id)) {
              return message;
            }

            const conversation = conversationsRef.current.find(conv => conv.id === message.conversation_id);
            const participant = conversation?.participants?.find(p => p.user_id === receipt.user_id);
            profileForReceipt = participant?.profile;

            updated = true;
            return {
              ...message,
              receipts: [
                ...message.receipts,
                {
                  message_id: receipt.message_id,
                  user_id: receipt.user_id,
                  read_at: receipt.read_at,
                  profile: participant?.profile,
                },
              ],
            };
          });
          return updated ? next : prev;
        });

        setConversations(prev => prev.map(conv => {
          if (!conv.participants?.some(p => p.user_id === receipt.user_id)) {
            return conv;
          }

          const updatedParticipants = conv.participants.map(p =>
            p.user_id === receipt.user_id ? { ...p, last_read_at: receipt.read_at } : p
          );

          const shouldClearUnread = receipt.user_id === user.id && conversationId && conv.id === conversationId;

          return {
            ...conv,
            participants: updatedParticipants,
            unreadCount: shouldClearUnread ? 0 : conv.unreadCount,
          };
        }));

      })
      .subscribe();

    messageReceiptsChannelRef.current = channel;

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
        messageReceiptsChannelRef.current = null;
      }
    };
  }, [supabase, user?.id]);

  useEffect(() => {
    if (!user?.id) return;

    if (conversationsChannelRef.current) {
      supabase.removeChannel(conversationsChannelRef.current);
      conversationsChannelRef.current = null;
    }

    const channel = supabase
      .channel(`conversation-participants-${user.id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'conversation_participants',
        filter: `user_id=eq.${user.id}`,
      }, () => {
        fetchConversations();
      })
      .subscribe();

    conversationsChannelRef.current = channel;

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
        conversationsChannelRef.current = null;
      }
    };

type RawReceipt = {
  message_id: string;
  user_id: string;
  read_at: string;
};
  }, [fetchConversations, user?.id]);

  useEffect(() => {
    const ids = conversationIdsKey
      .split(',')
      .map(id => id.trim())
      .filter(Boolean);

    if (!user?.id || ids.length === 0) {
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

    const filter = ids.length === 1
      ? `conversation_id=eq.${ids[0]}`
      : `conversation_id=in.(${ids.join(',')})`;

    const channel = supabase
      .channel(`conversation-messages-${user.id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'conversation_messages',
        filter,
      }, (payload) => {
        if (payload.eventType === 'INSERT') {
          const rawPayload = payload.new as RawMessage;
          const conversation = conversationsRef.current.find(conv => conv.id === rawPayload.conversation_id);
          const participantProfile = conversation?.participants?.find(p => p.user_id === rawPayload.sender_id)?.profile;

          const rawMessage: RawMessage = {
            ...rawPayload,
            metadata: rawPayload.metadata ?? null,
            sender: participantProfile
              ? {
                  id: participantProfile.id,
                  full_name: participantProfile.full_name,
                  avatar_url: participantProfile.avatar_url,
                }
              : rawPayload.sender ?? {
                  id: rawPayload.sender_id,
                  full_name: 'Unknown User',
                  avatar_url: null,
                },
            receipts: rawPayload.receipts && rawPayload.receipts.length > 0
              ? rawPayload.receipts
              : [{
                  message_id: rawPayload.id,
                  user_id: rawPayload.sender_id,
                  read_at: rawPayload.created_at,
                }],
          };

          const transformed = transformMessage(rawMessage);
          const conversationId = transformed.conversation_id;
          const isOwnMessage = transformed.sender_id === user.id;

          const messageWithProfile: Message = {
            ...transformed,
            receipts: transformed.receipts.map(receipt => {
              const participant = conversation?.participants?.find(p => p.user_id === receipt.user_id);
              return {
                ...receipt,
                profile: participant?.profile ?? receipt.profile,
              };
            }),
          };

          setConversations(prev => {
            const exists = prev.some(conv => conv.id === conversationId);
            if (!exists) {
              fetchConversations();
              return prev;
            }

            const updated = prev
              .map(conv =>
                conv.id === conversationId
                  ? {
                      ...conv,
                      lastMessage: messageWithProfile,
                      unreadCount: isOwnMessage ? 0 : (conv.unreadCount || 0) + 1,
                      updated_at: messageWithProfile.created_at,
                    }
                  : conv
              )
              .sort((a, b) => {
                const aTime = a.updated_at ? new Date(a.updated_at).getTime() : 0;
                const bTime = b.updated_at ? new Date(b.updated_at).getTime() : 0;
                return bTime - aTime;
              });

            return updated;
          });

          if (currentConversation === conversationId) {
            setMessages(prev => {
              if (prev.find(message => message.id === messageWithProfile.id)) {
                return prev;
              }
              return [...prev, messageWithProfile];
            });

            if (!isOwnMessage) {
              markConversationAsRead(conversationId);
            }
          }
        } else if (payload.eventType === 'UPDATE' || payload.eventType === 'DELETE') {
          const payloadConversationId =
            (payload.new as Partial<RawMessage> | null)?.conversation_id ||
            (payload.old as Partial<RawMessage> | null)?.conversation_id;
          if (payloadConversationId && currentConversation === payloadConversationId) {
            fetchMessages(payloadConversationId);
          }
          fetchConversations();
        }
      })
      .subscribe();

    messagesChannelRef.current = channel;

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
        messagesChannelRef.current = null;
      }
    };
  }, [conversationIdsKey, currentConversation, fetchConversations, fetchMessages, markConversationAsRead, transformMessage, user?.id]);

  useEffect(() => {
    if (!currentConversation) {
      if (typingChannelRef.current) {
        supabase.removeChannel(typingChannelRef.current);
        typingChannelRef.current = null;
      }
      return;
    }

    if (typingChannelRef.current) {
      supabase.removeChannel(typingChannelRef.current);
      typingChannelRef.current = null;
    }

    const channel = supabase
      .channel(`typing-indicators-${currentConversation}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'typing_indicators',
        filter: `conversation_id=eq.${currentConversation}`,
      }, () => {
        fetchTypingIndicators(currentConversation);
      })
      .subscribe();

    typingChannelRef.current = channel;

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
        typingChannelRef.current = null;
      }
    };
  }, [currentConversation, fetchTypingIndicators]);

  useEffect(() => {
    if (typingUsers.length === 0) return;

    const expirations = typingUsers
      .map(indicator => (indicator.expires_at ? new Date(indicator.expires_at).getTime() : null))
      .filter((timestamp): timestamp is number => timestamp !== null && !Number.isNaN(timestamp));

    if (expirations.length === 0) return;

    const nextExpiry = Math.min(...expirations);
    const timeoutDelay = Math.max(nextExpiry - Date.now(), 0) + 50;

    const timeoutId = setTimeout(() => {
      setTypingUsers(prev =>
        prev.filter(indicator => {
          if (!indicator.expires_at) return true;
          return new Date(indicator.expires_at).getTime() > Date.now();
        })
      );
    }, timeoutDelay);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [typingUsers]);

  useEffect(() => {
    return () => {
      if (messagesChannelRef.current) {
        supabase.removeChannel(messagesChannelRef.current);
        messagesChannelRef.current = null;
      }
      if (conversationsChannelRef.current) {
        supabase.removeChannel(conversationsChannelRef.current);
        conversationsChannelRef.current = null;
      }
      if (typingChannelRef.current) {
        supabase.removeChannel(typingChannelRef.current);
        typingChannelRef.current = null;
      }
    if (messageReceiptsChannelRef.current) {
      supabase.removeChannel(messageReceiptsChannelRef.current);
      messageReceiptsChannelRef.current = null;
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
    sendMessage,
    startTyping,
    stopTyping,
    getOrCreateConversation,
    fetchConversations,
  };
}
