import { useCallback, useEffect, useMemo, useState } from 'react';
import { ChatList } from '@/components/messages/ChatList';
import { ChatArea } from '@/components/messages/ChatArea';
import { MessagingUnavailable } from '@/components/messages/MessagingUnavailable';
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
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import {
  findDirectoryProfileById,
  getDirectoryProfiles,
  searchDirectoryProfiles,
  registerDirectoryProfile,
  type DirectoryProfile,
} from '@/lib/messaging/directory';
import { DEFAULT_TENANT_ID } from '@/lib/messaging/data';
import { getMessagingContactIds } from '@/lib/messaging/relationships';

type ProfileRecord = DirectoryProfile;

const MESSAGING_DIRECTORY_ROLES: DirectoryProfile['role'][] = [
  'agent',
  'partner',
  'staff',
  'admin',
  'counselor',
  'school_rep',
];

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
    error,
  } = useMessages();

  const { getUserPresence, isUserOnline } = usePresence();

  const [showNewChatDialog, setShowNewChatDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [profiles, setProfiles] = useState<ProfileRecord[]>([]);
  const [searchingProfiles, setSearchingProfiles] = useState(false);

  const currentConversationData = conversations.find(
    (c) => c.id === currentConversation
  );

  const messagingProfile = useMemo(() => {
    if (profile?.id) {
      return findDirectoryProfileById(profile.id) ?? null;
    }
    if (user?.id) {
      return findDirectoryProfileById(user.id) ?? null;
    }
    return null;
  }, [profile?.id, user?.id]);

  const allowedProfileIds = useMemo(() => {
    if (!messagingProfile) return undefined;
    const ids = getMessagingContactIds(messagingProfile);
    return ids.length > 0 ? new Set(ids) : undefined;
  }, [messagingProfile]);

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
        const tenant = profile?.tenant_id ?? DEFAULT_TENANT_ID;
        const excludeIds = [user?.id, profile?.id].filter(Boolean) as string[];
        // Don't pass allowedProfileIds to let the database function handle permissions
        const results = await searchDirectoryProfiles(trimmedQuery, {
          tenantId: tenant,
          excludeIds,
          roles: MESSAGING_DIRECTORY_ROLES,
          limit: 20,
        });

        results.forEach(registerDirectoryProfile);
        setProfiles(results);
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
    [profile?.id, profile?.tenant_id, toast, user?.id]
  );

  useEffect(() => {
    if (!showNewChatDialog) return;

    // Fetch default contacts when dialog opens
    if (!searchQuery.trim()) {
      void searchProfiles(''); // Fetch all available contacts
      return;
    }

    void searchProfiles(searchQuery);
  }, [searchProfiles, searchQuery, showNewChatDialog]);

  const handleSelectProfile = async (selectedProfile: ProfileRecord) => {
    registerDirectoryProfile(selectedProfile);
    const conversationId = await getOrCreateConversation(selectedProfile.id);
    if (conversationId) {
      setCurrentConversation(conversationId);
      setShowNewChatDialog(false);
      setSearchQuery('');
      setProfiles([]);
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

  // Show loading state first, then check for errors to prevent flash
  if (loading) {
    return (
      <div className="h-[calc(100vh-4rem)] flex flex-col bg-background">
        <div className="border-b bg-background px-4 py-2">
          <BackButton
            variant="ghost"
            size="sm"
            className="md:w-auto"
            fallback="/dashboard"
          />
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Loading messages...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-[calc(100vh-4rem)] flex flex-col bg-background">
        <div className="border-b bg-background px-4 py-2">
          <BackButton
            variant="ghost"
            size="sm"
            className="md:w-auto"
            fallback="/dashboard"
          />
        </div>
        <MessagingUnavailable
          reason={error}
          redirectHref="/dashboard"
          redirectLabel="Return to dashboard"
        />
      </div>
    );
  }

  const displayProfiles = profiles;
  const noMatches = searchQuery.trim().length > 0 && profiles.length === 0;
  const hasDisplayProfiles = displayProfiles.length > 0;

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
            getUserPresence={getUserPresence}
            isUserOnline={isUserOnline}
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

        {/* New Message Dialog */}
      <Dialog open={showNewChatDialog} onOpenChange={setShowNewChatDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
              <DialogTitle>New Message</DialogTitle>
              <DialogDescription>
                Search for users to start messaging
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
                    void searchProfiles(searchQuery);
                  }
                }}
                className="pl-9"
              />
              <Button
                onClick={() => void searchProfiles(searchQuery)}
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
              {hasDisplayProfiles ? (
                <div className="space-y-2">
                  {noMatches ? (
                    <div className="px-1 text-sm text-muted-foreground">
                      No users matched your search. Showing recommended
                      contacts instead.
                    </div>
                  ) : null}
                  {displayProfiles.map((profile) => (
                    <button
                      key={profile.id}
                      onClick={() => handleSelectProfile(profile)}
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
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No messaging contacts are available yet.</p>
                  <p className="text-sm mt-1">
                    Please check back later or contact support for help.
                  </p>
                </div>
              )}
            </ScrollArea>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
