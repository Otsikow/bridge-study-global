import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';
import type { RealtimeChannel } from '@supabase/supabase-js';

export interface Conversation {
  id: string;
  tenant_id: string;
  name: string | null;
  is_group: boolean;
  avatar_url: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  participants?: ConversationParticipant[];
  lastMessage?: Message;
  unreadCount?: number;
}

export interface ConversationParticipant {
  id: string;
  conversation_id: string;
  user_id: string;
  joined_at: string;
  last_read_at: string;
  is_admin: boolean;
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
  message_type: string;
  attachments: any[];
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
  started_at: string;
  profile?: {
    full_name: string;
  };
}

export function useMessages() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [typingUsers, setTypingUsers] = useState<TypingIndicator[]>([]);
  const [loading, setLoading] = useState(false);
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);

  // Fetch conversations
  const fetchConversations = async () => {
    if (!user?.id) return;
    
    setLoading(true);
    try {
      const { data: participantData, error: participantError } = await supabase
        .from('conversation_participants')
        .select(`
          conversation_id,
          last_read_at,
          conversations!inner(
            id,
            tenant_id,
            name,
            is_group,
            avatar_url,
            created_by,
            created_at,
            updated_at
          )
        `)
        .eq('user_id', user.id)
        .order('conversations.updated_at', { ascending: false });

      if (participantError) throw participantError;

      // Fetch participants and last message for each conversation
      const conversationsData = await Promise.all(
        (participantData || []).map(async (item: any) => {
          const conv = item.conversations;
          
          // Get participants with profiles
          const { data: participants } = await supabase
            .from('conversation_participants')
            .select(`
              id,
              user_id,
              is_admin,
              joined_at,
              last_read_at,
              profiles:user_id(id, full_name, avatar_url, role)
            `)
            .eq('conversation_id', conv.id);

          // Get last message
          const { data: lastMsg } = await supabase
            .from('conversation_messages')
            .select(`
              id,
              content,
              created_at,
              sender_id,
              message_type,
              profiles:sender_id(full_name)
            `)
            .eq('conversation_id', conv.id)
            .is('deleted_at', null)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          // Get unread count
          const { data: unreadData } = await supabase
            .rpc('get_unread_count', {
              p_user_id: user.id,
              p_conversation_id: conv.id
            });

          return {
            ...conv,
            participants: participants?.map((p: any) => ({
              ...p,
              profile: p.profiles
            })),
            lastMessage: lastMsg,
            unreadCount: unreadData || 0
          };
        })
      );

      setConversations(conversationsData);
    } catch (error: any) {
      console.error('Error fetching conversations:', error);
      toast({
        title: 'Error',
        description: 'Failed to load conversations',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  // Fetch messages for a conversation
  const fetchMessages = async (conversationId: string) => {
    if (!conversationId) return;

    setLoading(true);
    try {
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
          profiles:sender_id(id, full_name, avatar_url)
        `)
        .eq('conversation_id', conversationId)
        .is('deleted_at', null)
        .order('created_at', { ascending: true });

      if (error) throw error;

      setMessages(data?.map((msg: any) => ({
        ...msg,
        sender: msg.profiles
      })) || []);

      // Mark as read
      await supabase
        .from('conversation_participants')
        .update({ last_read_at: new Date().toISOString() })
        .eq('conversation_id', conversationId)
        .eq('user_id', user?.id);

    } catch (error: any) {
      console.error('Error fetching messages:', error);
      toast({
        title: 'Error',
        description: 'Failed to load messages',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  // Send a message
  const sendMessage = async (conversationId: string, content: string) => {
    if (!user?.id || !content.trim()) return;

    try {
      const { error } = await supabase
        .from('conversation_messages')
        .insert({
          conversation_id: conversationId,
          sender_id: user.id,
          content: content.trim(),
          message_type: 'text'
        });

      if (error) throw error;

      // Clear typing indicator
      await stopTyping(conversationId);

    } catch (error: any) {
      console.error('Error sending message:', error);
      toast({
        title: 'Error',
        description: 'Failed to send message',
        variant: 'destructive'
      });
    }
  };

  // Start typing indicator
  const startTyping = async (conversationId: string) => {
    if (!user?.id) return;

    try {
      await supabase.from('typing_indicators').upsert({
        conversation_id: conversationId,
        user_id: user.id,
        expires_at: new Date(Date.now() + 5000).toISOString()
      });
    } catch (error) {
      console.error('Error starting typing:', error);
    }
  };

  // Stop typing indicator
  const stopTyping = async (conversationId: string) => {
    if (!user?.id) return;

    try {
      await supabase
        .from('typing_indicators')
        .delete()
        .eq('conversation_id', conversationId)
        .eq('user_id', user.id);
    } catch (error) {
      console.error('Error stopping typing:', error);
    }
  };

  // Create or get conversation
  const getOrCreateConversation = async (otherUserId: string) => {
    if (!user?.id) return null;

    try {
      const { data: tenantData } = await supabase
        .from('profiles')
        .select('tenant_id')
        .eq('id', user.id)
        .single();

      const { data, error } = await supabase
        .rpc('get_or_create_conversation', {
          p_user1_id: user.id,
          p_user2_id: otherUserId,
          p_tenant_id: tenantData?.tenant_id
        });

      if (error) throw error;
      
      await fetchConversations();
      return data;
    } catch (error: any) {
      console.error('Error creating conversation:', error);
      toast({
        title: 'Error',
        description: 'Failed to create conversation',
        variant: 'destructive'
      });
      return null;
    }
  };

  // Setup realtime subscriptions
  useEffect(() => {
    if (!user?.id || !currentConversation) return;

    const realtimeChannel = supabase
      .channel(`conversation:${currentConversation}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'conversation_messages',
          filter: `conversation_id=eq.${currentConversation}`
        },
        async (payload) => {
          const newMessage = payload.new as any;
          
          // Fetch sender profile
          const { data: profile } = await supabase
            .from('profiles')
            .select('id, full_name, avatar_url')
            .eq('id', newMessage.sender_id)
            .single();

          setMessages(prev => [...prev, { ...newMessage, sender: profile }]);
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'typing_indicators',
          filter: `conversation_id=eq.${currentConversation}`
        },
        async (payload) => {
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const indicator = payload.new as any;
            if (indicator.user_id !== user.id) {
              const { data: profile } = await supabase
                .from('profiles')
                .select('full_name')
                .eq('id', indicator.user_id)
                .single();
              
              setTypingUsers(prev => {
                const filtered = prev.filter(t => t.user_id !== indicator.user_id);
                return [...filtered, { ...indicator, profile }];
              });
            }
          } else if (payload.eventType === 'DELETE') {
            const indicator = payload.old as any;
            setTypingUsers(prev => prev.filter(t => t.user_id !== indicator.user_id));
          }
        }
      )
      .subscribe();

    setChannel(realtimeChannel);

    return () => {
      realtimeChannel.unsubscribe();
    };
  }, [currentConversation, user?.id]);

  // Fetch conversations on mount
  useEffect(() => {
    if (user?.id) {
      fetchConversations();
    }
  }, [user?.id]);

  // Fetch messages when conversation changes
  useEffect(() => {
    if (currentConversation) {
      fetchMessages(currentConversation);
      setTypingUsers([]);
    }
  }, [currentConversation]);

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
    fetchConversations
  };
}
