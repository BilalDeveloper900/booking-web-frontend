import { Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatBlock, PersonCell, Pill, HueAvatar } from "@/components/shared";
import {
  STYLIST_TODAY,
  STYLIST_EARNINGS_WEEKLY,
  STYLIST_EARNINGS_LABELS,
  STYLIST_THREADS,
} from "@/lib/data";

const EARNINGS_MAX = Math.max(...STYLIST_EARNINGS_WEEKLY);

export function StylistOverview() {
  return (
    <div className="flex-1 overflow-auto p-6 lg:p-8">
      <div className="flex items-center mb-6">
        <div>
          <h2 className="text-[15px] font-semibold tracking-tight">
            Hi Camille — 7 sessions today
          </h2>
          <p className="text-[13px] text-muted-foreground">
            Tuesday, 28 April 2026
          </p>
        </div>
        <div className="flex-1" />
        <Button variant="outline" size="sm" className="gap-2">
          <Filter className="w-3.5 h-3.5" /> This week
        </Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatBlock label="Today" value="7" unit="sessions" foot="3 completed" />
        <StatBlock
          label="This week"
          value="34"
          delta="12%"
          foot="vs last week"
        />
        <StatBlock
          label="Earned MTD"
          value="8,420"
          unit="€"
          delta="8.4%"
          foot="vs last month"
        />
        <StatBlock label="Avg rating" value="4.92" unit="★" foot="48 reviews" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-5">
        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-baseline justify-between mb-4">
            <div className="text-[13px] font-medium text-muted-foreground">
              Today
            </div>
            <span className="text-xs text-[--teal-700] cursor-pointer">
              View calendar →
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left text-[11px] font-medium tracking-[0.08em] uppercase text-muted-foreground pb-3">
                    Time
                  </th>
                  <th className="text-left text-[11px] font-medium tracking-[0.08em] uppercase text-muted-foreground pb-3">
                    Client
                  </th>
                  <th className="text-left text-[11px] font-medium tracking-[0.08em] uppercase text-muted-foreground pb-3">
                    Service
                  </th>
                  <th className="text-left text-[11px] font-medium tracking-[0.08em] uppercase text-muted-foreground pb-3">
                    Duration
                  </th>
                  <th className="text-left text-[11px] font-medium tracking-[0.08em] uppercase text-muted-foreground pb-3">
                    Credits
                  </th>
                  <th className="text-left text-[11px] font-medium tracking-[0.08em] uppercase text-muted-foreground pb-3">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {STYLIST_TODAY.map((s, i) => (
                  <tr
                    key={i}
                    className="border-b border-[--line-soft] last:border-0"
                  >
                    <td className="py-3 tabular-nums">{s.time}</td>
                    <td className="py-3">
                      <PersonCell name={s.client} hue={s.hue} />
                    </td>
                    <td className="py-3">{s.service}</td>
                    <td className="py-3 tabular-nums">{s.duration}m</td>
                    <td className="py-3 tabular-nums">{s.credits}</td>
                    <td className="py-3">
                      {s.status === "done" && <Pill>Done</Pill>}
                      {s.status === "now" && (
                        <Pill kind="teal" dot>
                          In session
                        </Pill>
                      )}
                      {s.status === "next" && <Pill kind="sage">Up next</Pill>}
                      {s.status === "upcoming" && <Pill>Upcoming</Pill>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex flex-col gap-5">
          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-baseline justify-between mb-4">
              <div className="text-[13px] font-medium text-muted-foreground">
                Weekly earnings
              </div>
              <span className="text-xs text-[--teal-700] cursor-pointer">
                Details →
              </span>
            </div>
            <EarningsMiniChart />
          </div>

          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-baseline justify-between mb-4">
              <div className="text-[13px] font-medium text-muted-foreground">
                Messages
              </div>
              <span className="text-xs text-[--teal-700] cursor-pointer">
                View all →
              </span>
            </div>
            <div className="flex flex-col gap-1">
              {STYLIST_THREADS.slice(0, 3).map((t) => (
                <div
                  key={t.id}
                  className="flex items-center gap-3 px-2 py-2.5 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <HueAvatar name={t.name} hue={t.hue} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-[13px] font-medium">{t.name}</span>
                      <span className="text-[10px] text-muted-foreground">
                        {t.time}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground truncate">
                      {t.lastMsg}
                    </div>
                  </div>
                  {t.unread > 0 && (
                    <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground text-[10px] font-medium grid place-items-center shrink-0">
                      {t.unread}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function EarningsMiniChart() {
  return (
    <div className="flex items-end gap-3 h-[120px]">
      {STYLIST_EARNINGS_WEEKLY.map((v, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-2">
          <div
            className="w-full rounded bg-[--teal-700]"
            style={{ height: `${(v / EARNINGS_MAX) * 90}px` }}
          />
          <div className="text-[10px] text-muted-foreground tracking-wider">
            {STYLIST_EARNINGS_LABELS[i]}
          </div>
        </div>
      ))}
    </div>
  );
}
