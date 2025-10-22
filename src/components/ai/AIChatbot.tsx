import { useState, useRef, useEffect } from "react";
import DOMPurify from "dompurify";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  MessageCircle,
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
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

interface Attachment {
  id: string;
  name: string;
  type: string;
  url: string;
  size: number;
}

interface Message {
  role: "user" | "assistant";
  content: string;
  attachments?: Attachment[];
}

function FormattedMessage({ content }: { content: string }) {
  const lines = content.split("\n");
  const elements: JSX.Element[] = [];
  let listItems: string[] = [];

  const flushList = () => {
    if (listItems.length > 0) {
      elements.push(
        <ul key={elements.length} className="list-disc list-inside space-y-1 my-2">
          {listItems.map((item, i) => (
            <li
              key={i}
              className="text-sm"
              dangerouslySetInnerHTML={{ __html: sanitizeInline(item) }}
            />
          ))}
        </ul>
      );
      listItems = [];
    }
  };

  const formatInline = (text: string) =>
    text
      .replace(/\*\*\*(.+?)\*\*\*/g, "<strong><em>$1</em></strong>")
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.+?)\*/g, "<em>$1</em>")
      .replace(/__(.+?)__/g, "<strong>$1</strong>")
      .replace(/_(.+?)_/g, "<em>$1</em>");

  const sanitizeInline = (text: string) =>
    DOMPurify.sanitize(formatInline(text), {
      ALLOWED_TAGS: ["strong", "em"],
      ALLOWED_ATTR: [],
    });

  lines.forEach((line) => {
    if (line.match(/^#{1,3}\s+(.+)/)) {
      flushList();
      const match = line.match(/^#{1,3}\s+(.+)/);
      if (match) {
        elements.push(
          <h3 key={elements.length} className="font-semibold text-sm mt-3 mb-1">
            {match[1]}
          </h3>
        );
      }
    } else if (line.match(/^[-*]\s+(.+)/)) {
      const match = line.match(/^[-*]\s+(.+)/);
      if (match) listItems.push(match[1]);
    } else if (line.trim() === "") {
      flushList();
      if (elements.length > 0) elements.push(<div key={elements.length} className="h-2" />);
    } else {
      flushList();
      elements.push(
        <p
          key={elements.length}
          className="text-sm"
          dangerouslySetInnerHTML={{ __html: sanitizeInline(line) }}
        />
      );
    }
  });

  flushList();
  return <div className="space-y-1">{elements}</div>;
}

export default function AIChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hi! I'm your university admissions assistant. How can I help you today?",
    },
  ]);
  const [input, setInput] = useState("");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const { toast } = useToast();
  const { session } = useAuth();

  const isImage = (mime: string) => mime.startsWith("image/");

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  // Voice Recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        const audioBlob = new Blob(chunksRef.current, { type: "audio/webm" });
        await transcribeBlob(audioBlob);
        stream.getTracks().forEach((t) => t.stop());
      };

      recorder.start();
      setIsRecording(true);
      toast({ title: "Recording...", description: "Click mic again to stop." });
    } catch {
      toast({
        title: "Microphone not accessible",
        description: "Please allow microphone access to record.",
        variant: "destructive",
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const transcribeBlob = async (blob: Blob) => {
    if (!session?.access_token) return;
    const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/audio-transcribe`;
    const fd = new FormData();
    fd.append("audio", blob, "audio.webm");
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { Authorization: `Bearer ${session.access_token}` },
        body: fd,
      });
      const data = await res.json();
      if (data?.text) setInput((p) => (p ? p + " " + data.text : data.text));
    } catch {
      toast({ title: "Transcription failed", variant: "destructive" });
    }
  };

  // File Uploads
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    try {
      for (const file of Array.from(files)) await uploadFile(file);
    } catch {
      toast({ title: "Upload failed", variant: "destructive" });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const uploadFile = async (file: File) => {
    if (!session?.access_token) {
      toast({ title: "Sign in required", description: "Please sign in to upload files." });
      return;
    }
    const allowed = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
      "application/pdf",
      "text/plain",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    if (!allowed.includes(file.type)) {
      toast({ title: "Invalid file type", variant: "destructive" });
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast({ title: "File too large", description: "Limit 10MB", variant: "destructive" });
      return;
    }

    const ext = file.name.split(".").pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${ext}`;
    const filePath = `chat-attachments/${fileName}`;

    const { error } = await supabase.storage.from("public").upload(filePath, file);
    if (error) throw error;

    const { data } = supabase.storage.from("public").getPublicUrl(filePath);
    const attachment: Attachment = {
      id: fileName,
      name: file.name,
      type: file.type,
      url: data.publicUrl,
      size: file.size,
    };
    setAttachments((prev) => [...prev, attachment]);
    toast({ title: `${file.name} uploaded successfully.` });
  };

  const removeAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    setIsUploading(true);
    try {
      for (const file of files) await uploadFile(file);
    } catch {
      toast({ title: "Upload failed", variant: "destructive" });
    } finally {
      setIsUploading(false);
    }
  };

  // Send Message
  const sendMessage = async () => {
    if ((!input.trim() && attachments.length === 0) || isLoading) return;
    if (!session?.access_token) {
      toast({
        title: "Sign in required",
        description: "Please sign in to use the AI assistant.",
        variant: "destructive",
      });
      return;
    }

    const userMessage: Message = {
      role: "user",
      content: input,
      attachments: attachments.length ? [...attachments] : undefined,
    };

    setMessages((p) => [...p, userMessage]);
    setInput("");
    setAttachments([]);
    setIsLoading(true);

    try {
      const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-chatbot`;
      const response = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ messages: [...messages, userMessage] }),
      });

      if (!response.ok || !response.body) throw new Error("Failed to get response");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let assistantMessage = "";

      const updateAssistant = (chunk: string) => {
        assistantMessage += chunk;
        setMessages((prev) => {
          const last = prev[prev.length - 1];
          if (last?.role === "assistant") {
            return prev.map((m, i) =>
              i === prev.length - 1 ? { ...m, content: assistantMessage } : m
            );
          }
          return [...prev, { role: "assistant", content: assistantMessage }];
        });
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        const lines = chunk.split("\n").filter((l) => l.trim());
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const json = line.slice(6);
            if (json === "[DONE]") break;
            try {
              const parsed = JSON.parse(json);
              const text = parsed.choices?.[0]?.delta?.content;
              if (text) updateAssistant(text);
            } catch {}
          }
        }
      }
    } catch (err) {
      console.error(err);
      toast({ title: "Error", description: "Message failed", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  // UI
  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 h-12 w-12 rounded-full shadow-lg md:bottom-6 md:right-6 md:h-14 md:w-14 z-40"
        size="icon"
        aria-label="Open AI Assistant"
      >
        <MessageCircle className="h-5 w-5 md:h-6 md:w-6" />
      </Button>
    );
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <Card className="fixed bottom-4 right-4 left-4 h-[calc(100vh-2rem)] shadow-2xl flex flex-col xs:left-auto xs:w-[380px] xs:h-[85vh] xs:max-h-[600px] md:bottom-6 md:right-6 z-50">
      <CardHeader className="flex items-center justify-between space-y-0 pb-3 px-4 pt-4">
        <CardTitle className="flex items-center gap-2 text-base md:text-lg">
          <Bot className="h-5 w-5" /> AI Assistant
        </CardTitle>
        <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="h-8 w-8">
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col p-0 min-h-0">
        <ScrollArea className="flex-1 px-3 md:px-4" ref={scrollRef}>
          <div className="space-y-3 md:space-y-4 py-3 md:py-4">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {msg.role === "assistant" && (
                  <div className="h-8 w-8 rounded-full bg-primary/10 dark:bg-primary/20 flex items-center justify-center">
                    <Bot className="h-4 w-4 text-primary" />
                  </div>
                )}
                <div
                  className={`rounded-xl px-3 py-2 max-w-[75%] ${
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-foreground/90 dark:bg-secondary/60"
                  } shadow-sm`}
                >
                  <FormattedMessage content={msg.content} />
                  {msg.attachments?.length ? (
                    <div className="mt-2 space-y-1">
                      {msg.attachments.map((a) => (
                        <div key={a.id} className="flex items-center gap-2 text-xs opacity-90">
                          {a.type.startsWith("image/") ? <Image className="h-3 w-3" /> : <FileText className="h-3 w-3" />}
                          <a
                            href={a.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:underline truncate"
                          >
                            {a.name}
                          </a>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
                {msg.role === "user" && (
                  <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
                    <User className="h-4 w-4 text-primary-foreground" />
                  </div>
                )}
              </div>
            ))}
            {isLoading && (
              <div className="flex gap-2 justify-start">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <Bot className="h-4 w-4 text-primary" />
                </div>
                <div className="rounded-xl px-4 py-2 bg-muted dark:bg-secondary/60">
                  <p className="text-sm">Thinking...</p>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="p-3 md:p-4 border-t flex-shrink-0">
          {attachments.length > 0 && (
            <div className="mb-3 space-y-2">
              {attachments.map((a) => (
                <div key={a.id} className="flex items-center gap-2 p-2 bg-muted rounded-lg">
                  {a.type.startsWith("image/") ? (
                    <Image className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <FileText className="h-4 w-4 text-muted-foreground" />
                  )}
                  <span className="text-sm text-muted-foreground flex-1 truncate">
                    {a.name} ({formatFileSize(a.size)})
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeAttachment(a.id)}
                    className="h-6 w-6"
                  >
                    <XIcon className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              sendMessage();
            }}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragOver(true);
            }}
            onDragLeave={(e) => {
              e.preventDefault();
              setIsDragOver(false);
            }}
            onDrop={handleDrop}
            className={`flex gap-2 items-center ${isDragOver ? "bg-primary/5 rounded-lg p-2" : ""}`}
          >
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message..."
              disabled={isLoading || isUploading}
              className="flex-1"
            />
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              multiple
              accept="image/*,.pdf,.doc,.docx,.txt"
              className="hidden"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading || isUploading}
              className="h-9 w-9"
            >
              {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={isRecording ? stopRecording : startRecording}
              disabled={isLoading}
              className="h-9 w-9"
            >
              {isRecording ? <MicOff className="h-4 w-4 text-destructive" /> : <Mic className="h-4 w-4" />}
            </Button>
            <Button type="submit" size="icon" disabled={isLoading || isUploading} className="h-9 w-9">
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </CardContent>
    </Card>
  );
}
