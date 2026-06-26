import { corsHeaders } from "../_shared/cors.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const FROM_EMAIL = "Book It Daily <noreply@bookitdaily.com>";
const ADMIN_EMAIL = "bookitdaily@gmail.com";

// Service-role client — bypasses RLS so we can resolve the admin's email from a
// booking id without exposing it to the (client) caller. SUPABASE_URL +
// SUPABASE_SERVICE_ROLE_KEY are injected into edge functions automatically.
const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

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

type BookingPayload = {
  kind: "booking";
  bookingId: string;
};

type Payload = ContactPayload | InvitePayload | BookingPayload;

type BuiltEmail = { to: string; subject: string; text: string; html: string };

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

function pickOne<T>(v: T | T[] | null | undefined): T | null {
  if (Array.isArray(v)) return v[0] ?? null;
  return v ?? null;
}

/**
 * Resolve a booking's admin + details (service-role) and build the
 * notification email addressed to the relevant admin. Returns null when the
 * email should be skipped (booking gone, no admin, or admin has no email) —
 * callers treat that as a non-error no-op.
 */
async function buildBookingEmail(bookingId: string): Promise<BuiltEmail | null> {
  const { data, error } = await supabaseAdmin
    .from("bookings")
    .select(
      `
        id,
        status,
        session:sessions!bookings_session_id_fkey(
          starts_at,
          duration_min,
          studio:studios!sessions_studio_id_fkey(id, name, timezone),
          service:services!sessions_service_id_fkey(name, mode),
          admin:studio_members!sessions_admin_member_id_fkey(
            user:users!studio_members_user_id_fkey(name, email)
          )
        ),
        client:studio_members!bookings_client_member_id_fkey(
          user:users!studio_members_user_id_fkey(name)
        )
      `,
    )
    .eq("id", bookingId)
    .single();

  if (error || !data) {
    console.error("[send-email] booking lookup failed:", error?.message);
    return null;
  }

  const session = pickOne(data.session);
  const studio = session ? pickOne(session.studio) : null;
  const service = session ? pickOne(session.service) : null;
  const admin = session ? pickOne(session.admin) : null;
  const adminUser = admin ? pickOne(admin.user) : null;
  const client = pickOne(data.client);
  const clientUser = client ? pickOne(client.user) : null;

  const adminEmail = adminUser?.email;
  if (!adminEmail) return null; // nobody to notify

  // Booking email alerts are a Solo+ feature — Free studios don't send them.
  const studioId = (studio as { id?: string } | null)?.id;
  if (studioId) {
    const { data: plan } = await supabaseAdmin.rpc("effective_plan", {
      p_studio_id: studioId,
    });
    if (plan === "free") return null;
  }

  const adminName = adminUser?.name ?? "there";
  const clientName = clientUser?.name ?? "A client";
  const serviceName = service?.name ?? "a session";
  const studioName = studio?.name ?? "your studio";
  const timezone = studio?.timezone ?? "UTC";

  const startsAt = session?.starts_at ? new Date(session.starts_at) : null;
  const whenStr = startsAt
    ? new Intl.DateTimeFormat("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
        timeZone: timezone,
      }).format(startsAt)
    : "an upcoming time";

  const durationStr = session?.duration_min ? `${session.duration_min} min` : "";

  return {
    to: adminEmail,
    subject: `New booking: ${serviceName} — ${whenStr}`,
    text:
      `Hi ${adminName},\n\n` +
      `${clientName} just booked ${serviceName} with you.\n\n` +
      `When: ${whenStr}${durationStr ? ` (${durationStr})` : ""}\n` +
      `Studio: ${studioName}\n\n` +
      `— Book It Daily`,
    html: `
      <h2>New booking</h2>
      <p><strong>${escapeHtml(clientName)}</strong> just booked
         <strong>${escapeHtml(serviceName)}</strong> with you.</p>
      <table style="border-collapse:collapse;font-family:inherit;">
        <tr><td style="padding:4px 12px 4px 0;color:#666;">When</td>
            <td style="padding:4px 0;"><strong>${escapeHtml(whenStr)}</strong>${
              durationStr ? ` &middot; ${escapeHtml(durationStr)}` : ""
            }</td></tr>
        <tr><td style="padding:4px 12px 4px 0;color:#666;">Studio</td>
            <td style="padding:4px 0;">${escapeHtml(studioName)}</td></tr>
      </table>
      <p style="color:#666;margin-top:16px;">— Book It Daily</p>
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
    if (
      !payload ||
      (payload.kind !== "contact" &&
        payload.kind !== "invite" &&
        payload.kind !== "booking")
    ) {
      return json({ error: "Invalid payload" }, 400);
    }

    let email: BuiltEmail | null;
    if (payload.kind === "booking") {
      if (!payload.bookingId) {
        return json({ error: "Missing bookingId" }, 400);
      }
      email = await buildBookingEmail(payload.bookingId);
      // No admin to notify (or booking vanished) — treat as a successful no-op
      // so a missing email never fails the booking that triggered it.
      if (!email) return json({ skipped: true });
    } else {
      email = buildEmail(payload);
    }

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
