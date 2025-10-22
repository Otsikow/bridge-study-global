import { useEffect, useMemo, useRef, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MessageSquare, Search, Send, Paperclip, X, FileText, Image as ImageIcon, Download, CheckCheck, Check } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import type { Tables } from '@/integrations/supabase/types';

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

interface MessageAttachment {
  name: string;
  url: string;
  type: string;
  size: number;
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

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

export default function Messages() {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [studentId, setStudentId] = useState<string | null>(null);
  const [applications, setApplications] = useState<ApplicationSummary[]>([]);
  const [search, setSearch] = useState('');
  const [selectedAppId, setSelectedAppId] = useState<string | null>(null);
  const [messagesByApp, setMessagesByApp] = useState<Record<string, MessageRow[]>>({});
  const [latestByApp, setLatestByApp] = useState<Record<string, MessageRow | undefined>>({});
  const [composerText, setComposerText] = useState('');
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);
  const listBottomRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
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

        // Preload latest messages
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
  }, [user]);

  // Fetch full thread and mark as read
  useEffect(() => {
    const loadThread = async () => {
      if (!selectedAppId || !user) return;
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('application_id', selectedAppId)
        .order('created_at', { ascending: true });

      if (!error && data) {
        setMessagesByApp((prev) => ({ ...prev, [selectedAppId]: data as MessageRow[] }));

        // Mark messages as read
        const unreadMessages = data.filter(
          (m: MessageRow) => m.sender_id !== user.id && (!m.read_by || !m.read_by.includes(user.id))
        );

        if (unreadMessages.length > 0) {
          for (const msg of unreadMessages) {
            await supabase
              .from('messages')
              .update({
                read_by: [...(msg.read_by || []), user.id],
              })
              .eq('id', msg.id);
          }
        }

        // Update last seen
        const nextSeen = { ...lastSeen, [selectedAppId]: new Date().toISOString() };
        setLastSeen(nextSeen);
        persistLastSeen(nextSeen);

        // Update latest message
        const last = data[data.length - 1] as MessageRow | undefined;
        if (last) setLatestByApp((prev) => ({ ...prev, [selectedAppId]: last }));

        // Scroll to bottom
        setTimeout(() => listBottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
      }
    };
    loadThread();
  }, [selectedAppId]);

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel('student-messages')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
        const m = payload.new as MessageRow;
        setLatestByApp((prev) => ({ ...prev, [m.application_id]: m }));
        setMessagesByApp((prev) => {
          const arr = prev[m.application_id];
          if (!arr) return prev;
          return { ...prev, [m.application_id]: [...arr, m] };
        });
        if (m.application_id === selectedAppId) {
          setTimeout(() => listBottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
        }
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'messages' }, (payload) => {
        const m = payload.new as MessageRow;
        setMessagesByApp((prev) => {
          const arr = prev[m.application_id];
          if (!arr) return prev;
          const next = arr.map((msg) => (msg.id === m.id ? m : msg));
          return { ...prev, [m.application_id]: next };
        });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedAppId]);

  useEffect(() => {
    if (!selectedAppId && applications.length > 0) {
      setSelectedAppId(applications[0].id);
    }
  }, [applications, selectedAppId]);

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
    return msgs.filter(
      (m) =>
        new Date(m.created_at || 0).getTime() > last &&
        m.sender_id !== user.id &&
        (!m.read_by || !m.read_by.includes(user.id))
    ).length;
  };

  const hasUnread = (appId: string) => {
    if (!user) return false;
    const latest = latestByApp[appId];
    if (!latest) return false;
    const last = lastSeen[appId] ? new Date(lastSeen[appId]).getTime() : 0;
    return new Date(latest.created_at || 0).getTime() > last && latest.sender_id !== user.id;
  };

  const selectedMessages = selectedAppId ? messagesByApp[selectedAppId] || [] : [];

  const selectedTitle = useMemo(() => {
    if (!selectedAppId) return '';
    const app = applications.find((a) => a.id === selectedAppId);
    if (!app) return '';
    const parts = [app.program?.name, app.program?.university?.name].filter(Boolean);
    return parts.join(' • ');
  }, [applications, selectedAppId]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      const totalSize = files.reduce((sum, f) => sum + f.size, 0);
      if (totalSize > 10 * 1024 * 1024) {
        toast({
          title: 'Files too large',
          description: 'Total file size must be under 10MB',
          variant: 'destructive',
        });
        return;
      }
      setAttachments((prev) => [...prev, ...files]);
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const uploadFiles = async (): Promise<MessageAttachment[]> => {
    if (attachments.length === 0) return [];
    const uploaded: MessageAttachment[] = [];
    for (const file of attachments) {
      const fileName = `${user?.id}/${Date.now()}-${file.name}`;
      const { data, error } = await supabase.storage.from('public').upload(fileName, file);
      if (error) {
        toast({
          title: 'Upload failed',
          description: `Failed to upload ${file.name}`,
          variant: 'destructive',
        });
        continue;
      }
      const { data: { publicUrl } } = supabase.storage.from('public').getPublicUrl(fileName);
      uploaded.push({
        name: file.name,
        url: publicUrl,
        type: file.type,
        size: file.size,
      });
    }
    return uploaded;
  };

  const handleSend = async () => {
    if ((!composerText.trim() && attachments.length === 0) || !selectedAppId || !user) return;
    setSending(true);
    setUploading(attachments.length > 0);

    try {
      let uploadedFiles: MessageAttachment[] = [];
      if (attachments.length > 0) {
        uploadedFiles = await uploadFiles();
        if (uploadedFiles.length === 0 && attachments.length > 0) return;
      }

      const insert = {
        application_id: selectedAppId,
        sender_id: user.id,
        body: composerText.trim() || (uploadedFiles.length > 0 ? 'Sent attachments' : ''),
        message_type: uploadedFiles.length > 0 ? ('document' as const) : ('text' as const),
        attachments: uploadedFiles.length > 0 ? uploadedFiles : undefined,
      };

      const { data, error } = await supabase.from('messages').insert(insert).select('*').single();

      if (!error && data) {
        const row = data as MessageRow;
        setMessagesByApp((prev) => {
          const arr = prev[selectedAppId] || [];
          return { ...prev, [selectedAppId]: [...arr, row] };
        });
        setLatestByApp((prev) => ({ ...prev, [selectedAppId]: row }));
        setComposerText('');
        setAttachments([]);
        setTimeout(() => listBottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);

        toast({
          title: 'Message sent',
          description: 'Your message was sent successfully',
        });
      } else {
        toast({
          title: 'Failed to send',
          description: 'Could not send message. Please try again.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'An error occurred while sending the message',
        variant: 'destructive',
      });
    } finally {
      setSending(false);
      setUploading(false);
    }
  };

  const renderAttachment = (attachment: MessageAttachment) => {
    const isImage = attachment.type.startsWith('image/');
    return (
      <div key={attachment.url} className="mt-2">
        {isImage ? (
          <a
            href={attachment.url}
            target="_blank"
            rel="noopener noreferrer"
            className="block max-w-xs rounded-lg overflow-hidden border hover:opacity-90 transition-opacity"
          >
            <img src={attachment.url} alt={attachment.name} className="w-full h-auto" />
          </a>
        ) : (
          <a
            href={attachment.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-3 py-2 bg-muted rounded-lg hover:bg-muted/80 transition-colors"
          >
            <FileText className="h-4 w-4" />
            <span className="text-sm">{attachment.name}</span>
            <span className="text-xs text-muted-foreground">({formatFileSize(attachment.size)})</span>
            <Download className="h-4 w-4 ml-2" />
          </a>
        )}
      </div>
    );
  };

  const isMessageRead = (message: MessageRow) => {
    if (!user || message.sender_id === user.id) return true;
    return message.read_by && message.read_by.includes(user.id);
  };

  return (
    <DashboardLayout>
      <div className="p-4 md:p-8 space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 animate-fade-in">
          <div className="space-y-1.5 min-w-0">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight break-words">Messages</h1>
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
              Stay connected with advisors and support
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
          <Card className="lg:col-span-1 rounded-xl border shadow-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Conversations</CardTitle>
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
                  <div className="p-4 text-sm text-muted-foreground">No conversations yet</div>
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
                      const showDot = unread === 0 && hasUnread
