import Link from "next/link";
import { ArrowRight, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatBlock, PersonCell, Pill, HueAvatar } from "@/components/shared";
import { STYLIST_TODAY, STYLIST_THREADS } from "@/lib/data";
import { EarningsBars } from "@/components/charts/earnings-bars";

export function StylistOverview() {
  return (
    <div className="flex-1 overflow-auto p-6 lg:p-8">
      <div className="flex items-start mb-6 gap-4 flex-wrap">
        <div>
          <h2 className="text-[24px] font-semibold tracking-tight leading-tight">
            Hi Camille — 7 sessions today
          </h2>
          <p className="text-[13px] text-muted-foreground mt-1">
            Tuesday, 28 April 2026
          </p>
        </div>
        <div className="flex-1" />
        <Button variant="outline" size="sm" className="gap-2">
          <Filter className="w-3.5 h-3.5" /> This week
        </Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatBlock label="Today" value="7" unit="sessions" foot="3 completed" hero />
        <StatBlock label="This week" value="34" delta="12%" foot="vs last week" />
        <StatBlock label="Earned MTD" value="8,420" unit="€" delta="8.4%" foot="vs last month" />
        <StatBlock label="Avg rating" value="4.92" unit="★" foot="48 reviews" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-5">
        <Card>
          <CardHeader title="Today" right={<CardLink href="/stylist/calendar">View calendar</CardLink>} />
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-border">
                  <ColHead>Time</ColHead>
                  <ColHead>Client</ColHead>
                  <ColHead>Service</ColHead>
                  <ColHead>Duration</ColHead>
                  <ColHead>Credits</ColHead>
                  <ColHead>Status</ColHead>
                </tr>
              </thead>
              <tbody>
                {STYLIST_TODAY.map((s, i) => (
                  <tr
                    key={i}
                    className="border-b border-[--line-soft] last:border-0 hover:bg-muted/40 motion-safe:transition-colors motion-safe:duration-150"
                  >
                    <td className="py-3 tabular-nums">{s.time}</td>
                    <td className="py-3"><PersonCell name={s.client} hue={s.hue} /></td>
                    <td className="py-3">{s.service}</td>
                    <td className="py-3 tabular-nums">{s.duration}m</td>
                    <td className="py-3 tabular-nums">{s.credits}</td>
                    <td className="py-3">
                      {s.status === "done" && <Pill>Done</Pill>}
                      {s.status === "now" && <Pill kind="teal" dot>In session</Pill>}
                      {s.status === "next" && <Pill kind="sage">Up next</Pill>}
                      {s.status === "upcoming" && <Pill>Upcoming</Pill>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <div className="flex flex-col gap-5">
          <Card>
            <CardHeader title="Weekly earnings" right={<CardLink href="/stylist/earnings">Details</CardLink>} />
            <EarningsBars height={140} />
          </Card>

          <Card>
            <CardHeader title="Messages" right={<CardLink href="/stylist/messages">View all</CardLink>} />
            <div className="flex flex-col gap-1">
              {STYLIST_THREADS.slice(0, 3).map((t) => (
                <Link
                  key={t.id}
                  href={`/stylist/messages?thread=${t.id}`}
                  className="flex items-center gap-3 px-2 py-2.5 rounded-lg hover:bg-muted/50 motion-safe:transition-colors motion-safe:duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <HueAvatar name={t.name} hue={t.hue} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between mb-0.5 gap-2">
                      <span className="text-[13px] font-medium truncate">{t.name}</span>
                      <span className="text-[10px] text-muted-foreground shrink-0 tabular-nums">{t.time}</span>
                    </div>
                    <div className="text-xs text-muted-foreground truncate">{t.lastMsg}</div>
                  </div>
                  {t.unread > 0 && (
                    <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground text-[10px] font-medium grid place-items-center shrink-0 tabular-nums">
                      {t.unread}
                    </span>
                  )}
                </Link>
              ))}
            </div>
          </Card>
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

function CardHeader({
  title,
  right,
}: {
  title: string;
  right?: React.ReactNode;
}) {
  return (
    <div className="flex items-baseline justify-between mb-4 gap-4">
      <div className="text-[13px] font-medium text-foreground">{title}</div>
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

function ColHead({ children, align = "left" }: { children: React.ReactNode; align?: "left" | "right" }) {
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
