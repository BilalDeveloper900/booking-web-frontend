/**
 * Book It Daily SaaS plans — the subscription an *owner* pays us for.
 *
 * Single source of truth for the plan tiers shown on the public pricing page,
 * the landing page, and the in-app /owner/subscription screen. Prices are in
 * USD. The `id` matches the `studio_subscriptions.plan` value
 * ('free' | 'solo' | 'studio').
 *
 * Tiering model (see plan: soft-sprouting-parrot.md):
 *   Free   — booking-only (free reservations), comms + money features locked.
 *   Solo   — + branding removed, chat, booking email alerts, bigger caps.
 *   Studio — + the full money economy: offers builder, credits + gifting,
 *            manual payments, finance dashboard.
 *
 * Keep this file PURE (no React / no client imports) so server components can
 * import it. The plan-reading hook lives in lib/limits.ts (`useEffectivePlan`).
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
  /** Call-to-action label on the marketing cards. */
  cta: string;
  features: string[];
  /** Small print under the feature list on marketing cards. */
  limits?: string;
  /** Highlighted as the recommended tier. */
  popular?: boolean;
}

export const SAAS_PLANS: SaasPlan[] = [
  {
    id: "free",
    name: "Free",
    tagline: "Take bookings, free forever",
    monthly: 0,
    yearly: 0,
    cta: "Start free",
    features: [
      "1 admin seat",
      "Up to 30 active clients",
      "50 bookings / month",
      "Booking calendar (classes + 1-on-1)",
      "In-app notifications",
      "Installable mobile app (PWA)",
    ],
    limits: 'Adds a "Powered by Book It Daily" footer.',
  },
  {
    id: "solo",
    name: "Solo",
    tagline: "For 1-person studios going pro",
    monthly: 9,
    yearly: 90,
    cta: "Start 14-day trial",
    features: [
      "Everything in Free, plus:",
      "Up to 150 active clients",
      "Unlimited bookings",
      "Your branding (footer removed)",
      "Built-in client messaging",
      "Booking email alerts",
    ],
  },
  {
    id: "studio",
    name: "Studio",
    tagline: "Run the whole business",
    monthly: 24,
    yearly: 240,
    cta: "Start 14-day trial",
    popular: true,
    features: [
      "Everything in Solo, plus:",
      "Up to 5 admin seats",
      "Up to 500 active clients",
      "Client offers builder (plans + packs)",
      "Credits + gifting",
      "Payments & finance dashboard",
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

// ─────────────────────────────────────────────────────────────────────────────
// Feature gating — which plan a given feature requires. Mirrors the server-side
// gates (booking RPCs, send-email function, RLS). UI reads these to hide nav,
// guard pages, and disable controls. The numeric caps (admins/clients/bookings)
// live separately in lib/limits.ts (display) + the DB (enforcement).
// ─────────────────────────────────────────────────────────────────────────────

export type GatedFeature =
  | "chat" // Solo+
  | "finance" // Studio
  | "manualPayments" // Studio
  | "credits" // Studio
  | "offersBuilder"; // Studio

const FEATURE_MIN_PLAN: Record<GatedFeature, PlanId> = {
  chat: "solo",
  finance: "studio",
  manualPayments: "studio",
  credits: "studio",
  offersBuilder: "studio",
};

/** The lowest plan that unlocks a feature. */
export function minPlanFor(f: GatedFeature): PlanId {
  return FEATURE_MIN_PLAN[f];
}

/** True when `plan` is high enough to use `feature`. */
export function planAllows(plan: PlanId, feature: GatedFeature): boolean {
  return RANK[plan] >= RANK[FEATURE_MIN_PLAN[feature]];
}

/**
 * The plan whose limits/features actually apply — mirror of the DB
 * `effective_plan()`. A churned (cancelled/expired) subscription falls back to
 * Free, so a lapsed Studio studio doesn't keep Studio features. A missing
 * plan/row is Free.
 */
export function effectivePlan(
  plan?: string | null,
  status?: string | null,
): PlanId {
  if (status === "cancelled" || status === "expired") return "free";
  if (plan === "solo" || plan === "studio" || plan === "free") return plan;
  return "free";
}
