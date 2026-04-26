import { Filter, ArrowUpRight, Plus, Search, ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatBlock, PersonCell, Pill } from "@/components/shared";
import { CLIENTS } from "@/lib/data";

export function ClientsScreen() {
  return (
    <div className="flex-1 overflow-auto p-8">
      <div className="flex items-center mb-5">
        <div>
          <h2 className="text-[15px] font-semibold tracking-tight">Clients</h2>
          <p className="text-[13px] text-muted-foreground">312 total · 186 active subscribers · 28 new this month</p>
        </div>
        <div className="flex-1" />
        <Button variant="outline" size="sm" className="gap-2 mr-2"><Filter className="w-3.5 h-3.5" /> All plans</Button>
        <Button variant="outline" size="sm" className="gap-2 mr-2"><ArrowUpRight className="w-3.5 h-3.5" /> Export</Button>
        <Button size="sm" className="gap-2"><Plus className="w-3.5 h-3.5" /> Invite client</Button>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        <StatBlock label="Active" value="186" foot="of 312 total" />
        <StatBlock label="Low credits" value="14" foot="< 2 remaining" />
        <StatBlock label="Lapsed (60d)" value="22" foot="re-engagement queued" />
        <StatBlock label="Avg LTV" value="2,140" unit="€" foot="across all plans" />
      </div>

      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="flex items-center px-6 py-4 border-b border-border">
          <div className="flex items-center gap-2 bg-muted px-3 py-1.5 rounded-lg max-w-[320px] flex-1">
            <Search className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-[13px] text-muted-foreground">Search clients…</span>
          </div>
          <div className="flex-1" />
          <div className="flex items-center gap-1.5">
            {["All", "Subscribers", "Pay-as-you-go", "Lapsed"].map((t, i) => (
              <button
                key={t}
                className="text-xs px-3 py-1.5 rounded-md transition-colors"
                style={{
                  background: i === 0 ? "var(--ink-900)" : "transparent",
                  color: i === 0 ? "white" : "var(--ink-700)",
                  fontWeight: i === 0 ? 500 : 400,
                }}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <table className="w-full text-[13px]">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left text-[11px] font-medium tracking-[0.08em] uppercase text-muted-foreground pb-3 pt-3 pl-6">Client</th>
              <th className="text-left text-[11px] font-medium tracking-[0.08em] uppercase text-muted-foreground pb-3 pt-3">Plan</th>
              <th className="text-left text-[11px] font-medium tracking-[0.08em] uppercase text-muted-foreground pb-3 pt-3">Credits</th>
              <th className="text-left text-[11px] font-medium tracking-[0.08em] uppercase text-muted-foreground pb-3 pt-3">Stylist</th>
              <th className="text-left text-[11px] font-medium tracking-[0.08em] uppercase text-muted-foreground pb-3 pt-3">Last visit</th>
              <th className="text-right text-[11px] font-medium tracking-[0.08em] uppercase text-muted-foreground pb-3 pt-3">LTV</th>
              <th className="text-left text-[11px] font-medium tracking-[0.08em] uppercase text-muted-foreground pb-3 pt-3">Status</th>
              <th className="pb-3 pt-3 pr-4" />
            </tr>
          </thead>
          <tbody>
            {CLIENTS.map((c) => (
              <tr key={c.name} className="border-b border-[--line-soft] last:border-0">
                <td className="py-3.5 pl-6"><PersonCell name={c.name} hue={c.hue} /></td>
                <td className="text-xs text-muted-foreground">{c.plan}</td>
                <td><CreditsCell value={c.credits} /></td>
                <td className="text-xs text-muted-foreground">{c.trainer}</td>
                <td className="text-xs text-muted-foreground">{c.last}</td>
                <td className="text-right tabular-nums">€{c.ltv.toLocaleString()}</td>
                <td>
                  {c.status === "active" && <Pill kind="sage" dot>Active</Pill>}
                  {c.status === "low" && <Pill kind="warn" dot>Low credits</Pill>}
                  {c.status === "lapsed" && <Pill dot>Lapsed</Pill>}
                </td>
                <td className="pr-4 text-muted-foreground"><MoreHorizontal className="w-4 h-4" /></td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="flex items-center px-6 py-3.5 border-t border-border text-xs text-muted-foreground">
          <span>Showing 8 of 312</span>
          <div className="flex-1" />
          <div className="flex items-center gap-1">
            <Button variant="outline" size="icon" className="w-8 h-7"><ChevronLeft className="w-3.5 h-3.5" /></Button>
            <Button variant="outline" size="icon" className="w-8 h-7"><ChevronRight className="w-3.5 h-3.5" /></Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function CreditsCell({ value }: { value: number }) {
  const max = 12;
  const pct = Math.min(100, (value / max) * 100);
  const color = value === 0 ? "var(--neg)" : value <= 2 ? "var(--warn)" : "var(--teal-700)";
  return (
    <div className="flex items-center gap-2">
      <div className="w-14 h-[5px] bg-muted rounded-full overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span
        className="text-xs tabular-nums"
        style={{
          color: value === 0 ? "var(--neg)" : "var(--ink-900)",
          fontWeight: value <= 2 ? 600 : 400,
        }}
      >
        {value}
      </span>
    </div>
  );
}
