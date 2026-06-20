// Stripe Connect webhook → keeps studio_payment_accounts in sync.
//
// Deno edge function (NOT part of the Next app / tsconfig). Deploy with:
//   supabase functions deploy stripe-connect-webhook --no-verify-jwt
// Set secrets:
//   supabase secrets set STRIPE_SECRET_KEY=sk_test_...
//   supabase secrets set STRIPE_CONNECT_WEBHOOK_SECRET=whsec_...   (Connect endpoint secret)
// (SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY are injected automatically.)
//
// Register in Stripe → Developers → Webhooks → add a **Connect** endpoint at:
//   https://<project>.supabase.co/functions/v1/stripe-connect-webhook
// with at least: account.updated  (Phase 2 adds checkout/invoice events).
import Stripe from "npm:stripe@22";
import { createClient } from "npm:@supabase/supabase-js@2";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") ?? "");
const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);
const webhookSecret = Deno.env.get("STRIPE_CONNECT_WEBHOOK_SECRET") ?? "";

Deno.serve(async (req) => {
  const sig = req.headers.get("stripe-signature");
  const body = await req.text();

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(body, sig ?? "", webhookSecret);
  } catch (e) {
    console.error("stripe-connect-webhook: bad signature", e instanceof Error ? e.message : e);
    return new Response("invalid signature", { status: 400 });
  }

  if (event.type === "account.updated") {
    const acct = event.data.object as Stripe.Account;
    const studioId = acct.metadata?.studio_id ?? null;
    const status = acct.charges_enabled
      ? "connected"
      : acct.details_submitted
        ? "restricted"
        : "pending";

    const patch = {
      charges_enabled: acct.charges_enabled,
      payouts_enabled: acct.payouts_enabled,
      details_submitted: acct.details_submitted,
      status,
      updated_at: new Date().toISOString(),
    };

    const q = supabase.from("studio_payment_accounts").update(patch);
    const { error } = studioId
      ? await q.eq("studio_id", studioId)
      : await q.eq("stripe_account_id", acct.id);

    if (error) {
      console.error("stripe-connect-webhook upsert error:", error.message);
      return new Response("db error", { status: 500 });
    }
    console.log("stripe-connect-webhook: account.updated", { studioId, status });
  }

  return new Response("ok", { status: 200 });
});
