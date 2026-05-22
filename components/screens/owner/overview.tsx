"use client";

import Link from "next/link";
import { ArrowRight, Filter, Plus, Users } from "lucide-react";
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
} from "recharts";
import { Button } from "@/components/ui/button";
import { StatBlock, PersonCell, UtilBar, Pill, HueAvatar } from "@/components/shared";
import { TableSkeletonRows } from "@/components/skeletons";
import { useCurrentMember } from "@/lib/auth/use-current-member";
import {
  useOwnerOverviewStats,
  useOwnerToday,
  useOwnerAdminPerformance,
  useOwnerRevenueMonths,
  useOwnerSubscriptionHealth,
  type OwnerRevenueMonth,
  type OwnerTodaySession,
} from "@/lib/owner-overview";
import {
  axisTick,
  chartTokens,
  ChartTooltipFrame,
  ChartTooltipRow,
  type RechartsTooltipProps,
} from "@/components/charts/theme";

export function OwnerOverview() {
  const { member } = useCurrentMember();
  const studioId = member?.studio.id;
  const currency = member?.studio.currency ?? "EUR";
  const firstName = member?.user.name?.split(" ")[0] ?? "there";

  const stats = useOwnerOverviewStats(studioId);
  const today = useOwnerToday(studioId);
  const admins = useOwnerAdminPerformance(studioId);
  const revenue = useOwnerRevenueMonths(studioId);
  const health = useOwnerSubscriptionHealth(studioId);

  const workingTodayCount = countUniqueAdmins(today.items);
  const upcomingTodayCount = today.items.filter(
    (s) => s.status === "next" || s.status === "upcoming"
  ).length;

  return (
    <div className="flex-1 overflow-auto p-6 lg:p-8">
      <div className="flex items-start mb-8 gap-4 flex-wrap">
        <div>
          <h2 className="text-[24px] font-semibold tracking-tight leading-tight">
            {greeting()}, {firstName}.
          </h2>
          <p className="text-[13px] text-muted-foreground mt-1">
            {formatTodayLabel(new Date())} ·{" "}
            {workingTodayCount} {workingTodayCount === 1 ? "admin" : "admins"} working today ·{" "}
            {upcomingTodayCount} {upcomingTodayCount === 1 ? "booking" : "bookings"} ahead.
          </p>
        </div>
        <div className="flex-1" />
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-2">
            <Filter className="w-3.5 h-3.5" /> This month
          </Button>
          <Link
            href="/owner/calendar"
            className="inline-flex items-center justify-center gap-2 h-8 px-3 text-[13px] font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 motion-safe:transition-colors motion-safe:duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <Plus className="w-3.5 h-3.5" /> New booking
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatBlock
          label="Revenue"
          value={formatAmount(stats.stats.revenueCents / 100)}
          unit={currencySymbol(currency)}
          delta={formatDelta(stats.stats.revenueDeltaPct)}
          deltaKind={(stats.stats.revenueDeltaPct ?? 0) >= 0 ? "pos" : "neg"}
          foot="vs last month"
          hero
          loading={stats.loading}
        />
        <StatBlock
          label="Bookings"
          value={String(stats.stats.bookingsCount)}
          delta={formatDelta(stats.stats.bookingsDeltaPct)}
          deltaKind={(stats.stats.bookingsDeltaPct ?? 0) >= 0 ? "pos" : "neg"}
          foot="this month"
          loading={stats.loading}
        />
        <StatBlock
          label="Active subscribers"
          value={String(stats.stats.activeSubscribers)}
          delta={stats.stats.newSubscribersMTD > 0 ? `+${stats.stats.newSubscribersMTD}` : undefined}
          foot={`${stats.stats.newSubscribersMTD} new this month`}
          loading={stats.loading}
        />
        <StatBlock
          label="Credits sold"
          value={String(stats.stats.creditsSold)}
          delta={formatDelta(stats.stats.creditsSoldDeltaPct)}
          deltaKind={(stats.stats.creditsSoldDeltaPct ?? 0) >= 0 ? "pos" : "neg"}
          foot="this month"
          loading={stats.loading}
        />
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
          <RevenueBars data={revenue.data} currency={currency} />
        </Card>

        <Card>
          <CardHeader
            title="Today's schedule"
            right={<CardLink href="/owner/calendar">View calendar</CardLink>}
          />
          <TodaySchedule items={today.items} loading={today.loading} />
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
              {admins.loading && admins.items.length === 0 && (
                <TableSkeletonRows rows={4} cols={4} />
              )}
              {!admins.loading && admins.items.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-10 text-center text-sm text-muted-foreground">
                    No admins yet — invite one from <Link href="/owner/admins" className="text-foreground hover:underline">Admins</Link>.
                  </td>
                </tr>
              )}
              {admins.items.slice(0, 5).map((a) => (
                <tr
                  key={a.memberId}
                  className="border-b border-[--line-soft] last:border-0 hover:bg-muted/40 motion-safe:transition-colors motion-safe:duration-150"
                >
                  <td className="py-3.5">
                    <PersonCell name={a.name} meta={a.role} hue={a.hue} />
                  </td>
                  <td className="tabular-nums">{a.bookingsMTD}</td>
                  <td><UtilBar value={a.utilizationPct} /></td>
                  <td className="text-right tabular-nums">
                    {currencySymbol(currency)}
                    {formatAmount(a.earnedCentsMTD / 100)}
                  </td>
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
            {health.loading && health.data.byPlan.length === 0 && (
              <div className="py-6 text-center text-xs text-muted-foreground">Loading…</div>
            )}
            {!health.loading && health.data.byPlan.length === 0 && (
              <div className="py-6 text-center text-xs text-muted-foreground">
                No clients yet.
              </div>
            )}
            {health.data.byPlan.map((p) => (
              <SubHealth key={p.planId} label={p.planName} count={p.count} pct={p.pct} />
            ))}
          </div>
          <div className="h-px bg-border my-4" />
          <div className="flex justify-between gap-4">
            <MetricMini
              label="Cancelled (30d)"
              value={String(health.data.cancelledThisMonth)}
            />
            <MetricMini
              label="MRR"
              value={`${currencySymbol(currency)}${formatAmount(health.data.mrrCents / 100)}`}
            />
            <MetricMini
              label="Net new"
              value={formatNetNew(health.data.newThisMonth - health.data.cancelledThisMonth)}
              valueColor={
                health.data.newThisMonth - health.data.cancelledThisMonth >= 0
                  ? "var(--pos)"
                  : "var(--neg)"
              }
            />
          </div>
        </Card>
      </div>
    </div>
  );
}

// ─────────── Helpers ───────────

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

function formatTodayLabel(d: Date): string {
  return d.toLocaleDateString(undefined, {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

function countUniqueAdmins(items: OwnerTodaySession[]): number {
  return new Set(items.map((s) => s.adminName)).size;
}

function currencySymbol(code: string): string {
  switch (code) {
    case "EUR": return "€";
    case "USD": return "$";
    case "GBP": return "£";
    case "PKR": return "₨";
    default: return code + " ";
  }
}

function formatAmount(value: number): string {
  if (Math.abs(value) >= 10_000) {
    return value.toLocaleString(undefined, { maximumFractionDigits: 0 });
  }
  return value.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

function formatDelta(pct: number | null): string | undefined {
  if (pct === null) return undefined;
  const sign = pct >= 0 ? "+" : "";
  return `${sign}${pct.toFixed(1)}%`;
}

function formatNetNew(n: number): string {
  if (n > 0) return `+${n}`;
  return String(n);
}

// ─────────── Subcomponents ───────────

function RevenueBars({
  data,
  currency,
}: {
  data: OwnerRevenueMonth[];
  currency: string;
}) {
  return (
    <div className="h-55 -mx-1 mt-3">
      <ResponsiveContainer>
        <BarChart data={data} barCategoryGap={10} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
          <XAxis
            dataKey="month"
            axisLine={false}
            tickLine={false}
            tick={axisTick}
            interval={0}
          />
          <Tooltip
            cursor={{ fill: "var(--muted)", opacity: 0.4 }}
            content={(props) => <RevenueTooltip {...props} currency={currency} />}
          />
          <Bar dataKey="subs" stackId="a" fill={chartTokens.primary} animationDuration={400} />
          <Bar
            dataKey="credits"
            stackId="a"
            fill={chartTokens.secondary}
            radius={[4, 4, 0, 0]}
            animationDuration={400}
            animationBegin={120}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function RevenueTooltip({
  active,
  payload,
  label,
  currency,
}: RechartsTooltipProps & { currency: string }) {
  if (!active || !payload || payload.length === 0) return null;
  const subs = (payload.find((p) => p.dataKey === "subs")?.value as number | undefined) ?? 0;
  const credits = (payload.find((p) => p.dataKey === "credits")?.value as number | undefined) ?? 0;
  function fmt(cents: number) {
    return `${currencySymbol(currency)}${formatAmount(cents / 100)}`;
  }
  return (
    <ChartTooltipFrame label={label != null ? String(label) : undefined}>
      <ChartTooltipRow color={chartTokens.primary} label="Subscriptions" value={fmt(subs)} />
      <ChartTooltipRow color={chartTokens.secondary} label="Credit packs" value={fmt(credits)} />
      <div className="h-px bg-border my-1" />
      <ChartTooltipRow color="transparent" label="Total" value={fmt(subs + credits)} />
    </ChartTooltipFrame>
  );
}

function TodaySchedule({
  items,
  loading,
}: {
  items: OwnerTodaySession[];
  loading: boolean;
}) {
  if (loading && items.length === 0) {
    return (
      <div className="px-2 py-6 text-center text-xs text-muted-foreground">Loading…</div>
    );
  }
  if (items.length === 0) {
    return (
      <div className="px-2 py-6 text-center text-xs text-muted-foreground">
        Nothing scheduled today.
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-1">
      {items.slice(0, 5).map((b) => (
        <div
          key={b.sessionId}
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
            <div className="flex items-center gap-2 mb-0.5 flex-wrap">
              <span className="text-[13px] font-medium truncate">
                {b.mode === "group" ? b.service : b.client ?? b.service}
              </span>
              {b.status === "now" && <Pill kind="teal" dot>In session</Pill>}
              {b.status === "next" && <Pill kind="sage">Up next</Pill>}
              {b.mode === "group" && (
                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-muted text-[10px] font-medium text-muted-foreground">
                  <Users className="w-2.5 h-2.5" aria-hidden /> {b.attendees}/{b.capacity ?? "?"}
                </span>
              )}
            </div>
            <div className="text-xs text-muted-foreground truncate">
              {b.mode === "group" ? b.adminName : `${b.service} · ${b.adminName}`} · {b.duration}min
            </div>
          </div>
          {b.mode === "group" ? (
            <HueAvatar name={b.service} hue={b.hue} />
          ) : (
            <HueAvatar name={b.client ?? "Open"} hue={b.clientHue ?? b.hue} />
          )}
        </div>
      ))}
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
