import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const json = atob(payload.padEnd(payload.length + (4 - (payload.length % 4)) % 4, '='));
    return JSON.parse(json);
  } catch {
    return null;
  }
}

function requireAuthenticatedUser(req: Request): Response | null {
  const authHeader = req.headers.get('authorization') || req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return new Response(JSON.stringify({ error: 'Missing or invalid Authorization header' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
  const token = authHeader.slice(7);
  const payload = decodeJwtPayload(token);
  const role = (payload?.role || payload?.['user_role']) as string | undefined;
  const sub = payload?.sub as string | undefined;
  if (!payload || role !== 'authenticated' || !sub) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
  return null;
}

interface ContactEmailRequest {
  name: string;
  email: string;
  message: string;
  whatsapp?: string;
}

const sendEmail = async (to: string[], subject: string, html: string) => {
  const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: "Global Education Gateway <info@globaleducationgateway.com>",
      to,
      subject,
      html,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Resend API error: ${error}`);
  }

  return await response.json();
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const authError = requireAuthenticatedUser(req);
  if (authError) return authError;

  try {
    const { name, email, message, whatsapp }: ContactEmailRequest = await req.json();
    if (
      typeof name !== 'string' ||
      typeof email !== 'string' ||
      typeof message !== 'string' ||
      (whatsapp !== undefined && typeof whatsapp !== 'string') ||
      name.length === 0 ||
      email.length === 0 ||
      message.length === 0 ||
      name.length > 100 ||
      email.length > 255 ||
      message.length > 2000 ||
      (whatsapp !== undefined && whatsapp.length > 30)
    ) {
      return new Response(JSON.stringify({ error: 'Invalid request body' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log("Sending contact email from:", email, "name:", name);

    const safeName = escapeHtml(name);
    const safeEmail = escapeHtml(email);
    const safeWhatsapp = whatsapp ? escapeHtml(whatsapp) : "Not provided";
    const safeMessage = escapeHtml(message).replace(/\n/g, "<br>");

    // Send notification to admin
    const adminEmailResponse = await sendEmail(
      ["info@globaleducationgateway.com"],
      `New Contact Form Submission from ${name}`,
      `
        <h2>New Contact Form Submission</h2>
        <p><strong>Name:</strong> ${safeName}</p>
        <p><strong>Email:</strong> ${safeEmail}</p>
        <p><strong>WhatsApp:</strong> ${safeWhatsapp}</p>
        <p><strong>Message:</strong></p>
        <p>${safeMessage}</p>
      `
    );

    // Send confirmation to user
    const userEmailResponse = await sendEmail(
      [email],
      "Thank you for contacting Global Education Gateway",
      `
        <h1>Thank you for reaching out, ${safeName}!</h1>
        <p>We have received your message and will get back to you as soon as possible.</p>
        <p><strong>Your WhatsApp:</strong> ${safeWhatsapp}</p>
        <p><strong>Your message:</strong></p>
        <p>${safeMessage}</p>
        <br>
        <p>Best regards,<br>Global Education Gateway Team</p>
      `
    );

    console.log("Emails sent successfully:", { adminEmailResponse, userEmailResponse });

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: unknown) {
    console.error("Error in send-contact-email function:", error);
    const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      },
    );
  }
};

serve(handler);
