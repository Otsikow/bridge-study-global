import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import OpenAI from "https://esm.sh/openai@4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

if (!OPENAI_API_KEY) {
  throw new Error("OPENAI_API_KEY is not configured");
}

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("Supabase credentials are not configured");
}

const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
  global: {
    headers: {
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      apikey: SUPABASE_SERVICE_ROLE_KEY,
    },
  },
});

interface SupabaseProfile {
  tenant_id: string | null;
  locale: string | null;
  role: string | null;
}

interface ZoeRequestBody {
  messages: Array<{ role: string; content: string }>;
  audience?: string | string[] | null;
  locale?: string | null;
  session_id?: string | null;
  timezone?: string | null;
  metadata?: Record<string, unknown> | null;
}

interface AuthContext {
  userId: string;
  token: string;
  payload: Record<string, unknown>;
}

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const payload = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const json = atob(payload.padEnd(payload.length + (4 - (payload.length % 4)) % 4, "="));
    return JSON.parse(json);
  } catch (error) {
    console.warn("Failed to decode JWT payload", error);
    return null;
  }
}

function authenticateRequest(req: Request): { error?: Response; context?: AuthContext } {
  const authHeader = req.headers.get("authorization") || req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return {
      error: new Response(JSON.stringify({ error: "Missing or invalid Authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }),
    };
  }

  const token = authHeader.slice(7);
  const payload = decodeJwtPayload(token);
  const role = (payload?.role || payload?.["user_role"]) as string | undefined;
  const sub = payload?.sub as string | undefined;

  if (!payload || role !== "authenticated" || !sub) {
    return {
      error: new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }),
    };
  }

  return { context: { userId: sub, token, payload } };
}

function normalizeLocale(input?: string | null): string | null {
  if (!input) return null;
  try {
    // Keep both full locale and primary language when available
    return input.trim().slice(0, 10);
  } catch {
    return null;
  }
}

function sanitizeAudience(audience?: string | string[] | null): string[] | null {
  if (!audience) return null;
  if (Array.isArray(audience)) {
    return audience
      .map((item) => item?.toString().toLowerCase())
      .filter((item) => Boolean(item)) as string[];
  }
  return [audience.toString().toLowerCase()];
}

