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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  CALENDAR_DAYS,
  HOURS,
  CALENDAR_EVENTS,
  TRAINERS,
  type CalendarEvent,
} from "@/lib/data";
import { cn } from "@/lib/utils";
import { HueAvatar, Pill } from "@/components/shared";
import { useTheme } from "@/components/theme-provider";

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
const HOURS_START = 8; // HOURS[0] === "8 AM"
const VIEWS = ["Day", "Week", "Month"] as const;
type View = (typeof VIEWS)[number];

function trainerForEvent(event: CalendarEvent) {
  return (
    TRAINERS.find((t) => Math.abs(t.hue - event.hue) <= 5) ?? TRAINERS[0]
  );
}

function formatHour(start: number) {
  const total = HOURS_START + start;
  const hour = Math.floor(total);
  const minute = Math.round((total - hour) * 60);
  const h12 = ((hour + 11) % 12) + 1;
  const ampm = hour < 12 ? "AM" : "PM";
  return `${h12}:${minute.toString().padStart(2, "0")} ${ampm}`;
}

function rangeForOffset(offset: number) {
  const ref = new Date();
  ref.setHours(0, 0, 0, 0);
  ref.setDate(ref.getDate() + offset * 7);
  const dow = ref.getDay();
  const diffToMon = dow === 0 ? -6 : 1 - dow;
  const mon = new Date(ref);
  mon.setDate(mon.getDate() + diffToMon);
  const sun = new Date(mon);
  sun.setDate(sun.getDate() + 6);
  const sameMonth = mon.getMonth() === sun.getMonth();
  const monLabel = mon.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  const sunLabel = sameMonth
    ? sun.getDate().toString()
    : sun.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  return `${monLabel} – ${sunLabel}`;
}

