/**
 * Stripe Express dashboard login link (owner → "Manage payouts").
 * GET /api/connect/dashboard → redirects to the studio's Express dashboard,
 * where the owner sees their balance, payouts, and can manage their bank.
 */
import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { createClient, createServiceRoleClient } from "@/lib/supabase/server";

type PayAcctTable = {
  select: (c: string) => {
    eq: (k: string, v: string) => {
      maybeSingle: () => Promise<{ data: { stripe_account_id: string | null } | null }>;
    };
  };
};

export async function GET(req: Request) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? new URL(req.url).origin;
  const settingsUrl = `${appUrl}/owner/settings`;

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.redirect(`${appUrl}/login`);

    const { data: member } = await supabase
      .from("studio_members")
      .select("studio_id")
      .eq("user_id", user.id)
      .eq("role", "owner")
      .eq("status", "active")
      .limit(1)
      .maybeSingle();
    if (!member) return NextResponse.redirect(`${settingsUrl}?connect=forbidden`);

    const admin = createServiceRoleClient();
    const { data: acct } = await (admin as unknown as { from: (t: string) => PayAcctTable })
      .from("studio_payment_accounts")
      .select("stripe_account_id")
      .eq("studio_id", member.studio_id)
      .maybeSingle();

    if (!acct?.stripe_account_id) return NextResponse.redirect(`${settingsUrl}?connect=none`);

    const loginLink = await getStripe().accounts.createLoginLink(acct.stripe_account_id);
    return NextResponse.redirect(loginLink.url);
  } catch (e) {
    console.error("connect/dashboard error:", e instanceof Error ? e.message : e);
    return NextResponse.redirect(`${settingsUrl}?connect=error`);
  }
}
