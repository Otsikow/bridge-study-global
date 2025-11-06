import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
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

const buildPrompt = (title: string, excerpt?: string, tags?: string) => {
  const trimmedTags = (tags ?? "")
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean)
    .slice(0, 5);

  const promptLines = [
    "Create a photorealistic, high-resolution hero image for a university admissions blog post.",
    `Title: "${title.trim()}"`,
    excerpt?.trim()
      ? `Summary: ${excerpt.trim()}`
      : "Highlight themes of global education, student success, and opportunity.",
    trimmedTags.length
      ? `Incorporate visual motifs for: ${trimmedTags.join(", ")}.`
      : undefined,
    "Style: modern, aspirational, inclusive, natural lighting, vibrant yet professional color palette.",
    "Ensure believable lighting, lifelike people, realistic environments, and professional composition.",
    "Do not include text overlays, words, or logos.",
  ].filter(Boolean);

  return promptLines.join("\n");
};

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
    const title = typeof body?.title === "string" ? body.title : "";
    const excerpt = typeof body?.excerpt === "string" ? body.excerpt : undefined;
    const tags = typeof body?.tags === "string" ? body.tags : undefined;

    if (!title.trim()) {
      return new Response(JSON.stringify({ error: "Title is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const apiKey = Deno.env.get("GEMINI_API_KEY");
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not configured");
    }

    const prompt = buildPrompt(title, excerpt, tags);

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-001:predict?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          instances: [
            {
              prompt: prompt,
            },
          ],
          parameters: {
            sampleCount: 1,
            aspectRatio: "16:9",
            negativePrompt: "text, words, captions, watermark, logo, low resolution, blurry, distorted",
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Gemini API error", response.status, errorText);
      if (response.status === 429) {
        return new Response(
          JSON.stringify({
            error: "Rate limit reached. Please try again soon.",
          }),
          {
            status: 429,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }

      throw new Error(`Gemini API error: ${response.status}`);
    }

    const result = await response.json();
    const imageBase64 = result?.predictions?.[0]?.bytesBase64Encoded;

    if (!imageBase64) {
      console.error("Gemini API response missing image", result);
      return new Response(
        JSON.stringify({
          error: "Gemini API did not return an image",
        }),
        {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const mimeType = result?.predictions?.[0]?.mimeType || "image/png";

    return new Response(
      JSON.stringify({ imageBase64, mimeType }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("generate-blog-image error", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
