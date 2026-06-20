"use client";

import { StatBlock, PersonCell } from "@/components/shared";
import { EarningsBars } from "@/components/charts/earnings-bars";
import { useCurrentMember } from "@/lib/auth/use-current-member";
import { useAdminEarnings } from "@/lib/earnings";
import { formatPrice, currencySymbol } from "@/lib/offers";

export function AdminEarnings() {
  const { member } = useCurrentMember();
  const studioId = member?.studio.id;
  const adminMemberId = member?.member.id;
  const currency = member?.studio.currency ?? "EUR";
  const sym = currencySymbol(currency).trim();

  const { data, loading } = useAdminEarnings({ studioId, adminMemberId });
  const money = (cents: number) => Math.round(cents / 100).toLocaleString();

  const monthLabel = new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" });

  return (
    <div className="flex-1 overflow-auto p-6 lg:p-8">
      <div className="mb-6">
        <h2 className="text-[24px] font-semibold tracking-tight leading-tight">Earnings</h2>
        <p className="text-[13px] text-muted-foreground mt-1">
          {monthLabel} · {data.commissionPct}% commission
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatBlock label="Earned MTD" value={money(data.earnedMTDCents)} unit={sym} foot="unpaid · this month" hero loading={loading} />
        <StatBlock label="Sessions" value={String(data.sessionsMTD)} foot="delivered this month" loading={loading} />
        <StatBlock label="Clients" value={String(data.clientsMTD)} foot="seen this month" loading={loading} />
        <StatBlock label="Avg / session" value={money(data.avgPerSessionCents)} unit={sym} foot="your share" loading={loading} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[2fr_1fr] gap-5 mb-5">
        <Card>
          <div className="flex items-baseline justify-between mb-4 gap-4">
            <div>
              <div className="text-[13px] font-medium text-foreground">Weekly earnings</div>
              <div className="text-[11px] text-muted-foreground mt-0.5">Last 8 weeks</div>
            </div>
          </div>
          <EarningsBars data={data.weekly} currency={currency} height={200} />
        </Card>

        <Card>
          <div className="text-[13px] font-medium text-foreground mb-4">Service breakdown</div>
          {data.serviceMix.length === 0 ? (
            <EmptyMini text="No delivered sessions this month yet." />
          ) : (
            <div className="flex flex-col gap-3.5">
              {data.serviceMix.map((s) => (
                <div key={s.service}>
                  <div className="flex items-center justify-between mb-1.5 gap-2">
                    <span className="text-[13px] truncate">{s.service}</span>
                    <span className="text-xs text-muted-foreground tabular-nums shrink-0">
                      {s.sessions} · {formatPrice(s.revenueCents, currency)}
                    </span>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[--role-accent] motion-safe:transition-[width] motion-safe:duration-500 motion-safe:ease-out"
                      style={{ width: `${s.pct}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <div className="bg-card border border-border rounded-xl shadow-card overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <div className="text-[13px] font-medium text-foreground">Statement</div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-border">
                <Th first>Date</Th>
                <Th>Client</Th>
                <Th>Service</Th>
                <Th>Credits</Th>
                <Th align="right">Gross</Th>
                <Th align="right">Share</Th>
                <Th align="right" last>Net</Th>
              </tr>
            </thead>
            <tbody>
              {data.statement.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-sm text-muted-foreground">
                    No earnings yet. Delivered sessions show up here.
                  </td>
                </tr>
              ) : (
                data.statement.map((s) => (
                  <tr
                    key={s.bookingId}
                    className="border-b border-[--line-soft] last:border-0 hover:bg-muted/40 motion-safe:transition-colors motion-safe:duration-150"
                  >
                    <td className="py-3.5 pl-6 text-xs text-muted-foreground tabular-nums">{fmtDate(s.date)}</td>
                    <td className="py-3.5"><PersonCell name={s.clientName} hue={s.clientHue} /></td>
                    <td className="py-3.5">{s.serviceName}</td>
                    <td className="py-3.5 tabular-nums">{s.credits}</td>
                    <td className="py-3.5 text-right tabular-nums">{formatPrice(s.grossCents, currency)}</td>
                    <td className="py-3.5 text-right tabular-nums text-muted-foreground">{s.commissionPct}%</td>
                    <td className="py-3.5 text-right tabular-nums font-medium pr-6">{formatPrice(s.netCents, currency)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function fmtDate(iso: string): string {
  const d = new Date(iso);
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${months[d.getMonth()]} ${d.getDate()}`;
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-card border border-border rounded-xl p-6 shadow-card motion-safe:transition-shadow motion-safe:duration-200 hover:shadow-hero">
      {children}
    </div>
  );
}

function EmptyMini({ text }: { text: string }) {
  return (
    <div className="border border-dashed border-border rounded-xl p-6 text-center text-[12px] text-muted-foreground">
      {text}
    </div>
  );
}

function Th({
  children,
  first,
  last,
  align = "left",
}: {
  children: React.ReactNode;
  first?: boolean;
  last?: boolean;
  align?: "left" | "right";
}) {
  return (
    <th
      className={`text-[11px] font-medium tracking-[0.08em] uppercase text-muted-foreground pb-3 pt-3 ${
        align === "right" ? "text-right" : "text-left"
      } ${first ? "pl-6" : ""} ${last ? "pr-6" : ""}`}
    >
      {children}
    </th>
  );
}
