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

  return (
    <div className="flex-1 overflow-auto p-6 lg:p-8">
      <h2 className="text-[15px] font-semibold tracking-tight mb-1">
        Credits &amp; plan
      </h2>
      <p className="text-[13px] text-muted-foreground mb-6">
        Manage your subscription, credits, and billing
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr_1fr] gap-4 mb-6">
        <div className="bg-foreground text-background rounded-lg p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div className="text-[11px] font-medium tracking-[0.08em] uppercase opacity-60">
              Current plan
            </div>
            <Pill kind="teal">Active</Pill>
          </div>
          <div className="text-[22px] font-bold tracking-tight mb-0.5">
            {p.plan}
          </div>
          <div className="text-sm opacity-70 mb-4">
            {"\u20AC"}{p.pricePerMonth}/month · {p.creditsTotal} credits/month
          </div>
          <div className="h-2 bg-background/20 rounded-full overflow-hidden mb-3">
            <div
              className="h-full rounded-full"
              style={{
                width: `${(p.creditsUsed / p.creditsTotal) * 100}%`,
                background: "var(--teal-500, oklch(0.7 0.12 195))",
              }}
            />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs opacity-60">
              {p.creditsUsed} of {p.creditsTotal} used · Renews {p.renewalDate}
            </span>
            <Button
              variant="outline"
              size="sm"
              className="border-background/30 text-background hover:bg-background/10"
            >
              Manage plan
            </Button>
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-[18px]">
          <div className="text-[11px] font-medium tracking-[0.08em] uppercase text-muted-foreground mb-3.5">
            Used this month
          </div>
          <div className="text-[28px] font-semibold tracking-tight leading-none tabular-nums">
            {p.creditsUsed}
            <span className="text-sm text-muted-foreground ml-1">
              of {p.creditsTotal} credits
            </span>
          </div>
          <div className="text-xs text-muted-foreground mt-3">
            {p.creditsTotal - p.creditsUsed} remaining
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-[18px]">
          <div className="text-[11px] font-medium tracking-[0.08em] uppercase text-muted-foreground mb-3.5">
            Lifetime
          </div>
          <div className="text-[28px] font-semibold tracking-tight leading-none tabular-nums">
            {p.lifetimeVisits}
            <span className="text-sm text-muted-foreground ml-1">visits</span>
          </div>
          <div className="text-xs text-muted-foreground mt-3">
            {"\u20AC"}{p.lifetimeSpent.toLocaleString()} spent
          </div>
        </div>
      </div>

      <div className="mb-6">
        <h3 className="text-[13px] font-medium text-muted-foreground mb-3">
          Top up credits
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {CLIENT_TOPUP_PACKS.map((pack) => (
            <div
              key={pack.credits}
              className="bg-card border border-border rounded-lg p-4 relative"
            >
              {pack.label && (
                <span className="absolute top-3 right-3">
                  <Pill kind={pack.label === "Best value" ? "teal" : "sage"}>
                    {pack.label}
                  </Pill>
                </span>
              )}
              <div className="text-[22px] font-bold tracking-tight mb-0.5">
                {pack.credits} credits
              </div>
              <div className="text-sm text-muted-foreground mb-1">
                {"\u20AC"}{pack.price} ·{" "}
                {"\u20AC"}{pack.perCredit.toFixed(2)}/credit
              </div>
              {pack.savings > 0 && (
                <div className="text-xs text-[--pos] font-medium mb-3">
                  Save {pack.savings}%
                </div>
              )}
              {!pack.savings && <div className="mb-3" />}
              <Button variant="outline" size="sm" className="w-full">
                Buy
              </Button>
            </div>
          ))}
        </div>
      </div>

      <div className="mb-6">
        <h3 className="text-[13px] font-medium text-muted-foreground mb-3">
          Transactions
        </h3>
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left text-[11px] font-medium tracking-[0.08em] uppercase text-muted-foreground px-4 py-3">
                    Date
                  </th>
                  <th className="text-left text-[11px] font-medium tracking-[0.08em] uppercase text-muted-foreground px-4 py-3">
                    Description
                  </th>
                  <th className="text-right text-[11px] font-medium tracking-[0.08em] uppercase text-muted-foreground px-4 py-3">
                    Credits
                  </th>
                  <th className="text-right text-[11px] font-medium tracking-[0.08em] uppercase text-muted-foreground px-4 py-3">
                    Balance
                  </th>
                </tr>
              </thead>
              <tbody>
                {CLIENT_TRANSACTIONS.map((t, i) => (
                  <tr
                    key={i}
                    className="border-b border-[--line-soft] last:border-0"
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
                    <td className="px-4 py-3 text-right tabular-nums">
                      {t.balance}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-[13px] font-medium text-muted-foreground mb-3">
          Switch plan
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {CLIENT_PLANS.map((plan) => (
            <div
              key={plan.id}
              className={cn(
                "bg-card border rounded-lg p-5 flex flex-col",
                plan.current ? "border-foreground" : "border-border"
              )}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[15px] font-semibold">{plan.name}</span>
                {plan.current && <Pill kind="teal">Current plan</Pill>}
              </div>
              <div className="text-[22px] font-bold tracking-tight mb-0.5">
                {plan.price === 0 ? "Free" : `\u20AC${plan.price}`}
                {plan.price > 0 && (
                  <span className="text-sm font-normal text-muted-foreground">
                    /month
                  </span>
                )}
              </div>
              {plan.credits > 0 && (
                <div className="text-xs text-muted-foreground mb-2">
                  {plan.credits} credits/month
                </div>
              )}
              <p className="text-xs text-muted-foreground mb-3">{plan.desc}</p>
              <ul className="text-xs space-y-1.5 mb-4 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-1.5">
                    <span className="text-[--pos] mt-px">&#10003;</span>
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
      </div>
    </div>
  );
}
