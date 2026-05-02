import Link from "next/link";
import { ArrowRight, Filter, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatBlock, PersonCell, UtilBar, Pill, HueAvatar } from "@/components/shared";
import { TRAINERS, TODAY_BOOKINGS } from "@/lib/data";
import { RevenueBars } from "@/components/charts/revenue-bars";

export function DashboardScreen() {
  return (
    <div className="flex-1 overflow-auto p-6 lg:p-8">
      <div className="flex items-start mb-8 gap-4 flex-wrap">
        <div>
          <h2 className="text-[24px] font-semibold tracking-tight leading-tight">
            Good morning, Elena.
          </h2>
          <p className="text-[13px] text-muted-foreground mt-1">
            Tuesday, 28 April · 3 admins working today · 18 bookings ahead.
          </p>
        </div>
        <div className="flex-1" />
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-2">
            <Filter className="w-3.5 h-3.5" /> This month
          </Button>
          <Button size="sm" className="gap-2">
            <Plus className="w-3.5 h-3.5" /> New booking
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatBlock label="Revenue" value="38,420" unit="€" delta="12.4%" foot="vs last month" hero />
        <StatBlock label="Bookings" value="412" delta="8.1%" foot="92% utilization" />
        <StatBlock label="Active subscribers" value="186" delta="3.2%" foot="14 new this month" />
        <StatBlock label="Credits sold" value="1,248" delta="2.1%" deltaKind="neg" foot="6 packs refunded" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[2fr_1fr] gap-5">
        <Card>
          <CardHeader
            title="Revenue"
            subtitle="Subscriptions vs. credit packs · last 12 months"
            right={
              <div className="flex items-center gap-4 text-[11px] text-muted-foreground">
                <LegendDot color="var(--teal-700)">Subscriptions</LegendDot>
                <LegendDot color="var(--sage-500)">Credit packs</LegendDot>
              </div>
            }
          />
          <RevenueBars />
        </Card>

        <Card>
          <CardHeader
            title="Today's schedule"
            right={
              <CardLink href="/owner/calendar">View calendar</CardLink>
            }
          />
          <TodaySchedule />
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[2fr_1fr] gap-5 mt-5">
        <Card>
          <CardHeader
            title="Admin performance"
            right={<CardLink href="/owner/admins">All admins</CardLink>}
          />
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-border">
                <ColHead>Admin</ColHead>
                <ColHead>Bookings</ColHead>
                <ColHead>Utilization</ColHead>
                <ColHead align="right">Earned (MTD)</ColHead>
              </tr>
            </thead>
            <tbody>
              {TRAINERS.slice(0, 5).map((t) => (
                <tr
                  key={t.name}
                  className="border-b border-[--line-soft] last:border-0 hover:bg-muted/40 motion-safe:transition-colors motion-safe:duration-150"
                >
                  <td className="py-3.5">
                    <PersonCell name={t.name} meta={t.role} hue={t.hue} />
                  </td>
                  <td className="tabular-nums">{t.clients}</td>
                  <td><UtilBar value={t.util} /></td>
                  <td className="text-right tabular-nums">€{t.mtd.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        <Card>
          <CardHeader
            title="Subscription health"
            right={<CardLink href="/owner/clients">Details</CardLink>}
          />
          <div className="mt-2">
            <SubHealth label="Studio · 8 credits" count={112} pct={60} />
            <SubHealth label="Atelier · 12 credits" count={58} pct={31} />
            <SubHealth label="Pay-as-you-go" count={16} pct={9} />
          </div>
          <div className="h-px bg-border my-4" />
          <div className="flex justify-between gap-4">
            <MetricMini label="Churn (30d)" value="2.4%" />
            <MetricMini label="MRR" value="€18,640" />
            <MetricMini label="Net new" value="+11" valueColor="var(--pos)" />
          </div>
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

function LegendDot({ color, children }: { color: string; children: React.ReactNode }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className="w-2 h-2 rounded-sm" style={{ background: color }} aria-hidden />
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

function TodaySchedule() {
  return (
    <div className="flex flex-col gap-1">
      {TODAY_BOOKINGS.map((b, i) => (
        <div
          key={i}
          className="grid grid-cols-[56px_1fr_auto] gap-3 items-center px-2 py-2.5 rounded-lg motion-safe:transition-colors motion-safe:duration-150 hover:bg-muted/40"
          style={{ background: b.status === "now" ? "var(--teal-100)" : undefined }}
        >
          <div
            className="text-[13px] tabular-nums"
            style={{
              color: b.status === "now" ? "var(--teal-900)" : "var(--ink-700)",
              fontWeight: b.status === "now" ? 600 : 400,
            }}
          >
            {b.time}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-[13px] font-medium truncate">{b.client}</span>
              {b.status === "now" && <Pill kind="teal" dot>In session</Pill>}
              {b.status === "next" && <Pill kind="sage">Up next</Pill>}
            </div>
            <div className="text-xs text-muted-foreground truncate">
              {b.service} · {b.trainer} · {b.duration}min
            </div>
          </div>
          <HueAvatar name={b.client} hue={b.hue} />
        </div>
      ))}
    </div>
  );
}

function SubHealth({ label, count, pct }: { label: string; count: number; pct: number }) {
  return (
    <div className="mb-3.5">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[13px]">{label}</span>
        <span className="text-[13px] tabular-nums font-medium">{count}</span>
      </div>
      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full rounded-full bg-[--role-accent] motion-safe:transition-[width] motion-safe:duration-500 motion-safe:ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function MetricMini({
  label,
  value,
  valueColor,
}: {
  label: string;
  value: string;
  valueColor?: string;
}) {
  return (
    <div className="min-w-0">
      <div className="text-[11px] text-muted-foreground uppercase tracking-[0.08em] mb-1">
        {label}
      </div>
      <div
        className="text-[22px] font-semibold tracking-tight tabular-nums"
        style={{ color: valueColor }}
      >
        {value}
      </div>
    </div>
  );
}
