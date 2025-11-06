import { useCallback, useEffect, useState } from 'react';
import { ChatList } from '@/components/messages/ChatList';
import { ChatArea } from '@/components/messages/ChatArea';
import { useMessages, type SendMessagePayload } from '@/hooks/useMessages';
import { usePresence } from '@/hooks/usePresence';
import BackButton from '@/components/BackButton';
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
import { Badge } from '@/components/ui/badge';
import { Search, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface Profile {
  id: string;
  full_name: string;
  email: string;
  avatar_url: string | null;
  role: string;
}

export default function Messages() {
  const { user, profile } = useAuth();
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

  const [showNewChatDialog, setShowNewChatDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [searchingProfiles, setSearchingProfiles] = useState(false);

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
    setShowNewChatDialog(true);
  };

  const searchProfiles = useCallback(
    async (queryText: string) => {
      const trimmedQuery = queryText.trim();
      setSearchingProfiles(true);
      try {
        let query = supabase
          .from('profiles')
          .select('id, full_name, email, avatar_url, role')
          .neq('id', user?.id)
          .limit(20);

        if (trimmedQuery) {
          query = query.or(
            `full_name.ilike.%${trimmedQuery}%,email.ilike.%${trimmedQuery}%`
          );
        }

        if (profile?.tenant_id) {
          query = query.eq('tenant_id', profile.tenant_id);
        }

        const { data, error } = await query;

        if (error) throw error;
        setProfiles(data || []);
      } catch (error) {
        console.error('Error searching profiles:', error);
        toast({
          title: 'Error',
          description: 'Failed to search users',
          variant: 'destructive',
        });
      } finally {
        setSearchingProfiles(false);
      }
    },
    [profile?.tenant_id, toast, user?.id]
  );

  useEffect(() => {
    if (showNewChatDialog) {
      searchProfiles('');
    }
  }, [searchProfiles, showNewChatDialog]);

  const handleSelectProfile = async (profileId: string) => {
    const conversationId = await getOrCreateConversation(profileId);
    if (conversationId) {
      setCurrentConversation(conversationId);
      setShowNewChatDialog(false);
      setSearchQuery('');
    }
  };

  const getInitials = (name: string) =>
    name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'destructive';
      case 'staff':
        return 'default';
      case 'agent':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col bg-background">
      {/* Header */}
      <div className="border-b bg-background px-4 py-2">
        <BackButton
          variant="ghost"
          size="sm"
          className="md:w-auto"
          fallback="/dashboard"
        />
      </div>

      {/* Main layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Panel - Chat List */}
        <div className="w-full md:w-96 flex-shrink-0 h-full">
          <ChatList
            conversations={conversations}
            currentConversation={currentConversation}
            onSelectConversation={handleSelectConversation}
            onNewChat={handleNewChat}
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

      {/* New Chat Dialog */}
      <Dialog open={showNewChatDialog} onOpenChange={setShowNewChatDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>New Conversation</DialogTitle>
            <DialogDescription>
              Search for users to start a conversation
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    searchProfiles(searchQuery);
                  }
                }}
                className="pl-9"
              />
              <Button
                onClick={() => searchProfiles(searchQuery)}
                className="absolute right-1 top-1/2 transform -translate-y-1/2"
                size="sm"
                disabled={searchingProfiles}
              >
                {searchingProfiles ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  'Search'
                )}
              </Button>
            </div>

            <ScrollArea className="h-96">
              {profiles.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No users found</p>
                  <p className="text-sm mt-1">Try searching by name</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {profiles.map((profile) => (
                    <button
                      key={profile.id}
                      onClick={() => handleSelectProfile(profile.id)}
                      className="w-full p-3 flex items-center gap-3 hover:bg-accent rounded-lg transition-colors text-left"
                    >
                      <Avatar className="h-10 w-10">
                        <AvatarImage
                          src={profile.avatar_url || undefined}
                          alt={profile.full_name}
                        />
                        <AvatarFallback>
                          {getInitials(profile.full_name)}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1 min-w-0">
                        <p className="font-semibold truncate">
                          {profile.full_name}
                        </p>
                        <p className="text-sm text-muted-foreground truncate">
                          {profile.email}
                        </p>
                      </div>

                      <Badge variant={getRoleBadgeColor(profile.role)}>
                        {profile.role}
                      </Badge>
                    </button>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
