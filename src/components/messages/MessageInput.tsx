import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Send, Smile, Image as ImageIcon, Mic, Square, Loader2, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { MessageAttachment, SendMessagePayload } from '@/hooks/useMessages';

interface MessageInputProps {
  onSendMessage: (payload: SendMessagePayload) => void;
  onStartTyping: () => void;
  onStopTyping: () => void;
  disabled?: boolean;
}

const EMOJI_CATEGORIES = {
  'Smileys & People': ['😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '🙃', '😉', '😊', '😇', '🥰', '😍', '🤩', '😘', '😗', '😚', '😙', '🥲', '😋', '😛', '😜', '🤪', '😝', '🤑', '🤗', '🤭', '🤫', '🤔'],
  'Gestures': ['👍', '👎', '👏', '🙌', '👐', '🤲', '🤝', '🙏', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '👇', '☝️', '👋', '🤚', '🖐️', '✋', '🖖', '💪'],
  'Hearts': ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❤️‍🔥', '❤️‍🩹', '💕', '💞', '💓', '💗', '💖', '💘', '💝'],
  'Objects': ['📱', '💻', '⌨️', '🖥️', '🖨️', '📷', '📸', '📹', '🎥', '📞', '☎️', '📟', '📠', '📺', '📻', '⏰', '⏱️', '⏲️', '🕰️', '⌛', '⏳', '📡', '🔋', '🔌', '💡', '🔦'],
  'Activities': ['⚽', '🏀', '🏈', '⚾', '🥎', '🎾', '🏐', '🏉', '🥏', '🎱', '🏓', '🏸', '🏒', '🏑', '🥍', '🏏', '🪀', '🥅', '⛳', '🪁', '🏹', '🎣', '🤿', '🥊', '🥋'],
};

const MAX_ATTACHMENTS = 5;
const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;

const createLocalAttachmentId = () =>
  typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

export function MessageInput({
  onSendMessage,
  onStartTyping,
  onStopTyping,
  disabled = false
}: MessageInputProps) {
  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [attachments, setAttachments] = useState<MessageAttachment[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastTypingEventRef = useRef<number>(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Cleanup typing timeout and notify stop typing on unmount
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      onStopTyping();
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop?.();
        } catch (error) {
          console.error('Error stopping speech recognition on unmount:', error);
        }
        recognitionRef.current = null;
      }
    };
  }, [onStopTyping]);

  const emitStopTyping = useCallback(() => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }

    setIsTyping(prev => {
      if (prev) {
        return false;
      }
      return prev;
    });

    lastTypingEventRef.current = 0;
    onStopTyping();
  }, [onStopTyping]);

  const scheduleStopTyping = useCallback(() => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      emitStopTyping();
    }, 3000);
  }, [emitStopTyping]);

  const emitTypingEvent = useCallback(() => {
    const now = Date.now();

    if (!isTyping) {
      setIsTyping(true);
      onStartTyping();
      lastTypingEventRef.current = now;
      return;
    }

  if (now - lastTypingEventRef.current >= 2000) {
    onStartTyping();
    lastTypingEventRef.current = now;
  }
}, [isTyping, onStartTyping]);

