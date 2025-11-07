import { useCallback, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import BackButton from '@/components/BackButton';
import { ChatList } from '@/components/messages/ChatList';
import { ChatArea } from '@/components/messages/ChatArea';
import { useMessages, type SendMessagePayload } from '@/hooks/useMessages';
import { usePresence } from '@/hooks/usePresence';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface AgentContact {
  profile_id: string;
  full_name: string;
  email: string;
  avatar_url: string | null;
  role: string;
  contact_type: 'student' | 'staff';
}

export default function StaffMessages() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const {
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
  } = useMessages();

  const { getUserPresence, isUserOnline } = usePresence();
  const isAgent = profile?.role === 'agent';
  const [showNewChatDialog, setShowNewChatDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [contacts, setContacts] = useState<AgentContact[]>([]);
  const [loadingContacts, setLoadingContacts] = useState(false);

  const currentConversationData = conversations.find(
    (c) => c.id === currentConversation
  );

  const handleSelectConversation = (conversationId: string) => {
    setCurrentConversation(conversationId);
  };

  const handleSendMessage = (payload: SendMessagePayload) => {
    if (currentConversation) {
      sendMessage(currentConversation, payload);
    }
  };

  const handleStartTyping = () => {
    if (currentConversation) {
      startTyping(currentConversation);
    }
  };

  const handleStopTyping = () => {
    if (currentConversation) {
      stopTyping(currentConversation);
    }
  };

  const handleNewChat = () => {
    if (isAgent) {
      setShowNewChatDialog(true);
    }
  };

  const fetchContacts = useCallback(
    async (query: string) => {
      if (!isAgent) {
        return;
      }

      setLoadingContacts(true);
      try {
        const trimmed = query.trim();
        const { data, error } = await supabase.rpc('search_agent_contacts', {
          p_search: trimmed ? trimmed : null,
        });

        if (error) throw error;

        setContacts((data || []) as AgentContact[]);
      } catch (error) {
        console.error('Error fetching contacts:', error);
        toast({
          title: 'Error',
          description: 'Failed to load contacts. Please try again.',
          variant: 'destructive',
        });
      } finally {
        setLoadingContacts(false);
      }
    },
    [isAgent, toast]
  );

  const handleNewChatDialogChange = (open: boolean) => {
    setShowNewChatDialog(open);
    if (open) {
      void fetchContacts('');
    } else {
      setSearchQuery('');
    }
  };

  const handleSelectContact = async (contact: AgentContact) => {
    const conversationId = await getOrCreateConversation(contact.profile_id);
    if (conversationId) {
      setCurrentConversation(conversationId);
      setShowNewChatDialog(false);
      setSearchQuery('');
    }
  };

  const getContactBadge = (contact: AgentContact) => {
    if (contact.contact_type === 'student') {
      return { label: 'Student', variant: 'outline' as const };
    }
    if (contact.role === 'admin') {
      return { label: 'Admin', variant: 'destructive' as const };
    }
    return { label: 'Staff', variant: 'secondary' as const };
  };

  const getInitials = (name: string) =>
    name
      .split(' ')
      .map((part) => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);

  const totalUnread = conversations.reduce((sum, conv) => sum + (conv.unreadCount || 0), 0);

  return (
    <DashboardLayout>
      <div className="h-[calc(100vh-4rem)] flex flex-col bg-background">
        {/* Header */}
        <div className="border-b bg-background px-4 py-2 flex-shrink-0">
          <BackButton
            variant="ghost"
            size="sm"
            className="md:w-auto"
            fallback="/dashboard"
          />
          <div className="flex items-center justify-between mt-2">
            <div>
              <h1 className="text-2xl font-bold">Messages</h1>
              <p className="text-sm text-muted-foreground">
                Communicate with students and partners
              </p>
            </div>
            {totalUnread > 0 && (
              <Badge variant="destructive" className="text-sm px-3 py-1">
                {totalUnread} unread
              </Badge>
            )}
          </div>
        </div>

        {/* Main layout */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left Panel - Chat List */}
          <div className="w-full md:w-96 lg:w-[400px] flex-shrink-0 h-full border-r">
            <ChatList
              conversations={conversations}
              currentConversation={currentConversation}
              onSelectConversation={handleSelectConversation}
              onNewChat={isAgent ? handleNewChat : undefined}
            />
          </div>

          {/* Right Panel - Chat Area */}
          <div className="hidden md:flex flex-1">
            <ChatArea
              conversation={currentConversationData || null}
              messages={messages}
              typingUsers={typingUsers}
              loading={loading}
              onSendMessage={handleSendMessage}
              onStartTyping={handleStartTyping}
              onStopTyping={handleStopTyping}
              getUserPresence={getUserPresence}
              isUserOnline={isUserOnline}
              onBack={() => setCurrentConversation(null)}
            />
          </div>

          {/* Mobile Chat View */}
          {currentConversation && (
            <div className="md:hidden fixed inset-0 z-50 bg-background flex flex-col">
              <ChatArea
                conversation={currentConversationData || null}
                messages={messages}
                typingUsers={typingUsers}
                loading={loading}
                onSendMessage={handleSendMessage}
                onStartTyping={handleStartTyping}
                onStopTyping={handleStopTyping}
                getUserPresence={getUserPresence}
                isUserOnline={isUserOnline}
                onBack={() => setCurrentConversation(null)}
                showBackButton
              />
            </div>
          )}
          {isAgent && (
            <Dialog open={showNewChatDialog} onOpenChange={handleNewChatDialogChange}>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>New Message</DialogTitle>
                    <DialogDescription>
                      Message your assigned students or reach out to the staff team.
                    </DialogDescription>
                  </DialogHeader>

                <div className="space-y-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by name or email..."
                      value={searchQuery}
                      onChange={(event) => setSearchQuery(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter') {
                          event.preventDefault();
                          void fetchContacts(searchQuery);
                        }
                      }}
                      className="pl-9"
                    />
                    <Button
                      onClick={() => void fetchContacts(searchQuery)}
                      className="absolute right-1 top-1/2 transform -translate-y-1/2"
                      size="sm"
                      disabled={loadingContacts}
                    >
                      {loadingContacts ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Search'}
                    </Button>
                  </div>

                  <ScrollArea className="h-96">
                    {contacts.length === 0 && !loadingContacts ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <p>No contacts found</p>
                        <p className="text-sm mt-1">Try a different search or clear the filters.</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {contacts.map((contact) => {
                          const badge = getContactBadge(contact);
                          return (
                            <button
                              key={contact.profile_id}
                              onClick={() => handleSelectContact(contact)}
                              className="w-full p-3 flex items-center gap-3 hover:bg-accent rounded-lg transition-colors text-left"
                            >
                              <Avatar className="h-10 w-10">
                                <AvatarImage src={contact.avatar_url || undefined} alt={contact.full_name} />
                                <AvatarFallback>{getInitials(contact.full_name)}</AvatarFallback>
                              </Avatar>

                              <div className="flex-1 min-w-0">
                                <p className="font-semibold truncate">{contact.full_name}</p>
                                <p className="text-sm text-muted-foreground truncate">{contact.email}</p>
                              </div>

                              <Badge variant={badge.variant}>{badge.label}</Badge>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </ScrollArea>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
