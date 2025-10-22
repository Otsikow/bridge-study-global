import { useState, useRef, useEffect } from "react";
import DOMPurify from "dompurify";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageCircle, Send, X, Bot, User, Paperclip, Mic, MicOff, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

interface ChatAttachment {
  fileName: string;
  mimeType: string;
  storagePath: string;
  signedUrl: string;
  previewUrl?: string;
}

interface Message {
  role: "user" | "assistant";
  content: string;
  attachments?: ChatAttachment[];
}

function FormattedMessage({ content }: { content: string }) {
  const lines = content.split('\n');
  const elements: JSX.Element[] = [];
  let listItems: string[] = [];
  
  const flushList = () => {
    if (listItems.length > 0) {
      elements.push(
        <ul key={elements.length} className="list-disc list-inside space-y-1 my-2">
          {listItems.map((item, i) => (
            <li key={i} className="text-sm" dangerouslySetInnerHTML={{ __html: sanitizeInline(item) }} />
          ))}
        </ul>
      );
      listItems = [];
    }
  };

  const formatInline = (text: string) => {
    return text
      .replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/__(.+?)__/g, '<strong>$1</strong>')
      .replace(/_(.+?)_/g, '<em>$1</em>');
  };

  const sanitizeInline = (text: string) =>
    DOMPurify.sanitize(formatInline(text), {
      ALLOWED_TAGS: ["strong", "em"],
      ALLOWED_ATTR: [],
    });

  lines.forEach((line, index) => {
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
      if (match) {
        listItems.push(match[1]);
      }
    } else if (line.trim() === '') {
      flushList();
      if (elements.length > 0) {
        elements.push(<div key={elements.length} className="h-2" />);
      }
    } else {
      flushList();
      elements.push(
        <p key={elements.length} className="text-sm" dangerouslySetInnerHTML={{ __html: sanitizeInline(line) }} />
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
  const [isLoading, setIsLoading] = useState(false);
  const [attachments, setAttachments] = useState<ChatAttachment[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const { session, user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Narrow type guard
  const isImage = (mime: string) => mime.startsWith("image/");

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;
    if (!session?.access_token) {
      toast({
        title: "Sign in required",
        description: "Please sign in to use the AI assistant.",
        variant: "destructive",
      });
      return;
    }

    const userMessage: Message = { role: "user", content: input, attachments: attachments.length ? [...attachments] : undefined };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);
    setAttachments([]);

    try {
      const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-chatbot`;
      
      const response = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ 
          messages: [...messages, userMessage],
          attachments: userMessage.attachments?.map(a => ({
            file_name: a.fileName,
            mime_type: a.mimeType,
            storage_path: a.storagePath,
            signed_url: a.signedUrl,
          }))
        }),
      });

      if (!response.ok || !response.body) {
        if (response.status === 429) {
          toast({
            title: "Rate limit exceeded",
            description: "Please try again in a moment.",
            variant: "destructive",
          });
          setIsLoading(false);
          return;
        }
        throw new Error("Failed to get response");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let assistantMessage = "";
      let textBuffer = "";
      let streamDone = false;

      const updateAssistantMessage = (chunk: string) => {
        assistantMessage += chunk;
        setMessages((prev) => {
          const lastMsg = prev[prev.length - 1];
          if (lastMsg?.role === "assistant") {
            return prev.map((m, i) =>
              i === prev.length - 1 ? { ...m, content: assistantMessage } : m
            );
          }
          return [...prev, { role: "assistant", content: assistantMessage }];
        });
      };

      while (!streamDone) {
        const { done, value } = await reader.read();
        if (done) break;
        
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") {
            streamDone = true;
            break;
          }

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) updateAssistantMessage(content);
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }

      setIsLoading(false);
    } catch (error) {
      console.error("Chat error:", error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
      setMessages((prev) => prev.slice(0, -1));
      setIsLoading(false);
    }
  };

  const handleFileClick = () => fileInputRef.current?.click();

  const handleFilesSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    if (!user) {
      toast({ title: "Sign in required", description: "Please sign in to upload attachments.", variant: "destructive" });
      return;
    }

    const MAX_ATTACH = 4;
    const next: ChatAttachment[] = [];
    try {
      for (let i = 0; i < files.length && (attachments.length + next.length) < MAX_ATTACH; i++) {
        const file = files[i];
        const ext = file.name.split('.').pop();
        const path = `chat-attachments/${user.id}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from('student-documents')
          .upload(path, file, { upsert: false });
        if (uploadError) throw uploadError;
        const { data: signed, error: signError } = await supabase.storage
          .from('student-documents')
          .createSignedUrl(path, 60 * 60);
        if (signError || !signed?.signedUrl) throw signError || new Error('Failed to sign URL');
        const attachment: ChatAttachment = {
          fileName: file.name,
          mimeType: file.type || `application/${ext || 'octet-stream'}`,
          storagePath: path,
          signedUrl: signed.signedUrl,
          previewUrl: isImage(file.type) ? URL.createObjectURL(file) : undefined,
        };
        next.push(attachment);
      }
      setAttachments((prev) => [...prev, ...next]);
      // clear input so same file can be reselected later
      e.currentTarget.value = '';
    } catch (err) {
      console.error('Attachment error:', err);
      toast({ title: 'Upload failed', description: 'Could not upload attachment(s).', variant: 'destructive' });
    }
  };

  const removeAttachment = (idx: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== idx));
  };

  const startVoice = async () => {
    if (isLoading || isRecording) return;
    const SpeechRecognition: any = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      try {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';
        recognition.onresult = (event: any) => {
          let interim = '';
          let final = '';
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) final += transcript;
            else interim += transcript;
          }
          setInput((prev) => {
            const base = prev.trim().length > 0 ? prev + ' ' : '';
            return base + (final || interim);
          });
        };
        recognition.onend = () => setIsRecording(false);
        recognition.onerror = () => setIsRecording(false);
        recognition.start();
        (mediaRecorderRef as any).current = recognition; // reuse ref for stop
        setIsRecording(true);
      } catch (e) {
        console.warn('WebSpeech failed, falling back to recording', e);
        await startMediaRecorder();
      }
    } else {
      await startMediaRecorder();
    }
  };

  const stopVoice = async () => {
    const SpeechRecognition: any = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition && mediaRecorderRef.current && typeof (mediaRecorderRef.current as any).stop === 'function') {
      try {
        (mediaRecorderRef.current as any).stop();
      } catch {}
      setIsRecording(false);
      return;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  };

  const startMediaRecorder = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = async () => {
        try {
          const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
          chunksRef.current = [];
          const text = await transcribeBlob(blob);
          if (text) setInput((prev) => (prev.trim() ? prev + ' ' + text : text));
        } finally {
          stream.getTracks().forEach((t) => t.stop());
          mediaStreamRef.current = null;
          setIsRecording(false);
        }
      };
      recorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error('Mic error:', err);
      toast({ title: 'Microphone error', description: 'Could not access microphone.', variant: 'destructive' });
    }
  };

  const transcribeBlob = async (blob: Blob): Promise<string | null> => {
    if (!session?.access_token) return null;
    const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/audio-transcribe`;
    const fd = new FormData();
    fd.append('audio', blob, 'audio.webm');
    try {
      const res = await fetch(url, { method: 'POST', headers: { Authorization: `Bearer ${session.access_token}` }, body: fd });
      if (!res.ok) throw new Error('Transcription failed');
      const data = await res.json();
      return typeof data?.text === 'string' ? data.text : null;
    } catch (e) {
      console.error('Transcription error:', e);
      toast({ title: 'Transcription failed', description: 'Could not transcribe audio.', variant: 'destructive' });
      return null;
    }
  };

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 h-12 w-12 rounded-full shadow-lg md:bottom-6 md:right-6 md:h-14 md:w-14"
        size="icon"
      >
        <MessageCircle className="h-5 w-5 md:h-6 md:w-6" />
      </Button>
    );
  }

  return (
    <Card className="fixed bottom-4 right-4 left-4 h-[calc(100vh-2rem)] shadow-2xl flex flex-col xs:left-auto xs:w-[380px] xs:h-[85vh] xs:max-h-[600px] md:bottom-6 md:right-6">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 px-4 pt-4">
        <CardTitle className="flex items-center gap-2 text-base md:text-lg">
          <Bot className="h-5 w-5" />
          AI Assistant
        </CardTitle>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsOpen(false)}
          className="h-8 w-8"
        >
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col p-0 min-h-0">
        <ScrollArea className="flex-1 px-3 md:px-4" ref={scrollRef}>
          <div className="space-y-3 md:space-y-4 py-3 md:py-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex gap-2 ${
                  message.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                {message.role === "assistant" && (
                  <div className="h-8 w-8 rounded-full bg-primary/10 dark:bg-primary/20 flex items-center justify-center flex-shrink-0">
                    <Bot className="h-4 w-4 text-primary" />
                  </div>
                )}
                <div
                  className={`rounded-xl px-3 py-2 max-w-[75%] xs:max-w-[80%] ${
                    message.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-foreground/90 dark:bg-secondary/60"
                  } shadow-sm`}
                >
                  <FormattedMessage content={message.content} />
                  {message.attachments && message.attachments.length > 0 && (
                    <div className={`mt-2 grid gap-2 ${message.attachments.some(a => a.previewUrl) ? 'grid-cols-2' : 'grid-cols-1'}`}>
                      {message.attachments.map((att, i) => (
                        <div key={i} className={`rounded-md overflow-hidden border ${message.role === 'user' ? 'border-white/20' : 'border-border'}`}>
                          {att.previewUrl && isImage(att.mimeType) ? (
                            <img src={att.previewUrl} alt={att.fileName} className="w-full h-24 object-cover" />
                          ) : (
                            <div className="p-2 text-xs truncate">{att.fileName}</div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {message.role === "user" && (
                  <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                    <User className="h-4 w-4 text-primary-foreground" />
                  </div>
                )}
              </div>
            ))}
            {isLoading && messages[messages.length - 1]?.role !== "assistant" && (
              <div className="flex gap-2 justify-start">
                <div className="h-8 w-8 rounded-full bg-primary/10 dark:bg-primary/20 flex items-center justify-center">
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
          <form
            onSubmit={(e) => {
              e.preventDefault();
              sendMessage();
            }}
            className="flex flex-col gap-2"
          >
            {attachments.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {attachments.map((att, idx) => (
                  <div key={idx} className="flex items-center gap-2 border rounded-md p-1 pr-2 text-xs">
                    {att.previewUrl && isImage(att.mimeType) ? (
                      <img src={att.previewUrl} alt={att.fileName} className="h-8 w-8 rounded object-cover" />
                    ) : (
                      <div className="h-8 w-8 rounded bg-muted flex items-center justify-center">
                        <Paperclip className="h-4 w-4" />
                      </div>
                    )}
                    <span className="max-w-[160px] truncate">{att.fileName}</span>
                    <button type="button" onClick={() => removeAttachment(idx)} className="opacity-70 hover:opacity-100">✕</button>
                  </div>
                ))}
              </div>
            )}
            <div className="flex gap-2 items-center">
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={handleFilesSelected}
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp,.gif"
                multiple
              />
              <Button type="button" variant="outline" size="icon" onClick={handleFileClick} disabled={isLoading} title="Attach file">
                <Paperclip className="h-4 w-4" />
              </Button>
              <div className={`relative`}>
                <Button
                  type="button"
                  variant={isRecording ? "destructive" : "outline"}
                  size="icon"
                  onClick={isRecording ? stopVoice : startVoice}
                  disabled={isLoading}
                  title={isRecording ? "Stop recording" : "Start voice input"}
                >
                  {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                </Button>
              </div>
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask me anything..."
                disabled={isLoading}
                className="text-sm md:text-base"
              />
              <Button type="submit" size="icon" disabled={isLoading || !input.trim()} className="flex-shrink-0">
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </div>
          </form>
        </div>
      </CardContent>
    </Card>
  );
}
