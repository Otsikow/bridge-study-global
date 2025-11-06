import { DashboardLayout } from '@/components/layout/DashboardLayout';
import BackButton from '@/components/BackButton';
import { ChatList } from '@/components/messages/ChatList';
import { ChatArea } from '@/components/messages/ChatArea';
import { useMessages, type SendMessagePayload } from '@/hooks/useMessages';
import { usePresence } from '@/hooks/usePresence';
import { Badge } from '@/components/ui/badge';

export default function StaffMessages() {
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
  } = useMessages();

  const { getUserPresence, isUserOnline } = usePresence();

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
      </div>
    </DashboardLayout>
  );
}
