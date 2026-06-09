"use client";

import { useMemo, useState } from "react";
import { Check, Loader2, Sparkles, CreditCard } from "lucide-react";
import toast from "react-hot-toast";
import { Button, buttonVariants } from "@/components/ui/button";
import { Pill } from "@/components/shared";
import { cn } from "@/lib/utils";
import { useCurrentMember } from "@/lib/auth/use-current-member";
import { useStudioSubscription } from "@/lib/subscription";
import { SAAS_PLANS, getPlan, planDirection, type PlanId } from "@/lib/plans";
import { polarProductId } from "@/lib/polar-products";

type Interval = "monthly" | "yearly";

const STATUS_COPY: Record<string, { label: string; kind?: string }> = {
  trialing: { label: "Trial", kind: "teal" },
  active: { label: "Active", kind: "sage" },
  past_due: { label: "Past due", kind: "warn" },
  cancelled: { label: "Cancelling", kind: "warn" },
  expired: { label: "Expired", kind: "warn" },
};

function formatDate(iso: string | null): string | null {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function SubscriptionScreen() {
  const { member } = useCurrentMember();
  const studioId = member?.studio.id;
  const { subscription, loading } = useStudioSubscription(studioId);

  const [interval, setInterval] = useState<Interval>("monthly");
  const [changing, setChanging] = useState(false);

  // No row → the studio is on the Free plan.
  const currentPlanId: PlanId = (getPlan(subscription?.plan)?.id ?? "free") as PlanId;
  const currentPlan = getPlan(currentPlanId)!;
  const status = subscription?.status ?? "active";
  const statusInfo = STATUS_COPY[status] ?? { label: status };

  const renewalNote = useMemo(() => {
    if (currentPlanId === "free") return "Free forever — no billing.";
    if (status === "trialing") {
      const ends = formatDate(subscription?.trial_ends_at ?? null);
      return ends ? `Trial ends ${ends}.` : "On free trial.";
    }
    if (status === "cancelled") {
      const ends = formatDate(subscription?.current_period_end ?? null);
      return ends ? `Access until ${ends}, then cancels.` : "Cancels at period end.";
    }
    const renews = formatDate(subscription?.current_period_end ?? null);
    return renews ? `Renews ${renews}.` : "Billed monthly.";
  }, [currentPlanId, status, subscription]);

  function onChangePlan(targetId: PlanId) {
    if (planDirection(currentPlanId, targetId) === "current") return;
    if (!studioId || changing) return;

    // No active subscription yet → start a fresh Polar checkout.
    if (currentPlanId === "free") {
      const productId = polarProductId(targetId, interval);
      if (!productId) {
        toast.error("Billing isn't configured for this plan yet.");
        return;
      }
      const params = new URLSearchParams({ products: productId, customerExternalId: studioId });
      if (member?.user.email) params.set("customerEmail", member.user.email);
      window.location.href = `/api/checkout?${params.toString()}`;
      return;
    }

    // Already subscribed → change the existing subscription in place (upgrade,
    // downgrade, or cancel) via the Polar API. Polar prorates the difference.
    void changeExistingPlan(targetId);
  }

  async function changeExistingPlan(targetId: PlanId) {
    setChanging(true);
    try {
      const res = await fetch("/api/subscription/change", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: targetId, interval }),
      });
      const json = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !json.ok) throw new Error(json.error ?? "Couldn't change the plan.");
      toast.success(
        targetId === "free"
          ? "Your plan will cancel at the end of the period."
          : `Switched to ${getPlan(targetId)?.name}. Updating…`
      );
      // The webhook syncs the DB; reload shortly to show the new state.
      setTimeout(() => window.location.reload(), 1500);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e));
      setChanging(false);
    }
  }

  function onManageBilling() {
    window.location.href = "/api/portal";
  }

  return (
    <div className="flex-1 overflow-auto p-4 md:p-6 lg:p-8">
      <div className="max-w-5xl mx-auto">
        <div className="mb-6">
          <h2 className="text-[20px] md:text-[24px] font-semibold tracking-tight leading-tight">
            Subscription
          </h2>
          <p className="text-[13px] text-muted-foreground mt-1">
            Manage your Book It Daily plan and billing.
          </p>
        </div>

        {/* Current plan summary */}
        <div className="bg-card rounded-xl ring-1 ring-foreground/10 p-5 md:p-6 mb-8">
          {loading ? (
            <div className="flex items-center gap-2 text-[13px] text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" /> Loading your plan…
            </div>
          ) : (
            <div className="flex flex-wrap items-start gap-4 justify-between">
              <div className="min-w-0">
                <div className="text-[11px] font-medium tracking-[0.12em] uppercase text-muted-foreground">
                  Current plan
                </div>
                <div className="flex items-center gap-2.5 mt-1.5">
                  <span className="text-[22px] font-semibold tracking-tight">{currentPlan.name}</span>
                  <Pill kind={statusInfo.kind} dot>
                    {statusInfo.label}
                  </Pill>
                </div>
                <p className="text-[13px] text-muted-foreground mt-1.5">{renewalNote}</p>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {currentPlanId !== "free" && (
                  <Button variant="outline" size="sm" onClick={onManageBilling}>
                    <CreditCard className="w-3.5 h-3.5" /> Manage billing
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Billing interval toggle */}
        <div className="flex items-center justify-center mb-6">
          <div className="inline-flex items-center rounded-lg bg-muted p-0.5 text-[13px]">
            {(["monthly", "yearly"] as const).map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => setInterval(opt)}
                className={cn(
                  "px-3.5 py-1.5 rounded-md font-medium motion-safe:transition-colors capitalize",
                  interval === opt
                    ? "bg-card text-foreground shadow-card"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {opt}
                {opt === "yearly" && (
                  <span className="ml-1.5 text-[--pos] text-[11px] font-semibold">save 2 mo</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Plans grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {SAAS_PLANS.map((plan) => {
            const isCurrent = plan.id === currentPlanId;
            const featured = !!plan.popular;
            const price = interval === "monthly" ? plan.monthly : plan.yearly;
            const dir = planDirection(currentPlanId, plan.id);
            const ctaLabel = isCurrent
              ? "Current plan"
              : dir === "upgrade"
                ? `Upgrade to ${plan.name}`
                : `Switch to ${plan.name}`;
            return (
              <div
                key={plan.id}
                className={cn(
                  "bg-card border rounded-xl p-6 flex flex-col motion-safe:transition-all motion-safe:duration-200",
                  isCurrent
                    ? "border-primary ring-1 ring-primary/30 shadow-hero"
                    : featured
                      ? "border-primary/40 shadow-card hover:shadow-hero hover:-translate-y-px"
                      : "border-border shadow-card hover:shadow-hero hover:-translate-y-px"
                )}
              >
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-[15px] font-semibold tracking-tight">{plan.name}</span>
                  {isCurrent && (
                    <Pill kind="teal">Current</Pill>
                  )}
                  {!isCurrent && featured && (
                    <span className="inline-flex items-center gap-1 text-[10px] tracking-[0.08em] uppercase font-semibold text-[--role-accent-dark]">
                      <Sparkles className="w-3 h-3" /> Popular
                    </span>
                  )}
                </div>
                <div className="text-[12px] text-muted-foreground mb-4">{plan.tagline}</div>
                <div className="flex items-baseline gap-1 mb-1">
                  <span className="text-[32px] font-semibold tracking-tight tabular-nums">${price}</span>
                  <span className="text-[13px] text-muted-foreground">
                    USD / {interval === "monthly" ? "mo" : "yr"}
                  </span>
                </div>
                <div className="text-[11px] text-muted-foreground mb-5 tabular-nums min-h-4">
                  {plan.monthly === 0
                    ? "Free forever"
                    : interval === "yearly"
                      ? `Save $${plan.monthly * 12 - plan.yearly} vs monthly`
                      : `or $${plan.yearly}/yr`}
                </div>
                <ul className="text-[13px] space-y-2 mb-6 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="flex gap-2 items-start">
                      <Check className="w-3.5 h-3.5 text-[--pos] mt-0.5 shrink-0" aria-hidden />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  variant={isCurrent ? "outline" : featured ? "default" : "outline"}
                  className="w-full"
                  disabled={isCurrent || changing}
                  onClick={() => onChangePlan(plan.id)}
                >
                  {changing && !isCurrent ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Updating
                    </>
                  ) : (
                    ctaLabel
                  )}
                </Button>
              </div>
            );
          })}
        </div>

        <p className="text-[12px] text-muted-foreground text-center mt-6">
          Prices in USD, billed via Polar (our Merchant of Record). Taxes calculated at checkout.{" "}
          <a href="/pricing" className="text-primary underline underline-offset-2 hover:opacity-80">
            Compare plans
          </a>
          .
        </p>
      </div>
    </div>
  );
}
