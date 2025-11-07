import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Sparkles, Send, Bot, User, Loader2, MessageSquareQuote } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { getSupabaseBrowserConfig } from "@/lib/supabaseClientConfig";

type AssistantRole = "user" | "assistant";

interface AssistantMessage {
  id: string;
  role: AssistantRole;
  content: string;
}

const STORAGE_KEY = "university-zoe-assistant-session";
const { url: SUPABASE_URL, functionsUrl: SUPABASE_FUNCTIONS_URL } = getSupabaseBrowserConfig();
const FUNCTIONS_BASE = (SUPABASE_FUNCTIONS_URL ?? `${SUPABASE_URL}/functions/v1`).replace(/\/+$/, "");

const INTRO_MESSAGE =
  "Hello! I'm Zoe, your AI assistant for university partnerships. Ask me about agent engagement, application health, or how to accelerate admissions workflows.";

const SUGGESTIONS: { label: string; prompt: string }[] = [
  {
    label: "Agent pipeline brief",
    prompt: "Summarize which agents have students at risk this week and where to focus follow-up.",
  },
  {
    label: "Admissions update draft",
    prompt: "Draft a partner update announcing new program intake dates and key deadlines.",
  },
  {
    label: "Document checklist",
    prompt: "List the critical documents agents should provide to move CAS cases forward.",
  },
  {
    label: "FAQ response",
    prompt: "How should I answer an agent asking about scholarship availability for postgraduate applicants?",
  },
];

