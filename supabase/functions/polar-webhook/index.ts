// Polar webhook → keeps studio_subscriptions in sync.
//
// Deno edge function (NOT part of the Next.js app / tsconfig). Deploy with:
//   supabase functions deploy polar-webhook --no-verify-jwt
// Set the signing secret:
//   supabase secrets set POLAR_WEBHOOK_SECRET=...
// (SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY are injected automatically.)
//
// The Polar webhook endpoint is configured to:
//   https://<project>.supabase.co/functions/v1/polar-webhook
import { validateEvent, WebhookVerificationError } from "npm:@polar-sh/sdk/webhooks";
import { createClient } from "npm:@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

/** Polar product name ("Solo" / "Studio") → our plan id. */
function planFromProductName(name?: string): "solo" | "studio" | null {
  const n = (name ?? "").toLowerCase();
  if (n.includes("studio")) return "studio";
  if (n.includes("solo")) return "solo";
  return null;
}

/** Polar subscription status → our studio_subscriptions.status check values. */
function mapStatus(polarStatus?: string): string {
  switch (polarStatus) {
    case "active":
      return "active";
    case "trialing":
      return "trialing";
    case "past_due":
    case "unpaid":
      return "past_due";
    case "canceled":
      return "cancelled";
    case "incomplete":
    case "incomplete_expired":
      return "expired";
    default:
      return "active";
  }
}

Deno.serve(async (req) => {
  const body = await req.text();
  const headers: Record<string, string> = {};
  req.headers.forEach((value, key) => {
    headers[key] = value;
  });

  let event;
  try {
    event = validateEvent(body, headers, Deno.env.get("POLAR_WEBHOOK_SECRET") ?? "");
  } catch (e) {
    if (e instanceof WebhookVerificationError) {
      return new Response("Invalid signature", { status: 403 });
    }
    return new Response("Bad request", { status: 400 });
  }

  const type = event.type as string;
  // Only subscription lifecycle events drive the studio's plan.
  if (!type.startsWith("subscription.")) {
    return new Response("ignored", { status: 202 });
  }

  // deno-lint-ignore no-explicit-any
  const data = event.data as any;
  // Polar's SDK parses webhook JSON into camelCase models. Read camelCase
  // first, fall back to snake_case so it works either way.
  const customer = data?.customer ?? {};
  const studioId: string | null =
    customer.externalId ??
    customer.external_id ??
    data?.metadata?.studioId ??
    data?.metadata?.studio_id ??
    null;
  if (!studioId) {
    console.warn("polar-webhook: no studio mapping on", type);
    return new Response("no studio mapping", { status: 202 });
  }

  const plan = planFromProductName(data?.product?.name);
  let status = mapStatus(data?.status);
  if (type === "subscription.revoked") status = "expired";
  else if (type === "subscription.canceled") status = "cancelled";

  const currentPeriodEnd: string | null = data?.currentPeriodEnd ?? data?.current_period_end ?? null;
  const cancelAtPeriodEnd: boolean = data?.cancelAtPeriodEnd ?? data?.cancel_at_period_end ?? false;
  const polarCustomerId: string | null =
    data?.customerId ?? data?.customer_id ?? customer.id ?? null;

  const row: Record<string, unknown> = {
    studio_id: studioId,
    status,
    polar_subscription_id: data?.id ?? null,
    polar_customer_id: polarCustomerId,
    current_period_end: currentPeriodEnd,
    cancel_at: cancelAtPeriodEnd ? currentPeriodEnd : null,
    updated_at: new Date().toISOString(),
  };
  if (plan) row.plan = plan;

  console.log("polar-webhook:", type, { studioId, plan, status, polarCustomerId });

  const { error } = await supabase
    .from("studio_subscriptions")
    .upsert(row, { onConflict: "studio_id" });

  if (error) {
    console.error("polar-webhook upsert error:", error.message);
    return new Response("db error", { status: 500 });
  }

  return new Response("ok", { status: 200 });
});
