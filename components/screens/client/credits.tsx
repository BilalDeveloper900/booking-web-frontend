"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Pill } from "@/components/shared";
import { useCurrentMember } from "@/lib/auth/use-current-member";
import {
  useSubscriptionPlans,
  useCreditPacks,
  planFeatures,
  formatPrice,
} from "@/lib/offers";
import {
  useMyCredits,
  useMyCreditTransactions,
} from "@/lib/client-bookings";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

type MyPlanSnapshot = {
  planName: string;
  pricePerMonth: number; // in cents
  creditsPerMonth: number;
  currentPeriodEnd: string | null;
};

export function ClientCredits() {
  const { member } = useCurrentMember();
  const studioId = member?.studio.id;
  const memberId = member?.member.id;
  const currency = member?.studio.currency ?? "EUR";

  const { balance, loading: balanceLoading } = useMyCredits(memberId);
  const { transactions, loading: txLoading, error: txError } =
    useMyCreditTransactions(memberId, 50);
  const { plans, loading: plansLoading } = useSubscriptionPlans(studioId);
  const { packs, loading: packsLoading } = useCreditPacks(studioId);

  const [mySub, setMySub] = useState<MyPlanSnapshot | null>(null);
  const [subLoading, setSubLoading] = useState(true);

  // Fetch the client's active subscription joined with their plan name + price.
  useEffect(() => {
    if (!memberId) return;
    let cancelled = false;
    const supabase = createClient();
    supabase
      .from("client_subscriptions")
      .select(
        `current_period_end,
         plan:subscription_plans!client_subscriptions_plan_id_fkey(name, price_cents, credits_granted)`
      )
      .eq("member_id", memberId)
      .in("status", ["active", "past_due"])
      .maybeSingle()
      .then(({ data }) => {
        if (cancelled) return;
        if (data) {
          const plan = Array.isArray(data.plan) ? data.plan[0] : data.plan;
          if (plan) {
            setMySub({
              planName: plan.name,
              pricePerMonth: plan.price_cents,
              creditsPerMonth: plan.credits_granted,
              currentPeriodEnd: data.current_period_end,
            });
          }
        }
        setSubLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [memberId]);

  // Compute running balance for each transaction row (newest first).
  const ledger = useMemo(
    () => buildLedger(transactions, balance),
    [transactions, balance]
  );

  const heroLoading = balanceLoading || subLoading;
  const usedPct =
    mySub && mySub.creditsPerMonth > 0
      ? Math.min(
          100,
          ((mySub.creditsPerMonth - balance) / mySub.creditsPerMonth) * 100
        )
      : 0;
  const renewalLabel = mySub?.currentPeriodEnd
    ? new Date(mySub.currentPeriodEnd).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      })
    : null;

  return (
    <div className="flex-1 overflow-auto p-6 lg:p-8">
      <div className="mb-6">
        <h2 className="text-[24px] font-semibold tracking-tight leading-tight">
          Credits &amp; plan
        </h2>
        <p className="text-[13px] text-muted-foreground mt-1">
          Manage your subscription, credits, and billing
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr_1fr] gap-4 mb-8">
        <div className="bg-foreground text-background rounded-xl p-6 flex flex-col justify-between shadow-hero motion-safe:transition-shadow motion-safe:duration-200 hover:shadow-overlay">
          <div className="flex items-center justify-between mb-4">
            <div className="text-[11px] font-medium tracking-[0.08em] uppercase opacity-60">
              Current plan
            </div>
            {mySub ? (
              <Pill kind="teal">Active</Pill>
            ) : (
              <Pill>Pay-as-you-go</Pill>
            )}
          </div>

          {heroLoading ? (
            <div className="h-16 bg-background/10 rounded-lg animate-pulse" />
          ) : (
            <>
              <div className="text-[28px] font-bold tracking-tight mb-0.5 tabular-nums">
                {mySub?.planName ?? "Pay-as-you-go"}
              </div>
              <div className="text-sm opacity-70 mb-4 tabular-nums">
                {mySub
                  ? `${formatPrice(mySub.pricePerMonth, currency)}/month · ${
                      mySub.creditsPerMonth
                    } credits/month`
                  : "Top up credits whenever you need them."}
              </div>
              {mySub && mySub.creditsPerMonth > 0 && (
                <div className="h-2 bg-background/20 rounded-full overflow-hidden mb-3">
                  <div
                    className="h-full rounded-full bg-[--role-accent] motion-safe:transition-[width] motion-safe:duration-500 motion-safe:ease-out"
                    style={{ width: `${usedPct}%` }}
                  />
                </div>
              )}
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs opacity-60 tabular-nums">
                  {mySub
                    ? `${balance} credit${balance === 1 ? "" : "s"} left${
                        renewalLabel ? ` · Renews ${renewalLabel}` : ""
                      }`
                    : `${balance} credit${balance === 1 ? "" : "s"} on hand`}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-background/30 text-background hover:bg-background/10"
                  disabled
                >
                  Manage
                </Button>
              </div>
            </>
          )}
        </div>

        <SmallStat
          label="Credit balance"
          value={heroLoading ? "—" : String(balance)}
          unit="credits"
          foot={
            mySub
              ? `${mySub.creditsPerMonth} added each period`
              : "Top up to add more"
          }
        />
        <SmallStat
          label="Member since"
          value={member?.member.member_since
            ? new Date(member.member.member_since).toLocaleDateString("en-US", {
                month: "short",
                year: "numeric",
              })
            : "—"}
          unit=""
          foot="Your studio journey"
        />
      </div>

      <Section title="Top up credits">
        {packsLoading && packs.length === 0 ? (
          <PackGridSkeleton />
        ) : packs.length === 0 ? (
          <EmptyMini text="Your studio hasn't published any credit packs yet." />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {packs
              .filter((p) => p.active)
              .map((pack) => {
                const perCredit =
                  pack.credits > 0 ? pack.price_cents / pack.credits : 0;
                const featured = pack.label === "Best value" || pack.label === "Pro";
                return (
                  <div
                    key={pack.id}
                    className={cn(
                      "bg-card border rounded-xl shadow-card p-4 relative motion-safe:transition-all motion-safe:duration-200 hover:-translate-y-px hover:shadow-hero",
                      featured
                        ? "border-[--role-accent] ring-1 ring-[--role-accent]/30"
                        : "border-border"
                    )}
                  >
                    {pack.label && (
                      <span className="absolute top-3 right-3">
                        <Pill kind={featured ? "teal" : "sage"}>{pack.label}</Pill>
                      </span>
                    )}
                    <div className="text-[22px] font-bold tracking-tight mb-0.5 tabular-nums">
                      {pack.credits} credits
                    </div>
                    <div className="text-sm text-muted-foreground mb-1 tabular-nums">
                      {formatPrice(pack.price_cents, currency)} ·{" "}
                      {formatPrice(perCredit, currency)}/credit
                    </div>
                    <div className="text-xs text-muted-foreground mb-3 min-h-[1em]">
                      Checkout wires up later
                    </div>
                    <Button
                      variant={featured ? "default" : "outline"}
                      size="sm"
                      className="w-full"
                      disabled
                    >
                      Buy
                    </Button>
                  </div>
                );
              })}
          </div>
        )}
      </Section>

      <Section title="Transactions">
        <div className="bg-card border border-border rounded-xl shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-border">
                  <Th>Date</Th>
                  <Th>Description</Th>
                  <Th align="right">Credits</Th>
                  <Th align="right">Balance</Th>
                </tr>
              </thead>
              <tbody>
                {txLoading && ledger.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-12 text-center">
                      <Loader2 className="w-4 h-4 animate-spin inline mr-2 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        Loading transactions…
                      </span>
                    </td>
                  </tr>
                ) : txError ? (
                  <tr>
                    <td colSpan={4} className="py-6 text-center">
                      <span className="inline-flex items-center gap-2 text-[13px] text-[--neg]">
                        <AlertCircle className="w-3.5 h-3.5" /> {txError}
                      </span>
                    </td>
                  </tr>
                ) : ledger.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="py-12 text-center text-sm text-muted-foreground"
                    >
                      No transactions yet. Book a class to see activity here.
                    </td>
                  </tr>
                ) : (
                  ledger.map(({ tx, balanceAfter }) => (
                    <tr
                      key={tx.id}
                      className="border-b border-[--line-soft] last:border-0 hover:bg-muted/40 motion-safe:transition-colors motion-safe:duration-150"
                    >
                      <td className="px-4 py-3 tabular-nums">
                        {formatDate(tx.created_at)}
                      </td>
                      <td className="px-4 py-3">{tx.description}</td>
                      <td
                        className={cn(
                          "px-4 py-3 text-right tabular-nums font-medium",
                          tx.delta > 0 ? "text-[--pos]" : "text-[--neg]"
                        )}
                      >
                        {tx.delta > 0 ? "+" : ""}
                        {tx.delta}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums">
                        {balanceAfter}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </Section>

      <Section title="Switch plan">
        {plansLoading && plans.length === 0 ? (
          <PackGridSkeleton cols="md:grid-cols-3" />
        ) : plans.length === 0 ? (
          <EmptyMini text="Your studio hasn't published any subscription plans yet." />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {plans
              .filter((p) => p.active)
              .map((plan) => {
                const isCurrent = mySub?.planName === plan.name;
                const features = planFeatures(plan);
                return (
                  <div
                    key={plan.id}
                    className={cn(
                      "bg-card border rounded-xl shadow-card p-5 flex flex-col motion-safe:transition-all motion-safe:duration-200 hover:shadow-hero",
                      isCurrent
                        ? "border-[--role-accent] ring-1 ring-[--role-accent]/30"
                        : "border-border"
                    )}
                  >
                    <div className="flex items-center justify-between mb-2 gap-2">
                      <span className="text-[15px] font-semibold">{plan.name}</span>
                      {isCurrent && <Pill kind="teal">Current</Pill>}
                    </div>
                    <div className="text-[24px] font-bold tracking-tight mb-0.5 tabular-nums">
                      {plan.price_cents === 0
                        ? "Free"
                        : formatPrice(plan.price_cents, currency)}
                      {plan.price_cents > 0 && (
                        <span className="text-sm font-normal text-muted-foreground">
                          /month
                        </span>
                      )}
                    </div>
                    {plan.credits_granted > 0 && (
                      <div className="text-xs text-muted-foreground mb-2 tabular-nums">
                        {plan.credits_granted} credits/month
                      </div>
                    )}
                    {plan.description && (
                      <p className="text-xs text-muted-foreground mb-3">
                        {plan.description}
                      </p>
                    )}
                    {features.length > 0 && (
                      <ul className="text-xs space-y-1.5 mb-4 flex-1">
                        {features.map((f, i) => (
                          <li key={`${f}-${i}`} className="flex items-start gap-1.5">
                            <Check
                              className="w-3.5 h-3.5 text-[--pos] mt-px shrink-0"
                              aria-hidden
                            />
                            <span>{f}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                    {isCurrent ? (
                      <Button variant="outline" size="sm" className="w-full" disabled>
                        Current plan
                      </Button>
                    ) : (
                      <Button variant="outline" size="sm" className="w-full" disabled>
                        Switch (checkout coming later)
                      </Button>
                    )}
                  </div>
                );
              })}
          </div>
        )}
      </Section>
    </div>
  );
}

/* ────────── helpers ────────── */

/**
 * Compute a running balance for each transaction (newest first). Lives
 * outside the render scope so the local `let` isn't flagged by React 19's
 * `react-hooks/immutability` rule.
 */
function buildLedger<T extends { delta: number }>(transactions: T[], currentBalance: number) {
  let runningAfter = currentBalance;
  const result: { tx: T; balanceAfter: number }[] = [];
  for (const t of transactions) {
    result.push({ tx: t, balanceAfter: runningAfter });
    runningAfter -= t.delta;
  }
  return result;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getDate()} ${
    ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][d.getMonth()]
  }`;
}

function SmallStat({
  label,
  value,
  unit,
  foot,
}: {
  label: string;
  value: string | number;
  unit?: string;
  foot: string;
}) {
  return (
    <div className="bg-card border border-border rounded-xl shadow-card p-4.5 motion-safe:transition-shadow motion-safe:duration-200 hover:shadow-hero">
      <div className="text-[11px] font-medium tracking-[0.08em] uppercase text-muted-foreground mb-3.5">
        {label}
      </div>
      <div className="text-[28px] font-semibold tracking-tight leading-none tabular-nums">
        {value}
        {unit && (
          <span className="text-sm text-muted-foreground ml-1 font-normal">{unit}</span>
        )}
      </div>
      <div className="text-xs text-muted-foreground mt-3 tabular-nums">{foot}</div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-6">
      <h3 className="text-[13px] font-medium text-foreground mb-3">{title}</h3>
      {children}
    </div>
  );
}

function Th({
  children,
  align = "left",
}: {
  children: React.ReactNode;
  align?: "left" | "right";
}) {
  return (
    <th
      className={`text-[11px] font-medium tracking-[0.08em] uppercase text-muted-foreground px-4 py-3 ${
        align === "right" ? "text-right" : "text-left"
      }`}
    >
      {children}
    </th>
  );
}

function PackGridSkeleton({ cols = "sm:grid-cols-2 lg:grid-cols-4" }: { cols?: string }) {
  return (
    <div className={cn("grid grid-cols-1 gap-3", cols)}>
      {[0, 1, 2, 3].map((i) => (
        <div
          key={i}
          className="h-40 rounded-xl border border-border bg-muted/30 animate-pulse"
        />
      ))}
    </div>
  );
}

function EmptyMini({ text }: { text: string }) {
  return (
    <div className="border border-dashed border-border rounded-xl p-8 text-center text-[12px] text-muted-foreground">
      {text}
    </div>
  );
}
