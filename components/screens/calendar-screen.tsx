"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Filter,
  Plus,
  ChevronLeft,
  ChevronRight,
  Clock,
  User,
  Scissors,
  MessageSquare,
  CalendarOff,
  Repeat,
  Users,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { HOURS } from "@/lib/data";
import { useServices, type ServiceRow } from "@/lib/services";
import { useCurrentMember } from "@/lib/auth/use-current-member";
import { useStudioMembers, type MemberWithUser } from "@/lib/members";
import { createGroupSession } from "@/lib/sessions";
import {
  useCalendarSessions,
  weekDays,
  weekRangeLabel,
  HOURS_START,
  type LiveCalendarEvent,
  type CalendarDay,
} from "@/lib/calendar";
import { cn } from "@/lib/utils";
import { HueAvatar, Pill } from "@/components/shared";
import { CalendarEventSkeleton } from "@/components/skeletons";
import { useTheme } from "@/components/theme-provider";

/** Local alias so existing render code reads the same. */
type CalendarEvent = LiveCalendarEvent;

/**
 * Resolve the per-event background + accent (left rail / text)
 * to the right pair of OKLCH values for the active theme. Light
 * mode keeps the soft-tint card; dark mode goes deep-tinted card
 * with a brighter accent for legibility on near-black surfaces.
 */
function eventColors(hue: number, isDark: boolean) {
  return {
    bg: isDark ? `oklch(0.27 0.04 ${hue})` : `oklch(0.96 0.03 ${hue})`,
    accent: isDark ? `oklch(0.72 0.10 ${hue})` : `oklch(0.55 0.08 ${hue})`,
    text: isDark ? `oklch(0.92 0.05 ${hue})` : `oklch(0.55 0.08 ${hue})`,
  };
}

const ROW_H = 56;
const VIEWS = ["Day", "Week", "Month"] as const;

/** Fixed positions for the calendar's loading-state placeholder events.
 * One small array per day-of-week column; deterministic so the skeleton
 * doesn't shimmy on re-renders. start = hours from HOURS_START, len = hours. */
const SKELETON_EVENT_LAYOUT: { start: number; len: number; hue: number }[][] = [
  [{ start: 1, len: 1, hue: 195 }, { start: 4, len: 1.5, hue: 280 }],
  [{ start: 0.5, len: 1, hue: 220 }, { start: 3, len: 1, hue: 165 }, { start: 6, len: 1.5, hue: 330 }],
  [{ start: 2, len: 1.5, hue: 130 }, { start: 5, len: 1, hue: 60 }],
  [{ start: 1.5, len: 1, hue: 25 }, { start: 4.5, len: 2, hue: 280 }],
  [{ start: 0.5, len: 1, hue: 195 }, { start: 3, len: 1.5, hue: 165 }, { start: 7, len: 1, hue: 130 }],
  [{ start: 2, len: 1, hue: 220 }, { start: 5, len: 1.5, hue: 60 }],
  [{ start: 1, len: 1, hue: 330 }],
];
type View = (typeof VIEWS)[number];

/** Each live event carries its admin info inline — no lookups needed. */
function trainerForEvent(event: CalendarEvent): {
  name: string;
  hue: number;
  role: string;
  id: string;
} {
  return {
    name: event.adminName,
    hue: event.adminHue,
    role: "Admin", // specialty isn't joined yet; show generic role label
    id: event.adminMemberId,
  };
}

function formatHour(start: number) {
  const total = HOURS_START + start;
  const hour = Math.floor(total);
  const minute = Math.round((total - hour) * 60);
  const h12 = ((hour + 11) % 12) + 1;
  const ampm = hour < 12 ? "AM" : "PM";
  return `${h12}:${minute.toString().padStart(2, "0")} ${ampm}`;
}

