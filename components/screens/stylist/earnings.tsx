import { StatBlock, PersonCell } from "@/components/shared";
import {
  STYLIST_EARNINGS_WEEKLY,
  STYLIST_EARNINGS_LABELS,
  STYLIST_SERVICE_MIX,
  STYLIST_STATEMENTS,
} from "@/lib/data";

const EARNINGS_MAX = Math.max(...STYLIST_EARNINGS_WEEKLY);

export function StylistEarnings() {
  return (
    <div className="flex-1 overflow-auto p-6 lg:p-8">
      <div className="mb-6">
        <h2 className="text-[15px] font-semibold tracking-tight">Earnings</h2>
        <p className="text-[13px] text-muted-foreground">Apr 1 – 30</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatBlock
          label="Earned MTD"
          value="8,420"
          unit="€"
          delta="8.4%"
          foot="vs last month"
        />
        <StatBlock label="Sessions" value="48" delta="12%" foot="this month" />
        <StatBlock
          label="Tips"
          value="640"
          unit="€"
          delta="4.2%"
          foot="from 32 clients"
        />
        <StatBlock
          label="Next payout"
          value="5,473"
          unit="€"
          foot="Apr 30"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-5 mb-5">
        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-baseline justify-between mb-4">
            <div>
              <div className="text-[13px] font-medium text-muted-foreground">
                Weekly earnings
              </div>
              <div className="text-[11px] text-muted-foreground mt-0.5">
                Last 8 weeks
              </div>
            </div>
          </div>
          <WeeklyEarningsChart />
        </div>

        <div className="bg-card border border-border rounded-lg p-6">
          <div className="text-[13px] font-medium text-muted-foreground mb-4">
            Service breakdown
          </div>
          <div className="flex flex-col gap-3.5">
            {STYLIST_SERVICE_MIX.map((s) => (
              <div key={s.service}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[13px]">{s.service}</span>
                  <span className="text-xs text-muted-foreground tabular-nums">
                    {s.sessions} sessions · €{s.revenue.toLocaleString()}
                  </span>
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[--teal-700]"
                    style={{ width: `${s.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <div className="text-[13px] font-medium text-muted-foreground">
            Statement
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left text-[11px] font-medium tracking-[0.08em] uppercase text-muted-foreground pb-3 pt-3 pl-6">
                  Date
                </th>
                <th className="text-left text-[11px] font-medium tracking-[0.08em] uppercase text-muted-foreground pb-3 pt-3">
                  Client
                </th>
                <th className="text-left text-[11px] font-medium tracking-[0.08em] uppercase text-muted-foreground pb-3 pt-3">
                  Service
                </th>
                <th className="text-left text-[11px] font-medium tracking-[0.08em] uppercase text-muted-foreground pb-3 pt-3">
                  Credits
                </th>
                <th className="text-right text-[11px] font-medium tracking-[0.08em] uppercase text-muted-foreground pb-3 pt-3">
                  Gross
                </th>
                <th className="text-right text-[11px] font-medium tracking-[0.08em] uppercase text-muted-foreground pb-3 pt-3">
                  Share
                </th>
                <th className="text-right text-[11px] font-medium tracking-[0.08em] uppercase text-muted-foreground pb-3 pt-3 pr-6">
                  Net
                </th>
              </tr>
            </thead>
            <tbody>
              {STYLIST_STATEMENTS.map((s, i) => {
                const net = Math.round(s.gross * s.commission / 100);
                return (
                  <tr
                    key={i}
                    className="border-b border-[--line-soft] last:border-0"
                  >
                    <td className="py-3.5 pl-6 text-xs text-muted-foreground">
                      {s.date}
                    </td>
                    <td className="py-3.5">
                      <PersonCell name={s.client} hue={0} />
                    </td>
                    <td className="py-3.5">{s.service}</td>
                    <td className="py-3.5 tabular-nums">{s.credits}</td>
                    <td className="py-3.5 text-right tabular-nums">
                      €{s.gross}
                    </td>
                    <td className="py-3.5 text-right tabular-nums text-muted-foreground">
                      {s.commission}%
                    </td>
                    <td className="py-3.5 text-right tabular-nums font-medium pr-6">
                      €{net}
                    </td>
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

function WeeklyEarningsChart() {
  return (
    <div className="flex items-end gap-3 h-[200px] pt-3">
      {STYLIST_EARNINGS_WEEKLY.map((v, i) => {
        return (
          <div key={i} className="flex-1 flex flex-col items-center gap-2">
            <div
              className="w-full rounded bg-[--teal-700]"
              style={{ height: `${(v / EARNINGS_MAX) * 160}px` }}
            />
            <div className="text-[10px] text-muted-foreground tracking-wider">
              {STYLIST_EARNINGS_LABELS[i]}
            </div>
          </div>
        );
      })}
    </div>
  );
}
