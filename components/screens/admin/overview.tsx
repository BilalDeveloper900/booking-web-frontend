"use client";

import Link from "next/link";
import { ArrowRight, Filter, Users } from "lucide-react";
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
} from "recharts";
import { Button } from "@/components/ui/button";
import { StatBlock, PersonCell, Pill, HueAvatar } from "@/components/shared";
import {
  useAdminToday,
  useAdminOverviewStats,
  useAdminWeekSessions,
  useAdminMessagePreview,
  type AdminTodaySession,
} from "@/lib/admin-overview";
import { useCurrentMember } from "@/lib/auth/use-current-member";
import { ServicesPanel } from "@/components/screens/admin/services";
import {
  axisTick,
  chartTokens,
  ChartTooltipFrame,
  ChartTooltipRow,
  type RechartsTooltipProps,
} from "@/components/charts/theme";
import { cn } from "@/lib/utils";

export function AdminOverview() {
  const { member } = useCurrentMember();
  const studioId = member?.studio.id;
  const adminMemberId = member?.member.id;
  const firstName = member?.user.name?.split(" ")[0] ?? "there";

  const today = useAdminToday({ studioId, adminMemberId });
  const stats = useAdminOverviewStats({ studioId, adminMemberId });
  const week = useAdminWeekSessions({ studioId, adminMemberId });
  const messages = useAdminMessagePreview({ adminMemberId });

  const headlineCount = stats.stats.todayCount;
  const sessionsWord = headlineCount === 1 ? "session" : "sessions";

  return (
    <div className="flex-1 overflow-auto p-6 lg:p-8">
      <div className="flex items-start mb-6 gap-4 flex-wrap">
        <div>
          <h2 className="text-[24px] font-semibold tracking-tight leading-tight">
            Hi {firstName} — {headlineCount} {sessionsWord} today
          </h2>
          <p className="text-[13px] text-muted-foreground mt-1">
            {formatTodayLabel(new Date())}
          </p>
        </div>
        <div className="flex-1" />
        <Button variant="outline" size="sm" className="gap-2">
          <Filter className="w-3.5 h-3.5" /> This week
        </Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatBlock
          label="Today"
          value={String(stats.stats.todayCount)}
          unit="sessions"
          foot={completedFoot(today.items)}
          hero
        />
        <StatBlock
          label="This week"
          value={String(stats.stats.weekCount)}
          unit="sessions"
          foot="Mon–Sun"
        />
        <StatBlock
          label="Sessions MTD"
          value={String(stats.stats.sessionsMTD)}
          unit="sessions"
          foot={monthFoot(new Date())}
        />
        <StatBlock
          label="Avg rating"
          value={stats.stats.avgRating !== null ? stats.stats.avgRating.toFixed(2) : "—"}
          unit="★"
          foot={
            stats.stats.reviewCount > 0
              ? `${stats.stats.reviewCount} review${stats.stats.reviewCount === 1 ? "" : "s"}`
              : "No reviews yet"
          }
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[2fr_1fr] gap-5">
        <Card>
          <CardHeader title="Today" right={<CardLink href="/admin/calendar">View calendar</CardLink>} />
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
                {today.loading && (
                  <tr>
                    <td colSpan={6} className="py-10 text-center text-sm text-muted-foreground">
                      Loading today…
                    </td>
                  </tr>
                )}
                {!today.loading && today.items.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-10 text-center text-sm text-muted-foreground">
                      Nothing scheduled today.
                    </td>
                  </tr>
                )}
                {today.items.map((s) => {
                  const isGroup = s.mode === "group";
                  return (
                    <tr
                      key={s.sessionId}
                      className="border-b border-[--line-soft] last:border-0 hover:bg-muted/40 motion-safe:transition-colors motion-safe:duration-150"
                    >
                      <td className="py-3 tabular-nums">{s.time}</td>
                      <td className="py-3">
                        {isGroup ? (
                          <AttendeeStack
                            attendees={s.attendees ?? []}
                            capacity={s.capacity ?? 1}
                            hue={s.hue}
                          />
                        ) : (
                          <PersonCell
                            name={s.client ?? "(open slot)"}
                            hue={s.clientHue ?? s.hue}
                          />
                        )}
                      </td>
                      <td className="py-3">
                        <div className="flex items-center gap-1.5">
                          {s.service}
                          {isGroup && (
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-muted text-[10px] font-medium text-muted-foreground">
                              <Users className="w-2.5 h-2.5" aria-hidden /> Class
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 tabular-nums">{s.duration}m</td>
                      <td className="py-3 tabular-nums">{s.credits}</td>
                      <td className="py-3">
                        {s.status === "done" && <Pill>Done</Pill>}
                        {s.status === "now" && <Pill kind="teal" dot>In session</Pill>}
                        {s.status === "next" && <Pill kind="sage">Up next</Pill>}
                        {s.status === "upcoming" && <Pill>Upcoming</Pill>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>

        <div className="flex flex-col gap-5">
          <Card>
            <CardHeader title="This week" right={<CardLink href="/admin/calendar">Open calendar</CardLink>} />
            <WeekSessionsBars data={week.data} height={140} />
          </Card>

          <Card>
            <CardHeader title="Messages" right={<CardLink href="/admin/messages">View all</CardLink>} />
            <div className="flex flex-col gap-1">
              {messages.loading && (
                <div className="px-2 py-3 text-xs text-muted-foreground">Loading…</div>
              )}
              {!messages.loading && messages.threads.length === 0 && (
                <div className="px-2 py-3 text-xs text-muted-foreground">
                  No messages yet.
                </div>
              )}
              {messages.threads.map((t) => (
                <Link
                  key={t.threadId}
                  href={`/admin/messages?thread=${t.threadId}`}
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

      <div className="mt-5">
        <Card>
          <ServicesPanel />
        </Card>
      </div>
    </div>
  );
}

// ─────────── Helpers ───────────

function formatTodayLabel(d: Date): string {
  return d.toLocaleDateString(undefined, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function completedFoot(items: AdminTodaySession[]): string {
  const done = items.filter((s) => s.status === "done").length;
  return `${done} completed`;
}

function monthFoot(d: Date): string {
  return d.toLocaleDateString(undefined, { month: "long" });
}

// ─────────── Subcomponents ───────────

function WeekSessionsBars({
  data,
  height = 140,
}: {
  data: { day: string; sessions: number }[];
  height?: number;
}) {
  return (
    <div style={{ height }} className="-mx-1 mt-2">
      <ResponsiveContainer>
        <BarChart data={data} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
          <XAxis
            dataKey="day"
            axisLine={false}
            tickLine={false}
            tick={axisTick}
            interval={0}
          />
          <Tooltip
            cursor={{ fill: "var(--muted)", opacity: 0.4 }}
            content={(props) => <SessionsTooltip {...props} />}
          />
          <Bar
            dataKey="sessions"
            fill={chartTokens.primary}
            radius={[4, 4, 0, 0]}
            animationDuration={400}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function SessionsTooltip({ active, payload, label }: RechartsTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;
  const sessions = (payload[0]?.value as number | undefined) ?? 0;
  return (
    <ChartTooltipFrame label={label != null ? String(label) : undefined}>
      <ChartTooltipRow
        color={chartTokens.primary}
        label="Sessions"
        value={String(sessions)}
      />
    </ChartTooltipFrame>
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

function AttendeeStack({
  attendees,
  capacity,
  hue,
}: {
  attendees: readonly string[];
  capacity: number;
  hue: number;
}) {
  const visible = attendees.slice(0, 3);
  const extra = attendees.length - visible.length;
  const full = attendees.length >= capacity;
  return (
    <div className="flex items-center gap-2.5">
      <div className="flex -space-x-1.5">
        {visible.map((n, i) => (
          <div
            key={n + i}
            className="ring-2 ring-card rounded-full"
            style={{ zIndex: visible.length - i }}
          >
            <HueAvatar name={n} hue={hue + i * 8} size={26} />
          </div>
        ))}
        {extra > 0 && (
          <div
            className="w-[26px] h-[26px] rounded-full bg-muted border border-border ring-2 ring-card grid place-items-center text-[10px] font-semibold text-muted-foreground tabular-nums"
            style={{ zIndex: 0 }}
          >
            +{extra}
          </div>
        )}
        {attendees.length === 0 && (
          <span className="text-xs text-muted-foreground">No signups yet</span>
        )}
      </div>
      <span
        className={cn(
          "text-[12px] font-medium tabular-nums",
          full ? "text-[--neg]" : "text-foreground"
        )}
      >
        {attendees.length}
        <span className="text-muted-foreground">/{capacity}</span>
      </span>
    </div>
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
