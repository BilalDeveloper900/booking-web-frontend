import Link from "next/link";
import { ArrowRight, CalendarDays, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatBlock, PersonCell, Pill } from "@/components/shared";
import { TRAINERS, RECENT_TRANSACTIONS } from "@/lib/data";
import { FlowChart } from "@/components/charts/flow-chart";
import { RevenueMixDonut } from "@/components/charts/revenue-mix-donut";

export function FinanceScreen() {
  return (
    <div className="flex-1 overflow-auto p-6 lg:p-8">
      <div className="flex items-start mb-6 gap-4 flex-wrap">
        <div>
          <h2 className="text-[24px] font-semibold tracking-tight leading-tight">Finance</h2>
          <p className="text-[13px] text-muted-foreground mt-1">
            Period · 1 Apr – 30 Apr · Closes in 2 days
          </p>
        </div>
        <div className="flex-1" />
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-2">
            <CalendarDays className="w-3.5 h-3.5" /> April 2026
          </Button>
          <Button variant="outline" size="sm" className="gap-2">
            <ArrowUpRight className="w-3.5 h-3.5" /> Export
          </Button>
          <Button size="sm">Run payout</Button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatBlock label="Incoming" value="38,420" unit="€" delta="12.4%" foot="vs last month" hero />
        <StatBlock label="Outgoing" value="21,300" unit="€" delta="8.1%" deltaKind="neg" foot="payouts + fees" />
        <StatBlock label="Net" value="17,120" unit="€" delta="18.2%" foot="margin 44.6%" />
        <StatBlock label="Pending payout" value="6,840" unit="€" foot="to 6 admins · Apr 30" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[2fr_1fr] gap-5">
        <Card>
          <CardHeader
            title="Incoming vs. outgoing"
            subtitle="Last 6 months"
            right={
              <div className="flex items-center gap-4 text-[11px] text-muted-foreground">
                <LegendLine color="var(--teal-700)">Incoming</LegendLine>
                <LegendLine color="var(--neg)" dashed>Outgoing</LegendLine>
              </div>
            }
          />
          <FlowChart />
        </Card>

        <Card>
          <CardHeader title="Revenue mix" />
          <div className="flex items-start gap-6 mt-2">
            <RevenueMixDonut />
            <p className="flex-1 text-xs text-muted-foreground leading-relaxed">
              62% of incoming is recurring. Healthy mix — credit packs giving you upside on top of MRR.
            </p>
          </div>
          <div className="mt-4.5">
            <MixRow label="Studio subscriptions" amount={14620} color="var(--teal-700)" pct={38} />
            <MixRow label="Atelier subscriptions" amount={9840} color="var(--teal-500)" pct={26} />
            <MixRow label="Credit packs" amount={8210} color="var(--sage-500)" pct={21} />
            <MixRow label="Pay-as-you-go" amount={5750} color="oklch(0.85 0.04 195)" pct={15} />
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mt-5">
        <Card>
          <CardHeader
            title="Upcoming payouts"
            right={<CardLink href="/owner/finance#schedule">Schedule</CardLink>}
          />
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-border">
                <ColHead>Admin</ColHead>
                <ColHead>Sessions</ColHead>
                <ColHead>Rate</ColHead>
                <ColHead align="right">Payout</ColHead>
              </tr>
            </thead>
            <tbody>
              {TRAINERS.map((t) => (
                <tr
                  key={t.name}
                  className="border-b border-[--line-soft] last:border-0 hover:bg-muted/40 motion-safe:transition-colors motion-safe:duration-150"
                >
                  <td className="py-3"><PersonCell name={t.name} hue={t.hue} /></td>
                  <td className="tabular-nums">{t.clients}</td>
                  <td className="tabular-nums">{t.rate}%</td>
                  <td className="text-right tabular-nums font-medium">
                    €{Math.round((t.mtd * t.rate) / 100).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        <Card>
          <CardHeader
            title="Recent transactions"
            right={<CardLink href="/owner/finance#ledger">Ledger</CardLink>}
          />
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-border">
                <ColHead>Date</ColHead>
                <ColHead>Description</ColHead>
                <ColHead>Type</ColHead>
                <ColHead align="right">Amount</ColHead>
              </tr>
            </thead>
            <tbody>
              {RECENT_TRANSACTIONS.map((r, i) => (
                <tr
                  key={i}
                  className="border-b border-[--line-soft] last:border-0 hover:bg-muted/40 motion-safe:transition-colors motion-safe:duration-150"
                >
                  <td className="py-3 text-xs text-muted-foreground tabular-nums">{r.d}</td>
                  <td>{r.desc}</td>
                  <td>{r.t === "in" ? <Pill kind="sage">Income</Pill> : <Pill kind="warn">Outflow</Pill>}</td>
                  <td
                    className="text-right tabular-nums font-medium"
                    style={{ color: r.t === "in" ? "var(--pos)" : "var(--neg)" }}
                  >
                    {r.t === "in" ? "+" : "−"}€{r.a}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>
    </div>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-card border border-border rounded-xl p-6 shadow-card motion-safe:transition-shadow motion-safe:duration-200 hover:shadow-hero">
      {children}
    </div>
  );
}

function CardHeader({
  title,
  subtitle,
  right,
}: {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
}) {
  return (
    <div className="flex items-baseline justify-between mb-4 gap-4">
      <div>
        <div className="text-[13px] font-medium text-foreground">{title}</div>
        {subtitle && (
          <div className="text-[11px] text-muted-foreground mt-0.5">{subtitle}</div>
        )}
      </div>
      {right}
    </div>
  );
}

function CardLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1 text-xs font-medium text-[--role-accent] hover:gap-1.5 motion-safe:transition-all motion-safe:duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
    >
      {children}
      <ArrowRight className="w-3 h-3" aria-hidden />
    </Link>
  );
}

function LegendLine({
  color,
  dashed,
  children,
}: {
  color: string;
  dashed?: boolean;
  children: React.ReactNode;
}) {
  return (
    <span className="flex items-center gap-1.5">
      <span
        className="w-3 h-0.5"
        style={{
          background: dashed
            ? `repeating-linear-gradient(to right, ${color} 0 3px, transparent 3px 5px)`
            : color,
          opacity: dashed ? 0.7 : 1,
        }}
        aria-hidden
      />
      {children}
    </span>
  );
}

function ColHead({
  children,
  align = "left",
}: {
  children: React.ReactNode;
  align?: "left" | "right";
}) {
  return (
    <th
      className={`text-[11px] font-medium tracking-[0.08em] uppercase text-muted-foreground pb-3 ${
        align === "right" ? "text-right" : "text-left"
      }`}
    >
      {children}
    </th>
  );
}

function MixRow({ label, amount, color, pct }: { label: string; amount: number; color: string; pct: number }) {
  return (
    <div className="mb-2.5">
      <div className="flex items-center text-xs gap-2">
        <span className="w-2 h-2 rounded-sm shrink-0" style={{ background: color }} aria-hidden />
        <span className="truncate">{label}</span>
        <span className="flex-1" />
        <span className="tabular-nums font-medium">€{amount.toLocaleString()}</span>
        <span className="w-9 text-right text-muted-foreground text-[11px] tabular-nums">{pct}%</span>
      </div>
    </div>
  );
}
