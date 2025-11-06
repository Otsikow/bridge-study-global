import { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Search, MessageSquarePlus } from 'lucide-react';
import { format, isToday, isYesterday, formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import type { Conversation } from '@/hooks/useMessages';
import { useAuth } from '@/hooks/useAuth';

interface ChatListProps {
  conversations: Conversation[];
  currentConversation: string | null;
  onSelectConversation: (conversationId: string) => void;
  onNewChat?: () => void;
}

export function ChatList({
  conversations,
  currentConversation,
  onSelectConversation,
  onNewChat
}: ChatListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const { user } = useAuth();

  const filteredConversations = conversations.filter(conv => {
    if (!searchQuery) return true;
    
    const otherParticipant = conv.participants?.find(p => p.user_id !== user?.id);
    const searchLower = searchQuery.toLowerCase();
    
    return (
      conv.name?.toLowerCase().includes(searchLower) ||
      otherParticipant?.profile?.full_name?.toLowerCase().includes(searchLower)
    );
  });

  const getConversationName = (conversation: Conversation) => {
    if (conversation.is_group) {
      return conversation.name || 'Group Chat';
    }
    
    const otherParticipant = conversation.participants?.find(p => p.user_id !== user?.id);
    return otherParticipant?.profile?.full_name || 'Unknown User';
  };

  const getConversationAvatar = (conversation: Conversation) => {
    if (conversation.avatar_url) {
      return conversation.avatar_url;
    }
    
    const otherParticipant = conversation.participants?.find(p => p.user_id !== user?.id);
    return otherParticipant?.profile?.avatar_url || null;
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatMessageTime = (date: string) => {
    const messageDate = new Date(date);
    
    if (isToday(messageDate)) {
      return format(messageDate, 'HH:mm');
    } else if (isYesterday(messageDate)) {
      return 'Yesterday';
    } else {
      return format(messageDate, 'dd/MM/yyyy');
    }
  };

  const truncateMessage = (text: string, maxLength: number = 50) => {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength) + '...';
  };

  const getConversationPreview = (conversation: Conversation) => {
    const lastMessage = conversation.lastMessage;
    if (!lastMessage) {
      return 'No messages yet';
    }

    if (lastMessage.attachments && lastMessage.attachments.length > 0) {
      const allImages = lastMessage.attachments.every(attachment => attachment.type === 'image');
      if (allImages) {
        return lastMessage.attachments.length > 1 ? 'Sent multiple images' : 'Sent an image';
      }
      return 'Sent an attachment';
    }

    return truncateMessage(lastMessage.content);
  };

  return (
    <div className="flex flex-col h-full border-r bg-background">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-semibold">Messages</h2>
          {onNewChat && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onNewChat}
              title="New Chat"
            >
              <MessageSquarePlus className="h-5 w-5" />
            </Button>
          )}
        </div>
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Conversations List */}
      <ScrollArea className="flex-1">
        <div className="divide-y">
          {filteredConversations.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <p>No conversations yet</p>
              {onNewChat && (
                <Button
                  variant="link"
                  onClick={onNewChat}
                  className="mt-2"
                >
                  Start a new chat
                </Button>
              )}
            </div>
          ) : (
            filteredConversations.map((conversation) => {
              const name = getConversationName(conversation);
              const avatarUrl = getConversationAvatar(conversation);
              const isActive = currentConversation === conversation.id;

              return (
                <button
                  key={conversation.id}
                  onClick={() => onSelectConversation(conversation.id)}
                  className={cn(
                    'w-full p-4 flex items-start gap-3 hover:bg-accent transition-colors text-left',
                    isActive && 'bg-accent'
                  )}
                >
                  <Avatar className="h-12 w-12 flex-shrink-0">
                    <AvatarImage src={avatarUrl || undefined} alt={name} />
                    <AvatarFallback>{getInitials(name)}</AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-semibold truncate">{name}</h3>
                      {conversation.lastMessage && (
                        <span className="text-xs text-muted-foreground flex-shrink-0 ml-2">
                          {formatMessageTime(conversation.lastMessage.created_at)}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between">
                      <p className="text-sm text-muted-foreground truncate">
                          {getConversationPreview(conversation)}
                      </p>
                      {(conversation.unreadCount || 0) > 0 && (
                        <Badge
                          variant="default"
                          className="ml-2 flex-shrink-0 rounded-full px-2 min-w-[20px] h-5 flex items-center justify-center"
                        >
                          {conversation.unreadCount}
                        </Badge>
                      )}
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
