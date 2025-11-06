import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import BackButton from '@/components/BackButton';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Search,
  Send,
  Paperclip,
  MoreVertical,
  MessageSquare,
  Users,
  User,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  content: string;
  timestamp: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  isCurrentUser: boolean;
}

interface Conversation {
  id: string;
  participant: string;
  participantRole: string;
  lastMessage: string;
  timestamp: string;
  unreadCount: number;
  avatar?: string;
  isOnline?: boolean;
}

export default function StaffMessages() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedConversation, setSelectedConversation] = useState<string | null>('conv-1');
  const [messageText, setMessageText] = useState('');

  // Mock data - replace with actual data from your backend
  const conversations: Conversation[] = [
    {
      id: 'conv-1',
      participant: 'John Smith',
      participantRole: 'Student',
      lastMessage: 'Thanks for your help with the application!',
      timestamp: '2024-01-24T14:30:00',
      unreadCount: 2,
      isOnline: true,
    },
    {
      id: 'conv-2',
      participant: 'Sarah Johnson',
      participantRole: 'Student',
      lastMessage: 'When will I receive the offer letter?',
      timestamp: '2024-01-24T10:15:00',
      unreadCount: 1,
      isOnline: false,
    },
    {
      id: 'conv-3',
      participant: 'University of Oxford',
      participantRole: 'Partner',
      lastMessage: 'The documents have been received',
      timestamp: '2024-01-23T16:45:00',
      unreadCount: 0,
      isOnline: true,
    },
    {
      id: 'conv-4',
      participant: 'Michael Chen',
      participantRole: 'Student',
      lastMessage: 'I have uploaded the required documents',
      timestamp: '2024-01-23T09:20:00',
      unreadCount: 0,
      isOnline: false,
    },
    {
      id: 'conv-5',
      participant: 'Emily Davis',
      participantRole: 'Student',
      lastMessage: 'Can you help me with the visa application?',
      timestamp: '2024-01-22T15:30:00',
      unreadCount: 3,
      isOnline: true,
    },
  ];

  const messages: Record<string, Message[]> = {
    'conv-1': [
      {
        id: 'msg-1',
        content: 'Hi, I need help with my application documents.',
        timestamp: '2024-01-24T14:00:00',
        senderId: 'student-1',
        senderName: 'John Smith',
        senderRole: 'Student',
        isCurrentUser: false,
      },
      {
        id: 'msg-2',
        content: 'Hello John! I\'d be happy to help. What specific documents do you need assistance with?',
        timestamp: '2024-01-24T14:05:00',
        senderId: 'staff-1',
        senderName: 'You',
        senderRole: 'Staff',
        isCurrentUser: true,
      },
      {
        id: 'msg-3',
        content: 'I\'m not sure if my transcripts are in the correct format.',
        timestamp: '2024-01-24T14:10:00',
        senderId: 'student-1',
        senderName: 'John Smith',
        senderRole: 'Student',
        isCurrentUser: false,
      },
      {
        id: 'msg-4',
        content: 'Let me review your documents. I can see them in your application. They look good, but let me verify with the university to be sure.',
        timestamp: '2024-01-24T14:15:00',
        senderId: 'staff-1',
        senderName: 'You',
        senderRole: 'Staff',
        isCurrentUser: true,
      },
      {
        id: 'msg-5',
        content: 'Thanks for your help with the application!',
        timestamp: '2024-01-24T14:30:00',
        senderId: 'student-1',
        senderName: 'John Smith',
        senderRole: 'Student',
        isCurrentUser: false,
      },
    ],
    'conv-2': [
      {
        id: 'msg-6',
        content: 'Hi, I submitted my application last week. Do you know when I might hear back?',
        timestamp: '2024-01-24T10:00:00',
        senderId: 'student-2',
        senderName: 'Sarah Johnson',
        senderRole: 'Student',
        isCurrentUser: false,
      },
      {
        id: 'msg-7',
        content: 'When will I receive the offer letter?',
        timestamp: '2024-01-24T10:15:00',
        senderId: 'student-2',
        senderName: 'Sarah Johnson',
        senderRole: 'Student',
        isCurrentUser: false,
      },
    ],
  };

  const filteredConversations = conversations.filter((conv) =>
    conv.participant.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const currentMessages = selectedConversation ? messages[selectedConversation] || [] : [];
  const currentConversation = conversations.find((c) => c.id === selectedConversation);

  const handleSendMessage = () => {
    if (messageText.trim()) {
      // Handle message sending here
      console.log('Sending message:', messageText);
      setMessageText('');
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 48) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  const totalUnread = conversations.reduce((sum, conv) => sum + conv.unreadCount, 0);

  return (
    <DashboardLayout>
      <div className="h-[calc(100vh-4rem)] flex flex-col p-4 sm:p-6 lg:p-8">
        <BackButton variant="ghost" size="sm" fallback="/dashboard" wrapperClassName="mb-4" />

        {/* Header */}
        <div className="space-y-2 mb-6 animate-fade-in">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight">
                Messages
              </h1>
              <p className="text-sm sm:text-base text-muted-foreground">
                Communicate with students and partners
              </p>
            </div>
            {totalUnread > 0 && (
              <Badge variant="destructive" className="text-base px-3 py-1">
                {totalUnread} unread
              </Badge>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4 overflow-hidden">
          {/* Conversations List */}
          <Card className="md:col-span-1">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Conversations</CardTitle>
              <div className="relative mt-2">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search conversations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[calc(100vh-20rem)]">
                <div className="space-y-1 p-2">
                  {filteredConversations.map((conv) => (
                    <button
                      key={conv.id}
                      onClick={() => setSelectedConversation(conv.id)}
                      className={cn(
                        'w-full p-3 rounded-lg text-left hover:bg-muted transition-colors',
                        selectedConversation === conv.id && 'bg-muted'
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <div className="relative">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={conv.avatar} />
                            <AvatarFallback>{getInitials(conv.participant)}</AvatarFallback>
                          </Avatar>
                          {conv.isOnline && (
                            <div className="absolute bottom-0 right-0 h-3 w-3 bg-success rounded-full border-2 border-background" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <h3 className="font-semibold text-sm truncate">
                              {conv.participant}
                            </h3>
                            <span className="text-xs text-muted-foreground">
                              {formatTime(conv.timestamp)}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 mb-1">
                            {conv.participantRole === 'Student' ? (
                              <User className="h-3 w-3 text-muted-foreground" />
                            ) : (
                              <Users className="h-3 w-3 text-muted-foreground" />
                            )}
                            <span className="text-xs text-muted-foreground">
                              {conv.participantRole}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <p className="text-sm text-muted-foreground truncate">
                              {conv.lastMessage}
                            </p>
                            {conv.unreadCount > 0 && (
                              <Badge
                                variant="destructive"
                                className="ml-2 h-5 w-5 p-0 flex items-center justify-center text-[10px]"
                              >
                                {conv.unreadCount}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Message Thread */}
          <Card className="md:col-span-2">
            {selectedConversation && currentConversation ? (
              <>
                <CardHeader className="pb-3 border-b">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={currentConversation.avatar} />
                        <AvatarFallback>
                          {getInitials(currentConversation.participant)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-semibold">{currentConversation.participant}</h3>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          {currentConversation.isOnline ? (
                            <>
                              <div className="h-2 w-2 bg-success rounded-full" />
                              <span>Online</span>
                            </>
                          ) : (
                            <span>Offline</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-0 flex flex-col h-[calc(100vh-24rem)]">
                  {/* Messages */}
                  <ScrollArea className="flex-1 p-4">
                    <div className="space-y-4">
                      {currentMessages.map((msg) => (
                        <div
                          key={msg.id}
                          className={cn(
                            'flex gap-3',
                            msg.isCurrentUser && 'flex-row-reverse'
                          )}
                        >
                          <Avatar className="h-8 w-8 flex-shrink-0">
                            <AvatarFallback className="text-xs">
                              {getInitials(msg.senderName)}
                            </AvatarFallback>
                          </Avatar>
                          <div
                            className={cn(
                              'max-w-[70%] space-y-1',
                              msg.isCurrentUser && 'items-end'
                            )}
                          >
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <span className="font-medium">{msg.senderName}</span>
                              <span>{formatTime(msg.timestamp)}</span>
                            </div>
                            <div
                              className={cn(
                                'rounded-lg p-3',
                                msg.isCurrentUser
                                  ? 'bg-primary text-primary-foreground'
                                  : 'bg-muted'
                              )}
                            >
                              <p className="text-sm">{msg.content}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>

                  {/* Message Input */}
                  <div className="border-t p-4">
                    <div className="flex items-end gap-2">
                      <Button variant="outline" size="icon" className="flex-shrink-0">
                        <Paperclip className="h-4 w-4" />
                      </Button>
                      <Textarea
                        placeholder="Type your message..."
                        value={messageText}
                        onChange={(e) => setMessageText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSendMessage();
                          }
                        }}
                        rows={1}
                        className="min-h-[40px] max-h-[120px] resize-none"
                      />
                      <Button
                        onClick={handleSendMessage}
                        disabled={!messageText.trim()}
                        className="flex-shrink-0"
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </>
            ) : (
              <CardContent className="flex items-center justify-center h-full">
                <div className="text-center space-y-3 text-muted-foreground">
                  <MessageSquare className="h-12 w-12 mx-auto opacity-50" />
                  <p>Select a conversation to start messaging</p>
                </div>
              </CardContent>
            )}
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
