import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { PostgrestError, RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

export interface Conversation {
  id: string;
  tenant_id: string;
  name: string | null;
  is_group: boolean | null;
  avatar_url: string | null;
  created_by: string | null;
  created_at: string | null;
  updated_at: string | null;
  participants?: ConversationParticipant[];
  lastMessage?: Message;
  unreadCount?: number;
}

export interface ConversationParticipant {
  id: string;
  conversation_id: string;
  user_id: string;
  joined_at: string | null;
  last_read_at: string | null;
  is_admin: boolean | null;
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
  attachments: unknown[];
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

type RawMessage = {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  message_type: string | null;
  attachments: unknown[] | null;
  reply_to_id: string | null;
  edited_at: string | null;
  deleted_at: string | null;
  created_at: string;
  sender?: {
    id: string;
    full_name: string;
    avatar_url: string | null;
  } | null;
};

type RawParticipant = {
  id: string;
  conversation_id: string;
  user_id: string;
  joined_at: string | null;
  last_read_at: string | null;
  is_admin: boolean | null;
  profile?: {
    id: string;
    full_name: string;
    avatar_url: string | null;
    role: string;
  } | null;
};

type RawConversation = {
  id: string;
  tenant_id: string;
  name: string | null;
  is_group: boolean | null;
  avatar_url: string | null;
  created_by: string | null;
  created_at: string | null;
  updated_at: string | null;
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
  const { toast } = useToast();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [typingUsers, setTypingUsers] = useState<TypingIndicator[]>([]);
  const [loading, setLoading] = useState(false);

  const conversationsChannelRef = useRef<RealtimeChannel | null>(null);
  const messagesChannelRef = useRef<RealtimeChannel | null>(null);
  const typingChannelRef = useRef<RealtimeChannel | null>(null);

  const conversationIdsKey = useMemo(() => {
    return conversations.map(conv => conv.id).sort().join(',');
  }, [conversations]);

  const transformMessage = useCallback((message: RawMessage): Message => ({
    id: message.id,
    conversation_id: message.conversation_id,
    sender_id: message.sender_id,
    content: message.content,
    message_type: message.message_type,
    attachments: message.attachments ?? [],
    reply_to_id: message.reply_to_id,
    edited_at: message.edited_at,
    deleted_at: message.deleted_at,
    created_at: message.created_at,
    sender: message.sender
      ? {
          id: message.sender.id,
          full_name: message.sender.full_name,
          avatar_url: message.sender.avatar_url,
        }
      : undefined,
  }), []);

  const markConversationAsRead = useCallback(async (conversationId: string) => {
    if (!user?.id) return;

    try {
      const { error } = await supabase
        .from('conversation_participants')
        .update({ last_read_at: new Date().toISOString() })
        .eq('conversation_id', conversationId)
        .eq('user_id', user.id);

      if (error) throw error;

      setConversations(prev =>
        prev.map(conv =>
          conv.id === conversationId
            ? {
                ...conv,
                unreadCount: 0,
              }
            : conv
        )
      );
    } catch (error) {
      console.error('Error marking conversation as read:', error);
    }
  }, [user?.id]);

  const fetchTypingIndicators = useCallback(async (conversationId: string) => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from('typing_indicators')
        .select(`
          user_id,
          conversation_id,
          started_at,
          expires_at,
          profile:profiles!typing_indicators_user_id_fkey ( full_name )
        `)
        .eq('conversation_id', conversationId)
        .gt('expires_at', new Date().toISOString());

      if (error) throw error;

      const typedData = (data || []) as RawTypingIndicator[];

      const formatted: TypingIndicator[] = typedData
        .filter((indicator) => indicator.user_id !== user.id)
        .map((indicator) => ({
          user_id: indicator.user_id,
          conversation_id: indicator.conversation_id,
          started_at: indicator.started_at,
          expires_at: indicator.expires_at,
          profile: indicator.profile
            ? {
              full_name: indicator.profile.full_name,
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

      const { data, error } = await supabase
        .from('conversation_messages')
        .select(`
          id,
          conversation_id,
          sender_id,
          content,
          message_type,
          attachments,
          reply_to_id,
          edited_at,
          deleted_at,
          created_at,
          sender:profiles!conversation_messages_sender_id_fkey (
            id,
            full_name,
            avatar_url
          )
        `)
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      const typedData = (data || []) as RawMessage[];
      const formatted = typedData.map((message) => transformMessage(message));
      setMessages(formatted);
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
  }, [transformMessage, toast, user?.id]);

  const fetchConversations = useCallback(async () => {
    if (!user?.id) {
      setConversations([]);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('conversations')
        .select(`
          id,
          tenant_id,
          name,
          is_group,
          avatar_url,
          created_by,
          created_at,
          updated_at,
          participants:conversation_participants!inner (
            id,
            conversation_id,
            user_id,
            joined_at,
            last_read_at,
            is_admin,
            profile:profiles (
              id,
              full_name,
              avatar_url,
              role
            )
          ),
          lastMessage:conversation_messages(order_by: { created_at: desc }, limit: 1) (
            id,
            conversation_id,
            sender_id,
            content,
            message_type,
            attachments,
            reply_to_id,
            edited_at,
            deleted_at,
            created_at,
            sender:profiles!conversation_messages_sender_id_fkey (
              id,
              full_name,
              avatar_url
            )
          )
        `)
        .eq('participants.user_id', user.id)
        .order('updated_at', { ascending: false });

      if (error) throw error;

      const typedData = (data || []) as unknown as RawConversation[];

      const formatted = typedData.map((conversation) => {
        const participants: ConversationParticipant[] = (conversation.participants || []).map(
          (participant) => ({
            id: participant.id,
            conversation_id: participant.conversation_id,
            user_id: participant.user_id,
            joined_at: participant.joined_at,
            last_read_at: participant.last_read_at,
            is_admin: participant.is_admin,
            profile: participant.profile
              ? {
                  id: participant.profile.id,
                  full_name: participant.profile.full_name,
                  avatar_url: participant.profile.avatar_url,
                  role: participant.profile.role,
                }
              : undefined,
          })
        );

        const lastMessageRaw = conversation.lastMessage?.[0];
        const lastMessage = lastMessageRaw ? transformMessage(lastMessageRaw) : undefined;

        return {
          id: conversation.id,
          tenant_id: conversation.tenant_id,
          name: conversation.name,
          is_group: conversation.is_group,
          avatar_url: conversation.avatar_url,
          created_by: conversation.created_by,
          created_at: conversation.created_at,
          updated_at: conversation.updated_at,
          participants,
          lastMessage,
          unreadCount: 0,
        } as Conversation;
      });

      const unreadCounts = await Promise.all(
        formatted.map(async (conversation) => {
          try {
            const { data: unreadData, error: unreadError } = await supabase.rpc('get_unread_count', {
              p_user_id: user.id,
              p_conversation_id: conversation.id,
            });

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

      setConversations(withUnread);
    } catch (error) {
      console.error('Error fetching conversations:', error);
      toast({
        title: 'Error',
        description: 'Failed to load conversations',
        variant: 'destructive',
      });
    }
  }, [toast, transformMessage, user?.id]);

  const sendMessage = useCallback(async (conversationId: string, content: string) => {
    if (!user?.id || !content.trim()) return;

    try {
      const { data, error } = await supabase
        .from('conversation_messages')
        .insert({
          conversation_id: conversationId,
          sender_id: user.id,
          content,
          message_type: 'text',
          attachments: [],
        })
        .select(`
          id,
          conversation_id,
          sender_id,
          content,
          message_type,
          attachments,
          reply_to_id,
          edited_at,
          deleted_at,
          created_at,
          sender:profiles!conversation_messages_sender_id_fkey (
            id,
            full_name,
            avatar_url
          )
        `)
        .single();

      if (error) throw error;

      const formatted = transformMessage(data as RawMessage);

      if (currentConversation === conversationId) {
        setMessages(prev => [...prev, formatted]);
        setTypingUsers([]);
      }

      setConversations(prev =>
        prev
          .map(conv =>
            conv.id === conversationId
              ? {
                  ...conv,
                  lastMessage: formatted,
                  unreadCount: 0,
                  updated_at: formatted.created_at,
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
  }, [currentConversation, transformMessage, toast, user?.id]);

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
            created_by: user.id,
          })
          .select('id')
          .single();

        if (conversationError) throw conversationError;

        const conversationId = conversation?.id as string | undefined;
        if (!conversationId) {
          throw new Error('Failed to create conversation');
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
        console.error('Fallback conversation creation failed:', fallbackError);
        throw fallbackError;
      }
    },
    [profile?.tenant_id, user?.id]
  );

  const getOrCreateConversation = useCallback(
    async (otherUserId: string) => {
      if (!user?.id || !profile?.tenant_id) {
        toast({
          title: 'Unable to start conversation',
          description: 'Please try again after signing in.',
          variant: 'destructive',
        });
        return null;
      }

      try {
        const { data, error } = await supabase.rpc('get_or_create_conversation', {
          p_user1_id: user.id,
          p_user2_id: otherUserId,
          p_tenant_id: profile.tenant_id,
        });

        if (error) {
          if (isMissingRpcFunctionError(error)) {
            console.warn(
              'get_or_create_conversation RPC not available. Falling back to client-side creation.'
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
        console.error('Error getting or creating conversation:', error);

        const fallbackMessage = isMissingRpcFunctionError(error as SupabaseError)
          ? 'Messaging is almost ready. Please ensure the latest database migrations have been applied.'
          : 'An unexpected error occurred while starting the conversation.';

        const description = getErrorDescription(error as SupabaseError, fallbackMessage);
        toast({
          title: 'Unable to start conversation',
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
      return;
    }

    fetchConversations();
  }, [fetchConversations, user?.id]);

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
          const newMessage = transformMessage(payload.new as RawMessage);
          const conversationId = newMessage.conversation_id;
          const isOwnMessage = newMessage.sender_id === user.id;

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
                      lastMessage: newMessage,
                      unreadCount: isOwnMessage ? 0 : (conv.unreadCount || 0) + 1,
                      updated_at: newMessage.created_at,
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
              if (prev.find(message => message.id === newMessage.id)) {
                return prev;
              }
              return [...prev, newMessage];
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
