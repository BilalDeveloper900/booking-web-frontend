import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Pill } from "@/components/shared";
import {
  CLIENT_PROFILE,
  CLIENT_TOPUP_PACKS,
  CLIENT_TRANSACTIONS,
  CLIENT_PLANS,
} from "@/lib/data";
import { cn } from "@/lib/utils";

export function ClientCredits() {
  const p = CLIENT_PROFILE;
  const usedPct = (p.creditsUsed / p.creditsTotal) * 100;

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
            <Pill kind="teal">Active</Pill>
          </div>
          <div className="text-[28px] font-bold tracking-tight mb-0.5 tabular-nums">{p.plan}</div>
          <div className="text-sm opacity-70 mb-4 tabular-nums">
            €{p.pricePerMonth}/month · {p.creditsTotal} credits/month
          </div>
          <div className="h-2 bg-background/20 rounded-full overflow-hidden mb-3">
            <div
              className="h-full rounded-full bg-[--role-accent] motion-safe:transition-[width] motion-safe:duration-500 motion-safe:ease-out"
              style={{ width: `${usedPct}%` }}
            />
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs opacity-60 tabular-nums">
              {p.creditsUsed} of {p.creditsTotal} used · Renews {p.renewalDate}
            </span>
            <Button
              variant="outline"
              size="sm"
              className="border-background/30 text-background hover:bg-background/10"
            >
              Manage
            </Button>
          </div>
        </div>

        <SmallStat
          label="Used this month"
          value={p.creditsUsed}
          unit={`of ${p.creditsTotal} credits`}
          foot={`${p.creditsTotal - p.creditsUsed} remaining`}
        />
        <SmallStat
          label="Lifetime"
          value={p.lifetimeVisits}
          unit="visits"
          foot={`€${p.lifetimeSpent.toLocaleString()} spent`}
        />
      </div>

      <Section title="Top up credits">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {CLIENT_TOPUP_PACKS.map((pack) => {
            const featured = pack.label === "Best value";
            return (
              <div
                key={pack.credits}
                className={cn(
                  "bg-card border rounded-xl shadow-card p-4 relative motion-safe:transition-all motion-safe:duration-200 hover:-translate-y-px hover:shadow-hero",
                  featured ? "border-[--role-accent] ring-1 ring-[--role-accent]/30" : "border-border"
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
                  €{pack.price} · €{pack.perCredit.toFixed(2)}/credit
                </div>
                <div className="text-xs text-[--pos] font-medium mb-3 min-h-[1em] tabular-nums">
                  {pack.savings > 0 ? `Save ${pack.savings}%` : ""}
                </div>
                <Button variant={featured ? "default" : "outline"} size="sm" className="w-full">
                  Buy
                </Button>
              </div>
            );
          })}
        </div>
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
                {CLIENT_TRANSACTIONS.map((t, i) => (
                  <tr
                    key={i}
                    className="border-b border-[--line-soft] last:border-0 hover:bg-muted/40 motion-safe:transition-colors motion-safe:duration-150"
                  >
                    <td className="px-4 py-3 tabular-nums">{t.date}</td>
                    <td className="px-4 py-3">{t.desc}</td>
                    <td
                      className={cn(
                        "px-4 py-3 text-right tabular-nums font-medium",
                        t.credits > 0 ? "text-[--pos]" : "text-[--neg]"
                      )}
                    >
                      {t.credits > 0 ? "+" : ""}
                      {t.credits}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">{t.balance}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </Section>

      <Section title="Switch plan">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {CLIENT_PLANS.map((plan) => (
            <div
              key={plan.id}
              className={cn(
                "bg-card border rounded-xl shadow-card p-5 flex flex-col motion-safe:transition-all motion-safe:duration-200 hover:shadow-hero",
                plan.current ? "border-[--role-accent] ring-1 ring-[--role-accent]/30" : "border-border"
              )}
            >
              <div className="flex items-center justify-between mb-2 gap-2">
                <span className="text-[15px] font-semibold">{plan.name}</span>
                {plan.current && <Pill kind="teal">Current</Pill>}
              </div>
              <div className="text-[24px] font-bold tracking-tight mb-0.5 tabular-nums">
                {plan.price === 0 ? "Free" : `€${plan.price}`}
                {plan.price > 0 && (
                  <span className="text-sm font-normal text-muted-foreground">/month</span>
                )}
              </div>
              {plan.credits > 0 && (
                <div className="text-xs text-muted-foreground mb-2 tabular-nums">
                  {plan.credits} credits/month
                </div>
              )}
              <p className="text-xs text-muted-foreground mb-3">{plan.desc}</p>
              <ul className="text-xs space-y-1.5 mb-4 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-1.5">
                    <Check className="w-3.5 h-3.5 text-[--pos] mt-px shrink-0" aria-hidden />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              {plan.current ? (
                <Button variant="outline" size="sm" className="w-full" disabled>
                  Current plan
                </Button>
              ) : (
                <Button variant="outline" size="sm" className="w-full">
                  Switch
                </Button>
              )}
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
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
        {unit && <span className="text-sm text-muted-foreground ml-1 font-normal">{unit}</span>}
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

function Th({ children, align = "left" }: { children: React.ReactNode; align?: "left" | "right" }) {
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
