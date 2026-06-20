/**
 * Stripe Connect onboarding (owner). Ensures the studio has an Express
 * connected account, then redirects to Stripe's hosted onboarding.
 *
 * GET /api/connect/onboard  → (creates account if needed) → Stripe onboarding URL
 * Used as the href of the "Connect payouts" button. `refresh_url` points back
 * here so an expired link just regenerates.
 */
import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { createClient, createServiceRoleClient } from "@/lib/supabase/server";

// Loose view of the not-yet-in-generated-types table.
type PayAcctTable = {
  select: (c: string) => {
    eq: (k: string, v: string) => {
      maybeSingle: () => Promise<{ data: { stripe_account_id: string | null } | null }>;
    };
  };
  upsert: (row: Record<string, unknown>, opts: { onConflict: string }) => Promise<{ error: unknown }>;
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

    const studioId = member.studio_id;
    const admin = createServiceRoleClient();
    const payAcct = (admin as unknown as { from: (t: string) => PayAcctTable }).from(
      "studio_payment_accounts"
    );

    const { data: existing } = await payAcct
      .select("stripe_account_id")
      .eq("studio_id", studioId)
      .maybeSingle();

    const stripe = getStripe();
    let accountId = existing?.stripe_account_id ?? undefined;

    if (!accountId) {
      const account = await stripe.accounts.create({
        type: "express",
        email: user.email ?? undefined,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        metadata: { studio_id: studioId },
      });
      accountId = account.id;
      await payAcct.upsert(
        {
          studio_id: studioId,
          provider: "stripe_connect",
          stripe_account_id: accountId,
          status: "pending",
          updated_at: new Date().toISOString(),
        },
        { onConflict: "studio_id" }
      );
    }

    const link = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${appUrl}/api/connect/onboard`,
      return_url: `${settingsUrl}?connect=done`,
      type: "account_onboarding",
    });
    return NextResponse.redirect(link.url);
  } catch (e) {
    console.error("connect/onboard error:", e instanceof Error ? e.message : e);
    return NextResponse.redirect(`${settingsUrl}?connect=error`);
  }
}
