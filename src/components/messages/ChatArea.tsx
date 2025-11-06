import { useEffect, useRef } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { format, formatDistanceToNow, isToday, isYesterday } from 'date-fns';
import { cn } from '@/lib/utils';
import { MessageInput } from './MessageInput';
import type { Message, TypingIndicator, Conversation, SendMessagePayload } from '@/hooks/useMessages';
import { useAuth } from '@/hooks/useAuth';
import { ArrowLeft, Loader2 } from 'lucide-react';
import type { UserPresence } from '@/hooks/usePresence';

interface ChatAreaProps {
  conversation: Conversation | null;
  messages: Message[];
  typingUsers: TypingIndicator[];
  loading: boolean;
    onSendMessage: (payload: SendMessagePayload) => void;
  onStartTyping: () => void;
  onStopTyping: () => void;
  getUserPresence?: (userId: string) => UserPresence | null;
  isUserOnline?: (userId: string) => boolean;
  onBack?: () => void;
  showBackButton?: boolean;
}

export function ChatArea({
  conversation,
  messages,
  typingUsers,
  loading,
  onSendMessage,
  onStartTyping,
  onStopTyping,
  getUserPresence,
  isUserOnline,
  onBack,
  showBackButton,
}: ChatAreaProps) {
  const { user } = useAuth();
  const scrollRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const getConversationName = () => {
    if (!conversation) return '';
    if (conversation.is_group) {
      return conversation.name || 'Group Chat';
    }
    const otherParticipant = conversation.participants?.find(p => p.user_id !== user?.id);
    return otherParticipant?.profile?.full_name || 'Unknown User';
  };

  const getConversationAvatar = () => {
    if (!conversation) return null;
    if (conversation.avatar_url) {
      return conversation.avatar_url;
    }
    const otherParticipant = conversation.participants?.find(p => p.user_id !== user?.id);
    return otherParticipant?.profile?.avatar_url || null;
  };

  const getPresenceDetails = () => {
    if (!conversation || !user?.id) {
      return { label: 'Offline', indicator: 'bg-gray-400' };
    }

    const otherParticipant = conversation.participants?.find(
      participant => participant.user_id !== user.id
    );

    if (!otherParticipant) {
      return { label: 'Offline', indicator: 'bg-gray-400' };
    }

    if (isUserOnline && isUserOnline(otherParticipant.user_id)) {
      return { label: 'Online', indicator: 'bg-green-500' };
    }

    const presence = getUserPresence?.(otherParticipant.user_id);
    if (!presence) {
      return { label: 'Offline', indicator: 'bg-gray-400' };
    }

    if (presence.status === 'online') {
      return { label: 'Online', indicator: 'bg-green-500' };
    }

    if (presence.status === 'away') {
      return { label: 'Away', indicator: 'bg-amber-500' };
    }

    const lastSeen = presence.last_seen || presence.updated_at;
    if (!lastSeen) {
      return { label: 'Offline', indicator: 'bg-gray-400' };
    }

    return {
      label: `Last seen ${formatDistanceToNow(new Date(lastSeen), { addSuffix: true })}`,
      indicator: 'bg-gray-400',
    };
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatMessageDate = (date: string) => {
    const messageDate = new Date(date);
    if (isToday(messageDate)) return 'Today';
    if (isYesterday(messageDate)) return 'Yesterday';
    return format(messageDate, 'MMMM dd, yyyy');
  };

  const formatMessageTime = (date: string) => {
    return format(new Date(date), 'HH:mm');
  };

  const shouldShowDateDivider = (currentMsg: Message, previousMsg: Message | null) => {
    if (!previousMsg) return true;
    const currentDate = new Date(currentMsg.created_at).toDateString();
    const previousDate = new Date(previousMsg.created_at).toDateString();
    return currentDate !== previousDate;
  };

  const shouldGroupMessage = (currentMsg: Message, previousMsg: Message | null) => {
    if (!previousMsg) return false;
    const timeDiff =
      new Date(currentMsg.created_at).getTime() - new Date(previousMsg.created_at).getTime();
    const fiveMinutes = 5 * 60 * 1000;
    return currentMsg.sender_id === previousMsg.sender_id && timeDiff < fiveMinutes;
  };

  if (!conversation) {
    return (
      <div className="flex-1 flex items-center justify-center bg-muted/20">
        <div className="text-center text-muted-foreground">
          <p className="text-lg">Select a conversation to start messaging</p>
        </div>
      </div>
    );
  }

  const conversationName = getConversationName();
  const avatarUrl = getConversationAvatar();
  const presenceDetails = getPresenceDetails();

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b bg-background flex items-center gap-3">
        {showBackButton && onBack && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="md:hidden"
            aria-label="Go back to conversations"
          >
            <ArrowLeft className="h-5 w-5" />
            <span className="sr-only">Back to conversations</span>
          </Button>
        )}
        <Avatar className="h-10 w-10">
          <AvatarImage src={avatarUrl || undefined} alt={conversationName} />
          <AvatarFallback>{getInitials(conversationName)}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <h2 className="font-semibold">{conversationName}</h2>
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <span
              className={cn('inline-block w-2 h-2 rounded-full', presenceDetails.indicator)}
            />
            {presenceDetails.label}
          </p>
        </div>
      </div>

      {/* Messages Area */}
      <ScrollArea className="flex-1 p-4">
        {loading && messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-1" ref={scrollRef}>
            {messages.map((message, index) => {
              const previousMessage = index > 0 ? messages[index - 1] : null;
              const showDate = shouldShowDateDivider(message, previousMessage);
              const groupWithPrevious = shouldGroupMessage(message, previousMessage);
              const isOwnMessage = message.sender_id === user?.id;
              const showAvatar = !groupWithPrevious || isOwnMessage;

              return (
                <div key={message.id}>
                  {showDate && (
                    <div className="flex items-center justify-center my-4">
                      <Badge variant="secondary" className="text-xs">
                        {formatMessageDate(message.created_at)}
                      </Badge>
                    </div>
                  )}

                  <div
                    className={cn(
                      'flex gap-2 items-end',
                      isOwnMessage ? 'justify-end' : 'justify-start',
                      groupWithPrevious && 'mt-0.5',
                      !groupWithPrevious && 'mt-4'
                    )}
                  >
                    {!isOwnMessage && (
                      <Avatar className={cn('h-8 w-8', !showAvatar && 'invisible')}>
                        <AvatarImage
                          src={message.sender?.avatar_url || undefined}
                          alt={message.sender?.full_name || ''}
                        />
                        <AvatarFallback>
                          {getInitials(message.sender?.full_name || 'U')}
                        </AvatarFallback>
                      </Avatar>
                    )}

                    <div
                      className={cn(
                        'max-w-[70%] rounded-2xl px-4 py-2',
                        isOwnMessage
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      )}
                    >
                        {!isOwnMessage && !groupWithPrevious && (
                          <p className="text-xs font-semibold mb-1">
                            {message.sender?.full_name}
                          </p>
                        )}
                        <p className="text-sm whitespace-pre-wrap break-words">
                          {message.content}
                        </p>
                        {message.attachments.length > 0 && (
                          <div className="mt-2 space-y-2">
                            {message.attachments.map((attachment) =>
                              attachment.type === 'image' ? (
                                <img
                                  key={attachment.id}
                                  src={attachment.preview_url || attachment.url}
                                  alt={attachment.name || 'Shared image'}
                                  className="max-w-[240px] rounded-lg border"
                                />
                              ) : (
                                <a
                                  key={attachment.id}
                                  href={attachment.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs underline break-all"
                                >
                                  {attachment.name || 'View attachment'}
                                </a>
                              )
                            )}
                          </div>
                        )}
                      <p
                        className={cn(
                          'text-xs mt-1',
                          isOwnMessage
                            ? 'text-primary-foreground/70'
                            : 'text-muted-foreground'
                        )}
                      >
                        {formatMessageTime(message.created_at)}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Typing Indicators */}
            {typingUsers.length > 0 && (
              <div className="flex gap-2 items-end mt-4">
                <Avatar className="h-8 w-8">
                  <AvatarFallback>•••</AvatarFallback>
                </Avatar>
                <div className="bg-muted rounded-2xl px-4 py-3">
                  <p className="text-xs font-medium text-muted-foreground mb-2">
                    {typingUsers
                      .map(indicator => indicator.profile?.full_name || 'Someone')
                      .join(', ')}{' '}
                    {typingUsers.length === 1 ? 'is' : 'are'} typing…
                  </p>
                  <div className="flex gap-1">
                    <span
                      className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"
                      style={{ animationDelay: '0ms' }}
                    />
                    <span
                      className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"
                      style={{ animationDelay: '150ms' }}
                    />
                    <span
                      className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"
                      style={{ animationDelay: '300ms' }}
                    />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </ScrollArea>

      {/* Message Input */}
      <MessageInput
        onSendMessage={onSendMessage}
        onStartTyping={onStartTyping}
        onStopTyping={onStopTyping}
        disabled={loading}
      />
    </div>
  );
}
