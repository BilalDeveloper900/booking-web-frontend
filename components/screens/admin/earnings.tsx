import { StatBlock, PersonCell } from "@/components/shared";
import { ADMIN_SERVICE_MIX, ADMIN_STATEMENTS } from "@/lib/data";
import { EarningsBars } from "@/components/charts/earnings-bars";

export function AdminEarnings() {
  return (
    <div className="flex-1 overflow-auto p-6 lg:p-8">
      <div className="mb-6">
        <h2 className="text-[24px] font-semibold tracking-tight leading-tight">Earnings</h2>
        <p className="text-[13px] text-muted-foreground mt-1">Apr 1 – 30</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatBlock label="Earned MTD" value="8,420" unit="€" delta="8.4%" foot="vs last month" hero />
        <StatBlock label="Sessions" value="48" delta="12%" foot="this month" />
        <StatBlock label="Tips" value="640" unit="€" delta="4.2%" foot="from 32 clients" />
        <StatBlock label="Next payout" value="5,473" unit="€" foot="Apr 30" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[2fr_1fr] gap-5 mb-5">
        <Card>
          <div className="flex items-baseline justify-between mb-4 gap-4">
            <div>
              <div className="text-[13px] font-medium text-foreground">Weekly earnings</div>
              <div className="text-[11px] text-muted-foreground mt-0.5">Last 8 weeks</div>
            </div>
          </div>
          <EarningsBars height={200} />
        </Card>

        <Card>
          <div className="text-[13px] font-medium text-foreground mb-4">Service breakdown</div>
          <div className="flex flex-col gap-3.5">
            {ADMIN_SERVICE_MIX.map((s) => (
              <div key={s.service}>
                <div className="flex items-center justify-between mb-1.5 gap-2">
                  <span className="text-[13px] truncate">{s.service}</span>
                  <span className="text-xs text-muted-foreground tabular-nums shrink-0">
                    {s.sessions} · €{s.revenue.toLocaleString()}
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
              {ADMIN_STATEMENTS.map((s, i) => {
                const net = Math.round((s.gross * s.commission) / 100);
                return (
                  <tr
                    key={i}
                    className="border-b border-[--line-soft] last:border-0 hover:bg-muted/40 motion-safe:transition-colors motion-safe:duration-150"
                  >
                    <td className="py-3.5 pl-6 text-xs text-muted-foreground tabular-nums">{s.date}</td>
                    <td className="py-3.5"><PersonCell name={s.client} hue={0} /></td>
                    <td className="py-3.5">{s.service}</td>
                    <td className="py-3.5 tabular-nums">{s.credits}</td>
                    <td className="py-3.5 text-right tabular-nums">€{s.gross}</td>
                    <td className="py-3.5 text-right tabular-nums text-muted-foreground">{s.commission}%</td>
                    <td className="py-3.5 text-right tabular-nums font-medium pr-6">€{net}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
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
