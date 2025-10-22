import { useState, useRef, useEffect } from "react";
import DOMPurify from "dompurify";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageCircle, Send, X, Bot, User, Mic, MicOff, Upload, FileText, Image, X as XIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

interface Message {
  role: "user" | "assistant";
  content: string;
  attachments?: Attachment[];
}

interface Attachment {
  id: string;
  name: string;
  type: string;
  url: string;
  size: number;
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
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const { toast } = useToast();
  const { session } = useAuth();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Voice recording functions
  const startRecording = async () => {
    try {
      // Check if speech recognition is supported
      if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        toast({
          title: "Voice input not supported",
          description: "Your browser doesn't support voice input. Please use text input instead.",
          variant: "destructive",
        });
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        } 
      });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/wav' });
        await processAudioBlob(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      
      toast({
        title: "Recording started",
        description: "Speak now... Click the microphone again to stop.",
      });
    } catch (error) {
      console.error('Error starting recording:', error);
      toast({
        title: "Microphone access denied",
        description: "Please allow microphone access to use voice input.",
        variant: "destructive",
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      toast({
        title: "Processing voice input",
        description: "Converting your speech to text...",
      });
    }
  };

  const processAudioBlob = async (audioBlob: Blob) => {
    try {
      // Use Web Speech API for speech recognition
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      
      if (!SpeechRecognition) {
        toast({
          title: "Speech recognition not supported",
          description: "Your browser doesn't support speech recognition. Please use text input instead.",
          variant: "destructive",
        });
        return;
      }

      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';
      recognition.maxAlternatives = 1;

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput(prev => prev + (prev ? ' ' : '') + transcript);
        toast({
          title: "Voice input processed",
          description: "Your speech has been converted to text.",
        });
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        let errorMessage = "Could not process your voice input. Please try again.";
        
        switch (event.error) {
          case 'no-speech':
            errorMessage = "No speech detected. Please try speaking again.";
            break;
          case 'audio-capture':
            errorMessage = "No microphone found. Please check your microphone.";
            break;
          case 'not-allowed':
            errorMessage = "Microphone access denied. Please allow microphone access.";
            break;
        }
        
        toast({
          title: "Speech recognition failed",
          description: errorMessage,
          variant: "destructive",
        });
      };

      recognition.onend = () => {
        // Recognition ended
      };

      recognition.start();
    } catch (error) {
      console.error('Error processing audio:', error);
      toast({
        title: "Voice processing failed",
        description: "Could not process your voice input. Please try typing instead.",
        variant: "destructive",
      });
    }
  };

  // File upload functions
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    try {
      for (const file of Array.from(files)) {
        await uploadFile(file);
      }
    } catch (error) {
      console.error('Error uploading files:', error);
      toast({
        title: "Upload failed",
        description: "Could not upload files. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const uploadFile = async (file: File) => {
    if (!session?.access_token) {
      toast({
        title: "Sign in required",
        description: "Please sign in to upload files.",
        variant: "destructive",
      });
      return;
    }

    // Validate file type
    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'application/pdf', 'text/plain',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];

    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Please upload images, PDFs, or text documents only.",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (10MB limit)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      toast({
        title: "File too large",
        description: "Please upload files smaller than 10MB.",
        variant: "destructive",
      });
      return;
    }

    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `chat-attachments/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('public')
      .upload(filePath, file);

    if (uploadError) {
      throw uploadError;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('public')
      .getPublicUrl(filePath);

    const attachment: Attachment = {
      id: fileName,
      name: file.name,
      type: file.type,
      url: publicUrl,
      size: file.size,
    };

    setAttachments(prev => [...prev, attachment]);
    
    toast({
      title: "File uploaded",
      description: `${file.name} has been uploaded successfully.`,
    });
  };

  const removeAttachment = (id: string) => {
    setAttachments(prev => prev.filter(att => att.id !== id));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length === 0) return;

    setIsUploading(true);
    try {
      for (const file of files) {
        await uploadFile(file);
      }
    } catch (error) {
      console.error('Error uploading files:', error);
      toast({
        title: "Upload failed",
        description: "Could not upload files. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

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
      attachments: attachments.length > 0 ? [...attachments] : undefined
    };
    setMessages((prev) => [...prev, userMessage]);
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
        body: JSON.stringify({ 
          messages: [...messages, userMessage],
          attachments: userMessage.attachments || []
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

  return (
    <Card className="fixed bottom-4 right-4 left-4 h-[calc(100vh-2rem)] shadow-2xl flex flex-col xs:left-auto xs:w-[380px] xs:h-[85vh] xs:max-h-[600px] md:bottom-6 md:right-6 z-50">
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
                    <div className="mt-2 space-y-1">
                      {message.attachments.map((attachment) => (
                        <div key={attachment.id} className="flex items-center gap-2 text-xs opacity-90">
                          {attachment.type.startsWith('image/') ? (
                            <>
                              <Image className="h-3 w-3" />
                              <a 
                                href={attachment.url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="hover:underline truncate"
                              >
                                {attachment.name}
                              </a>
                            </>
                          ) : (
                            <>
                              <FileText className="h-3 w-3" />
                              <a 
                                href={attachment.url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="hover:underline truncate"
                              >
                                {attachment.name}
                              </a>
                            </>
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
          {/* Attachments Preview */}
          {attachments.length > 0 && (
            <div className="mb-3 space-y-2">
              {attachments.map((attachment) => (
                <div key={attachment.id} className="flex items-center gap-2 p-2 bg-muted rounded-lg">
                  {attachment.type.startsWith('image/') ? (
                    <Image className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <FileText className="h-4 w-4 text-muted-foreground" />
                  )}
                  <span className="text-sm text-muted-foreground flex-1 truncate">
                    {attachment.name} ({formatFileSize(attachment.size)})
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeAttachment(attachment.id)}
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
            className="space-y-2"
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div className={`flex gap-2 transition-colors ${isDragOver ? 'bg-primary/5 rounded-lg p-2' : ''}`}>
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={isDragOver ? "Drop files here..." : "Ask me anything..."}
                disabled={isLoading}
                className="text-sm md:text-base flex-1"
              />
              <div className="flex gap-1">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={isRecording ? stopRecording : startRecording}
                  disabled={isLoading || isUploading}
                  className={`flex-shrink-0 h-9 w-9 transition-all duration-200 ${
                    isRecording 
                      ? 'bg-red-500 text-white hover:bg-red-600 animate-pulse' 
                      : 'hover:bg-primary/10'
                  }`}
                  aria-label={isRecording ? "Stop recording" : "Start voice recording"}
                >
                  {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isLoading || isUploading}
                  className="flex-shrink-0 h-9 w-9"
                  aria-label="Upload file"
                >
                  <Upload className="h-4 w-4" />
                </Button>
                <Button 
                  type="submit" 
                  size="icon" 
                  disabled={isLoading || (!input.trim() && attachments.length === 0)} 
                  className="flex-shrink-0 h-9 w-9"
                  aria-label="Send message"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,.pdf,.doc,.docx,.txt"
              onChange={handleFileUpload}
              className="hidden"
            />
            {isUploading && (
              <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-primary"></div>
                Uploading files...
              </div>
            )}
            {isDragOver && (
              <p className="text-xs text-primary text-center">
                Drop files here to upload
              </p>
            )}
          </form>
        </div>
      </CardContent>
    </Card>
  );
}