function validateMessages(messages: ZoeRequestBody["messages"]): Response | null {
  if (!Array.isArray(messages) || messages.length === 0) {
    return new Response(JSON.stringify({ error: "Invalid request body" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (messages.length > 40) {
    return new Response(JSON.stringify({ error: "Too many messages" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  for (const message of messages) {
    if (typeof message?.content !== "string" || message.content.trim().length === 0) {
      return new Response(JSON.stringify({ error: "Message content is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (message.content.length > 4000) {
      return new Response(JSON.stringify({ error: "Message too large" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  }

  return null;
}

async function fetchProfile(userId: string): Promise<SupabaseProfile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("tenant_id, locale, role")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    console.error("Unable to load profile for Zoe chatbot", error);
    return null;
  }

  return data as SupabaseProfile | null;
}

function buildKnowledgeContext(matches: Array<Record<string, unknown>>): {
  contextMessage: string;
  sources: Array<Record<string, unknown>>;
} {
  if (!Array.isArray(matches) || matches.length === 0) {
    return {
      contextMessage:
        "No verified institutional knowledge matched this request. Provide best-practice guidance and invite the user to share more details if needed.",
      sources: [],
    };
  }

  const trimmedMatches = matches
    .filter((match) => typeof match?.content === "string")
    .slice(0, 6);

  const contextSections = trimmedMatches
    .map((match, index) => {
      const title = match.title ?? `Source ${index + 1}`;
      const category = match.category ?? "general";
      const excerpt = (match.content as string).replace(/\s+/g, " ").slice(0, 1200);
      const tags = Array.isArray(match.tags) ? (match.tags as string[]).join(", ") : "";
      const audience = Array.isArray(match.audience)
        ? (match.audience as string[]).join(", ")
        : match.audience ?? "general";
      const locale = match.locale ?? "en";

      return `Source ${index + 1} (Category: ${category}; Audience: ${audience}; Locale: ${locale}${
        tags ? `; Tags: ${tags}` : ""
      }):\n${excerpt}`;
    })
    .join("\n\n");

  const sources = trimmedMatches.map((match, index) => ({
    id: match.id,
    title: match.title,
    category: match.category,
    source_url: match.source_url,
    source_type: match.source_type,
    similarity: match.similarity,
  }));

  return {
    contextMessage: `Use only the following verified institutional knowledge to answer. When you reference a fact, cite it inline as [Source ${
      trimmedMatches.length > 1 ? "#" : "1"
    }] matching the numbering below. If the information does not answer the question, clearly say so and suggest what else is needed.\n\n${contextSections}`,
    sources,
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const auth = authenticateRequest(req);
  if (auth.error) return auth.error;

  const { context } = auth;

  try {
    const body = (await req.json()) as ZoeRequestBody;
    const validationError = validateMessages(body.messages);
    if (validationError) return validationError;

    const sessionId = typeof body.session_id === "string" && body.session_id.trim().length > 0
      ? body.session_id.trim().slice(0, 128)
      : crypto.randomUUID();

    const rawMessages = body.messages.slice(-20).map((message) => ({
      role: message.role === "assistant" ? "assistant" : "user",
      content: message.content.trim(),
    }));

    const lastUserMessage = [...rawMessages].reverse().find((msg) => msg.role === "user");
    if (!lastUserMessage) {
      return new Response(JSON.stringify({ error: "A user message is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const profile = await fetchProfile(context.userId);
    const audienceFilter = sanitizeAudience(body.audience ?? profile?.role ?? null);
    const preferredLocale = normalizeLocale(body.locale ?? profile?.locale ?? navigatorLocale(req.headers));
    const shortLocale = preferredLocale?.split("-")?.[0] ?? null;

    // Retrieve embeddings for the latest user message
    let embedding: number[] | null = null;
    try {
      const embeddingResponse = await openai.embeddings.create({
        model: "text-embedding-3-large",
        input: lastUserMessage.content,
      });
      embedding = embeddingResponse.data?.[0]?.embedding ?? null;
    } catch (error) {
      console.error("Failed to generate embeddings for Zoe", error);
    }

    let knowledgeMatches: Array<Record<string, unknown>> = [];
    if (embedding) {
      const { data: matches, error } = await supabase.rpc("match_knowledge", {
        query_embedding: embedding,
        match_count: 6,
        match_threshold: 0.7,
        audience_filter: audienceFilter,
        locale_filter: shortLocale,
        tenant_filter: profile?.tenant_id ?? null,
      });

      if (error) {
        console.error("match_knowledge RPC failed", error);
      } else if (Array.isArray(matches)) {
        knowledgeMatches = matches as Array<Record<string, unknown>>;
      }
    }

    const { contextMessage, sources } = buildKnowledgeContext(knowledgeMatches);

    // Upsert conversation metadata
    let conversationId: string | null = null;
    try {
      const { data: conversation, error: upsertError } = await supabase
        .from("zoe_chat_conversations")
        .upsert(
          {
            external_session_id: sessionId,
            user_id: context.userId,
            tenant_id: profile?.tenant_id ?? null,
            locale: preferredLocale,
            audience: audienceFilter?.join(", ") ?? null,
            last_user_message_at: new Date().toISOString(),
          },
          { onConflict: "external_session_id" }
        )
        .select("id")
        .maybeSingle();

      if (upsertError) {
        console.error("Failed to upsert Zoe conversation", upsertError);
      }

      if (conversation?.id) {
        conversationId = conversation.id as string;
      }
    } catch (error) {
      console.error("Unexpected error upserting Zoe conversation", error);
    }

    if (conversationId) {
      try {
        await supabase.from("zoe_chat_messages").insert({
          conversation_id: conversationId,
          role: "user",
          content: lastUserMessage.content,
          metadata: {
            audience: audienceFilter,
            locale: preferredLocale,
            timezone: body.timezone ?? null,
            attachments: body.metadata?.attachments ?? null,
          },
        });
      } catch (error) {
        console.error("Failed to log Zoe user message", error);
      }
    }

    const systemPrompt = `You are Zoe — a warm, professional AI assistant supporting students, universities, and global recruitment agents.Your mission:\n- Respond with empathy, clarity, and confidence.\n- Format answers with concise Markdown headings, bullet points, and bold key phrases.\n- Keep tone inclusive and globally aware; avoid slang.\n- Mention when policies differ by region and invite follow-up questions.\n- Never fabricate data. If information is unavailable, state that and recommend next steps.\n- Default to English unless the user explicitly requests another language.`;

    const formattingPrompt = `When you reply:\n1. Start with a short summary heading (e.g., **Admissions Overview**) that captures the main intent.\n2. Use bullet lists for steps, requirements, or comparisons.\n3. Highlight critical keywords in **bold**.\n4. Close with an optional next-step suggestion or invitation to ask more.\n5. If institutional sources are provided, cite them inline as [Source #] and add a "+ Sources" section (bullet list).`;

    const knowledgePrompt = contextMessage;

    const structuredMessages = [
      { role: "system" as const, content: systemPrompt },
      { role: "system" as const, content: formattingPrompt },
      { role: "system" as const, content: knowledgePrompt },
      ...rawMessages,
    ];

    const responseStart = Date.now();
    let assistantContent = "";

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.2,
      max_tokens: 900,
      stream: true,
      messages: structuredMessages,
    });

    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        try {
          for await (const chunk of completion) {
            const json = JSON.stringify(chunk);
            const choice = chunk.choices?.[0];
            const deltaContent = choice?.delta?.content;
            if (deltaContent) {
              assistantContent += deltaContent;
            }
            controller.enqueue(encoder.encode(`data: ${json}\n\n`));
          }

          if (sources.length > 0) {
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({ type: "sources", sources })}\n\n`
              )
            );
          }

          controller.enqueue(encoder.encode("data: [DONE]\n\n"));

          if (conversationId && assistantContent.trim().length > 0) {
            try {
              await supabase.from("zoe_chat_messages").insert({
                conversation_id: conversationId,
                role: "assistant",
                content: assistantContent.trim(),
                response_time_ms: Date.now() - responseStart,
                metadata: {
                  sources,
                  audience: audienceFilter,
                  locale: preferredLocale,
                },
              });

              await supabase
                .from("zoe_chat_conversations")
                .update({
                  last_assistant_message_at: new Date().toISOString(),
                })
                .eq("id", conversationId);
            } catch (error) {
              console.error("Failed to log Zoe assistant message", error);
            }
          }
        } catch (error) {
          console.error("Streaming error in Zoe chatbot", error);
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ type: "error", message: "Zoe ran into an issue while generating a response. Please try again." })}\n\n`
            )
          );
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Error in ai-chatbot function:", error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : "Unknown error",
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function navigatorLocale(headers: Headers): string | null {
  const languages = headers.get("accept-language");
  if (!languages) return null;
  const [primary] = languages.split(",");
  return primary?.trim() ?? null;
}