export function CalendarScreen() {
  const [view, setView] = useState<View>("Week");
  const [weekOffset, setWeekOffset] = useState(0);
  const [stylistFilter, setStylistFilter] = useState<Set<string>>(
    () => new Set(TRAINERS.map((t) => t.name))
  );
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [newSlot, setNewSlot] = useState<{ day: number; hour: number } | null>(null);
  const [openNewBooking, setOpenNewBooking] = useState(false);
  const [selectedDayIdx, setSelectedDayIdx] = useState(() =>
    CALENDAR_DAYS.findIndex((d) => d.today)
  );

  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  const filteredEvents = useMemo(
    () =>
      CALENDAR_EVENTS.filter((e) => {
        if (e.closed) return true;
        return stylistFilter.has(trainerForEvent(e).name);
      }),
    [stylistFilter]
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

  const totalEvents = filteredEvents.filter((e) => !e.closed).length;
  const dateRange = weekOffset === 0 ? "April 27 – May 3" : rangeForOffset(weekOffset);

  function toggleStylist(name: string) {
    setStylistFilter((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
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
            {totalEvents} bookings · {Math.round((totalEvents / 28) * 100)}% utilization ·{" "}
            {stylistFilter.size} of {TRAINERS.length} stylists
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

          <Button size="sm" className="gap-2" onClick={() => openSlot(selectedDayIdx, 1)}>
            <Plus className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Booking</span>
          </Button>
        </div>
      </div>

      <div className="hidden lg:block">
        <StylistLegend selected={stylistFilter} onToggle={toggleStylist} />
      </div>

      {/* Mobile + tablet: agenda list pattern (date strip + stacked events). */}
      <div className="lg:hidden flex-1 overflow-hidden flex flex-col">
        <MobileAgenda
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
            eventsByDay={eventsByDay}
            nowTop={nowTop}
            nowVisible={nowVisible}
            nowLabel={nowLabel}
            onEventClick={setSelectedEvent}
            onSlotClick={openSlot}
          />
        )}
        {view === "Day" && (
          <DayView
            dayIdx={selectedDayIdx}
            onDayChange={setSelectedDayIdx}
            events={eventsByDay.get(selectedDayIdx) ?? []}
            nowTop={nowTop}
            nowVisible={nowVisible && CALENDAR_DAYS[selectedDayIdx]?.today === true}
            nowLabel={nowLabel}
            onEventClick={setSelectedEvent}
            onSlotClick={(hour) => openSlot(selectedDayIdx, hour)}
          />
        )}
        {view === "Month" && (
          <MonthView
            eventsByDay={eventsByDay}
            onDayClick={(idx) => {
              setSelectedDayIdx(idx);
              setView("Day");
            }}
          />
        )}
      </div>

      <EventSheet event={selectedEvent} onOpenChange={(o) => !o && setSelectedEvent(null)} />
      <NewBookingSheet
        open={openNewBooking}
        slot={newSlot}
        onOpenChange={setOpenNewBooking}
      />
    </div>
  );
}

/* ---------------- mobile agenda (per design spec) ---------------- */

function MobileAgenda({
  dayIdx,
  onDayChange,
  events,
  onEventClick,
}: {
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
        {CALENDAR_DAYS.map((d, i) => {
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
                  <span className="text-[11px] tabular-nums text-foreground/80 shrink-0">
                    {Math.round(e.len * 60)}m
                  </span>
                </div>
                <div className="text-[11px] text-muted-foreground mt-0.5 truncate">
                  {e.client} · {trainer.name.split(" ")[0]}
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

function StylistLegend({
  selected,
  onToggle,
}: {
  selected: Set<string>;
  onToggle: (name: string) => void;
}) {
  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      <span className="text-[11px] font-medium tracking-[0.08em] uppercase text-muted-foreground mr-1.5">
        <Filter className="w-3 h-3 inline mr-1" aria-hidden /> Stylists
      </span>
      {TRAINERS.map((t) => {
        const on = selected.has(t.name);
        return (
          <button
            key={t.name}
            onClick={() => onToggle(t.name)}
            aria-pressed={on}
            className={cn(
              "inline-flex items-center gap-1.5 pr-2.5 pl-1 py-0.5 rounded-full border text-[11px] font-medium motion-safe:transition-all motion-safe:duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              on
                ? "border-border bg-card hover:bg-muted/60"
                : "border-transparent bg-muted/30 text-muted-foreground opacity-60 hover:opacity-100"
            )}
          >
            <HueAvatar name={t.name} hue={t.hue} size={18} />
            <span>{t.name.split(" ")[0]}</span>
          </button>
        );
      })}
    </div>
  );
}

/* ---------------- week view ---------------- */

function WeekView({
  eventsByDay,
  nowTop,
  nowVisible,
  nowLabel,
  onEventClick,
  onSlotClick,
}: {
  eventsByDay: Map<number, CalendarEvent[]>;
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
        {CALENDAR_DAYS.map((d, i) => (
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
          {CALENDAR_DAYS.map((d, di) => (
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
  dayIdx,
  onDayChange,
  events,
  nowTop,
  nowVisible,
  nowLabel,
  onEventClick,
  onSlotClick,
}: {
  dayIdx: number;
  onDayChange: (i: number) => void;
  events: CalendarEvent[];
  nowTop: number;
  nowVisible: boolean;
  nowLabel: string;
  onEventClick: (e: CalendarEvent) => void;
  onSlotClick: (hour: number) => void;
}) {
  const day = CALENDAR_DAYS[dayIdx];
  return (
    <>
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border overflow-x-auto">
        {CALENDAR_DAYS.map((d, i) => {
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
            {nowVisible && <NowLine top={nowTop} label={nowLabel} />}
          </div>
        </div>
      </div>
    </>
  );
}

/* ---------------- month view ---------------- */

function MonthView({
  eventsByDay,
  onDayClick,
}: {
  eventsByDay: Map<number, CalendarEvent[]>;
  onDayClick: (i: number) => void;
}) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  // Build a 5-row mock month: [-7..-1, 0..6 (current week), 7..13, 14..20, 21..27]
  const rows: { offset: number; weekIdx: number | null }[][] = [];
  for (let r = 0; r < 5; r++) {
    const row: { offset: number; weekIdx: number | null }[] = [];
    for (let c = 0; c < 7; c++) {
      const offset = (r - 1) * 7 + c;
      row.push({ offset, weekIdx: r === 1 ? c : null });
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
          const isToday = cell.weekIdx !== null && CALENDAR_DAYS[cell.weekIdx]?.today;
          const dateNum =
            cell.weekIdx !== null
              ? CALENDAR_DAYS[cell.weekIdx]?.n
              : null;

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
                  return (
                    <div
                      key={ei}
                      className="text-[10px] px-1.5 py-0.5 rounded truncate"
                      style={{
                        background: e.closed ? "var(--ink-200)" : colors!.bg,
                        color: e.closed ? "var(--ink-500)" : colors!.text,
                      }}
                    >
                      {e.client}
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

  return (
    <button
      type="button"
      onClick={() => onClick(event)}
      aria-label={`${event.client} — ${event.service} at ${formatHour(event.start)}`}
      className="absolute left-1 right-1 rounded-md overflow-hidden px-2 py-1.5 text-left motion-safe:transition-all motion-safe:duration-150 hover:scale-[1.02] hover:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      style={{
        top,
        height: h,
        background: bg,
        borderLeft: `3px solid ${accent}`,
        boxShadow: event.now ? `0 0 0 2px ${accent}` : undefined,
      }}
    >
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
  event,
  onOpenChange,
}: {
  event: CalendarEvent | null;
  onOpenChange: (open: boolean) => void;
}) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const open = event !== null;
  const trainer = event ? trainerForEvent(event) : null;
  const dayLabel = event ? CALENDAR_DAYS[event.day] : null;
  const colors = event ? eventColors(event.hue, isDark) : null;
  const accent = colors?.accent;
  const bg = colors?.bg;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md p-0">
        <SheetHeader className="p-6 pb-4">
          <div
            className="inline-flex items-center gap-2 self-start px-2 py-1 rounded-md text-[11px] font-medium mb-3"
            style={{ background: bg, color: colors?.text }}
          >
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: accent }} />
            {event?.service}
          </div>
          <SheetTitle className="text-[20px] font-semibold tracking-tight">
            {event?.client}
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
            <Detail icon={<Scissors className="w-4 h-4" />} label="Service">
              {event.service}
            </Detail>
            <Detail icon={<User className="w-4 h-4" />} label="Stylist">
              <div className="flex items-center gap-2">
                <HueAvatar name={trainer.name} hue={trainer.hue} size={20} />
                <span>{trainer.name}</span>
                <span className="text-muted-foreground">· {trainer.role}</span>
              </div>
            </Detail>

            <div className="h-px bg-border" />

            <div className="flex items-center gap-2 text-[13px]">
              <span className="text-muted-foreground">Status</span>
              <div className="flex-1" />
              {event.now ? (
                <Pill kind="teal" dot>
                  In session
                </Pill>
              ) : (
                <Pill kind="sage">Confirmed</Pill>
              )}
            </div>

            <div className="flex items-center gap-2 text-[13px]">
              <span className="text-muted-foreground">Cost</span>
              <div className="flex-1" />
              <span className="font-medium tabular-nums">3 credits</span>
            </div>
          </div>
        )}

        <div className="mt-auto p-6 pt-4 border-t border-border flex flex-col gap-2">
          <Button className="w-full gap-2">
            <MessageSquare className="w-4 h-4" /> Message client
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1 gap-2">
              <Repeat className="w-4 h-4" /> Reschedule
            </Button>
            <Button variant="destructive" className="flex-1 gap-2">
              <CalendarOff className="w-4 h-4" /> Cancel
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function NewBookingSheet({
  open,
  slot,
  onOpenChange,
}: {
  open: boolean;
  slot: { day: number; hour: number } | null;
  onOpenChange: (open: boolean) => void;
}) {
  const day = slot ? CALENDAR_DAYS[slot.day] : null;
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
            <div className="grid grid-cols-2 gap-2">
              {["Cut + gloss", "Balayage", "Beard trim", "Manicure"].map((s) => (
                <button
                  key={s}
                  className="px-3 py-2 border border-border rounded-lg text-[13px] hover:bg-muted/40 hover:border-[--role-accent] motion-safe:transition-colors text-left"
                >
                  {s}
                </button>
              ))}
            </div>
          </FormField>

          <FormField label="Stylist">
            <div className="flex flex-wrap gap-1.5">
              {TRAINERS.slice(0, 4).map((t) => (
                <button
                  key={t.name}
                  className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full border border-border text-[11px] hover:bg-muted/40 motion-safe:transition-colors"
                >
                  <HueAvatar name={t.name} hue={t.hue} size={16} />
                  {t.name.split(" ")[0]}
                </button>
              ))}
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
