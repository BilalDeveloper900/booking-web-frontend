import { CalendarDays, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatBlock, PersonCell, Pill } from "@/components/shared";
import { TRAINERS, FINANCE_MONTHS, FINANCE_INCOMING, FINANCE_OUTGOING, RECENT_TRANSACTIONS } from "@/lib/data";

export function FinanceScreen() {
  return (
    <div className="flex-1 overflow-auto p-8">
      <div className="flex items-center mb-5">
        <div>
          <h2 className="text-[15px] font-semibold tracking-tight">Finance</h2>
          <p className="text-[13px] text-muted-foreground">Period · 1 Apr – 30 Apr · Closes in 2 days</p>
        </div>
        <div className="flex-1" />
        <Button variant="outline" size="sm" className="gap-2 mr-2"><CalendarDays className="w-3.5 h-3.5" /> April 2026</Button>
        <Button variant="outline" size="sm" className="gap-2 mr-2"><ArrowUpRight className="w-3.5 h-3.5" /> Export</Button>
        <Button size="sm">Run payout</Button>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        <StatBlock label="Incoming" value="38,420" unit="€" delta="12.4%" foot="vs last month" />
        <StatBlock label="Outgoing" value="21,300" unit="€" delta="8.1%" deltaKind="neg" foot="payouts + fees" />
        <StatBlock label="Net" value="17,120" unit="€" delta="18.2%" foot="margin 44.6%" />
        <StatBlock label="Pending payout" value="6,840" unit="€" foot="to 6 stylists · Apr 30" />
      </div>

      <div className="grid grid-cols-[2fr_1fr] gap-5">
        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-baseline justify-between mb-4">
            <div>
              <div className="text-[13px] font-medium text-muted-foreground">Incoming vs. outgoing</div>
              <div className="text-[11px] text-muted-foreground mt-0.5">Last 6 months</div>
            </div>
            <div className="flex items-center gap-4 text-[11px] text-muted-foreground">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-0.5 bg-[--teal-700]" />Incoming</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-0.5 bg-[--neg] opacity-70" />Outgoing</span>
            </div>
          </div>
          <FlowChart />
        </div>

        <div className="bg-card border border-border rounded-lg p-6">
          <div className="text-[13px] font-medium text-muted-foreground mb-4">Revenue mix</div>
          <DonutChart />
          <div className="mt-[18px]">
            <MixRow label="Studio subscriptions" amount={14620} color="var(--teal-700)" pct={38} />
            <MixRow label="Atelier subscriptions" amount={9840} color="var(--teal-500)" pct={26} />
            <MixRow label="Credit packs" amount={8210} color="var(--sage-500)" pct={21} />
            <MixRow label="Pay-as-you-go" amount={5750} color="oklch(0.85 0.04 195)" pct={15} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-5 mt-5">
        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-baseline justify-between mb-4">
            <div className="text-[13px] font-medium text-muted-foreground">Upcoming payouts</div>
            <span className="text-xs text-[--teal-700] cursor-pointer">Schedule →</span>
          </div>
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left text-[11px] font-medium tracking-[0.08em] uppercase text-muted-foreground pb-3">Stylist</th>
                <th className="text-left text-[11px] font-medium tracking-[0.08em] uppercase text-muted-foreground pb-3">Sessions</th>
                <th className="text-left text-[11px] font-medium tracking-[0.08em] uppercase text-muted-foreground pb-3">Rate</th>
                <th className="text-right text-[11px] font-medium tracking-[0.08em] uppercase text-muted-foreground pb-3">Payout</th>
              </tr>
            </thead>
            <tbody>
              {TRAINERS.map((t) => (
                <tr key={t.name} className="border-b border-[--line-soft] last:border-0">
                  <td className="py-3"><PersonCell name={t.name} hue={t.hue} /></td>
                  <td className="tabular-nums">{t.clients}</td>
                  <td className="tabular-nums">{t.rate}%</td>
                  <td className="text-right tabular-nums font-medium">€{Math.round(t.mtd * t.rate / 100).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-baseline justify-between mb-4">
            <div className="text-[13px] font-medium text-muted-foreground">Recent transactions</div>
            <span className="text-xs text-[--teal-700] cursor-pointer">Ledger →</span>
          </div>
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left text-[11px] font-medium tracking-[0.08em] uppercase text-muted-foreground pb-3">Date</th>
                <th className="text-left text-[11px] font-medium tracking-[0.08em] uppercase text-muted-foreground pb-3">Description</th>
                <th className="text-left text-[11px] font-medium tracking-[0.08em] uppercase text-muted-foreground pb-3">Type</th>
                <th className="text-right text-[11px] font-medium tracking-[0.08em] uppercase text-muted-foreground pb-3">Amount</th>
              </tr>
            </thead>
            <tbody>
              {RECENT_TRANSACTIONS.map((r, i) => (
                <tr key={i} className="border-b border-[--line-soft] last:border-0">
                  <td className="py-3 text-xs text-muted-foreground">{r.d}</td>
                  <td>{r.desc}</td>
                  <td>{r.t === "in" ? <Pill kind="sage">Income</Pill> : <Pill kind="warn">Outflow</Pill>}</td>
                  <td className="text-right tabular-nums font-medium" style={{ color: r.t === "in" ? "var(--pos)" : "var(--neg)" }}>
                    {r.t === "in" ? "+" : "−"}€{r.a}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

const FLOW_MAX = Math.max(...FINANCE_INCOMING, ...FINANCE_OUTGOING);

function FlowChart() {
  const max = FLOW_MAX;
  const W = 520, H = 220, pad = 24;
  const x = (i: number) => pad + (i / (FINANCE_MONTHS.length - 1)) * (W - pad * 2);
  const y = (v: number) => H - pad - (v / max) * (H - pad * 2);
  const pathD = (arr: readonly number[]) => arr.map((v, i) => `${i === 0 ? "M" : "L"} ${x(i)} ${y(v)}`).join(" ");
  const area = `${pathD(FINANCE_INCOMING)} L ${x(FINANCE_INCOMING.length - 1)} ${H - pad} L ${x(0)} ${H - pad} Z`;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-[240px]">
      <defs>
        <linearGradient id="incFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="oklch(0.42 0.05 200)" stopOpacity="0.18" />
          <stop offset="100%" stopColor="oklch(0.42 0.05 200)" stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0, 0.25, 0.5, 0.75, 1].map((p) => (
        <line key={p} x1={pad} x2={W - pad} y1={y(max * p)} y2={y(max * p)} stroke="var(--line-soft)" strokeDasharray="2 4" />
      ))}
      {FINANCE_MONTHS.map((m, i) => (
        <text key={m} x={x(i)} y={H - 6} fill="var(--ink-500)" fontSize="10" textAnchor="middle">{m}</text>
      ))}
      <path d={area} fill="url(#incFill)" />
      <path d={pathD(FINANCE_INCOMING)} stroke="var(--teal-700)" strokeWidth="2" fill="none" />
      <path d={pathD(FINANCE_OUTGOING)} stroke="var(--neg)" strokeWidth="2" fill="none" strokeDasharray="4 3" opacity="0.7" />
      {FINANCE_INCOMING.map((v, i) => <circle key={i} cx={x(i)} cy={y(v)} r="3" fill="var(--teal-700)" />)}
    </svg>
  );
}

const DONUT_DATA = [
  { v: 38, c: "var(--teal-700)" },
  { v: 26, c: "var(--teal-500)" },
  { v: 21, c: "var(--sage-500)" },
  { v: 15, c: "oklch(0.85 0.04 195)" },
];
const DONUT_R = 60, DONUT_CX = 80, DONUT_CY = 80, DONUT_SW = 16;
const DONUT_C = 2 * Math.PI * DONUT_R;
const DONUT_SEGMENTS = DONUT_DATA.reduce<{ dash: number; offset: number; c: string }[]>((acc, d) => {
  const cum = acc.reduce((s, seg) => s + seg.dash, 0);
  acc.push({ dash: (d.v / 100) * DONUT_C, offset: -(cum), c: d.c });
  return acc;
}, []);

function DonutChart() {
  return (
    <div className="flex items-start gap-6 mt-2">
      <svg width="160" height="160" viewBox="0 0 160 160">
        <circle cx={DONUT_CX} cy={DONUT_CY} r={DONUT_R} fill="none" stroke="var(--ink-100)" strokeWidth={DONUT_SW} />
        {DONUT_SEGMENTS.map((seg, i) => (
          <circle key={i} cx={DONUT_CX} cy={DONUT_CY} r={DONUT_R} fill="none"
            stroke={seg.c} strokeWidth={DONUT_SW}
            strokeDasharray={`${seg.dash} ${DONUT_C - seg.dash}`}
            strokeDashoffset={seg.offset}
            transform={`rotate(-90 ${DONUT_CX} ${DONUT_CY})`}
          />
        ))}
        <text x={DONUT_CX} y={DONUT_CY - 2} textAnchor="middle" className="text-[22px] font-semibold" fill="var(--ink-900)">€38.4k</text>
        <text x={DONUT_CX} y={DONUT_CY + 14} textAnchor="middle" fontSize="9" fill="var(--ink-500)" letterSpacing="1">THIS MONTH</text>
      </svg>
      <p className="flex-1 text-xs text-muted-foreground leading-relaxed">
        62% of incoming is recurring. Healthy mix — credit packs giving you upside on top of MRR.
      </p>
    </div>
  );
}

function MixRow({ label, amount, color, pct }: { label: string; amount: number; color: string; pct: number }) {
  return (
    <div className="mb-2.5">
      <div className="flex items-center text-xs">
        <span className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-sm" style={{ background: color }} />
          <span>{label}</span>
        </span>
        <span className="flex-1" />
        <span className="tabular-nums font-medium">€{amount.toLocaleString()}</span>
        <span className="w-9 text-right text-muted-foreground text-[11px]">{pct}%</span>
      </div>
    </div>
  );
}
