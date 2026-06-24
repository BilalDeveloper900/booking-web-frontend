import { createClient } from "@/lib/supabase/client";

type ContactSubmission = {
  name: string;
  email: string;
  topic: string;
  message: string;
};

type InviteEmail = {
  email: string;
  role: "admin" | "client";
  link: string;
};

export async function sendContactSubmission(
  payload: ContactSubmission,
): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.functions.invoke("send-email", {
    body: {
      kind: "contact",
      ...payload,
    },
  });
  if (error) throw error;
}

export async function sendInviteEmail(payload: InviteEmail): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.functions.invoke("send-email", {
    body: {
      kind: "invite",
      ...payload,
    },
  });
  if (error) throw error;
}

/**
 * Notify the session's admin that a booking was made. The edge function
 * resolves the admin's email + booking details server-side (service role), so
 * the caller only needs the booking id and never sees the admin's address.
 *
 * Best-effort: callers should fire this without awaiting the booking on it —
 * a failed notification must never fail the booking itself.
 */
export async function sendBookingNotification(bookingId: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.functions.invoke("send-email", {
    body: {
      kind: "booking",
      bookingId,
    },
  });
  if (error) throw error;
}
