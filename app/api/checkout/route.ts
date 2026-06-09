/**
 * Polar checkout. The owner's Subscription page links here with:
 *   /api/checkout?products=<polarProductId>&customerExternalId=<studioId>&customerEmail=<email>
 *
 * `customerExternalId` = our studio_id, so the polar-webhook edge function can
 * map the resulting subscription back to the right studio.
 */
import { Checkout } from "@polar-sh/nextjs";

const server = process.env.POLAR_SERVER === "production" ? "production" : "sandbox";

export const GET = Checkout({
  accessToken: process.env.POLAR_ACCESS_TOKEN ?? "",
  successUrl: `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/owner/subscription?checkout=success`,
  server,
});
