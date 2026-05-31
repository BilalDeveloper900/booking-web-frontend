"use client";

import { useState } from "react";
import Link from "next/link";
import { Check } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Tier = {
  id: string;
  name: string;
  tagline: string;
  monthly: number;
  yearly: number;
  cta: string;
  features: readonly string[];
  popular?: boolean;
  limits?: string;
};

type Interval = "monthly" | "yearly";

export function PricingPlans({ tiers }: { tiers: readonly Tier[] }) {
  const [interval, setInterval] = useState<Interval>("monthly");

  // Largest yearly saving across paid tiers — shown on the toggle.
  const maxSaving = Math.max(
    0,
    ...tiers.map((t) => (t.yearly === 0 ? 0 : t.monthly * 12 - t.yearly))
  );

  return (
    <div>
      {/* Billing interval toggle */}
      <div className="flex flex-col items-center gap-2 mb-10">
        <div
          role="tablist"
          aria-label="Billing interval"
          className="inline-flex items-center rounded-lg bg-muted p-0.5 text-[13px]"
        >
          {(["monthly", "yearly"] as const).map((opt) => (
            <button
              key={opt}
              role="tab"
              aria-selected={interval === opt}
              onClick={() => setInterval(opt)}
              className={cn(
                "px-4 py-1.5 rounded-md font-medium capitalize motion-safe:transition-all motion-safe:duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
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
        {maxSaving > 0 && (
          <p className="text-[12px] text-muted-foreground tabular-nums">
            {interval === "yearly"
              ? `You're saving up to $${maxSaving} a year.`
              : `Switch to yearly and save up to $${maxSaving} a year.`}
          </p>
        )}
      </div>

      {/* Tier cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {tiers.map((t) => {
          const featured = !!t.popular;
          const price = interval === "monthly" ? t.monthly : t.yearly;
          const saving = t.yearly === 0 ? 0 : t.monthly * 12 - t.yearly;
          return (
            <div
              key={t.id}
              className={
                "bg-card border rounded-xl p-6 flex flex-col motion-safe:transition-all motion-safe:duration-200 hover:-translate-y-0.5 " +
                (featured
                  ? "border-primary ring-1 ring-primary/30 shadow-hero"
                  : "border-border shadow-card hover:shadow-hero")
              }
            >
              {featured && (
                <span className="self-start text-[10px] tracking-[0.08em] uppercase font-semibold text-primary-foreground bg-primary px-2 py-0.5 rounded-full mb-3">
                  Most popular
                </span>
              )}
              <div className="text-[15px] font-semibold tracking-tight">{t.name}</div>
              <div className="text-[12px] text-muted-foreground mb-5">{t.tagline}</div>
              <div className="flex items-baseline gap-1 mb-1">
                <span className="text-[36px] font-semibold tracking-tight tabular-nums">${price}</span>
                <span className="text-[13px] text-muted-foreground">
                  USD / {interval === "monthly" ? "mo" : "yr"}
                </span>
              </div>
              <div className="text-[11px] mb-5 tabular-nums min-h-4">
                {t.monthly === 0 ? (
                  <span className="text-muted-foreground">Free forever</span>
                ) : interval === "yearly" ? (
                  <span className="text-[--pos] font-medium">Save ${saving} a year</span>
                ) : (
                  <span className="text-muted-foreground">or ${t.yearly} USD / yr billed annually</span>
                )}
              </div>
              <ul className="text-[13px] space-y-2 mb-6 flex-1">
                {t.features.map((f) => (
                  <li key={f} className="flex gap-2 items-start">
                    <Check className="w-3.5 h-3.5 text-[--pos] mt-0.5 shrink-0" aria-hidden />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              {t.limits && <div className="text-[11px] text-muted-foreground mb-4">{t.limits}</div>}
              <Link
                href="/signup"
                className={cn(buttonVariants({ variant: featured ? "default" : "outline" }), "w-full")}
              >
                {t.cta}
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
}
