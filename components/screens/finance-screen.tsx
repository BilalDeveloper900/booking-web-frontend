"use client";

import { ArrowUpRight, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatBlock, PersonCell, Pill } from "@/components/shared";
import { FlowChart } from "@/components/charts/flow-chart";
import { RevenueMixDonut } from "@/components/charts/revenue-mix-donut";
import { useCurrentMember } from "@/lib/auth/use-current-member";
import { useOwnerFinance } from "@/lib/finance";
import { formatPrice, currencySymbol } from "@/lib/offers";

export function FinanceScreen() {
  const { member } = useCurrentMember();
  const studioId = member?.studio.id;
  const currency = member?.studio.currency ?? "EUR";
  const sym = currencySymbol(currency).trim();

  const { data, loading } = useOwnerFinance(studioId);
  const money = (cents: number) => Math.round(cents / 100).toLocaleString();

  const monthLabel = new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const mixTotal = data.mix.reduce((s, m) => s + m.cents, 0);

  return (
    <div className="flex-1 overflow-auto p-6 lg:p-8">
      <div className="flex items-start mb-6 gap-4 flex-wrap">
        <div>
          <h2 className="text-[24px] font-semibold tracking-tight leading-tight">Finance</h2>
          <p className="text-[13px] text-muted-foreground mt-1">{monthLabel} · this month</p>
        </div>
        <div className="flex-1" />
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-2">
            <CalendarDays className="w-3.5 h-3.5" /> {monthLabel}
          </Button>
          <Button variant="outline" size="sm" className="gap-2">
            <ArrowUpRight className="w-3.5 h-3.5" /> Export
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatBlock label="Incoming" value={money(data.incomingCents)} unit={sym} foot="client payments this month" hero loading={loading} />
        <StatBlock label="Outgoing" value={money(data.outgoingCents)} unit={sym} deltaKind="neg" foot="admin payouts paid" loading={loading} />
        <StatBlock label="Net" value={money(data.netCents)} unit={sym} foot="incoming − outgoing" loading={loading} />
        <StatBlock
          label="Owed to admins"
          value={money(data.pendingPayoutCents)}
          unit={sym}
          foot={`commission · ${data.adminPayouts.filter((a) => a.payoutCents > 0).length} admin${
            data.adminPayouts.filter((a) => a.payoutCents > 0).length === 1 ? "" : "s"
          }`}
          loading={loading}
        />
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
          <FlowChart data={data.flow} currency={currency} />
        </Card>

        <Card>
          <CardHeader title="Revenue mix" />
          {data.mix.length === 0 ? (
            <EmptyMini text="No client revenue this month yet." />
          ) : (
            <>
              <div className="flex items-start gap-6 mt-2">
                <RevenueMixDonut segments={data.mix} currency={currency} totalCents={mixTotal} />
                <p className="flex-1 text-xs text-muted-foreground leading-relaxed">
                  This month&rsquo;s client revenue, split by memberships vs. one-off credit top-ups.
                </p>
              </div>
              <div className="mt-4.5">
                {data.mix.map((m, i) => (
                  <MixRow
                    key={m.name}
                    label={m.name}
                    amount={Math.round(m.cents / 100)}
                    sym={sym}
                    color={MIX_COLORS[i % MIX_COLORS.length]}
                    pct={m.pct}
                  />
                ))}
              </div>
            </>
          )}
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mt-5">
        <Card>
          <CardHeader title="Owed to admins" subtitle="Commission on delivered sessions this month" />
          {data.adminPayouts.length === 0 ? (
            <EmptyMini text="No admins yet." />
          ) : (
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-border">
                  <ColHead>Admin</ColHead>
                  <ColHead>Sessions</ColHead>
                  <ColHead>Rate</ColHead>
                  <ColHead align="right">Owed</ColHead>
                </tr>
              </thead>
              <tbody>
                {data.adminPayouts.map((t) => (
                  <tr
                    key={t.memberId}
                    className="border-b border-[--line-soft] last:border-0 hover:bg-muted/40 motion-safe:transition-colors motion-safe:duration-150"
                  >
                    <td className="py-3"><PersonCell name={t.name} hue={t.hue} /></td>
                    <td className="tabular-nums">{t.sessions}</td>
                    <td className="tabular-nums">{t.ratePct}%</td>
                    <td className="text-right tabular-nums font-medium">
                      {formatPrice(t.payoutCents, currency)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>

        <Card>
          <CardHeader title="Recent transactions" />
          {data.recent.length === 0 ? (
            <EmptyMini text="No transactions yet. Record a client payment to get started." />
          ) : (
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
                {data.recent.map((r) => (
                  <tr
                    key={r.id}
                    className="border-b border-[--line-soft] last:border-0 hover:bg-muted/40 motion-safe:transition-colors motion-safe:duration-150"
                  >
                    <td className="py-3 text-xs text-muted-foreground tabular-nums">{fmtDate(r.date)}</td>
                    <td className="max-w-45 truncate">{r.description}</td>
                    <td>{r.kind === "in" ? <Pill kind="sage">Income</Pill> : <Pill kind="warn">Payout</Pill>}</td>
                    <td
                      className="text-right tabular-nums font-medium"
                      style={{ color: r.kind === "in" ? "var(--pos)" : "var(--neg)" }}
                    >
                      {r.kind === "in" ? "+" : "−"}
                      {formatPrice(r.amountCents, currency)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      </div>
    </div>
  );
}

const MIX_COLORS = ["var(--teal-700)", "var(--sage-500)", "var(--teal-500)", "oklch(0.85 0.04 195)"];

function fmtDate(iso: string): string {
  const d = new Date(iso);
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${d.getDate()} ${months[d.getMonth()]}`;
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
        {subtitle && <div className="text-[11px] text-muted-foreground mt-0.5">{subtitle}</div>}
      </div>
      {right}
    </div>
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

function MixRow({
  label,
  amount,
  sym,
  color,
  pct,
}: {
  label: string;
  amount: number;
  sym: string;
  color: string;
  pct: number;
}) {
  return (
    <div className="mb-2.5">
      <div className="flex items-center text-xs gap-2">
        <span className="w-2 h-2 rounded-sm shrink-0" style={{ background: color }} aria-hidden />
        <span className="truncate">{label}</span>
        <span className="flex-1" />
        <span className="tabular-nums font-medium">
          {sym}
          {amount.toLocaleString()}
        </span>
        <span className="w-9 text-right text-muted-foreground text-[11px] tabular-nums">{pct}%</span>
      </div>
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