export function CalendarScreen() {
  const { member } = useCurrentMember();
  const studioId = member?.studio.id;
  const myRole = member?.role;
  const myMemberId = member?.member.id;

  // Owner sees all studio sessions; admin only their own.
  const scopedAdminId = myRole === "admin" ? myMemberId : undefined;

  const [view, setView] = useState<View>("Week");
  const [weekOffset, setWeekOffset] = useState(0);

  // Real admin list for owner's legend filter. Empty for admin role (legend hidden).
  const { members: admins } = useStudioMembers(studioId, "admin");

  // Visible week's 7 days, derived from weekOffset.
  const days = useMemo(() => weekDays(weekOffset), [weekOffset]);

  // Default day selection = today within visible week, else first day.
  const todayIdxInWeek = days.findIndex((d) => d.today);
  const [pickedDayIdx, setPickedDayIdx] = useState<number | null>(null);
  const selectedDayIdx =
    pickedDayIdx != null && pickedDayIdx >= 0 && pickedDayIdx < 7
      ? pickedDayIdx
      : todayIdxInWeek >= 0
        ? todayIdxInWeek
        : 0;
  const setSelectedDayIdx = setPickedDayIdx;

  // Owner-only filter: which admin chips are toggled on.
  const [adminFilterIds, setAdminFilterIds] = useState<Set<string> | null>(null);
  // Seed the filter once admins load (all on by default). Memoized so the
  // identity is stable across renders when the filter is the implicit
  // "everyone" default — otherwise `useMemo` consumers refire each render.
  const effectiveAdminFilter = useMemo(
    () => adminFilterIds ?? new Set(admins.map((a) => a.id)),
    [adminFilterIds, admins]
  );

  const {
    events: allEvents,
    loading: eventsLoading,
    error: eventsError,
    refetch: refetchEvents,
  } = useCalendarSessions({
    studioId,
    weekOffset,
    adminMemberId: scopedAdminId,
  });

  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [newSlot, setNewSlot] = useState<{ day: number; hour: number } | null>(null);
  const [openNewBooking, setOpenNewBooking] = useState(false);
  const [openNewClass, setOpenNewClass] = useState(false);

  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  const filteredEvents = useMemo(
    () =>
      myRole === "owner"
        ? allEvents.filter((e) => effectiveAdminFilter.has(e.adminMemberId))
        : allEvents,
    [allEvents, effectiveAdminFilter, myRole]
  );

  const eventsByDay = useMemo(() => {
    const map = new Map<number, CalendarEvent[]>();
    for (const e of filteredEvents) {
      const list = map.get(e.day) ?? [];
      list.push(e);
      map.set(e.day, list);
    }
    return map;
  }, [filteredEvents]);

  const nowFraction = now.getHours() + now.getMinutes() / 60 - HOURS_START;
  const nowVisible = nowFraction >= 0 && nowFraction <= HOURS.length;
  const nowTop = nowVisible ? nowFraction * ROW_H : 0;
  const nowLabel = now.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });

  const totalEvents = filteredEvents.length;
  const dateRange = weekRangeLabel(weekOffset);
  const showLegend = myRole === "owner";

  function toggleAdmin(id: string) {
    setAdminFilterIds((prev) => {
      const base = prev ?? new Set(admins.map((a) => a.id));
      const next = new Set(base);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function openSlot(day: number, hour: number) {
    setNewSlot({ day, hour });
    setOpenNewBooking(true);
  }

  return (
    <div className="flex-1 overflow-hidden flex flex-col p-4 md:p-6 lg:p-8">
      <div className="flex items-start mb-4 md:mb-5 gap-4 flex-wrap">
        <div>
          <h2 className="text-[20px] md:text-[24px] font-semibold tracking-tight leading-tight">
            {dateRange}
          </h2>
          <p className="text-[12px] md:text-[13px] text-muted-foreground mt-1 tabular-nums">
            {eventsLoading ? (
              <>
                <Loader2 className="w-3 h-3 inline animate-spin mr-1" /> Loading…
              </>
            ) : (
              <>
                {totalEvents} booking{totalEvents === 1 ? "" : "s"}
                {showLegend && admins.length > 0 && (
                  <>
                    {" · "}
                    {effectiveAdminFilter.size} of {admins.length} admin
                    {admins.length === 1 ? "" : "s"}
                  </>
                )}
              </>
            )}
          </p>
        </div>
        <div className="flex-1" />

        <div className="flex items-center gap-2 flex-wrap">
          <div role="tablist" className="hidden lg:flex items-center gap-0.5 p-0.5 bg-muted rounded-lg">
            {VIEWS.map((v) => {
              const active = view === v;
              return (
                <button
                  key={v}
                  role="tab"
                  aria-selected={active}
                  onClick={() => setView(v)}
                  className={cn(
                    "px-3.5 py-1 text-xs rounded-md motion-safe:transition-all motion-safe:duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    active
                      ? "bg-card text-foreground shadow-sm font-medium"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {v}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="icon"
              aria-label="Previous week"
              onClick={() => setWeekOffset((o) => o - 1)}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => setWeekOffset(0)}>
              Today
            </Button>
            <Button
              variant="outline"
              size="icon"
              aria-label="Next week"
              onClick={() => setWeekOffset((o) => o + 1)}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => setOpenNewClass(true)}
          >
            <Users className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">New class</span>
          </Button>

          <Button size="sm" className="gap-2" onClick={() => openSlot(selectedDayIdx, 1)}>
            <Plus className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Booking</span>
          </Button>
        </div>
      </div>

      {eventsError && (
        <div
          role="alert"
          className="rounded-lg border border-[--neg]/30 bg-[--neg]/10 px-3 py-2 text-[12px] text-[--neg] mb-3 inline-flex items-center gap-2"
        >
          <AlertCircle className="w-3.5 h-3.5" />
          {eventsError}
        </div>
      )}

      {showLegend && (
        <div className="hidden lg:block">
          <AdminLegend
            admins={admins}
            selectedIds={effectiveAdminFilter}
            onToggle={toggleAdmin}
          />
        </div>
      )}

      {/* Mobile + tablet: agenda list pattern (date strip + stacked events). */}
      <div className="lg:hidden flex-1 overflow-hidden flex flex-col">
        <MobileAgenda
          days={days}
          dayIdx={selectedDayIdx}
          onDayChange={setSelectedDayIdx}
          events={eventsByDay.get(selectedDayIdx) ?? []}
          onEventClick={setSelectedEvent}
        />
      </div>

      {/* Laptop+: full calendar card with Week/Day/Month switcher. */}
      <div className="hidden lg:flex bg-card border border-border rounded-xl shadow-card flex-1 overflow-hidden flex-col mt-3">
        {view === "Week" && (
          <WeekView
            days={days}
            eventsByDay={eventsByDay}
            loading={eventsLoading && totalEvents === 0}
            nowTop={nowTop}
            nowVisible={nowVisible}
            nowLabel={nowLabel}
            onEventClick={setSelectedEvent}
            onSlotClick={openSlot}
          />
        )}
        {view === "Day" && (
          <DayView
            days={days}
            dayIdx={selectedDayIdx}
            onDayChange={setSelectedDayIdx}
            events={eventsByDay.get(selectedDayIdx) ?? []}
            loading={eventsLoading && totalEvents === 0}
            nowTop={nowTop}
            nowVisible={nowVisible && days[selectedDayIdx]?.today === true}
            nowLabel={nowLabel}
            onEventClick={setSelectedEvent}
            onSlotClick={(hour) => openSlot(selectedDayIdx, hour)}
          />
        )}
        {view === "Month" && (
          <MonthView
            days={days}
            eventsByDay={eventsByDay}
            onDayClick={(idx) => {
              setSelectedDayIdx(idx);
              setView("Day");
            }}
          />
        )}
      </div>

      <EventSheet
        days={days}
        event={selectedEvent}
        onOpenChange={(o) => !o && setSelectedEvent(null)}
      />
      <NewBookingSheet
        days={days}
        admins={admins}
        open={openNewBooking}
        slot={newSlot}
        onOpenChange={setOpenNewBooking}
      />
      <NewClassSheet
        days={days}
        open={openNewClass}
        onOpenChange={setOpenNewClass}
        defaultDayIdx={selectedDayIdx}
        onCreated={refetchEvents}
      />
    </div>
  );
}

/* ---------------- mobile agenda (per design spec) ---------------- */

function MobileAgenda({
  days,
  dayIdx,
  onDayChange,
  events,
  onEventClick,
}: {
  days: CalendarDay[];
  dayIdx: number;
  onDayChange: (i: number) => void;
  events: CalendarEvent[];
  onEventClick: (e: CalendarEvent) => void;
}) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const sorted = [...events].sort((a, b) => a.start - b.start);

  return (
    <div className="flex-1 overflow-hidden flex flex-col mt-3 -mx-4 bg-card border-y border-border">
      <div className="flex gap-2 overflow-x-auto px-4 py-3 border-b border-[--line-soft]">
        {days.map((d, i) => {
          const active = i === dayIdx;
          return (
            <button
              key={i}
              type="button"
              onClick={() => onDayChange(i)}
              aria-pressed={active}
              className={cn(
                "shrink-0 w-13 text-center py-2 px-2 rounded-xl motion-safe:transition-colors motion-safe:duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                active
                  ? "bg-primary text-primary-foreground"
                  : "text-foreground hover:bg-muted/50"
              )}
              style={{ minWidth: 52 }}
            >
              <div
                className={cn(
                  "text-[10px] tracking-[0.08em] uppercase font-medium",
                  active ? "opacity-70" : "text-muted-foreground"
                )}
              >
                {d.d}
              </div>
              <div className="text-lg font-semibold tabular-nums mt-0.5">{d.n}</div>
            </button>
          );
        })}
      </div>

      <div className="flex-1 overflow-auto px-4 py-3 space-y-2.5">
        {sorted.length === 0 && (
          <div className="text-sm text-muted-foreground text-center py-12">
            No bookings this day. Tap + to add one.
          </div>
        )}
        {sorted.map((e, i) => {
          if (e.closed) {
            return (
              <div
                key={i}
                className="grid place-items-center rounded-xl text-[12px] text-muted-foreground py-4"
                style={{
                  background:
                    "repeating-linear-gradient(45deg, transparent 0 6px, var(--ink-200) 6px 12px)",
                }}
              >
                Closed
              </div>
            );
          }
          const trainer = trainerForEvent(e);
          const { bg, accent } = eventColors(e.hue, isDark);
          const isGroup = e.mode === "group";
          const enrolled = e.attendees?.length ?? 0;
          const cap = e.capacity ?? 0;
          const full = isGroup && cap > 0 && enrolled >= cap;
          return (
            <div key={i} className="flex gap-3">
              <div className="w-12 shrink-0 pt-2.5 text-[12px] text-muted-foreground tabular-nums">
                {formatHour(e.start)}
              </div>
              <button
                type="button"
                onClick={() => onEventClick(e)}
                className="flex-1 text-left rounded-xl px-3.5 py-2.5 motion-safe:transition-transform motion-safe:duration-150 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                style={{ background: bg, borderLeft: `3px solid ${accent}` }}
              >
                <div className="flex items-center gap-2">
                  <span className="text-[13px] font-semibold truncate flex-1">
                    {e.service}
                  </span>
                  {isGroup && (
                    <span
                      className={cn(
                        "shrink-0 inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-medium tabular-nums",
                        full ? "bg-[--neg]/15 text-[--neg]" : "bg-foreground/8 text-foreground/80"
                      )}
                    >
                      <Users className="w-2.5 h-2.5" aria-hidden />
                      {enrolled}/{cap}
                    </span>
                  )}
                  <span className="text-[11px] tabular-nums text-foreground/80 shrink-0">
                    {Math.round(e.len * 60)}m
                  </span>
                </div>
                <div className="text-[11px] text-muted-foreground mt-0.5 truncate">
                  {isGroup
                    ? `Class · ${trainer.name.split(" ")[0]}${full ? " · full" : ""}`
                    : `${e.client} · ${trainer.name.split(" ")[0]}`}
                </div>
              </button>
            </div>
          );
        })}
      </div>

    </div>
  );
}

/* ---------------- legend ---------------- */

function AdminLegend({
  admins,
  selectedIds,
  onToggle,
}: {
  admins: MemberWithUser[];
  selectedIds: Set<string>;
  onToggle: (id: string) => void;
}) {
  if (admins.length === 0) return null;
  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      <span className="text-[11px] font-medium tracking-[0.08em] uppercase text-muted-foreground mr-1.5">
        <Filter className="w-3 h-3 inline mr-1" aria-hidden /> Admins
      </span>
      {admins.map((a) => {
        const on = selectedIds.has(a.id);
        return (
          <button
            key={a.id}
            onClick={() => onToggle(a.id)}
            aria-pressed={on}
            className={cn(
              "inline-flex items-center gap-1.5 pr-2.5 pl-1 py-0.5 rounded-full border text-[11px] font-medium motion-safe:transition-all motion-safe:duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              on
                ? "border-border bg-card hover:bg-muted/60"
                : "border-transparent bg-muted/30 text-muted-foreground opacity-60 hover:opacity-100"
            )}
          >
            <HueAvatar name={a.user.name} hue={a.user.avatar_hue} size={18} />
            <span>{a.user.name.split(" ")[0]}</span>
          </button>
        );
      })}
    </div>
  );
}

/* ---------------- week view ---------------- */

function WeekView({
  days,
  eventsByDay,
  loading,
  nowTop,
  nowVisible,
  nowLabel,
  onEventClick,
  onSlotClick,
}: {
  days: CalendarDay[];
  eventsByDay: Map<number, CalendarEvent[]>;
  loading?: boolean;
  nowTop: number;
  nowVisible: boolean;
  nowLabel: string;
  onEventClick: (e: CalendarEvent) => void;
  onSlotClick: (day: number, hour: number) => void;
}) {
  return (
    <>
      <div
        className="grid shrink-0"
        style={{ gridTemplateColumns: "60px repeat(7, 1fr)" }}
      >
        <div className="border-b border-border" />
        {days.map((d, i) => (
          <div
            key={i}
            className="py-3.5 px-3 border-l border-b border-[--line-soft]"
            style={{ background: d.today ? "var(--teal-100)" : undefined }}
          >
            <div
              className="text-[11px] tracking-[0.08em] uppercase font-medium"
              style={{ color: d.today ? "var(--teal-900)" : "var(--ink-500)" }}
            >
              {d.d}
            </div>
            <div
              className="text-2xl tracking-tight mt-0.5 font-semibold tabular-nums"
              style={{ color: d.today ? "var(--teal-900)" : "var(--ink-900)" }}
            >
              {d.n}
            </div>
          </div>
        ))}
      </div>

      <div className="flex-1 overflow-auto">
        <div
          className="grid relative"
          style={{ gridTemplateColumns: "60px repeat(7, 1fr)" }}
        >
          <div>
            {HOURS.map((h, i) => (
              <div
                key={i}
                className="text-right pr-2 text-[10px] text-muted-foreground tracking-wider tabular-nums"
                style={{ height: ROW_H, paddingTop: 4 }}
              >
                {h}
              </div>
            ))}
          </div>
          {days.map((d, di) => (
            <div
              key={di}
              className="border-l border-[--line-soft] relative"
              style={{ background: d.today ? "rgba(255,255,255,0.4)" : undefined }}
            >
              {HOURS.map((_, hi) => (
                <button
                  key={hi}
                  type="button"
                  aria-label={`Add booking on ${d.d} at ${HOURS[hi]}`}
                  onClick={() => onSlotClick(di, hi)}
                  className="block w-full border-b border-[--line-soft] motion-safe:transition-colors motion-safe:duration-150 hover:bg-[--role-accent-light]/40 focus-visible:outline-none focus-visible:bg-[--role-accent-light]/60 group"
                  style={{ height: ROW_H }}
                >
                  <span className="block w-full h-full opacity-0 group-hover:opacity-100 motion-safe:transition-opacity motion-safe:duration-150 grid place-items-center">
                    <Plus className="w-3.5 h-3.5 text-[--role-accent]" />
                  </span>
                </button>
              ))}
              {(eventsByDay.get(di) ?? []).map((e, ei) => (
                <CalendarEventBlock key={ei} event={e} onClick={onEventClick} />
              ))}
              {loading &&
                SKELETON_EVENT_LAYOUT[di]?.map((blk, ei) => (
                  <CalendarEventSkeleton
                    key={`s${ei}`}
                    top={blk.start * ROW_H + 1}
                    height={blk.len * ROW_H - 4}
                    hue={blk.hue}
                  />
                ))}
              {d.today && nowVisible && <NowLine top={nowTop} label={nowLabel} />}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

/* ---------------- day view ---------------- */

function DayView({
  days,
  dayIdx,
  onDayChange,
  events,
  loading,
  nowTop,
  nowVisible,
  nowLabel,
  onEventClick,
  onSlotClick,
}: {
  days: CalendarDay[];
  dayIdx: number;
  onDayChange: (i: number) => void;
  events: CalendarEvent[];
  loading?: boolean;
  nowTop: number;
  nowVisible: boolean;
  nowLabel: string;
  onEventClick: (e: CalendarEvent) => void;
  onSlotClick: (hour: number) => void;
}) {
  const day = days[dayIdx];
  return (
    <>
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border overflow-x-auto">
        {days.map((d, i) => {
          const active = i === dayIdx;
          return (
            <button
              key={i}
              onClick={() => onDayChange(i)}
              aria-pressed={active}
              className={cn(
                "flex flex-col items-center justify-center min-w-[52px] h-12 rounded-lg border text-sm motion-safe:transition-colors motion-safe:duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                active
                  ? "border-[--role-accent] bg-[--role-accent-light] text-[--role-accent-dark]"
                  : "border-border hover:bg-muted/60 text-muted-foreground hover:text-foreground"
              )}
            >
              <span className="text-[10px] uppercase tracking-wider font-medium">
                {d.d}
              </span>
              <span className="text-base font-semibold tabular-nums leading-none mt-0.5">
                {d.n}
              </span>
            </button>
          );
        })}
        <div className="flex-1" />
        <span className="text-[11px] text-muted-foreground tabular-nums shrink-0">
          {events.filter((e) => !e.closed).length} bookings
          {day?.today && " · today"}
        </span>
      </div>

      <div className="flex-1 overflow-auto">
        <div
          className="grid relative"
          style={{ gridTemplateColumns: "60px 1fr", maxWidth: 720, margin: "0 auto" }}
        >
          <div>
            {HOURS.map((h, i) => (
              <div
                key={i}
                className="text-right pr-2 text-[10px] text-muted-foreground tracking-wider tabular-nums"
                style={{ height: ROW_H, paddingTop: 4 }}
              >
                {h}
              </div>
            ))}
          </div>
          <div className="border-l border-[--line-soft] relative">
            {HOURS.map((_, hi) => (
              <button
                key={hi}
                type="button"
                aria-label={`Add booking at ${HOURS[hi]}`}
                onClick={() => onSlotClick(hi)}
                className="block w-full border-b border-[--line-soft] motion-safe:transition-colors motion-safe:duration-150 hover:bg-[--role-accent-light]/40 focus-visible:outline-none focus-visible:bg-[--role-accent-light]/60 group"
                style={{ height: ROW_H }}
              >
                <span className="block w-full h-full opacity-0 group-hover:opacity-100 motion-safe:transition-opacity motion-safe:duration-150 grid place-items-center text-xs text-[--role-accent] font-medium">
                  <Plus className="w-3.5 h-3.5 inline mr-1" /> New booking
                </span>
              </button>
            ))}
            {events.map((e, ei) => (
              <CalendarEventBlock key={ei} event={e} onClick={onEventClick} expanded />
            ))}
            {loading &&
              SKELETON_EVENT_LAYOUT[dayIdx]?.map((blk, ei) => (
                <CalendarEventSkeleton
                  key={`s${ei}`}
                  top={blk.start * ROW_H + 1}
                  height={blk.len * ROW_H - 4}
                  hue={blk.hue}
                />
              ))}
            {nowVisible && <NowLine top={nowTop} label={nowLabel} />}
          </div>
        </div>
      </div>
    </>
  );
}

/* ---------------- month view ---------------- */

function MonthView({
  days,
  eventsByDay,
  onDayClick,
}: {
  days: CalendarDay[];
  eventsByDay: Map<number, CalendarEvent[]>;
  onDayClick: (i: number) => void;
}) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  // 5-row month view: the visible week is row 1 (interactive); the surrounding
  // 4 rows are read-only placeholders that show date numbers but no events,
  // until a real month-level query lands in a future phase.
  const rows: { weekIdx: number | null; dateNum: number | null; isToday: boolean }[][] = [];
  const firstDay = days[0]?.date ?? new Date();
  for (let r = 0; r < 5; r++) {
    const row: { weekIdx: number | null; dateNum: number | null; isToday: boolean }[] = [];
    for (let c = 0; c < 7; c++) {
      if (r === 1) {
        row.push({
          weekIdx: c,
          dateNum: days[c]?.n ?? null,
          isToday: days[c]?.today ?? false,
        });
      } else {
        const offsetDays = (r - 1) * 7 + c;
        const date = new Date(firstDay);
        date.setDate(firstDay.getDate() + offsetDays);
        row.push({ weekIdx: null, dateNum: date.getDate(), isToday: false });
      }
    }
    rows.push(row);
  }

  return (
    <div className="flex-1 overflow-auto">
      <div className="grid grid-cols-7 border-b border-border">
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
          <div
            key={d}
            className="py-3 px-3 text-[10px] tracking-[0.08em] uppercase font-medium text-muted-foreground border-l border-[--line-soft] first:border-l-0"
          >
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7" style={{ minHeight: "100%" }}>
        {rows.flat().map((cell, i) => {
          const events = cell.weekIdx !== null ? eventsByDay.get(cell.weekIdx) ?? [] : [];
          const isCurrent = cell.weekIdx !== null;
          const isToday = cell.isToday;
          const dateNum = cell.dateNum;

          return (
            <button
              key={i}
              onClick={() => cell.weekIdx !== null && onDayClick(cell.weekIdx)}
              className={cn(
                "min-h-[110px] border-l border-b border-[--line-soft] first:border-l-0 p-2 text-left motion-safe:transition-colors motion-safe:duration-150 focus-visible:outline-none focus-visible:bg-muted/40",
                isCurrent
                  ? "hover:bg-muted/40"
                  : "bg-muted/20 cursor-not-allowed",
                isToday && "bg-[--teal-100]/50"
              )}
              disabled={!isCurrent}
              aria-label={dateNum != null ? `View ${dateNum} in day view` : undefined}
            >
              <div
                className={cn(
                  "text-[13px] font-semibold tabular-nums leading-none mb-2",
                  isToday ? "text-[--teal-900]" : isCurrent ? "text-foreground" : "text-muted-foreground"
                )}
              >
                {dateNum ?? ""}
              </div>
              <div className="space-y-1">
                {events.slice(0, 3).map((e, ei) => {
                  const colors = e.closed ? null : eventColors(e.hue, isDark);
                  const isGroupEvt = e.mode === "group";
                  const label = isGroupEvt
                    ? `${e.service} · ${e.attendees?.length ?? 0}/${e.capacity ?? 0}`
                    : e.client;
                  return (
                    <div
                      key={ei}
                      className="text-[10px] px-1.5 py-0.5 rounded truncate"
                      style={{
                        background: e.closed ? "var(--ink-200)" : colors!.bg,
                        color: e.closed ? "var(--ink-500)" : colors!.text,
                      }}
                    >
                      {label}
                    </div>
                  );
                })}
                {events.length > 3 && (
                  <div className="text-[10px] text-muted-foreground px-1.5">
                    + {events.length - 3} more
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ---------------- event block ---------------- */

function CalendarEventBlock({
  event,
  onClick,
  expanded,
}: {
  event: CalendarEvent;
  onClick: (e: CalendarEvent) => void;
  expanded?: boolean;
}) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const top = event.start * ROW_H + 1;
  const h = event.len * ROW_H - 4;

  if (event.closed) {
    return (
      <div
        className="absolute left-1 right-1 grid place-items-center rounded-md text-[11px] text-muted-foreground"
        style={{
          top,
          height: h,
          background:
            "repeating-linear-gradient(45deg, transparent 0 6px, var(--ink-200) 6px 12px)",
        }}
      >
        Closed
      </div>
    );
  }

  const { bg, accent, text } = eventColors(event.hue, isDark);
  const isGroup = event.mode === "group";
  const enrolled = event.attendees?.length ?? 0;
  const cap = event.capacity ?? 0;
  const full = isGroup && cap > 0 && enrolled >= cap;

  return (
    <button
      type="button"
      onClick={() => onClick(event)}
      aria-label={
        isGroup
          ? `${event.service} class · ${enrolled} of ${cap} enrolled at ${formatHour(event.start)}`
          : `${event.client} — ${event.service} at ${formatHour(event.start)}`
      }
      className="absolute left-1 right-1 rounded-md overflow-hidden px-2 py-1.5 text-left motion-safe:transition-all motion-safe:duration-150 hover:scale-[1.02] hover:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      style={{
        top,
        height: h,
        background: bg,
        borderLeft: `3px solid ${accent}`,
        boxShadow: event.now ? `0 0 0 2px ${accent}` : undefined,
      }}
    >
      {isGroup ? (
        <>
          <div className="flex items-center gap-1.5">
            <div
              className={cn(
                "font-semibold tracking-tight truncate flex-1",
                expanded ? "text-[13px]" : "text-[11px]"
              )}
              style={{ color: text }}
            >
              {event.service}
            </div>
            <span
              className={cn(
                "shrink-0 inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full font-medium tabular-nums",
                expanded ? "text-[10px]" : "text-[9px]",
                full ? "bg-[--neg]/15 text-[--neg]" : ""
              )}
              style={
                !full
                  ? {
                      background: isDark ? `oklch(0.35 0.06 ${event.hue})` : `oklch(0.86 0.06 ${event.hue})`,
                      color: text,
                    }
                  : undefined
              }
            >
              <Users className={expanded ? "w-2.5 h-2.5" : "w-2 h-2"} aria-hidden />
              {enrolled}/{cap}
            </span>
          </div>
          <div
            className={cn(
              "text-muted-foreground mt-0.5 truncate",
              expanded ? "text-[12px]" : "text-[10px]"
            )}
          >
            Class
            {expanded && ` · ${formatHour(event.start)}`}
            {full && " · full"}
          </div>
        </>
      ) : (
        <>
          <div
            className={cn(
              "font-semibold tracking-tight truncate",
              expanded ? "text-[13px]" : "text-[11px]"
            )}
            style={{ color: text }}
          >
            {event.client}
          </div>
          <div
            className={cn(
              "text-muted-foreground mt-0.5 truncate",
              expanded ? "text-[12px]" : "text-[10px]"
            )}
          >
            {event.service}
            {expanded && ` · ${formatHour(event.start)}`}
          </div>
        </>
      )}
    </button>
  );
}

function NowLine({ top, label }: { top: number; label: string }) {
  return (
    <div className="absolute left-0 right-0 z-10 pointer-events-none" style={{ top }} aria-hidden>
      <div className="relative h-0.5 bg-[--neg]">
        <div className="absolute -left-1 -top-1 w-2.5 h-2.5 rounded-full bg-[--neg] motion-safe:animate-pulse" />
        <span className="absolute -top-2.5 -left-12 w-12 text-right pr-2 text-[10px] font-medium tabular-nums text-[--neg]">
          {label}
        </span>
      </div>
    </div>
  );
}

/* ---------------- sheets ---------------- */

function EventSheet({
  days,
  event,
  onOpenChange,
}: {
  days: CalendarDay[];
  event: CalendarEvent | null;
  onOpenChange: (open: boolean) => void;
}) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const open = event !== null;
  const trainer = event ? trainerForEvent(event) : null;
  const dayLabel = event ? days[event.day] : null;
  const colors = event ? eventColors(event.hue, isDark) : null;
  const accent = colors?.accent;
  const bg = colors?.bg;

  const isGroup = event?.mode === "group";
  const enrolled = event?.attendees?.length ?? 0;
  const cap = event?.capacity ?? 0;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md p-0">
        <SheetHeader className="p-6 pb-4">
          <div
            className="inline-flex items-center gap-2 self-start px-2 py-1 rounded-md text-[11px] font-medium mb-3"
            style={{ background: bg, color: colors?.text }}
          >
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: accent }} />
            {isGroup ? "Group class" : event?.service}
          </div>
          <SheetTitle className="text-[20px] font-semibold tracking-tight">
            {isGroup ? event?.service : event?.client}
          </SheetTitle>
          <SheetDescription>
            {dayLabel && `${dayLabel.d} · ${dayLabel.n}`}
            {event && ` · ${formatHour(event.start)}`}
          </SheetDescription>
        </SheetHeader>

        {event && trainer && (
          <div className="px-6 space-y-4">
            <Detail icon={<Clock className="w-4 h-4" />} label="Duration">
              {Math.round(event.len * 60)} minutes
            </Detail>
            {!isGroup && (
              <Detail icon={<Scissors className="w-4 h-4" />} label="Service">
                {event.service}
              </Detail>
            )}
            <Detail icon={<User className="w-4 h-4" />} label={isGroup ? "Instructor" : "Admin"}>
              <div className="flex items-center gap-2">
                <HueAvatar name={trainer.name} hue={trainer.hue} size={20} />
                <span>{trainer.name}</span>
                <span className="text-muted-foreground">· {trainer.role}</span>
              </div>
            </Detail>

            {isGroup && (
              <Detail icon={<Users className="w-4 h-4" />} label="Enrollment">
                <div className="flex items-center gap-2">
                  <span className="font-medium tabular-nums">
                    {enrolled} / {cap}
                  </span>
                  <span className="text-muted-foreground">
                    {enrolled >= cap ? "· full" : `· ${cap - enrolled} seat${cap - enrolled === 1 ? "" : "s"} left`}
                  </span>
                </div>
              </Detail>
            )}

            {isGroup && event.attendees && event.attendees.length > 0 && (
              <div>
                <div className="text-[11px] font-medium tracking-[0.08em] uppercase text-muted-foreground mb-2">
                  Attendees
                </div>
                <div className="flex flex-wrap gap-1.5 max-h-40 overflow-auto">
                  {event.attendees.map((name) => (
                    <span
                      key={name}
                      className="inline-flex items-center gap-1.5 pl-0.5 pr-2 py-0.5 rounded-full bg-muted/50 border border-border text-[11px]"
                    >
                      <HueAvatar name={name} hue={event.hue} size={18} />
                      {name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="h-px bg-border" />

            <div className="flex items-center gap-2 text-[13px]">
              <span className="text-muted-foreground">Status</span>
              <div className="flex-1" />
              {event.now ? (
                <Pill kind="teal" dot>
                  In session
                </Pill>
              ) : isGroup && enrolled >= cap ? (
                <Pill kind="warn">Full</Pill>
              ) : (
                <Pill kind="sage">Confirmed</Pill>
              )}
            </div>

            <div className="flex items-center gap-2 text-[13px]">
              <span className="text-muted-foreground">{isGroup ? "Per attendee" : "Cost"}</span>
              <div className="flex-1" />
              <span className="font-medium tabular-nums">
                {isGroup ? "1 credit" : "3 credits"}
              </span>
            </div>
          </div>
        )}

        <div className="mt-auto p-6 pt-4 border-t border-border flex flex-col gap-2">
          <Button className="w-full gap-2">
            <MessageSquare className="w-4 h-4" />
            {isGroup ? "Message attendees" : "Message client"}
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1 gap-2">
              <Repeat className="w-4 h-4" /> Reschedule
            </Button>
            <Button variant="destructive" className="flex-1 gap-2">
              <CalendarOff className="w-4 h-4" /> {isGroup ? "Cancel class" : "Cancel"}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function NewBookingSheet({
  days,
  admins,
  open,
  slot,
  onOpenChange,
}: {
  days: CalendarDay[];
  admins: MemberWithUser[];
  open: boolean;
  slot: { day: number; hour: number } | null;
  onOpenChange: (open: boolean) => void;
}) {
  const day = slot ? days[slot.day] : null;
  const hourLabel = slot ? HOURS[slot.hour] : null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md p-0">
        <SheetHeader className="p-6 pb-4">
          <div className="inline-flex items-center gap-2 self-start px-2 py-1 rounded-md text-[11px] font-medium mb-3 bg-[--role-accent-light] text-[--role-accent-dark]">
            <Plus className="w-3 h-3" />
            New booking
          </div>
          <SheetTitle className="text-[20px] font-semibold tracking-tight">
            {day ? `${day.d}, ${day.n}` : "Pick a slot"} · {hourLabel ?? ""}
          </SheetTitle>
          <SheetDescription>
            Wire this form to a real backend later. For now, the slot is captured.
          </SheetDescription>
        </SheetHeader>

        <div className="px-6 space-y-4">
          <FormField label="Client">
            <button className="w-full text-left px-3 py-2 border border-border rounded-lg text-[13px] text-muted-foreground hover:bg-muted/40 motion-safe:transition-colors">
              Search client…
            </button>
          </FormField>

          <FormField label="Service">
            <div className="text-[12px] text-muted-foreground py-2">
              Service picker arrives in Phase 2.E — for now, the slot is captured.
            </div>
          </FormField>

          <FormField label="Admin">
            <div className="flex flex-wrap gap-1.5">
              {admins.length === 0 ? (
                <span className="text-[12px] text-muted-foreground">
                  No admins yet. Invite one from /owner/admins.
                </span>
              ) : (
                admins.slice(0, 6).map((a) => (
                  <button
                    key={a.id}
                    className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full border border-border text-[11px] hover:bg-muted/40 motion-safe:transition-colors"
                  >
                    <HueAvatar
                      name={a.user.name}
                      hue={a.user.avatar_hue}
                      size={16}
                    />
                    {a.user.name.split(" ")[0]}
                  </button>
                ))
              )}
            </div>
          </FormField>
        </div>

        <div className="mt-auto p-6 pt-4 border-t border-border flex flex-col gap-2">
          <Button className="w-full">Confirm booking</Button>
          <Button variant="ghost" className="w-full" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function NewClassSheet({
  days,
  open,
  onOpenChange,
  defaultDayIdx,
  onCreated,
}: {
  days: CalendarDay[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultDayIdx: number;
  onCreated?: () => void | Promise<void>;
}) {
  const { member } = useCurrentMember();
  const { services, loading: servicesLoading } = useServices(member?.member.id);
  const myGroupServices = useMemo(
    () => services.filter((s) => s.mode === "group" && s.active),
    [services]
  );

  // User's explicit pick (null = no pick yet, fall back to first available)
  const [pickedServiceId, setPickedServiceId] = useState<string | null>(null);
  const [dayIdx, setDayIdx] = useState(defaultDayIdx);
  const [hour, setHour] = useState(2); // default 10am (HOURS[2])
  const [capacityOverride, setCapacityOverride] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Derived effective selection: user's pick if it's still in the list, else first.
  const serviceId =
    pickedServiceId && myGroupServices.some((s) => s.id === pickedServiceId)
      ? pickedServiceId
      : myGroupServices[0]?.id ?? "";
  const service: ServiceRow | undefined = myGroupServices.find((s) => s.id === serviceId);
  const day = days[dayIdx];
  const capacity = capacityOverride ?? service?.default_capacity ?? 0;

  async function submit() {
    if (submitting) return;
    if (!member?.studio.id || !member?.member.id) {
      setError("You must be logged in as an admin to schedule a class.");
      return;
    }
    if (!service) {
      setError("Pick a class first.");
      return;
    }
    if (!day) {
      setError("Pick a day inside the visible week.");
      return;
    }
    if (capacity < 1) {
      setError("Capacity must be at least 1.");
      return;
    }
    setSubmitting(true);
    setError(null);
    const startsAt = new Date(day.date);
    startsAt.setHours(HOURS_START + hour, 0, 0, 0);
    try {
      await createGroupSession({
        studioId: member.studio.id,
        serviceId: service.id,
        adminMemberId: member.member.id,
        startsAt,
        durationMin: service.duration_min,
        capacity,
      });
      await onCreated?.();
      // Reset local state for next open and close the sheet.
      setPickedServiceId(null);
      setCapacityOverride(null);
      setHour(2);
      onOpenChange(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md p-0">
        <SheetHeader className="p-6 pb-4">
          <div className="inline-flex items-center gap-2 self-start px-2 py-1 rounded-md text-[11px] font-medium mb-3 bg-[--role-accent-light] text-[--role-accent-dark]">
            <Users className="w-3 h-3" />
            New class
          </div>
          <SheetTitle className="text-[20px] font-semibold tracking-tight">
            Schedule a class
          </SheetTitle>
          <SheetDescription>
            Pick one of your group services and place it on the calendar. Clients can enroll once it&apos;s saved.
          </SheetDescription>
        </SheetHeader>

        <div className="px-6 space-y-5 overflow-auto">
          {servicesLoading ? (
            <div className="grid gap-2">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-14 rounded-lg border border-border bg-muted/30 animate-pulse" />
              ))}
            </div>
          ) : myGroupServices.length === 0 ? (
            <div className="border border-dashed border-border rounded-xl p-6 text-center">
              <div className="text-[13px] font-medium mb-1">No group services yet</div>
              <p className="text-[12px] text-muted-foreground mb-3">
                Create a class-mode service first from your overview.
              </p>
              <a
                href="/admin"
                className={buttonVariants({ variant: "outline", size: "sm" })}
              >
                Go to overview
              </a>
            </div>
          ) : (
            <>
              <div>
                <div className="text-[11px] font-medium tracking-[0.08em] uppercase text-muted-foreground mb-2">
                  Class
                </div>
                <div className="grid gap-2">
                  {myGroupServices.map((s) => {
                    const on = s.id === serviceId;
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => setPickedServiceId(s.id)}
                        aria-pressed={on}
                        className={cn(
                          "flex items-center gap-3 p-3 rounded-lg border text-left motion-safe:transition-colors",
                          on
                            ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                            : "border-border hover:border-primary/50 bg-card"
                        )}
                      >
                        <HueAvatar name={s.name} hue={s.hue} size={32} />
                        <div className="flex-1 min-w-0">
                          <div className="text-[13px] font-semibold">{s.name}</div>
                          <div className="text-[11px] text-muted-foreground tabular-nums">
                            {s.duration_min}m · up to {s.default_capacity} · {s.credits_cost} cr
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <div className="text-[11px] font-medium tracking-[0.08em] uppercase text-muted-foreground mb-2">
                  Day
                </div>
                <div className="flex gap-1.5 flex-wrap">
                  {days.map((d, i) => {
                    const on = i === dayIdx;
                    return (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setDayIdx(i)}
                        aria-pressed={on}
                        className={cn(
                          "flex flex-col items-center justify-center w-12 h-12 rounded-lg border text-sm motion-safe:transition-colors",
                          on
                            ? "bg-primary text-primary-foreground border-primary"
                            : "border-border hover:border-primary/50"
                        )}
                      >
                        <span className="text-[10px] uppercase tracking-wider">{d.d}</span>
                        <span className="text-[14px] font-semibold tabular-nums leading-none mt-0.5">{d.n}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <div className="text-[11px] font-medium tracking-[0.08em] uppercase text-muted-foreground mb-2">
                  Time
                </div>
                <select
                  value={hour}
                  onChange={(e) => setHour(Number(e.target.value))}
                  className="w-full h-10 px-3 border border-border rounded-lg text-[13px] bg-card focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  {HOURS.map((h, i) => (
                    <option key={h} value={i}>{h}</option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex items-baseline justify-between mb-1.5">
                  <div className="text-[11px] font-medium tracking-[0.08em] uppercase text-muted-foreground">
                    Capacity
                  </div>
                  <span className="text-[10px] text-muted-foreground">
                    Default: {service?.default_capacity}
                  </span>
                </div>
                <input
                  type="number"
                  value={capacity}
                  onChange={(e) => {
                    const n = Number(e.target.value);
                    if (Number.isNaN(n)) return;
                    setCapacityOverride(n);
                  }}
                  min={2}
                  className="w-full h-10 px-3 border border-border rounded-lg text-[13px] bg-card tabular-nums focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              <div className="bg-muted/40 border border-border rounded-lg p-3 text-[12px]">
                <div className="font-medium text-foreground mb-1">Preview</div>
                <div className="text-muted-foreground">
                  {service?.name} · {day?.d} {day?.n} · {HOURS[hour]} · {capacity} seats
                </div>
              </div>

              {error && (
                <div
                  role="alert"
                  className="rounded-lg border border-[--neg]/30 bg-[--neg]/10 px-3 py-2 text-[12px] text-[--neg]"
                >
                  {error}
                </div>
              )}
            </>
          )}
        </div>

        {myGroupServices.length > 0 && (
          <div className="mt-auto p-6 pt-4 border-t border-border flex flex-col gap-2">
            <Button
              className="w-full"
              onClick={submit}
              disabled={submitting || !service || !day || capacity < 1}
            >
              {submitting ? "Scheduling…" : "Schedule class"}
            </Button>
            <Button
              variant="ghost"
              className="w-full"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

function Detail({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="w-7 h-7 grid place-items-center rounded-md bg-muted text-muted-foreground shrink-0 mt-0.5">
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <div className="text-[11px] font-medium tracking-[0.08em] uppercase text-muted-foreground">
          {label}
        </div>
        <div className="text-[13px] mt-0.5">{children}</div>
      </div>
    </div>
  );
}

function FormField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="text-[11px] font-medium tracking-[0.08em] uppercase text-muted-foreground mb-2">
        {label}
      </div>
      {children}
    </div>
  );
}
