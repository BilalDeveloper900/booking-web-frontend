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
