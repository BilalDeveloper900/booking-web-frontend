/**
 * Platform Stripe client (server-only). Used to act on behalf of studios'
 * connected accounts via Stripe Connect (pass `{ stripeAccount: acct_... }`
 * on calls, or the `Stripe-Account` header).
 *
 * NEVER import from a "use client" file. The secret key stays server-side.
 */
import Stripe from "stripe";

let client: Stripe | null = null;

export function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error("Missing STRIPE_SECRET_KEY. Set it in web/.env.local.");
  }
  if (!client) {
    // Pin the API version to the SDK's default by omitting it; Stripe uses the
    // account's default version. Bump deliberately when upgrading the SDK.
    client = new Stripe(key);
  }
  return client;
}

/** Whether Stripe Connect is configured (used to gate the payments UI). */
export function isStripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}
