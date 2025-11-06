import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const payload = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const json = atob(payload.padEnd(payload.length + (4 - (payload.length % 4)) % 4, "="));
    return JSON.parse(json);
  } catch {
    return null;
  }
}

function requireAuthenticatedUser(req: Request): Response | null {
  const authHeader = req.headers.get("authorization") || req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Missing or invalid Authorization header" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const token = authHeader.slice(7);
  const payload = decodeJwtPayload(token);
  const role = (payload?.role || payload?.["user_role"]) as string | undefined;
  const sub = payload?.sub as string | undefined;

  if (!payload || role !== "authenticated" || !sub) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  return null;
}

function sanitizeStringArray(value: unknown, maxItems: number) {
  if (!Array.isArray(value)) return [] as string[];
  return value
    .slice(0, maxItems)
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter((item) => item.length > 0);
}

function extractJsonObject(content: string) {
  const start = content.indexOf("{");
  const end = content.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) {
    throw new Error("No JSON object found in OpenAI response");
  }

  const jsonString = content.slice(start, end + 1);
  return JSON.parse(jsonString);
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

  const authError = requireAuthenticatedUser(req);
  if (authError) return authError;

  try {
    const body = await req.json();
    const query = typeof body?.query === "string" ? body.query.trim() : "";
    const focusAreas = sanitizeStringArray(body?.focusAreas, 5);
    const resultCount = Math.max(1, Math.min(Number(body?.resultCount) || 3, 5));

    if (!query) {
      return new Response(JSON.stringify({ error: "Query is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (query.length > 500) {
      return new Response(JSON.stringify({ error: "Query is too long" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    if (!OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY is not configured");
    }

    console.log("Generating AI university search for:", { query, focusAreas, resultCount });

    const systemPrompt = `You are Global Education Gateway's live university and scholarship research analyst. ` +
      `Return precise, up-to-date guidance about universities, degree programs, and scholarships globally. ` +
      `Respond with a single JSON object that follows this exact TypeScript interface:
{
  "summary": string;
  "universities": Array<{
    "name": string;
    "country": string | null;
    "city": string | null;
    "website": string | null;
    "globalRanking": string | null;
    "tuitionRange": string | null;
    "acceptanceRate": string | null;
    "standoutPrograms": Array<{
      "name": string;
      "level": string | null;
      "duration": string | null;
      "overview": string | null;
      "admissionsInsight": string | null;
      "careerOutlook": string | null;
      "scholarshipHighlight": string | null;
    }>;
    "scholarships": Array<{
      "name": string;
      "amount": string | null;
      "deadline": string | null;
      "eligibility": string | null;
      "link": string | null;
    }>;
    "notes": string[];
  }>;
  "scholarships": Array<{
    "name": string;
    "provider": string | null;
    "amount": string | null;
    "deadline": string | null;
    "eligibility": string | null;
    "link": string | null;
  }>;
  "nextSteps": string[];
  "sources": string[];
}

Rules:
- Never invent data; note uncertainty inside "notes" when details are unclear.
- Prefer 2023-2025 information. Mention when values are approximate.
- Include at most ${resultCount} universities.
- Include concrete scholarships aligned with the query, avoiding duplicates between sections.
- Keep string values concise (<= 240 characters) but informative.
- Use null for any field with no trustworthy data.`;

    const userPrompt = {
      query,
      focusAreas,
      resultCount,
      instructions: "Prioritize relevance to the student's interests and highlight actionable next steps."
    };

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: JSON.stringify(userPrompt) },
        ],
        temperature: 0.4,
        max_tokens: 1400,
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenAI API error:", response.status, errorText);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const messageContent = data.choices?.[0]?.message?.content;

    if (!messageContent || typeof messageContent !== "string") {
      throw new Error("Received empty response from OpenAI");
    }

    let structuredResults: unknown;
    try {
      structuredResults = JSON.parse(messageContent);
    } catch (parseError) {
      console.warn("Failed to parse OpenAI response directly", parseError);
      structuredResults = extractJsonObject(messageContent);
    }

    console.log("AI university search generated successfully");

    return new Response(JSON.stringify({ results: structuredResults }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in ai-university-search function:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