const createMessageId = (prefix: string) =>
  `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

export function UniversityZoeAssistant() {
  const { session, profile } = useAuth();
  const { toast } = useToast();

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<AssistantMessage[]>([
    { id: "assistant-intro", role: "assistant", content: INTRO_MESSAGE },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [activeSuggestion, setActiveSuggestion] = useState<string | null>(null);

  const scrollAreaRef = useRef<HTMLDivElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    let existing = window.localStorage.getItem(STORAGE_KEY);
    if (!existing) {
      existing = crypto.randomUUID();
      window.localStorage.setItem(STORAGE_KEY, existing);
    }
    setSessionId(existing);
  }, []);

  useEffect(() => {
    const viewport = scrollAreaRef.current?.querySelector(
      "[data-radix-scroll-area-viewport]",
    ) as HTMLDivElement | null;
    if (!viewport || !messagesEndRef.current) return;

    requestAnimationFrame(() => {
      viewport.scrollTo({
        top: messagesEndRef.current?.offsetTop ?? viewport.scrollHeight,
        behavior: "smooth",
      });
    });
  }, [messages, isLoading]);

  const audience = useMemo(() => profile?.role ?? "partner", [profile?.role]);

  const updateAssistantMessage = useCallback((messageId: string, chunk: string) => {
    setMessages((prev) =>
      prev.map((message) =>
        message.id === messageId
          ? {
              ...message,
              content: (message.content ?? "") + chunk,
            }
          : message,
      ),
    );
  }, []);

  const sendMessage = useCallback(async () => {
    const trimmed = inputValue.trim();
    if (!trimmed || isLoading) {
      return;
    }
    if (!session?.access_token) {
      toast({
        title: "Sign in required",
        description: "Please sign in to chat with Zoe.",
        variant: "destructive",
      });
      return;
    }
    if (!sessionId) {
      toast({
        title: "Session not ready",
        description: "Please wait a moment and try again.",
      });
      return;
    }

    const userMessageId = createMessageId("user");
    const assistantMessageId = createMessageId("assistant");

    const nextHistory: AssistantMessage[] = [
      ...messages,
      { id: userMessageId, role: "user", content: trimmed },
      { id: assistantMessageId, role: "assistant", content: "" },
    ];

    setMessages(nextHistory);
    setInputValue("");
    setActiveSuggestion(null);
    setIsLoading(true);

    try {
      const payloadHistory = nextHistory
        .filter((message) => message.id !== assistantMessageId)
        .map((message) => ({
          role: message.role,
          content: message.content,
        }));

      const response = await fetch(`${FUNCTIONS_BASE}/ai-chatbot`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          session_id: sessionId,
          audience,
          locale: typeof navigator !== "undefined" ? navigator.language : "en",
          messages: payloadHistory,
          metadata: {
            surface: "university-messages-sidebar",
          },
        }),
      });

      if (!response.ok) {
        throw new Error("Zoe could not respond to that prompt.");
      }

      if (!response.body) {
        const text = await response.text();
        updateAssistantMessage(assistantMessageId, text);
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let done = false;

      while (!done) {
        const { value, done: streamDone } = await reader.read();
        if (streamDone) break;
        if (!value) continue;
        const chunk = decoder.decode(value, { stream: true });
        const events = chunk.split("\n\n").filter(Boolean);

        for (const event of events) {
          if (!event.startsWith("data:")) continue;
          const data = event.replace(/^data:\s*/, "").trim();

          if (!data) continue;
          if (data === "[DONE]") {
            done = true;
            break;
          }

          try {
            const parsed = JSON.parse(data);
            if (parsed?.type === "error") {
              throw new Error(parsed.message ?? "Zoe encountered an issue.");
            }
            const textChunk = parsed?.choices?.[0]?.delta?.content as string | undefined;
            if (textChunk) {
              updateAssistantMessage(assistantMessageId, textChunk);
            }
          } catch (error) {
            console.error("Failed to parse Zoe response chunk", error);
          }
        }
      }
    } catch (error) {
      console.error("Zoe assistant error", error);
      updateAssistantMessage(
        nextHistory[nextHistory.length - 1].id,
        error instanceof Error ? error.message : "Zoe is unavailable right now. Please try again later.",
      );
      toast({
        title: "Zoe is unavailable",
        description:
          error instanceof Error ? error.message : "Something went wrong while contacting Zoe.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [audience, inputValue, isLoading, messages, session?.access_token, sessionId, toast, updateAssistantMessage]);

  const handleSuggestion = useCallback((prompt: string) => {
    setInputValue(prompt);
    setActiveSuggestion(prompt);
  }, []);

  return (
    <Card className="flex h-full w-full flex-col rounded-none border-slate-800/60 bg-slate-900/50 text-slate-100 shadow-lg shadow-slate-950/40">
      <CardHeader className="border-b border-slate-800/60 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <Badge variant="outline" className="border-blue-500/40 text-blue-200">
              Zoe
            </Badge>
            <CardTitle className="mt-2 text-lg font-semibold text-white">
              Partner Intelligence Assistant
            </CardTitle>
            <p className="text-xs text-slate-400">
              Tap into Zoe for quick answers on agent engagement, admissions blockers, and program updates.
            </p>
          </div>
          <Sparkles className="h-5 w-5 text-blue-300" />
        </div>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col p-0">
        <div className="space-y-4 p-4">
          <div>
            <p className="text-xs font-semibold uppercase text-slate-400">Suggested prompts</p>
            <div className="mt-3 grid gap-2">
              {SUGGESTIONS.map((suggestion) => (
                <button
                  key={suggestion.label}
                  onClick={() => handleSuggestion(suggestion.prompt)}
                  className="flex items-start gap-3 rounded-xl border border-slate-800/70 bg-slate-900/70 p-3 text-left transition hover:border-blue-600/50 hover:bg-slate-900/90"
                >
                  <MessageSquareQuote className="mt-0.5 h-4 w-4 text-blue-300" />
                  <div>
                    <p className="text-xs font-semibold text-slate-200">{suggestion.label}</p>
                    <p className="mt-1 text-xs text-slate-400">{suggestion.prompt}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
          <Separator className="bg-slate-800/60" />
          <div className="flex items-center gap-3 rounded-xl border border-slate-800/70 bg-slate-900/70 p-3">
            <Bot className="h-5 w-5 text-blue-300" />
            <div className="text-xs text-slate-300">
              Zoe uses your university context to surface insights securely. No sensitive data is shared externally.
            </div>
          </div>
        </div>
        <Separator className="bg-slate-800/60" />
        <div className="flex flex-1 flex-col overflow-hidden">
          <ScrollArea ref={scrollAreaRef} className="flex-1 px-4">
            <div className="space-y-4 py-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className="flex items-start gap-3 rounded-xl border border-slate-800/60 bg-slate-900/70 p-3"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-800/70">
                    {message.role === "assistant" ? (
                      <Bot className="h-4 w-4 text-blue-300" />
                    ) : (
                      <User className="h-4 w-4 text-slate-300" />
                    )}
                  </div>
                  <p className="text-sm leading-relaxed text-slate-200 whitespace-pre-wrap">
                    {message.content}
                  </p>
                </div>
              ))}
              {isLoading && (
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Zoe is composing a reply…
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>
          <div className="border-t border-slate-800/60 bg-slate-950/40 p-4">
            <label htmlFor="zoe-input" className="sr-only">
              Message Zoe
            </label>
            <Textarea
              id="zoe-input"
              value={inputValue}
              onChange={(event) => setInputValue(event.target.value)}
              placeholder={
                activeSuggestion
                  ? "Press Enter to send your prompt to Zoe…"
                  : "Type a question about your partnerships or admissions..."
              }
              className="min-h-[120px] resize-none border-slate-800/60 bg-slate-900/70 text-sm text-slate-100 placeholder:text-slate-500 focus-visible:ring-blue-500/60"
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  void sendMessage();
                }
              }}
            />
            <div className="mt-3 flex items-center justify-between gap-2">
              <p className="text-[10px] uppercase tracking-wide text-slate-500">
                Zoe references secure programme and agent data in your tenant.
              </p>
              <Button
                size="sm"
                className="gap-2 rounded-full bg-blue-600 px-4 py-2 text-blue-50 shadow-lg hover:bg-blue-500"
                onClick={() => void sendMessage()}
                disabled={isLoading || inputValue.trim().length === 0}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Ask Zoe
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default UniversityZoeAssistant;
