import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.8";

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
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

function base64ToUint8Array(base64: string): Uint8Array {
  const binary = atob(base64);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

const supabaseUrl = Deno.env.get("SUPABASE_URL");
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be configured");
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false },
});

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
    const name = typeof body?.name === "string" ? body.name.trim() : "";
    const universityId = typeof body?.universityId === "string" ? body.universityId : undefined;
    const city = typeof body?.city === "string" ? body.city.trim() : "";
    const country = typeof body?.country === "string" ? body.country.trim() : "";
    const tone = typeof body?.tone === "string" ? body.tone.trim() : "";

    if (!name) {
      return new Response(JSON.stringify({ error: "University name is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const nanaApiKey = Deno.env.get("NANA_BANANA_API_KEY");
    if (!nanaApiKey) {
      throw new Error("NANA_BANANA_API_KEY is not configured");
    }

    const nanaApiUrl = Deno.env.get("NANA_BANANA_API_URL") ?? "https://api.nanabanana.ai/v1";

    const promptParts = [
      `Create a photorealistic 16:9 hero image for ${name}.`,
      city && country ? `Location: ${city}, ${country}.` : city ? `City: ${city}.` : country ? `Country: ${country}.` : undefined,
      "Depict a welcoming campus scene with modern architecture, lush landscaping, and diverse international students.",
      "Use aspirational, cinematic lighting and professional composition suitable for a homepage spotlight.",
      tone ? `Style guidance: ${tone}.` : undefined,
      "Exclude text, logos, or watermarks. Focus on authentic details and vibrant, premium aesthetics.",
    ].filter(Boolean);

    const prompt = promptParts.join("\n");

    const response = await fetch(`${nanaApiUrl.replace(/\/$/, "")}/images/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${nanaApiKey}`,
      },
      body: JSON.stringify({
        prompt,
        aspect_ratio: "16:9",
        output_format: "base64",
        enhance: true,
        preset: "campus_spotlight_v1",
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Nana Banana API error", response.status, errorText);
      let message = "Failed to generate image";
      if (response.status === 429) {
        message = "Nana Banana rate limit reached. Please try again soon.";
      } else if (response.status === 401 || response.status === 403) {
        message = "Nana Banana API key is invalid or lacks permissions.";
      } else if (response.status === 402) {
        message = "Nana Banana workspace requires additional credits.";
      }
      return new Response(JSON.stringify({ error: message }), {
        status: response.status === 200 ? 500 : response.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const nanaResult = await response.json();
    const imageBase64: string | undefined =
      nanaResult?.data?.image_base64 ?? nanaResult?.image_base64 ?? nanaResult?.image?.base64;
    const mimeType: string =
      nanaResult?.data?.mime_type ?? nanaResult?.mime_type ?? nanaResult?.image?.mime_type ?? "image/png";

    if (!imageBase64) {
      console.error("Nana Banana response missing image", nanaResult);
      return new Response(JSON.stringify({ error: "Image generator did not return an image" }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const cleanBase64 = imageBase64.includes(",") ? imageBase64.split(",")[1] : imageBase64;
    const bytes = base64ToUint8Array(cleanBase64);
    const blob = new Blob([bytes as BlobPart], { type: mimeType });

    const fileBase = universityId ?? crypto.randomUUID();
    const timestamp = new Date().toISOString().replace(/[-:]/g, "").split(".")[0];
    const extension = mimeType.includes("jpeg") ? "jpg" : mimeType.split("/")[1] ?? "png";
    const filePath = `featured-universities/${fileBase}-${timestamp}.${extension}`;

    const { error: uploadError } = await supabase.storage.from("public").upload(filePath, blob, {
      contentType: mimeType,
      cacheControl: "3600",
      upsert: true,
    });

    if (uploadError) {
      console.error("Supabase upload error", uploadError);
      return new Response(JSON.stringify({ error: "Unable to store generated image" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: publicUrlData } = supabase.storage.from("public").getPublicUrl(filePath);
    const imageUrl = publicUrlData.publicUrl;

    return new Response(
      JSON.stringify({
        imageUrl,
        filePath,
        prompt,
        mimeType,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("generate-university-image error", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
