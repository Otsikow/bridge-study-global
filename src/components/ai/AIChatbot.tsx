import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import DOMPurify from "dompurify";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    Sparkles,
  Send,
  X,
  Bot,
  User,
  Mic,
  MicOff,
  Upload,
  FileText,
  Image,
  X as XIcon,
  Loader2,
  Bookmark,
  ExternalLink,
  MessageSquareQuote,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { getSupabaseBrowserConfig } from "@/lib/supabaseClientConfig";
import zoeAvatar from "@/assets/professional-consultant.png";

interface Attachment {
  id: string;
  name: string;
  type: string;
  url: string;
  size: number;
}

interface ZoeSource {
  id?: string;
  title?: string;
  category?: string;
  source_url?: string | null;
  source_type?: string;
  similarity?: number | null;
}

interface Message {
  role: "user" | "assistant";
  content: string;
  attachments?: Attachment[];
  sources?: ZoeSource[];
}

const STORAGE_KEY = "zoe-chat-session-id";
const { url: SUPABASE_URL } = getSupabaseBrowserConfig();
const SUPABASE_FUNCTIONS_BASE = `${SUPABASE_URL}/functions/v1`;

const SUGGESTED_PROMPTS: { label: string; prompt: string }[] = [
  {
    label: "Scholarship guidance",
    prompt: "Can you outline scholarship options for international master’s students heading to Canada?",
  },
  {
    label: "Visa timeline",
    prompt: "What documents do I need for a student visa and when should I apply?",
  },
  {
    label: "Partner onboarding",
    prompt: "What steps do new university partners follow to launch a program with GEG?",
  },
  {
    label: "Agent compliance",
    prompt: "Which compliance documents must a new recruitment agent submit?",
  },
];

function sanitizeInline(text: string) {
  return DOMPurify.sanitize(text, {
    ALLOWED_TAGS: ["strong", "em", "code", "mark"],
    ALLOWED_ATTR: [],
  });
}

function formatInline(text: string) {
  return sanitizeInline(
    text
      .replace(/\*\*\*(.+?)\*\*\*/g, "<strong><em>$1</em></strong>")
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.+?)\*/g, "<em>$1</em>")
      .replace(/__(.+?)__/g, "<strong>$1</strong>")
      .replace(/_(.+?)_/g, "<em>$1</em>")
      .replace(/`(.+?)`/g, "<code>$1</code>")
  );
}