const handleAttachmentSelection = useCallback(async (fileList: FileList | null) => {
  if (!fileList || disabled) return;

  const files = Array.from(fileList);
  if (files.length === 0) return;

  const remainingSlots = MAX_ATTACHMENTS - attachments.length;
  if (remainingSlots <= 0) {
    toast({
      title: 'Attachment limit reached',
      description: `You can add up to ${MAX_ATTACHMENTS} images per message.`,
      variant: 'destructive',
    });
    return;
  }

  const selectedFiles = files.slice(0, remainingSlots);
  if (files.length > remainingSlots) {
    toast({
      title: 'Too many images selected',
      description: `Only the first ${remainingSlots} image${remainingSlots > 1 ? 's' : ''} were added.`,
    });
  }

  setIsUploading(true);

  try {
    const uploaded: MessageAttachment[] = [];

    for (const file of selectedFiles) {
      if (!file.type.startsWith('image/')) {
        toast({
          title: 'Unsupported file',
          description: 'Only image files are supported at the moment.',
          variant: 'destructive',
        });
        continue;
      }

      if (file.size > MAX_IMAGE_SIZE_BYTES) {
        toast({
          title: 'Image too large',
          description: 'Images must be smaller than 5MB.',
          variant: 'destructive',
        });
        continue;
      }

      const extension = file.name.split('.').pop() || file.type.split('/')[1] || 'png';
      const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${extension}`;
      const filePath = `message-attachments/${fileName}`;

      const { error: uploadError } = await supabase.storage.from('public').upload(filePath, file);

      if (uploadError) {
        console.error('Attachment upload error:', uploadError);
        toast({
          title: 'Upload failed',
          description: uploadError.message || 'Unable to upload the selected image.',
          variant: 'destructive',
        });
        continue;
      }

      const { data: urlData } = supabase.storage.from('public').getPublicUrl(filePath);

      if (!urlData?.publicUrl) {
        toast({
          title: 'Upload failed',
          description: 'Could not retrieve the uploaded image.',
          variant: 'destructive',
        });
        continue;
      }

      uploaded.push({
        id: createLocalAttachmentId(),
        type: 'image',
        url: urlData.publicUrl,
        preview_url: urlData.publicUrl,
        name: file.name,
        size: file.size,
        mime_type: file.type,
        meta: {
          storagePath: filePath,
        },
      });
    }

    if (uploaded.length > 0) {
      setAttachments(prev => [...prev, ...uploaded]);
      toast({
        title: uploaded.length === 1 ? 'Image added' : `${uploaded.length} images added`,
        description: 'Image attachments are ready to send.',
      });
    }
  } catch (error) {
    console.error('Unexpected attachment upload error:', error);
    toast({
      title: 'Upload error',
      description: 'Something went wrong while uploading the image.',
      variant: 'destructive',
    });
  } finally {
    setIsUploading(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }
}, [attachments.length, disabled, toast]);

const handleAttachmentButtonClick = useCallback(() => {
  if (disabled) return;

  const remainingSlots = MAX_ATTACHMENTS - attachments.length;
  if (remainingSlots <= 0) {
    toast({
      title: 'Attachment limit reached',
      description: `You can add up to ${MAX_ATTACHMENTS} images per message.`,
    });
    return;
  }

  fileInputRef.current?.click();
}, [attachments.length, disabled, toast]);

const handleRemoveAttachment = useCallback((attachmentId: string) => {
  setAttachments(prev => prev.filter(attachment => attachment.id !== attachmentId));
}, []);

const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setMessage(value);

    // Typing indicator logic
    if (value.trim()) {
      emitTypingEvent();
      scheduleStopTyping();
    } else {
      emitStopTyping();
    }
  };

  const handleSend = () => {
    const trimmed = message.trim();
    const hasText = trimmed.length > 0;
    const hasAttachments = attachments.length > 0;

    if ((!hasText && !hasAttachments) || disabled || isUploading) {
      return;
    }

    onSendMessage({
      content: message,
      attachments,
      messageType: hasAttachments
        ? attachments.every(attachment => attachment.type === 'image')
          ? 'image'
          : undefined
        : 'text',
    });

    setMessage('');
    setAttachments([]);
    emitStopTyping();

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    textareaRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!isUploading) {
        handleSend();
      }
    }
  };

  const handleBlur = () => {
    if (message.trim()) {
      emitStopTyping();
    } else if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
  };

  const insertEmoji = (emoji: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const newMessage = message.slice(0, start) + emoji + message.slice(end);
    
    setMessage(newMessage);
    
    // Focus and set cursor position after emoji
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + emoji.length, start + emoji.length);
    }, 0);
  };

  const handleToggleRecording = useCallback(() => {
    if (disabled) return;

    if (isRecording) {
      try {
        recognitionRef.current?.stop?.();
      } catch (error) {
        console.error('Error stopping speech recognition:', error);
      }
      return;
    }

    if (typeof window === 'undefined') {
      toast({
        title: 'Voice input unavailable',
        description: 'Speech recognition is not supported in this environment.',
        variant: 'destructive',
      });
      return;
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      toast({
        title: 'Voice input unavailable',
        description: 'Your browser does not support voice recognition.',
        variant: 'destructive',
      });
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsRecording(true);
      emitTypingEvent();
      scheduleStopTyping();
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event);
      setIsRecording(false);
      recognition.stop();
      recognitionRef.current = null;
      toast({
        title: 'Voice input error',
        description: 'Something went wrong while listening.',
        variant: 'destructive',
      });
    };

    recognition.onend = () => {
      setIsRecording(false);
      recognitionRef.current = null;
      emitStopTyping();
    };

    recognition.onresult = (event: any) => {
      let transcript = '';
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const result = event.results[i];
        if (result?.[0]?.transcript) {
          transcript += result[0].transcript;
        }
      }

      if (transcript) {
        setMessage(prev => {
          const combined = prev ? `${prev.trim()} ${transcript.trim()}` : transcript.trim();
          return combined.trimStart();
        });
        emitTypingEvent();
        scheduleStopTyping();
      }
    };

    recognitionRef.current = recognition;

    try {
      recognition.start();
    } catch (error) {
      console.error('Speech recognition start error:', error);
      toast({
        title: 'Voice input error',
        description: 'Unable to start listening.',
        variant: 'destructive',
      });
      recognitionRef.current = null;
      setIsRecording(false);
    }
  }, [disabled, emitStopTyping, emitTypingEvent, isRecording, scheduleStopTyping, toast]);

  return (
    <div className="p-4 border-t bg-background">
      <div className="flex items-end gap-2">
        {/* Emoji Picker */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="flex-shrink-0"
              disabled={disabled}
            >
              <Smile className="h-5 w-5" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-2" align="start">
            <div className="max-h-72 overflow-y-auto">
              {Object.entries(EMOJI_CATEGORIES).map(([category, emojis]) => (
                <div key={category} className="mb-3">
                  <p className="text-xs font-semibold text-muted-foreground mb-2 px-2">
                    {category}
                  </p>
                  <div className="grid grid-cols-8 gap-1">
                    {emojis.map((emoji) => (
                      <button
                        key={emoji}
                        onClick={() => insertEmoji(emoji)}
                        className="p-2 hover:bg-accent rounded transition-colors text-xl"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </PopoverContent>
        </Popover>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(event) => handleAttachmentSelection(event.target.files)}
          />

          <Button
            variant="ghost"
            size="icon"
            className="flex-shrink-0"
            disabled={disabled || isUploading || attachments.length >= MAX_ATTACHMENTS}
            onClick={handleAttachmentButtonClick}
            title="Attach image"
          >
            <ImageIcon className="h-5 w-5" />
          </Button>

          <Button
            variant={isRecording ? 'destructive' : 'ghost'}
            size="icon"
            className="flex-shrink-0"
            disabled={disabled || isUploading}
            onClick={handleToggleRecording}
            title={isRecording ? 'Stop voice input' : 'Voice to text'}
          >
            {isRecording ? <Square className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
          </Button>

        {/* Message Input */}
        <div className="flex-1 relative">
          <Textarea
            ref={textareaRef}
            value={message}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onBlur={handleBlur}
            placeholder="Type a message..."
            disabled={disabled}
            className="min-h-[44px] max-h-32 resize-none pr-12"
            rows={1}
          />
        </div>

        {/* Send Button */}
          <Button
            onClick={handleSend}
            disabled={disabled || isUploading || (!message.trim() && attachments.length === 0)}
            size="icon"
            className="flex-shrink-0"
          >
            <Send className="h-5 w-5" />
          </Button>
      </div>
        {(attachments.length > 0 || isUploading) && (
          <div className="flex flex-col gap-2 mt-3 px-2">
            {isUploading && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Uploading image...
              </div>
            )}
            {attachments.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {attachments.map((attachment) => (
                  <div key={attachment.id} className="relative h-20 w-20 rounded-lg border overflow-hidden">
                    <img
                      src={attachment.preview_url || attachment.url}
                      alt={attachment.name || 'Attachment preview'}
                      className="h-full w-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveAttachment(attachment.id)}
                      className="absolute -top-2 -right-2 rounded-full border bg-background p-1 shadow-sm"
                      aria-label="Remove image"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        <p className="text-xs text-muted-foreground mt-3 px-2">
          Press Enter to send, Shift+Enter for new line
        </p>
    </div>
  );
}
