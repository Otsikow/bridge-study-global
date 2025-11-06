import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const payload = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const json = atob(
      payload.padEnd(payload.length + (4 - (payload.length % 4)) % 4, "="),
    );
    return JSON.parse(json);
  } catch {
    return null;
  }
}

function requireAuthenticatedUser(req: Request): Response | null {
  const authHeader =
    req.headers.get("authorization") || req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(
      JSON.stringify({ error: "Missing or invalid Authorization header" }),
      {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }

  const token = authHeader.slice(7);
  const payload = decodeJwtPayload(token);
  const role = (payload?.role || payload?.["user_role"]) as
    | string
    | undefined;
  const sub = payload?.sub as string | undefined;
  if (!payload || role !== "authenticated" || !sub) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  return null;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // Require POST
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Authenticate user
  const authError = requireAuthenticatedUser(req);
  if (authError) return authError;

  try {
    const contentType = req.headers.get("content-type") || "";
    if (!contentType.toLowerCase().includes("multipart/form-data")) {
      return new Response(
        JSON.stringify({ error: "Expected multipart/form-data" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const formData = await req.formData();
    const audioFile = formData.get("audio");

    if (!(audioFile instanceof File)) {
      return new Response(
        JSON.stringify({ error: "Missing or invalid audio file" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // File size guard (~25MB typical Whisper limit)
    const maxBytes = 25 * 1024 * 1024;
    if (audioFile.size > maxBytes) {
      return new Response(
        JSON.stringify({ error: "Audio file too large (max 25MB)" }),
        {
          status: 413,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    if (!OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY is not configured");
    }

    console.log("Sending to OpenAI Whisper API...");

    // Prepare form data for OpenAI
    const openaiFormData = new FormData();
    const filename = audioFile.name || "audio.webm";
    openaiFormData.append(
      "file",
      audioFile,
      filename,
    );
    // Prefer gpt-4o-mini-transcribe, fallback to whisper-1
    openaiFormData.append("model", "gpt-4o-mini-transcribe");

    let response = await fetch(
      "https://api.openai.com/v1/audio/transcriptions",
      {
        method: "POST",
        headers: { Authorization: `Bearer ${OPENAI_API_KEY}` },
        body: openaiFormData,
      },
    );

    if (!response.ok) {
      const primaryError = await response.text();
      console.warn(
        "Primary transcription failed, retrying with whisper-1:",
        response.status,
        primaryError,
      );

      // Retry with whisper-1
      const fallbackForm = new FormData();
      fallbackForm.append("file", audioFile, filename);
      fallbackForm.append("model", "whisper-1");

      response = await fetch(
        "https://api.openai.com/v1/audio/transcriptions",
        {
          method: "POST",
          headers: { Authorization: `Bearer ${OPENAI_API_KEY}` },
          body: fallbackForm,
        },
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error("OpenAI transcription error:", response.status, errorText);

        if (response.status === 429) {
          return new Response(
            JSON.stringify({
              error: "Rate limit exceeded. Please try again later.",
            }),
            {
              status: 429,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            },
          );
        }

        return new Response(
          JSON.stringify({ error: "Transcription failed" }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }
    }

    const data = await response.json();
    const text: string | undefined = data?.text;

    console.log("Transcription successful:", text);

    return new Response(
      JSON.stringify({ text: text || "" }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("Error in audio-transcribe function:", error);
    const message =
      error instanceof Error ? error.message : "Unknown error occurred";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
