import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChatList } from "@/components/messages/ChatList";
import { ChatArea } from "@/components/messages/ChatArea";
import { useMessages, type SendMessagePayload } from "@/hooks/useMessages";
import { usePresence } from "@/hooks/usePresence";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import UniversityZoeAssistant from "@/components/university/UniversityZoeAssistant";
import { MessageCircle, Search, Loader2, MoreVertical, CheckCheck, Trash2, Sparkles } from "lucide-react";

interface ContactRecord {
  id: string;
  full_name: string;
  email: string;
  avatar_url: string | null;
  role: string;
}

const CONTACT_ROLES = ["agent", "staff", "admin", "partner"];

const UniversityMessagesPage = () => {
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
    fetchConversations,
  } = useMessages();

  const { getUserPresence, isUserOnline } = usePresence();

  const [showNewChatDialog, setShowNewChatDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [contacts, setContacts] = useState<ContactRecord[]>([]);
  const [isSearchingContacts, setIsSearchingContacts] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isInitializingAudio, setIsInitializingAudio] = useState(false);

  const audioContextRef = useRef<AudioContext | null>(null);
  const lastMessageIdRef = useRef<string | null>(null);

  useEffect(() => {
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => undefined);
        audioContextRef.current = null;
      }
    };
  }, []);

  const playTone = useCallback(async (frequency: number, duration = 0.28) => {
    if (typeof window === "undefined") return;
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;

    try {
      let ctx = audioContextRef.current;
      if (!ctx) {
        ctx = new AudioCtx();
        audioContextRef.current = ctx;
      }

      if (ctx.state === "suspended") {
        setIsInitializingAudio(true);
        await ctx.resume();
        setIsInitializingAudio(false);
      }

      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();

      oscillator.type = "triangle";
      oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);

      gain.gain.setValueAtTime(0.0001, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.08, ctx.currentTime + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);

      oscillator.connect(gain);
      gain.connect(ctx.destination);
      oscillator.start();
      oscillator.stop(ctx.currentTime + duration + 0.05);
    } catch (error) {
      console.warn("Unable to play notification tone", error);
      setIsInitializingAudio(false);
    }
  }, []);

  const playSendSound = useCallback(async () => {
    await playTone(720);
  }, [playTone]);

  const playIncomingSound = useCallback(async () => {
    await playTone(520);
  }, [playTone]);

  useEffect(() => {
    if (messages.length === 0) return;
    const lastMessage = messages[messages.length - 1];
    if (lastMessageIdRef.current === lastMessage.id) return;
    lastMessageIdRef.current = lastMessage.id;

    if (lastMessage.sender_id && lastMessage.sender_id !== user?.id) {
      void playIncomingSound();
    }
  }, [messages, playIncomingSound, user?.id]);

  const currentConversationData = useMemo(
    () => conversations.find((conversation) => conversation.id === currentConversation) ?? null,
    [conversations, currentConversation],
  );

  const totalUnread = useMemo(
    () => conversations.reduce((sum, conversation) => sum + (conversation.unreadCount ?? 0), 0),
    [conversations],
  );

  const initialsForName = useCallback((name: string) => {
    return name
      .split(" ")
      .filter(Boolean)
      .map((segment) => segment[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  }, []);

  const searchContacts = useCallback(
    async (queryText: string) => {
      if (!profile?.tenant_id) {
        toast({
          title: "Profile not ready",
          description: "We could not determine your tenant. Please try again later.",
          variant: "destructive",
        });
        return;
      }

      setIsSearchingContacts(true);
      try {
        const trimmed = queryText.trim();
        let query = supabase
          .from("profiles")
          .select("id, full_name, email, avatar_url, role")
          .eq("tenant_id", profile.tenant_id)
          .neq("id", user?.id)
          .in("role", CONTACT_ROLES)
          .order("full_name", { ascending: true })
          .limit(40);

        if (trimmed) {
          query = query.or(`full_name.ilike.%${trimmed}%,email.ilike.%${trimmed}%`);
        }

        const { data, error } = await query;
        if (error) throw error;
        setContacts((data ?? []) as ContactRecord[]);
      } catch (error) {
        console.error("Error searching contacts", error);
        toast({
          title: "Unable to search contacts",
          description: "Please try again later.",
          variant: "destructive",
        });
      } finally {
        setIsSearchingContacts(false);
      }
    },
    [profile?.tenant_id, toast, user?.id],
  );

  useEffect(() => {
    if (showNewChatDialog) {
      void searchContacts("");
    } else {
      setSearchQuery("");
      setContacts([]);
    }
  }, [searchContacts, showNewChatDialog]);

  const handleSelectConversation = useCallback(
    (conversationId: string) => {
      setCurrentConversation(conversationId);
    },
    [setCurrentConversation],
  );

  const handleSendMessage = useCallback(
    async (payload: SendMessagePayload) => {
      if (!currentConversation) return;
      await sendMessage(currentConversation, payload);
      void playSendSound();
    },
    [currentConversation, playSendSound, sendMessage],
  );

  const handleStartTyping = useCallback(() => {
    if (!currentConversation) return;
    void startTyping(currentConversation);
  }, [currentConversation, startTyping]);

  const handleStopTyping = useCallback(() => {
    if (!currentConversation) return;
    void stopTyping(currentConversation);
  }, [currentConversation, stopTyping]);

  const handleNewChat = useCallback(() => {
    setShowNewChatDialog(true);
  }, []);

  const handleSelectContact = useCallback(
    async (contact: ContactRecord) => {
      const conversationId = await getOrCreateConversation(contact.id);
      if (conversationId) {
        setCurrentConversation(conversationId);
        setShowNewChatDialog(false);
        setSearchQuery("");
      }
    },
    [getOrCreateConversation, setCurrentConversation],
  );

  const handleMarkAsRead = useCallback(async () => {
    if (!currentConversation) {
      toast({
        title: "No conversation selected",
        description: "Choose a conversation first.",
      });
      return;
    }
    try {
      const { error } = await supabase.rpc("mark_conversation_read", {
        p_conversation_id: currentConversation,
      });
      if (error) throw error;
      await fetchConversations();
      toast({
        title: "Conversation marked as read",
        description: "All messages are now marked as read for you.",
      });
    } catch (error) {
      console.error("Error marking conversation as read", error);
      toast({
        title: "Unable to mark as read",
        description: "Please try again later.",
        variant: "destructive",
      });
    }
  }, [currentConversation, fetchConversations, toast]);

  const handleDeleteConversation = useCallback(async () => {
    if (!currentConversation || !user?.id) {
      toast({
        title: "No conversation selected",
        description: "Choose a conversation first.",
      });
      return;
    }
    try {
      await supabase
        .from("conversation_participants")
        .delete()
        .eq("conversation_id", currentConversation)
        .eq("user_id", user.id);

      setCurrentConversation(null);
      await fetchConversations();
      toast({
        title: "Conversation removed",
        description: "The conversation has been removed from your inbox.",
      });
    } catch (error) {
      console.error("Error deleting conversation", error);
      toast({
        title: "Unable to delete conversation",
        description: "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setShowDeleteDialog(false);
    }
  }, [currentConversation, fetchConversations, setCurrentConversation, toast, user?.id]);

  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col gap-6">
      <header className="flex flex-col gap-4 rounded-3xl border border-slate-800/60 bg-slate-900/40 px-6 py-6 text-slate-100 shadow-lg shadow-slate-950/40 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-white md:text-3xl">University Messages</h1>
            <p className="text-sm text-slate-400">
              Coordinate with agents and GEG staff to keep your applicants on track.
            </p>
          </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button
            onClick={handleNewChat}
            size="sm"
            className="gap-2 rounded-full bg-blue-600 px-4 py-2 text-blue-50 shadow-lg hover:bg-blue-500"
          >
            <MessageCircle className="h-4 w-4" />
            New Message
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-2 rounded-full border-blue-900/50 bg-blue-950/50 text-blue-100 hover:bg-blue-900/60"
            onClick={() =>
              window.dispatchEvent(
                new CustomEvent("zoe:open-chat", {
                  detail: { prompt: "Help me with my university conversations." },
                }),
              )
            }
          >
            <Sparkles className="h-4 w-4" />
            Ask Zoe
          </Button>
          {totalUnread > 0 && (
            <Badge variant="destructive" className="rounded-full px-3 py-1 text-xs font-semibold">
              {totalUnread} unread
            </Badge>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" className="rounded-full border-slate-700/70">
                <MoreVertical className="h-4 w-4" />
                <span className="sr-only">Conversation actions</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => void handleMarkAsRead()} disabled={!currentConversation}>
                <CheckCheck className="mr-2 h-4 w-4" />
                Mark as Read
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setShowDeleteDialog(true)}
                disabled={!currentConversation}
                className="text-red-500 focus:text-red-500"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Conversation
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <div className="flex flex-1 gap-4 lg:gap-6">
        <section className="flex h-[calc(100vh-14rem)] w-full flex-col overflow-hidden rounded-3xl border border-slate-800/60 bg-slate-900/30 text-slate-100 shadow-lg shadow-slate-950/40 md:w-[360px] lg:w-[380px]">
          <ChatList
            conversations={conversations}
            currentConversation={currentConversation}
            onSelectConversation={handleSelectConversation}
            onNewChat={handleNewChat}
          />
        </section>

        <section className="hidden h-[calc(100vh-14rem)] flex-1 overflow-hidden rounded-3xl border border-slate-800/60 bg-slate-900/30 text-slate-100 shadow-lg shadow-slate-950/40 md:flex">
          <ChatArea
            conversation={currentConversationData}
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
        </section>

        <section className="hidden h-[calc(100vh-14rem)] w-full max-w-xl overflow-hidden rounded-3xl border border-slate-800/60 bg-slate-900/30 text-slate-100 shadow-lg shadow-slate-950/40 xl:flex">
          <UniversityZoeAssistant />
        </section>
      </div>

      {currentConversation && (
        <div className="md:hidden fixed inset-0 z-40 flex flex-col bg-slate-950">
          <ChatArea
            conversation={currentConversationData}
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

      <Dialog open={showNewChatDialog} onOpenChange={setShowNewChatDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Start a new conversation</DialogTitle>
            <DialogDescription>
              Search for agents or GEG team members to begin a new chat.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search by name or email"
                className="pl-9"
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    void searchContacts(searchQuery);
                  }
                }}
              />
              <Button
                size="sm"
                onClick={() => void searchContacts(searchQuery)}
                className="absolute right-1 top-1/2 -translate-y-1/2"
                disabled={isSearchingContacts}
              >
                {isSearchingContacts ? <Loader2 className="h-4 w-4 animate-spin" /> : "Search"}
              </Button>
            </div>
            <ScrollArea className="h-96">
              {contacts.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-2 py-16 text-center text-muted-foreground">
                  <p className="text-sm font-medium">No contacts found</p>
                  <p className="text-xs text-muted-foreground">
                    Try broadening your search or check with your partnership manager.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {contacts.map((contact) => (
                    <button
                      key={contact.id}
                      onClick={() => void handleSelectContact(contact)}
                      className="flex w-full items-center gap-3 rounded-xl border border-transparent bg-slate-950/60 p-3 text-left transition hover:border-blue-900/60 hover:bg-slate-900/80"
                    >
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={contact.avatar_url ?? undefined} alt={contact.full_name} />
                        <AvatarFallback>{initialsForName(contact.full_name)}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-slate-100">{contact.full_name}</p>
                        <p className="truncate text-xs text-slate-400">{contact.email}</p>
                      </div>
                      <Badge variant="outline" className="text-xs capitalize">
                        {contact.role}
                      </Badge>
                    </button>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove this conversation?</AlertDialogTitle>
            <AlertDialogDescription>
              You will no longer see this thread in your inbox. Other participants will retain the conversation history.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-500"
              onClick={() => void handleDeleteConversation()}
            >
              Delete conversation
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {isInitializingAudio && (
        <div className="fixed bottom-4 right-4 z-50 rounded-full bg-blue-600 px-3 py-2 text-xs font-semibold text-blue-50 shadow-lg">
          Preparing audio…
        </div>
      )}
    </div>
  );
};

export default UniversityMessagesPage;
