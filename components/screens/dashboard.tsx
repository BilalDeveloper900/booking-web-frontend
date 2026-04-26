import { Filter, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatBlock, PersonCell, UtilBar, Pill, HueAvatar } from "@/components/shared";
import { TRAINERS, TODAY_BOOKINGS, REVENUE_BARS, REVENUE_LABELS } from "@/lib/data";

export function DashboardScreen() {
  return (
    <div className="flex-1 overflow-auto p-8">
      <div className="flex items-center mb-6">
        <div>
          <h2 className="text-[15px] font-semibold tracking-tight">Good morning, Elena.</h2>
          <p className="text-[13px] text-muted-foreground">Tuesday, 28 April · 3 stylists working today · 18 bookings ahead.</p>
        </div>
        <div className="flex-1" />
        <Button variant="outline" size="sm" className="gap-2 mr-2">
          <Filter className="w-3.5 h-3.5" /> This month
        </Button>
        <Button size="sm" className="gap-2">
          <Plus className="w-3.5 h-3.5" /> New booking
        </Button>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        <StatBlock label="Revenue" value="38,420" unit="€" delta="12.4%" foot="vs last month" />
        <StatBlock label="Bookings" value="412" delta="8.1%" foot="92% utilization" />
        <StatBlock label="Active subscribers" value="186" delta="3.2%" foot="14 new this month" />
        <StatBlock label="Credits sold" value="1,248" delta="2.1%" deltaKind="neg" foot="6 packs refunded" />
      </div>

      <div className="grid grid-cols-[2fr_1fr] gap-5">
        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-baseline justify-between mb-4">
            <div>
              <div className="text-[13px] font-medium text-muted-foreground">Revenue</div>
              <div className="text-[11px] text-muted-foreground mt-0.5">Subscriptions vs. credit packs · last 12 months</div>
            </div>
            <div className="flex items-center gap-4 text-[11px] text-muted-foreground">
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-sm bg-[--teal-700]" />Subscriptions</span>
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-sm bg-[--sage-500]" />Credit packs</span>
            </div>
          </div>
          <RevenueChart />
        </div>

        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-baseline justify-between mb-4">
            <div className="text-[13px] font-medium text-muted-foreground">Today&apos;s schedule</div>
            <span className="text-xs text-[--teal-700] cursor-pointer">View calendar →</span>
          </div>
          <TodaySchedule />
        </div>
      </div>

      <div className="grid grid-cols-[2fr_1fr] gap-5 mt-5">
        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-baseline justify-between mb-4">
            <div className="text-[13px] font-medium text-muted-foreground">Stylist performance</div>
            <span className="text-xs text-[--teal-700] cursor-pointer">All stylists →</span>
          </div>
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left text-[11px] font-medium tracking-[0.08em] uppercase text-muted-foreground pb-3">Stylist</th>
                <th className="text-left text-[11px] font-medium tracking-[0.08em] uppercase text-muted-foreground pb-3">Bookings</th>
                <th className="text-left text-[11px] font-medium tracking-[0.08em] uppercase text-muted-foreground pb-3">Utilization</th>
                <th className="text-right text-[11px] font-medium tracking-[0.08em] uppercase text-muted-foreground pb-3">Earned (MTD)</th>
              </tr>
            </thead>
            <tbody>
              {TRAINERS.slice(0, 5).map((t) => (
                <tr key={t.name} className="border-b border-[--line-soft] last:border-0">
                  <td className="py-3.5"><PersonCell name={t.name} meta={t.role} hue={t.hue} /></td>
                  <td className="tabular-nums">{t.clients}</td>
                  <td><UtilBar value={t.util} /></td>
                  <td className="text-right tabular-nums">€{t.mtd.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-baseline justify-between mb-4">
            <div className="text-[13px] font-medium text-muted-foreground">Subscription health</div>
            <span className="text-xs text-[--teal-700] cursor-pointer">Details →</span>
          </div>
          <div className="mt-2">
            <SubHealth label="Studio · 8 credits" count={112} pct={60} />
            <SubHealth label="Atelier · 12 credits" count={58} pct={31} />
            <SubHealth label="Pay-as-you-go" count={16} pct={9} />
          </div>
          <div className="h-px bg-border my-4" />
          <div className="flex justify-between">
            <MetricMini label="Churn (30d)" value="2.4%" />
            <MetricMini label="MRR" value="€18,640" />
            <MetricMini label="Net new" value="+11" valueColor="var(--pos)" />
          </div>
        </div>
      </div>
    </div>
  );
}

function RevenueChart() {
  return (
    <div className="flex items-end gap-3 h-[220px] pt-3">
      {REVENUE_BARS.map((v, i) => {
        const sub = v * 0.62;
        const cred = v - sub;
        return (
          <div key={i} className="flex-1 flex flex-col items-center gap-2">
            <div className="w-full flex flex-col justify-end rounded overflow-hidden" style={{ height: `${v * 1.8}px` }}>
              <div style={{ background: "var(--sage-500)", height: cred * 1.8 }} />
              <div style={{ background: "var(--teal-700)", height: sub * 1.8 }} />
            </div>
            <div className="text-[10px] text-muted-foreground tracking-wider">{REVENUE_LABELS[i]}</div>
          </div>
        );
      })}
    </div>
  );
}

function TodaySchedule() {
  return (
    <div className="flex flex-col gap-1">
      {TODAY_BOOKINGS.map((b, i) => (
        <div
          key={i}
          className="grid grid-cols-[56px_1fr_auto] gap-3 items-center px-2 py-2.5 rounded-lg"
          style={{ background: b.status === "now" ? "var(--teal-100)" : "transparent" }}
        >
          <div className="text-[13px] tabular-nums" style={{
            color: b.status === "now" ? "var(--teal-900)" : "var(--ink-700)",
            fontWeight: b.status === "now" ? 600 : 400,
          }}>
            {b.time}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-[13px] font-medium">{b.client}</span>
              {b.status === "now" && <Pill kind="teal" dot>In session</Pill>}
              {b.status === "next" && <Pill kind="sage">Up next</Pill>}
            </div>
            <div className="text-xs text-muted-foreground">{b.service} · {b.trainer} · {b.duration}min</div>
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
        <div className="h-full rounded-full bg-[--teal-700]" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function MetricMini({ label, value, valueColor }: { label: string; value: string; valueColor?: string }) {
  return (
    <div>
      <div className="text-[11px] text-muted-foreground uppercase tracking-[0.08em] mb-1">{label}</div>
      <div className="text-[28px] font-semibold tracking-tight" style={{ color: valueColor }}>{value}</div>
    </div>
  );
}
