/**
 * In-app subscription change for the owner: upgrade/downgrade the existing
 * Polar subscription's product, or cancel it (downgrade to Free).
 *
 * POST body: { plan: "free" | "solo" | "studio", interval: "monthly" | "yearly" }
 *
 * Polar applies the change with proration; the polar-webhook edge function then
 * syncs studio_subscriptions (source of truth). The client reloads to reflect it.
 */
import { NextResponse } from "next/server";
import { Polar } from "@polar-sh/sdk";
import { createClient } from "@/lib/supabase/server";
import { polarProductId, type Interval } from "@/lib/polar-products";
import type { PlanId } from "@/lib/plans";

const server = process.env.POLAR_SERVER === "production" ? "production" : "sandbox";

export async function POST(req: Request) {
  const { plan, interval } = (await req.json()) as { plan: PlanId; interval: Interval };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const { data: member } = await supabase
    .from("studio_members")
    .select("studio_id")
    .eq("user_id", user.id)
    .eq("role", "owner")
    .eq("status", "active")
    .limit(1)
    .maybeSingle();
  if (!member) return NextResponse.json({ error: "Only the owner can change the plan." }, { status: 403 });

  // polar_subscription_id was added after the generated types — read it loosely.
  const { data: sub } = await (supabase as unknown as {
    from: (t: string) => {
      select: (c: string) => {
        eq: (col: string, val: string) => {
          maybeSingle: () => Promise<{ data: { polar_subscription_id: string | null } | null }>;
        };
      };
    };
  })
    .from("studio_subscriptions")
    .select("polar_subscription_id")
    .eq("studio_id", member.studio_id)
    .maybeSingle();

  const subscriptionId = sub?.polar_subscription_id;
  if (!subscriptionId) {
    return NextResponse.json({ error: "No active subscription to change." }, { status: 400 });
  }

  const polar = new Polar({ accessToken: process.env.POLAR_ACCESS_TOKEN ?? "", server });

  try {
    if (plan === "free") {
      // Downgrade to Free = cancel at period end.
      await polar.subscriptions.update({
        id: subscriptionId,
        subscriptionUpdate: { cancelAtPeriodEnd: true },
      });
    } else {
      const productId = polarProductId(plan, interval);
      if (!productId) {
        return NextResponse.json({ error: "That plan isn't configured for billing." }, { status: 400 });
      }
      await polar.subscriptions.update({
        id: subscriptionId,
        subscriptionUpdate: { productId, prorationBehavior: "prorate" },
      });
    }
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: message }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}
