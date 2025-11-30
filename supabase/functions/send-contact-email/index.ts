import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

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

const contactEmailSchema = z.object({
  name: z
    .string({ required_error: "Name is required" })
    .min(1, "Name is required")
    .max(100, "Name must be at most 100 characters"),
  email: z
    .string({ required_error: "Email is required" })
    .min(1, "Email is required")
    .max(255, "Email must be at most 255 characters")
    .email("Email must be a valid email address"),
  message: z
    .string({ required_error: "Message is required" })
    .min(1, "Message is required")
    .max(2000, "Message must be at most 2000 characters"),
  whatsapp: z
    .string()
    .max(30, "WhatsApp number must be at most 30 characters")
    .optional(),
});

type ContactEmailRequest = z.infer<typeof contactEmailSchema>;

const sendEmail = async (to: string[], subject: string, html: string) => {
  const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: "UniDoxia <info@unidoxia.com>",
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

  try {
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return new Response(JSON.stringify({ error: "Invalid JSON payload" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const parsedBody = contactEmailSchema.safeParse(body);
    if (!parsedBody.success) {
      const errorMessage = parsedBody.error.errors
        .map((issue) => issue.message)
        .join("; ");
      return new Response(JSON.stringify({ error: errorMessage }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { name, email, message, whatsapp }: ContactEmailRequest = parsedBody.data;

    console.log("Sending contact email from:", email, "name:", name);

    const safeName = escapeHtml(name);
    const safeEmail = escapeHtml(email);
    const safeWhatsapp = whatsapp ? escapeHtml(whatsapp) : "Not provided";
    const safeMessage = escapeHtml(message).replace(/\n/g, "<br>");

    // Send notification to admin
    const adminEmailResponse = await sendEmail(
      ["info@unidoxia.com"],
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
      "Thank you for contacting UniDoxia",
      `
        <h1>Thank you for reaching out, ${safeName}!</h1>
        <p>We have received your message and will get back to you as soon as possible.</p>
        <p><strong>Your WhatsApp:</strong> ${safeWhatsapp}</p>
        <p><strong>Your message:</strong></p>
        <p>${safeMessage}</p>
        <br>
        <p>Best regards,<br>UniDoxia Team</p>
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
