import { corsHeaders } from "../_shared/cors.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const FROM_EMAIL = "Book It Daily <noreply@bookitdaily.com>";
const ADMIN_EMAIL = "bookitdaily@gmail.com";

type ContactPayload = {
  kind: "contact";
  name: string;
  email: string;
  topic: string;
  message: string;
};

type InvitePayload = {
  kind: "invite";
  email: string;
  role: "admin" | "client";
  link: string;
};

type Payload = ContactPayload | InvitePayload;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function buildEmail(payload: Payload) {
  if (payload.kind === "contact") {
    return {
      to: ADMIN_EMAIL,
      subject: `[${payload.topic}] Message from ${payload.name}`,
      text: `${payload.message}\n\n— ${payload.name} (${payload.email})`,
      html: `
        <h2>New contact request</h2>
        <p><strong>Name:</strong> ${escapeHtml(payload.name)}</p>
        <p><strong>Email:</strong> ${escapeHtml(payload.email)}</p>
        <p><strong>Topic:</strong> ${escapeHtml(payload.topic)}</p>
        <p><strong>Message:</strong></p>
        <pre style="white-space:pre-wrap;font-family:inherit;">${escapeHtml(payload.message)}</pre>
      `,
    };
  }

  return {
    to: payload.email,
    subject: `You're invited to Book It Daily as ${payload.role}`,
    text: `You have been invited to Book It Daily as a ${payload.role}.\n\nOpen this link to continue: ${payload.link}`,
    html: `
      <h2>You&rsquo;re invited to Book It Daily</h2>
      <p>You have been invited as a <strong>${escapeHtml(payload.role)}</strong>.</p>
      <p><a href="${escapeHtml(payload.link)}">Open your invite link</a></p>
      <p style="word-break:break-all;color:#666;">${escapeHtml(payload.link)}</p>
    `,
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  if (!RESEND_API_KEY) {
    return json({ error: "Missing RESEND_API_KEY" }, 500);
  }

  try {
    const payload = (await req.json()) as Payload;
    if (!payload || (payload.kind !== "contact" && payload.kind !== "invite")) {
      return json({ error: "Invalid payload" }, 400);
    }

    const email = buildEmail(payload);
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [email.to],
        subject: email.subject,
        text: email.text,
        html: email.html,
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      return json({ error: data }, response.status);
    }

    return json(data);
  } catch (error) {
    return json(
      { error: error instanceof Error ? error.message : String(error) },
      500,
    );
  }
});
