/**
 * Book It Daily SaaS plans — the subscription an *owner* pays us for.
 *
 * Single source of truth for the plan tiers shown on the public pricing page
 * and the in-app /owner/subscription screen. Prices are in USD. The `id`
 * matches the `studio_subscriptions.plan` value ('free' | 'solo' | 'studio').
 */

export type PlanId = "free" | "solo" | "studio";

export interface SaasPlan {
  id: PlanId;
  name: string;
  tagline: string;
  /** Monthly price in USD. */
  monthly: number;
  /** Annual price in USD (billed once per year). */
  yearly: number;
  features: string[];
  /** Highlighted as the recommended tier. */
  popular?: boolean;
}

export const SAAS_PLANS: SaasPlan[] = [
  {
    id: "free",
    name: "Free",
    tagline: "For solo coaches starting out",
    monthly: 0,
    yearly: 0,
    features: [
      "1 admin seat",
      "Up to 30 active clients",
      "50 bookings / month",
      "Booking calendar + agenda",
      "Client + admin messaging",
      "Installable mobile PWA",
    ],
  },
  {
    id: "solo",
    name: "Solo",
    tagline: "For 1-person studios going pro",
    monthly: 9,
    yearly: 90,
    features: [
      "1 admin seat",
      "Up to 150 active clients",
      "Unlimited bookings",
      "Branding removed",
      "Finance dashboard",
      "Email support",
    ],
  },
  {
    id: "studio",
    name: "Studio",
    tagline: "Where most studios land",
    monthly: 24,
    yearly: 240,
    popular: true,
    features: [
      "Up to 5 admin seats",
      "Up to 500 active clients",
      "Custom domain",
      "Build your own client offers",
      "Dark mode for your team",
      "Priority email support",
    ],
  },
];

/** Order used to decide whether a target plan is an upgrade or a downgrade. */
const RANK: Record<PlanId, number> = { free: 0, solo: 1, studio: 2 };

export function getPlan(id: string | null | undefined): SaasPlan | undefined {
  return SAAS_PLANS.find((p) => p.id === id);
}

/** "upgrade" | "downgrade" | "current" of `target` relative to `current`. */
export function planDirection(current: PlanId, target: PlanId): "upgrade" | "downgrade" | "current" {
  if (current === target) return "current";
  return RANK[target] > RANK[current] ? "upgrade" : "downgrade";
}
