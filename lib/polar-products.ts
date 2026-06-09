/**
 * Maps our plan + billing interval to a Polar product ID.
 *
 * Product IDs come from NEXT_PUBLIC_* env vars (they're not secret — they show
 * up in the checkout URL anyway), so this module is safe in client components.
 * Set them in web/.env.local from your Polar (sandbox) products.
 */
import type { PlanId } from "@/lib/plans";

export type Interval = "monthly" | "yearly";

const PRODUCT_IDS: Record<string, string | undefined> = {
  "solo:monthly": process.env.NEXT_PUBLIC_POLAR_PRODUCT_SOLO_MONTHLY,
  "solo:yearly": process.env.NEXT_PUBLIC_POLAR_PRODUCT_SOLO_YEARLY,
  "studio:monthly": process.env.NEXT_PUBLIC_POLAR_PRODUCT_STUDIO_MONTHLY,
  "studio:yearly": process.env.NEXT_PUBLIC_POLAR_PRODUCT_STUDIO_YEARLY,
};

/** Polar product ID for a paid plan + interval, or undefined (e.g. free). */
export function polarProductId(plan: PlanId, interval: Interval): string | undefined {
  if (plan === "free") return undefined;
  return PRODUCT_IDS[`${plan}:${interval}`];
}