function FormattedMessage({ content }: { content: string }) {
  const lines = useMemo(() => content.split("\n"), [content]);
  const elements: JSX.Element[] = [];
  let listItems: string[] = [];

  const flushList = () => {
    if (listItems.length > 0) {
      elements.push(
        <ul key={`list-${elements.length}`} className="list-disc list-inside space-y-1 my-2">
          {listItems.map((item, index) => (
            <li
              key={index}
              className="text-sm"
              dangerouslySetInnerHTML={{ __html: formatInline(item) }}
            />
          ))}
        </ul>
      );
      listItems = [];
    }
  };

  lines.forEach((line) => {
    if (/^#{1,6}\s+/.test(line)) {
      flushList();
      const heading = line.replace(/^#{1,6}\s+/, "").trim();
      elements.push(
        <h3 key={`heading-${elements.length}`} className="font-semibold text-sm mt-3 mb-1">
          {heading}
        </h3>
      );
      return;
    }

    if (/^[-*]\s+/.test(line)) {
      listItems.push(line.replace(/^[-*]\s+/, ""));
      return;
    }

    if (line.trim() === "") {
      flushList();
      elements.push(<div key={`space-${elements.length}`} className="h-2" />);
      return;
    }

    flushList();
    elements.push(
      <p
        key={`paragraph-${elements.length}`}
        className="text-sm leading-relaxed whitespace-pre-wrap"
        dangerouslySetInnerHTML={{ __html: formatInline(line) }}
      />
    );
  });

  flushList();
  return <div className="space-y-1">{elements}</div>;
}

function MessageSources({ sources }: { sources: ZoeSource[] }) {
  if (!sources.length) return null;

  return (
    <div className="mt-3 rounded-lg border border-primary/20 bg-primary/5 p-3 text-xs space-y-2">
      <div className="flex items-center gap-2 text-primary">
        <Bookmark className="h-3.5 w-3.5" />
        <span className="font-medium uppercase tracking-wide">Sources</span>
      </div>
      <ul className="space-y-1.5">
        {sources.map((source, index) => (
          <li key={source.id ?? index} className="flex items-start gap-2">
            <span className="mt-0.5 text-[10px] font-semibold text-primary/80">[{index + 1}]</span>
            <div className="flex-1 space-y-0.5">
              <p className="font-medium text-foreground text-xs">
                {source.title ?? "Institutional guidance"}
              </p>
              <div className="flex flex-wrap items-center gap-2 text-[10px] text-muted-foreground">
                {source.category && <span className="uppercase">{source.category}</span>}
                {typeof source.similarity === "number" && (
                  <span className="text-emerald-600 dark:text-emerald-400">
                    Match {(source.similarity * 100).toFixed(0)}%
                  </span>
                )}
                {source.source_type && <span>{source.source_type}</span>}
                {source.source_url && (
                  <a
                    href={source.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-primary hover:underline"
                  >
                    View <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function ZoeChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Hello! I’m **Zoe**, your AI-powered student and university assistant. Ask me about admissions, partnerships, or agent onboarding—I'm here 24/7 to help.",
    },
  ]);
  const [input, setInput] = useState("");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [hasConversationStarted, setHasConversationStarted] = useState(false);
  const [suggestions, setSuggestions] = useState(SUGGESTED_PROMPTS);

  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const notificationPlayedRef = useRef(false);

  const { toast } = useToast();
  const { session, profile } = useAuth();

  useEffect(() => {
    if (typeof window === "undefined") return;
    let stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      stored = crypto.randomUUID();
      localStorage.setItem(STORAGE_KEY, stored);
    }
    setSessionId(stored);
  }, []);

  useEffect(() => {
    const viewport = scrollRef.current?.querySelector(
      "[data-radix-scroll-area-viewport]"
    ) as HTMLDivElement | null;

    if (!viewport) return;

    requestAnimationFrame(() => {
      viewport.scrollTo({
        top: viewport.scrollHeight,
        behavior: hasConversationStarted ? "smooth" : "auto",
      });
    });
  }, [messages, isLoading, hasConversationStarted]);

  const generateSuggestions = useCallback((history: Message[]) => {
    const lastUserMessage = [...history]
      .reverse()
      .find((message) => message.role === "user" && message.content.trim().length > 0);

    if (!lastUserMessage) {
      return SUGGESTED_PROMPTS;
    }

    const text = lastUserMessage.content.toLowerCase();
    const dynamic: { label: string; prompt: string }[] = [];

    const addSuggestion = (label: string, prompt: string) => {
      if (!dynamic.some((item) => item.label === label)) {
        dynamic.push({ label, prompt });
      }
    };

    if (/(visa|immigration|permit|embassy)/.test(text)) {
      addSuggestion("Visa checklist", "Can you provide a visa preparation checklist specific to my intake?");
      addSuggestion("Interview prep", "What common visa interview questions should I prepare for?");
    }

    if (/(scholar|funding|financial aid|tuition)/.test(text)) {
      addSuggestion("Funding comparison", "Could you compare scholarships and grants that fit my background?");
    }

    if (/(partner|university|institution|campus)/.test(text)) {
      addSuggestion("Partner onboarding", "What milestones should a new university partner expect in the first 90 days?");
    }

    if (/(agent|compliance|training|certification)/.test(text)) {
      addSuggestion("Compliance overview", "What compliance documents should our agents review this quarter?");
    }

    if (/(application|apply|admission|document)/.test(text)) {
      addSuggestion("Application tracker", "How can I track outstanding documents for my application?");
    }

    if (/(timeline|deadline|schedule)/.test(text)) {
      addSuggestion("Timeline planning", "Can you build a milestone timeline so I stay on track?");
    }

    if ((lastUserMessage.attachments?.length ?? 0) > 0) {
      addSuggestion("Attachment summary", "Can you summarize the key points from the files I shared?");
    }

    if (!dynamic.length) {
      addSuggestion(
        "Explore services",
        "What else can you help me with regarding my study abroad plans?"
      );
      addSuggestion("Talk to an advisor", "How do I schedule time with a human advisor if I need deeper support?");
    }

    const filled = [...dynamic];
    for (const fallback of SUGGESTED_PROMPTS) {
      if (filled.length >= 4) break;
      if (!filled.some((item) => item.label === fallback.label)) {
        filled.push(fallback);
      }
    }

    return filled.slice(0, 4);
  }, []);

  useEffect(() => {
    if (!hasConversationStarted) {
      setSuggestions(SUGGESTED_PROMPTS);
      return;
    }
    setSuggestions(generateSuggestions(messages));
  }, [messages, hasConversationStarted, generateSuggestions]);

  const playNotification = useCallback(async () => {
    if (typeof window === "undefined") return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      let ctx = audioContextRef.current;
      if (!ctx) {
        ctx = new AudioCtx();
        audioContextRef.current = ctx;
      }
      if (ctx.state === "suspended") {
        await ctx.resume();
      }
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();
      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(880, ctx.currentTime);
      gain.gain.setValueAtTime(0.0001, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.08, ctx.currentTime + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.55);
      oscillator.connect(gain);
      gain.connect(ctx.destination);
      oscillator.start();
      oscillator.stop(ctx.currentTime + 0.6);
    } catch (error) {
      console.warn("Notification sound failed", error);
    }
  }, []);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onstop = async () => {
        const audioBlob = new Blob(chunksRef.current, { type: "audio/webm" });
        await transcribeBlob(audioBlob);
        stream.getTracks().forEach((track) => track.stop());
      };

      recorder.start();
      setIsRecording(true);
      toast({ title: "Recording", description: "Tap the mic again to stop." });
    } catch {
      toast({
        title: "Microphone blocked",
        description: "Please enable microphone access to record.",
        variant: "destructive",
      });
    }
  }, [toast]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  }, [isRecording]);

    const transcribeBlob = useCallback(
      async (blob: Blob) => {
        if (!session?.access_token) return;
        const url = `${SUPABASE_FUNCTIONS_BASE}/audio-transcribe`;
        const formData = new FormData();
        formData.append("audio", blob, "voice.webm");

        try {
          const res = await fetch(url, {
            method: "POST",
            headers: { Authorization: `Bearer ${session.access_token}` },
            body: formData,
          });
          const data = await res.json();
          if (data?.text) {
            setInput((prev) => (prev ? `${prev} ${data.text}` : data.text));
          }
        } catch (error) {
          console.error("Transcription failed", error);
          toast({ title: "Transcription failed", variant: "destructive" });
        }
      },
      [session?.access_token, toast]
    );

  const uploadFile = useCallback(
    async (file: File) => {
      if (!session?.access_token) {
        toast({
          title: "Sign in required",
          description: "Please sign in to upload supporting documents.",
        });
        return;
      }

      const allowedTypes = [
        "image/jpeg",
        "image/png",
        "image/gif",
        "image/webp",
        "application/pdf",
        "text/plain",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ];

      if (!allowedTypes.includes(file.type)) {
        toast({
          title: "Unsupported file",
          description: "Upload images, PDFs, Word, or plain text files only.",
          variant: "destructive",
        });
        return;
      }

      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Keep attachments under 10MB.",
          variant: "destructive",
        });
        return;
      }

      try {
        const { data: userData } = await supabase.auth.getUser();
        const user = userData?.user;
        if (!user) {
          toast({ title: "Sign in", description: "Please sign in to upload." });
          return;
        }

        const extension = file.name.split(".").pop();
        const name = `${Date.now()}-${Math.random().toString(36).slice(2)}.${extension}`;
        const path = `chat-uploads/${user.id}/${name}`;

        const { error } = await supabase.storage
          .from("public")
          .upload(path, file, { cacheControl: "3600", upsert: false });
        if (error) throw error;

        const { data } = supabase.storage.from("public").getPublicUrl(path);
        if (!data?.publicUrl) throw new Error("Unable to retrieve file URL");

        const attachment: Attachment = {
          id: name,
          name: file.name,
          type: file.type,
          url: data.publicUrl,
          size: file.size,
        };

        setAttachments((prev) => [...prev, attachment]);
        toast({ title: "Uploaded", description: `${file.name} is attached to your message.` });
      } catch (error) {
        const description = error instanceof Error ? error.message : "Upload failed";
        toast({ title: "Upload error", description, variant: "destructive" });
      }
    },
    [session?.access_token, toast]
  );

  const handleFileUpload = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = event.target.files;
      if (!files?.length) return;
      setIsUploading(true);
      try {
        await Promise.all(Array.from(files).map(uploadFile));
      } finally {
        setIsUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    },
    [uploadFile]
  );

  const removeAttachment = useCallback((id: string) => {
    setAttachments((prev) => prev.filter((attachment) => attachment.id !== id));
  }, []);

  const handleDrop = useCallback(
    async (event: React.DragEvent) => {
      event.preventDefault();
      setIsDragOver(false);
      const files = Array.from(event.dataTransfer.files);
      if (!files.length) return;
      setIsUploading(true);
      try {
        await Promise.all(files.map(uploadFile));
      } finally {
        setIsUploading(false);
      }
    },
    [uploadFile]
  );

  const formatFileSize = useCallback((bytes: number) => {
    if (bytes === 0) return "0 B";
    const units = ["B", "KB", "MB", "GB"];
    const index = Math.floor(Math.log(bytes) / Math.log(1024));
    const size = bytes / Math.pow(1024, index);
    return `${size.toFixed(size >= 10 ? 0 : 1)} ${units[index]}`;
  }, []);

  const sendMessage = useCallback(async () => {
    if ((!input.trim() && attachments.length === 0) || isLoading || !session?.access_token) {
      if (!session?.access_token) {
        toast({
          title: "Sign in required",
          description: "Log in to chat with Zoe across your account data.",
          variant: "destructive",
        });
      }
      return;
    }

    const userContent = input.trim();

    const userMessage: Message = {
      role: "user",
      content: userContent,
      attachments: attachments.length ? [...attachments] : undefined,
    };

    const updatedHistory = [...messages, userMessage];

    setMessages(updatedHistory);
    setSuggestions(generateSuggestions(updatedHistory));
    setHasConversationStarted(true);
    setInput("");
    setAttachments([]);
    setIsLoading(true);
    notificationPlayedRef.current = false;

    try {
      const chatUrl = `${SUPABASE_FUNCTIONS_BASE}/ai-chatbot`;
      const audience = profile?.role ?? undefined;
      const locale = typeof navigator !== "undefined" ? navigator.language : "en";

      const response = await fetch(chatUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          session_id: sessionId,
          audience,
          locale,
          messages: updatedHistory,
          metadata: {
            attachments: userMessage.attachments?.map((attachment) => ({
              name: attachment.name,
              type: attachment.type,
              url: attachment.url,
            })),
          },
        }),
      });

      if (!response.ok || !response.body) {
        throw new Error("Failed to reach Zoe");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      const pushAssistantChunk = (chunk: string) => {
        setMessages((prev) => {
          const next = [...prev];
          const last = next[next.length - 1];
          if (!last || last.role !== "assistant") {
            next.push({ role: "assistant", content: chunk });
          } else {
            next[next.length - 1] = {
              ...last,
              content: (last.content ?? "") + chunk,
            };
          }
          return next;
        });
      };

      const applySources = (sources: ZoeSource[]) => {
        setMessages((prev) => {
          const next = [...prev];
          for (let i = next.length - 1; i >= 0; i -= 1) {
            if (next[i].role === "assistant") {
              next[i] = { ...next[i], sources };
              break;
            }
          }
          return next;
        });
      };

      let done = false;
      while (!done) {
        const { value, done: streamDone } = await reader.read();
        if (streamDone) break;
        if (!value) continue;
        const chunk = decoder.decode(value, { stream: true });
        const events = chunk.split("\n\n").filter(Boolean);

        for (const event of events) {
          if (event.startsWith("data: ")) {
            const data = event.replace(/^data: /, "").trim();
            if (data === "[DONE]") {
              done = true;
              break;
            }

            try {
              const parsed = JSON.parse(data);

              if (parsed?.type === "error") {
                throw new Error(parsed.message ?? "Zoe encountered an issue");
              }

              if (parsed?.type === "sources" && Array.isArray(parsed.sources)) {
                const normalized = (parsed.sources as ZoeSource[]).map((source) => ({
                  id: source.id,
                  title: source.title,
                  category: source.category,
                  source_type: source.source_type,
                  source_url: source.source_url,
                  similarity: typeof source.similarity === "number" ? source.similarity : null,
                }));
                applySources(normalized);
                continue;
              }

              const text = parsed?.choices?.[0]?.delta?.content as string | undefined;
              if (text) {
                if (!notificationPlayedRef.current) {
                  notificationPlayedRef.current = true;
                  void playNotification();
                }
                pushAssistantChunk(text);
              }
            } catch (error) {
              console.error("Stream parse error", error, data);
            }
          }
        }
      }
    } catch (error) {
      console.error("Zoe chat error", error);
      toast({
        title: "Something went wrong",
        description: error instanceof Error ? error.message : "Zoe could not finish that reply.",
        variant: "destructive",
      });
    } finally {
      notificationPlayedRef.current = false;
      setIsLoading(false);
    }
  }, [
    attachments,
    generateSuggestions,
    input,
    isLoading,
    messages,
    playNotification,
    profile?.role,
    session?.access_token,
    sessionId,
    toast,
  ]);

  const quickPromptHandler = useCallback(
    (prompt: string) => {
      setInput(prompt);
      if (!isOpen) setIsOpen(true);
    },
    [isOpen]
  );

    if (!isOpen) {
      return (
        <Button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-4 right-4 flex h-12 items-center gap-2 rounded-full bg-primary px-5 text-sm font-semibold shadow-xl transition hover:translate-y-[-2px] hover:shadow-2xl md:bottom-6 md:right-6 md:h-14 md:px-6 md:text-base"
          aria-label="Chat with Zoe"
        >
          <Sparkles className="h-5 w-5" />
          Chat
        </Button>
      );
  }

  return (
        <Card className="fixed bottom-4 right-4 left-4 flex h-[calc(100vh-2rem)] flex-col overflow-hidden rounded-3xl border border-primary/15 bg-gradient-to-br from-background via-background to-primary/5 shadow-[0_28px_80px_rgba(15,23,42,0.45)] backdrop-blur xs:left-auto xs:h-[88vh] xs:w-[420px] xs:max-h-[680px] md:bottom-6 md:right-6 md:w-[460px]">
        <CardHeader className="px-5 pb-2 pt-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative h-12 w-12 overflow-hidden rounded-full ring-2 ring-primary/40">
              <img src={zoeAvatar} alt="Zoe avatar" className="h-full w-full object-cover" />
              <span className="absolute inset-0 rounded-full bg-primary/10" />
            </div>
              <div className="space-y-1">
                <CardTitle className="flex items-center gap-2 text-base font-semibold md:text-lg">
                  Zoe
                  <span className="hidden items-center gap-1 text-xs font-medium uppercase tracking-wide text-primary/80 sm:inline-flex">
                    <Sparkles className="h-3 w-3" /> Always ready to help
                  </span>
              </CardTitle>
                <p className="text-xs text-muted-foreground md:text-sm">
                  AI-powered support for students, universities, and recruitment partners
              </p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="h-8 w-8">
            <X className="h-4 w-4" />
          </Button>
        </div>
          {suggestions.length > 0 && input.trim().length === 0 ? (
            <div className="mt-4 flex flex-wrap gap-2">
              {suggestions.map(({ label, prompt }) => (
                <Button
                  key={label}
                  type="button"
                  size="sm"
                  variant="secondary"
                  className="h-9 rounded-full bg-primary/10 text-xs font-medium text-primary shadow-inner transition hover:bg-primary/20"
                  onClick={() => quickPromptHandler(prompt)}
                >
                  <MessageSquareQuote className="mr-1.5 h-3.5 w-3.5" />
                  {label}
                </Button>
              ))}
            </div>
          ) : null}
      </CardHeader>

          <CardContent className="flex min-h-0 flex-1 flex-col p-0">
            <ScrollArea ref={scrollRef} className="min-h-0 flex-1 px-5">
            <div className="space-y-4 py-5">
            {messages.map((message, index) => {
              const isUser = message.role === "user";
              return (
                <div key={index} className={`flex gap-2 ${isUser ? "justify-end" : "justify-start"}`}>
                  {!isUser && (
                    <div className="h-8 w-8 overflow-hidden rounded-full bg-primary/10 ring-1 ring-primary/30">
                      <img src={zoeAvatar} alt="Zoe" className="h-full w-full object-cover" />
                    </div>
                  )}
                    <div
                      className={`max-w-[80%] rounded-3xl px-5 py-4 shadow-sm transition-all ${
                      isUser
                          ? "bg-primary text-primary-foreground"
                          : "bg-card/90 border border-primary/10 text-foreground backdrop-blur"
                    }`}
                  >
                    <FormattedMessage content={message.content} />
                    {message.attachments?.length ? (
                      <div className="mt-3 space-y-1 text-xs">
                        {message.attachments.map((attachment) => (
                          <div key={attachment.id} className="flex items-center gap-2 opacity-90">
                            {attachment.type.startsWith("image/") ? (
                              <Image className="h-3.5 w-3.5" />
                            ) : (
                              <FileText className="h-3.5 w-3.5" />
                            )}
                            <a
                              href={attachment.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="truncate hover:underline"
                            >
                              {attachment.name}
                            </a>
                          </div>
                        ))}
                      </div>
                    ) : null}
                    {message.sources && message.sources.length > 0 && !isUser ? (
                      <MessageSources sources={message.sources} />
                    ) : null}
                  </div>
                  {isUser && (
                    <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground">
                      <User className="h-4 w-4" />
                    </div>
                  )}
                </div>
              );
            })}
              {isLoading && (
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 ring-1 ring-primary/30">
                    <Bot className="h-4 w-4 text-primary" />
                  </div>
                  <div className="rounded-full bg-muted/60 px-4 py-2 text-xs uppercase tracking-wide text-muted-foreground">
                    Zoe is preparing a response…
                  </div>
                </div>
              )}
          </div>
        </ScrollArea>

          <div className="flex-shrink-0 border-t border-primary/10 bg-background/90 px-5 pb-5 pt-4">
          {attachments.length > 0 && (
            <div className="mb-3 space-y-2">
              {attachments.map((attachment) => (
                <div
                  key={attachment.id}
                  className="flex items-center gap-2 rounded-lg border border-dashed border-primary/30 bg-primary/5 p-2"
                >
                  {attachment.type.startsWith("image/") ? (
                    <Image className="h-4 w-4 text-primary" />
                  ) : (
                    <FileText className="h-4 w-4 text-primary" />
                  )}
                  <span className="flex-1 truncate text-xs text-primary">
                    {attachment.name} ({formatFileSize(attachment.size)})
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => removeAttachment(attachment.id)}
                  >
                    <XIcon className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}

            <form
              className={`flex flex-col gap-3 rounded-2xl border px-4 py-3 transition duration-150 ${
                isDragOver ? "border-primary bg-primary/5 shadow-inner" : "border-border bg-card/40"
              }`}
            onSubmit={(event) => {
              event.preventDefault();
              void sendMessage();
            }}
            onDragOver={(event) => {
              event.preventDefault();
              setIsDragOver(true);
            }}
            onDragLeave={(event) => {
              event.preventDefault();
              setIsDragOver(false);
            }}
            onDrop={handleDrop}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,.pdf,.doc,.docx,.txt"
              onChange={handleFileUpload}
              className="hidden"
            />

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 rounded-xl"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isLoading || isUploading}
                >
                  {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 rounded-xl"
                  onClick={isRecording ? stopRecording : startRecording}
                  disabled={isLoading}
                >
                  {isRecording ? <MicOff className="h-4 w-4 text-destructive" /> : <Mic className="h-4 w-4" />}
                </Button>

                <div className="flex-1">
                  <Textarea
                    value={input}
                    onChange={(event) => setInput(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" && !event.shiftKey) {
                        event.preventDefault();
                        void sendMessage();
                      }
                    }}
                    placeholder="Ask Zoe about admissions, partnerships, or agent docs…"
                    disabled={isLoading || isUploading}
                    className="min-h-[52px] w-full resize-none border-0 bg-transparent p-0 text-sm leading-6 text-foreground placeholder:text-muted-foreground/70 focus-visible:ring-0 focus-visible:ring-offset-0"
                  />
                </div>

                <Button
                  type="submit"
                  size="icon"
                  disabled={isLoading || isUploading || (!input.trim() && attachments.length === 0)}
                  className="h-10 w-10 rounded-xl bg-primary text-primary-foreground shadow-lg transition hover:shadow-xl"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
          </form>

            <p className="mt-3 text-[10px] uppercase tracking-[0.28em] text-muted-foreground">
            “Meet Zoe — your AI-powered student and university assistant, always ready to help.”
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
