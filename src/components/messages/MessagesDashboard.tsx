import { useEffect, useMemo, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MessageSquare, Search, Send } from 'lucide-react';
import { isSupabaseConfigured, supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import type { Tables } from '@/integrations/supabase/types';
import { MessagingUnavailable } from './MessagingUnavailable';

type MessageRow = Tables<'messages'>;

interface ProgramSummary {
  name: string;
  level: string;
  university: { name: string };
}

interface ApplicationSummary {
  id: string;
  program: ProgramSummary;
}

type LastSeenMap = Record<string, string>; // application_id -> ISO timestamp

const LAST_SEEN_STORAGE_KEY = (profileId: string | undefined) => `messages:lastSeen:${profileId || 'anon'}`;

function formatRelativeTime(dateIso: string | null | undefined) {
  if (!dateIso) return '';
  const diffMs = Date.now() - new Date(dateIso).getTime();
  const sec = Math.floor(diffMs / 1000);
  if (sec < 60) return 'just now';
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const d = Math.floor(hr / 24);
  return `${d}d ago`;
}

export default function MessagesDashboard() {
  const { user, profile } = useAuth();
  const messagingDisabled = !isSupabaseConfigured;
  const [loading, setLoading] = useState(true);
  const [studentId, setStudentId] = useState<string | null>(null);
  const [applications, setApplications] = useState<ApplicationSummary[]>([]);
  const [search, setSearch] = useState('');
  const [selectedAppId, setSelectedAppId] = useState<string | null>(null);
  const [messagesByApp, setMessagesByApp] = useState<Record<string, MessageRow[]>>({});
  const [latestByApp, setLatestByApp] = useState<Record<string, MessageRow | undefined>>({});
  const [composerText, setComposerText] = useState('');
  const [sending, setSending] = useState(false);
  const listBottomRef = useRef<HTMLDivElement | null>(null);
  const [lastSeen, setLastSeen] = useState<LastSeenMap>({});

  // Load last seen map from localStorage
  useEffect(() => {
    const key = LAST_SEEN_STORAGE_KEY(profile?.id);
    try {
      const raw = localStorage.getItem(key);
      if (raw) setLastSeen(JSON.parse(raw));
    } catch {
      // ignore
    }
  }, [profile?.id]);

  const persistLastSeen = (next: LastSeenMap) => {
    const key = LAST_SEEN_STORAGE_KEY(profile?.id);
    try {
      localStorage.setItem(key, JSON.stringify(next));
    } catch {
      // ignore
    }
  };

  // Fetch student id and applications
  useEffect(() => {
    if (messagingDisabled) {
      setLoading(false);
      setApplications([]);
      setStudentId(null);
      return;
    }
    const bootstrap = async () => {
      if (!user) return;
      setLoading(true);
      try {
        const { data: student, error: studentError } = await supabase
          .from('students')
          .select('id')
          .eq('profile_id', user.id)
          .maybeSingle();
        if (studentError) throw studentError;
        if (!student) {
          setApplications([]);
          setStudentId(null);
          return;
        }
        setStudentId(student.id);

        const { data: apps, error: appsError } = await supabase
          .from('applications')
          .select(`
            id,
            program:programs(
              name,
              level,
              university:universities(name)
            )
          `)
          .eq('student_id', student.id)
          .order('created_at', { ascending: false });
        if (appsError) throw appsError;
        const appSummaries: ApplicationSummary[] = (apps || []) as unknown as ApplicationSummary[];
        setApplications(appSummaries);

        // Preload latest messages across these applications (best-effort)
        if (appSummaries.length > 0) {
          const appIds = appSummaries.map((a) => a.id);
          const { data: msgs } = await supabase
            .from('messages')
            .select('*')
            .in('application_id', appIds)
            .order('created_at', { ascending: false })
            .limit(200);
          const latest: Record<string, MessageRow | undefined> = {};
          (msgs || []).forEach((m) => {
            if (!latest[m.application_id]) latest[m.application_id] = m as MessageRow;
          });
          setLatestByApp(latest);
        }
      } finally {
        setLoading(false);
      }
    };
    bootstrap();
  }, [messagingDisabled, user]);

  // Fetch full thread when selecting a message thread
  useEffect(() => {
    if (messagingDisabled) return;
    const loadThread = async () => {
      if (!selectedAppId) return;
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('application_id', selectedAppId)
        .order('created_at', { ascending: true });
      if (!error) {
        setMessagesByApp((prev) => ({ ...prev, [selectedAppId]: (data || []) as MessageRow[] }));
          // mark last seen for this message thread now
        const nextSeen = { ...lastSeen, [selectedAppId]: new Date().toISOString() };
        setLastSeen(nextSeen);
        persistLastSeen(nextSeen);
        // update latest
        const last = (data || [])[data!.length - 1] as MessageRow | undefined;
        if (last) setLatestByApp((prev) => ({ ...prev, [selectedAppId]: last }));
        // scroll to bottom
        setTimeout(() => listBottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
      }
    };
    loadThread();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messagingDisabled, selectedAppId]);

  // Realtime subscription to new messages
  useEffect(() => {
    if (messagingDisabled) return;
    const channel = supabase
      .channel('student-messages')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload) => {
          const m = payload.new as MessageRow;
            // Update latest per message thread
          setLatestByApp((prev) => ({ ...prev, [m.application_id]: m }));
          // If current thread loaded, append
          setMessagesByApp((prev) => {
            const arr = prev[m.application_id];
            if (!arr) return prev;
            const next = [...arr, m];
            return { ...prev, [m.application_id]: next };
          });
            // Auto-scroll if new message belongs to open message thread
          if (m.application_id === selectedAppId) {
            setTimeout(() => listBottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
          }
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [messagingDisabled, selectedAppId]);

  const filteredApplications = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return applications;
    return applications.filter((a) => {
      const title = `${a.program?.name || ''} ${a.program?.university?.name || ''}`.toLowerCase();
      return title.includes(q);
    });
  }, [applications, search]);

  const unreadCount = (appId: string) => {
    const last = lastSeen[appId] ? new Date(lastSeen[appId]).getTime() : 0;
    const msgs = messagesByApp[appId];
    if (!msgs || !user) return 0;
    return msgs.filter((m) => new Date(m.created_at || 0).getTime() > last && m.sender_id !== user.id).length;
  };

  const selectedMessages = selectedAppId ? messagesByApp[selectedAppId] || [] : [];

  const selectedTitle = useMemo(() => {
    if (!selectedAppId) return '';
    const app = applications.find((a) => a.id === selectedAppId);
    if (!app) return '';
    const parts = [app.program?.name, app.program?.university?.name].filter(Boolean);
    return parts.join(' • ');
  }, [applications, selectedAppId]);

  const handleSend = async () => {
    if (!composerText.trim() || !selectedAppId || !user) return;
    setSending(true);
    try {
      const insert = {
        application_id: selectedAppId,
        sender_id: user.id,
        body: composerText.trim(),
        message_type: 'text' as const,
      };
      const { data, error } = await supabase
        .from('messages')
        .insert(insert)
        .select('*')
        .single();
      if (!error && data) {
        const row = data as MessageRow;
        setMessagesByApp((prev) => {
          const arr = prev[selectedAppId] || [];
          return { ...prev, [selectedAppId]: [...arr, row] };
        });
        setLatestByApp((prev) => ({ ...prev, [selectedAppId]: row }));
        setComposerText('');
        setTimeout(() => listBottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
      }
    } finally {
      setSending(false);
    }
  };

  if (messagingDisabled) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 animate-fade-in">
          <div className="space-y-1.5 min-w-0">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight break-words">Messages</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Stay connected with advisors and support
            </p>
          </div>
        </div>
        <MessagingUnavailable
          reason="Messaging is currently unavailable because the messaging service is not configured."
          redirectHref="/"
          redirectLabel="Return to home"
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 animate-fade-in">
        <div className="space-y-1.5 min-w-0">
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight break-words">Messages</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">Stay connected with advisors and support</p>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <Button variant="outline" className="gap-2 hover-scale whitespace-nowrap" disabled>
            <MessageSquare className="h-4 w-4" /> <span className="hidden sm:inline">New Message</span>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        <Card className="lg:col-span-1 rounded-xl border shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Messages</CardTitle>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by program or university"
                className="pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[420px]">
              {loading ? (
                <div className="p-4 text-sm text-muted-foreground">Loading...</div>
              ) : filteredApplications.length === 0 ? (
                <div className="p-4 text-sm text-muted-foreground">No messages yet</div>
              ) : (
                <ul className="divide-y">
                  {filteredApplications.map((app) => {
                    const latest = latestByApp[app.id];
                    const title = `${app.program?.name || 'Application'}${
                      app.program?.university?.name ? ' • ' + app.program.university.name : ''
                    }`;
                    const preview = latest?.body || 'No messages yet';
                    const when = formatRelativeTime(latest?.created_at || null);
                    const unread = unreadCount(app.id);
                    return (
                      <li
                        key={app.id}
                        className={`p-4 hover:bg-accent/50 cursor-pointer ${
                          selectedAppId === app.id ? 'bg-accent/50' : ''
                        }`}
                        onClick={() => {
                          setSelectedAppId(app.id);
                        }}
                      >
                        <div className="flex items-start gap-3">
                          <Avatar>
                            <AvatarImage alt={title} />
                            <AvatarFallback>
                              {(app.program?.university?.name || 'A').slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <p className="font-medium truncate">{title}</p>
                              <span className="text-xs text-muted-foreground flex-shrink-0">{when}</span>
                            </div>
                            <p className="text-sm text-muted-foreground truncate">{preview}</p>
                          </div>
                          {unread > 0 && (
                            <Badge variant="secondary" className="rounded-full px-2 py-0.5">
                              {unread}
                            </Badge>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2 rounded-xl border shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">
              {selectedAppId ? selectedTitle : 'Message'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {!selectedAppId ? (
                <div className="h-[360px] flex items-center justify-center text-muted-foreground text-sm">
                  Select a message thread to view details
              </div>
            ) : (
              <>
                <ScrollArea className="h-[360px] pr-2">
                  <div className="space-y-3">
                    {selectedMessages.length === 0 ? (
                        <div className="text-sm text-muted-foreground px-1">
                          No messages yet. Start messaging below.
                        </div>
                    ) : (
                      selectedMessages.map((m) => {
                        const mine = user && m.sender_id === user.id;
                        return (
                          <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                            <div
                              className={`max-w-[80%] rounded-lg p-3 text-sm ${
                                mine
                                  ? 'bg-primary text-primary-foreground'
                                  : 'bg-muted text-foreground'
                              }`}
                            >
                              <p className="whitespace-pre-wrap break-words">{m.body}</p>
                              <div className={`mt-1 text-[10px] ${mine ? 'opacity-80' : 'text-muted-foreground'}`}>
                                {formatRelativeTime(m.created_at)}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                    <div ref={listBottomRef} />
                  </div>
                </ScrollArea>
                <div className="flex gap-2 pt-2">
                  <Input
                    placeholder="Type a message..."
                    className="flex-1"
                    value={composerText}
                    onChange={(e) => setComposerText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                      }
                    }}
                    disabled={sending}
                  />
                  <Button className="gap-2" onClick={handleSend} disabled={sending || !composerText.trim()}>
                    <Send className="h-4 w-4" /> Send
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}