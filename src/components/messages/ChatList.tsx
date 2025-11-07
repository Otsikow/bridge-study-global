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
    return conversation.name || 'Group Message';
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
      const types = new Set(lastMessage.attachments.map((attachment) => attachment.type));
      if (types.size === 1) {
        const type = types.values().next().value;
        if (type === 'image') {
          return lastMessage.attachments.length > 1 ? 'Sent multiple images' : 'Sent an image';
        }
        if (type === 'audio') {
          return lastMessage.attachments.length > 1 ? 'Sent multiple audio messages' : 'Sent an audio message';
        }
        if (type === 'video') {
          return lastMessage.attachments.length > 1 ? 'Sent multiple videos' : 'Sent a video';
        }
        if (type === 'file') {
          return lastMessage.attachments.length > 1 ? 'Sent multiple files' : 'Sent a file';
        }
      }
      return 'Sent attachments';
    }

    return truncateMessage(lastMessage.content);
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="p-3 sm:p-4 border-b flex-shrink-0">
        <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg sm:text-xl font-semibold">Messages</h2>
          {onNewChat && (
            <Button
              variant="ghost"
              size="icon"
                onClick={onNewChat}
                title="New Message"
              className="h-8 w-8 sm:h-9 sm:w-9"
            >
              <MessageSquarePlus className="h-4 w-4 sm:h-5 sm:w-5" />
            </Button>
          )}
        </div>
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search messages..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9"
          />
        </div>
      </div>

        {/* Messages List */}
      <ScrollArea className="flex-1">
        <div className="divide-y">
          {filteredConversations.length === 0 ? (
              <div className="p-6 sm:p-8 text-center text-muted-foreground">
                <p className="text-sm">No messages yet</p>
              {onNewChat && (
                <Button
                  variant="link"
                  onClick={onNewChat}
                  className="mt-2 text-sm"
                >
                    Start a new message
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
                    'w-full p-3 sm:p-4 flex items-start gap-2 sm:gap-3 hover:bg-accent transition-colors text-left',
                    isActive && 'bg-accent'
                  )}
                >
                  <Avatar className="h-10 w-10 sm:h-12 sm:w-12 flex-shrink-0">
                    <AvatarImage src={avatarUrl || undefined} alt={name} />
                    <AvatarFallback className="text-xs sm:text-sm">{getInitials(name)}</AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-semibold text-sm sm:text-base truncate">{name}</h3>
                      {conversation.lastMessage && (
                        <span className="text-[10px] sm:text-xs text-muted-foreground flex-shrink-0 ml-2">
                          {formatMessageTime(conversation.lastMessage.created_at)}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs sm:text-sm text-muted-foreground truncate flex-1">
                        {getConversationPreview(conversation)}
                      </p>
                      {(conversation.unreadCount || 0) > 0 && (
                        <Badge
                          variant="default"
                          className="flex-shrink-0 rounded-full px-1.5 sm:px-2 min-w-[18px] sm:min-w-[20px] h-4 sm:h-5 flex items-center justify-center text-[10px] sm:text-xs"
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
