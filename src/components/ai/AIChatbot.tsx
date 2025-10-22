import { useState, useRef, useEffect } from "react";
import DOMPurify from "dompurify";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageCircle, Send, X, Bot, User, Mic, MicOff, Paperclip, FileText, Image as ImageIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

interface Message {
  role: "user" | "assistant";
  content: string;
  fileUrl?: string;
  fileName?: string;
  fileType?: string;
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
  const [isRecording, setIsRecording] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<{ url: string; name: string; type: string } | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { session } = useAuth();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    // Initialize Speech Recognition
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput((prev) => prev + (prev ? ' ' : '') + transcript);
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsRecording(false);
        if (event.error !== 'no-speech' && event.error !== 'aborted') {
          toast({
            title: "Voice input error",
            description: "Failed to recognize speech. Please try again.",
            variant: "destructive",
          });
        }
      };

      recognitionRef.current.onend = () => {
        setIsRecording(false);
      };
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [toast]);

  const toggleRecording = () => {
    if (!recognitionRef.current) {
      toast({
        title: "Not supported",
        description: "Voice input is not supported in your browser.",
        variant: "destructive",
      });
      return;
    }

    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsRecording(true);
      } catch (error) {
        console.error('Failed to start recognition:', error);
        toast({
          title: "Error",
          description: "Failed to start voice input.",
          variant: "destructive",
        });
      }
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/gif', 'image/webp', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
    if (!validTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Please upload an image, PDF, or document file.",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload a file smaller than 10MB.",
        variant: "destructive",
      });
      return;
    }

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `chat-uploads/${session?.user?.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('public')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('public')
        .getPublicUrl(filePath);

      setUploadedFile({
        url: publicUrl,
        name: file.name,
        type: file.type,
      });

      toast({
        title: "File uploaded",
        description: `${file.name} has been uploaded successfully.`,
      });
    } catch (error) {
      console.error('File upload error:', error);
      toast({
        title: "Upload failed",
        description: "Failed to upload file. Please try again.",
        variant: "destructive",
      });
    }

    // Reset input
    event.target.value = '';
  };

  const removeUploadedFile = () => {
    setUploadedFile(null);
  };

  const sendMessage = async () => {
    if ((!input.trim() && !uploadedFile) || isLoading) return;
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
      content: input || (uploadedFile ? `[Uploaded file: ${uploadedFile.name}]` : ""),
      fileUrl: uploadedFile?.url,
      fileName: uploadedFile?.name,
      fileType: uploadedFile?.type,
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setUploadedFile(null);
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
                  {message.fileUrl && (
                    <div className="mb-2 p-2 rounded-lg bg-background/20 dark:bg-background/40">
                      {message.fileType?.startsWith('image/') ? (
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-xs opacity-90">
                            <ImageIcon className="h-3 w-3" />
                            <span className="truncate">{message.fileName}</span>
                          </div>
                          <img 
                            src={message.fileUrl} 
                            alt={message.fileName}
                            className="max-w-full h-auto rounded max-h-40 object-contain"
                          />
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-xs opacity-90">
                          <FileText className="h-3 w-3" />
                          <span className="truncate">{message.fileName}</span>
                        </div>
                      )}
                    </div>
                  )}
                  <FormattedMessage content={message.content} />
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
          {uploadedFile && (
            <div className="mb-2 p-2 rounded-lg bg-muted flex items-center justify-between">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                {uploadedFile.type.startsWith('image/') ? (
                  <ImageIcon className="h-4 w-4 flex-shrink-0" />
                ) : (
                  <FileText className="h-4 w-4 flex-shrink-0" />
                )}
                <span className="text-xs truncate">{uploadedFile.name}</span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={removeUploadedFile}
                className="h-6 w-6 flex-shrink-0"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          )}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              sendMessage();
            }}
            className="flex gap-2"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,.pdf,.doc,.docx,.txt"
              onChange={handleFileUpload}
              className="hidden"
            />
            <Button
              type="button"
              size="icon"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading || !!uploadedFile}
              className="flex-shrink-0"
              title="Upload file"
            >
              <Paperclip className="h-4 w-4" />
            </Button>
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask me anything..."
              disabled={isLoading}
              className="text-sm md:text-base flex-1"
            />
            <Button
              type="button"
              size="icon"
              variant={isRecording ? "destructive" : "outline"}
              onClick={toggleRecording}
              disabled={isLoading}
              className="flex-shrink-0"
              title={isRecording ? "Stop recording" : "Start voice input"}
            >
              {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            </Button>
            <Button 
              type="submit" 
              size="icon" 
              disabled={isLoading || (!input.trim() && !uploadedFile)} 
              className="flex-shrink-0"
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </CardContent>
    </Card>
  );
}
