/**
 * Polar customer portal. The owner's "Manage billing" button links here.
 * Resolves the Polar customer ID from the logged-in owner's studio
 * (studio_subscriptions.polar_customer_id, set by the polar-webhook function).
 */
import { CustomerPortal } from "@polar-sh/nextjs";
import { createClient } from "@/lib/supabase/server";

const server = process.env.POLAR_SERVER === "production" ? "production" : "sandbox";

export const GET = CustomerPortal({
  accessToken: process.env.POLAR_ACCESS_TOKEN ?? "",
  server,
  getCustomerId: async () => {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return "";

    const { data: member } = await supabase
      .from("studio_members")
      .select("studio_id")
      .eq("user_id", user.id)
      .eq("role", "owner")
      .eq("status", "active")
      .limit(1)
      .maybeSingle();
    if (!member) return "";

    // polar_customer_id was added in a migration after types were generated.
    const { data: sub } = await (supabase as unknown as {
      from: (t: string) => {
        select: (c: string) => {
          eq: (col: string, val: string) => {
            maybeSingle: () => Promise<{ data: { polar_customer_id: string | null } | null }>;
          };
        };
      };
    })
      .from("studio_subscriptions")
      .select("polar_customer_id")
      .eq("studio_id", member.studio_id)
      .maybeSingle();

    return sub?.polar_customer_id ?? "";
  },
});
