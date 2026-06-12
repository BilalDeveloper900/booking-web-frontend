"use client";

import { useState } from "react";
import { BadgeCheck, CalendarDays, RotateCcw, Sparkles, User, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Live, zero-signup demo of the real booking flow. Mirrors the actual app:
 * group classes ("events") with capacity, and the 1-on-1 solo slot grid
 * (same statuses the `solo_slot_grid` RPC returns: available/booked/blocked).
 * All state is local — refresh resets it.
 */

type ClassEvent = {
  id: string;
  time: string;
  title: string;
  coach: string;
  capacity: number;
  taken: number;
  credits: number;
};

const CLASSES: ClassEvent[] = [
  { id: "vinyasa", time: "09:00", title: "Vinyasa Flow", coach: "Elena", capacity: 12, taken: 9, credits: 1 },
  { id: "reformer", time: "11:30", title: "Reformer Pilates", coach: "Camille", capacity: 8, taken: 6, credits: 2 },
  { id: "hiit", time: "18:00", title: "HIIT Express", coach: "Olivia", capacity: 14, taken: 13, credits: 1 },
];

type SlotStatus = "available" | "booked" | "blocked";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;
const TIMES = ["09:00", "10:00", "11:00", "13:00", "14:00", "15:00", "16:00", "17:00"] as const;

/** Deterministic mock grid — looks organic, renders identically on server and client. */
function baseStatus(day: number, t: number): SlotStatus {
  if ((day * 7 + t * 3) % 5 === 0) return "booked";
  if (day === 5 && t > 4) return "blocked"; // Saturday afternoon off
  if ((day + t) % 7 === 3) return "blocked";
  return "available";
}

export function DemoBooking() {
  const [tab, setTab] = useState<"classes" | "solo">("classes");
  const [credits, setCredits] = useState(8);
  const [bookedClasses, setBookedClasses] = useState<string[]>([]);
  const [day, setDay] = useState(3); // Thu
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const dirty = bookedClasses.length > 0 || bookedSlots.length > 0 || credits !== 8;

  function confirm(message: string, cost: number) {
    setCredits((c) => c - cost);
    setToast(message);
  }

  function reset() {
    setCredits(8);
    setBookedClasses([]);
    setBookedSlots([]);
    setSelected(null);
    setToast(null);
  }

  return (
    <div className="bg-card border border-border rounded-xl shadow-hero overflow-hidden">
      {/* header: tabs + credits */}
      <div className="flex items-center justify-between gap-3 px-4 md:px-6 py-4 border-b border-border flex-wrap">
        <div role="tablist" aria-label="Demo booking mode" className="flex items-center gap-0.5 p-0.5 bg-muted rounded-lg">
          {(
            [
              { id: "classes", label: "Classes", icon: Users },
              { id: "solo", label: "1-on-1", icon: User },
            ] as const
          ).map((t) => (
            <button
              key={t.id}
              role="tab"
              aria-selected={tab === t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 text-[13px] rounded-md motion-safe:transition-all motion-safe:duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                tab === t.id
                  ? "bg-card text-foreground shadow-card font-medium"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <t.icon className="w-3.5 h-3.5" aria-hidden />
              {t.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <span
            className={cn(
              "inline-flex items-center gap-1.5 text-[12px] font-medium px-2.5 py-1 rounded-full tabular-nums motion-safe:transition-colors motion-safe:duration-150",
              credits <= 2
                ? "bg-[--warn]/15 text-[--warn]"
                : "bg-[--teal-100]/70 text-[--teal-900]"
            )}
          >
            <Sparkles className="w-3 h-3" aria-hidden />
            {credits} credits
          </span>
          {dirty && (
            <Button variant="ghost" size="sm" onClick={reset} className="gap-1.5 text-muted-foreground">
              <RotateCcw className="w-3.5 h-3.5" aria-hidden /> Reset
            </Button>
          )}
        </div>
      </div>

      {/* body */}
      <div className="p-4 md:p-6 min-h-[320px]">
        {tab === "classes" ? (
          <ul className="space-y-3">
            {CLASSES.map((c) => {
              const isBooked = bookedClasses.includes(c.id);
              const taken = c.taken + (isBooked ? 1 : 0);
              const full = taken >= c.capacity && !isBooked;
              const pct = Math.round((taken / c.capacity) * 100);
              return (
                <li
                  key={c.id}
                  className="flex items-center gap-3 md:gap-4 border border-border rounded-lg p-3 md:p-4 motion-safe:transition-all motion-safe:duration-200 hover:shadow-card"
                >
                  <div className="text-center shrink-0 w-12">
                    <div className="text-[13px] font-semibold tabular-nums">{c.time}</div>
                    <div className="text-[10px] uppercase tracking-[0.08em] text-muted-foreground">Thu</div>
                  </div>
                  <span className="w-px self-stretch bg-[--line-soft]" aria-hidden />
                  <div className="flex-1 min-w-0">
                    <div className="text-[14px] font-semibold truncate">{c.title}</div>
                    <div className="text-[12px] text-muted-foreground truncate">
                      with {c.coach} · {c.credits} {c.credits === 1 ? "credit" : "credits"}
                    </div>
                    <div className="mt-1.5 flex items-center gap-2">
                      <div className="h-1.5 w-24 md:w-32 rounded-full bg-muted overflow-hidden">
                        <div
                          className={cn(
                            "h-full rounded-full motion-safe:transition-all motion-safe:duration-300",
                            pct >= 90 ? "bg-[--warn]" : "bg-[--teal-500]"
                          )}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-[11px] text-muted-foreground tabular-nums">
                        {taken}/{c.capacity} spots
                      </span>
                    </div>
                  </div>
                  {isBooked ? (
                    <span className="inline-flex items-center gap-1.5 text-[12px] font-medium text-[--pos] bid-pop">
                      <BadgeCheck className="w-4 h-4" aria-hidden /> Booked
                    </span>
                  ) : (
                    <Button
                      size="sm"
                      disabled={full || credits < c.credits}
                      onClick={() => {
                        setBookedClasses((b) => [...b, c.id]);
                        confirm(`You're in — ${c.title}, Thursday ${c.time}.`, c.credits);
                      }}
                    >
                      {full ? "Full" : "Book"}
                    </Button>
                  )}
                </li>
              );
            })}
          </ul>
        ) : (
          <div>
            {/* day picker */}
            <div role="tablist" aria-label="Pick a day" className="flex items-center gap-1.5 mb-4 overflow-x-auto pb-1">
              {DAYS.map((d, i) => (
                <button
                  key={d}
                  role="tab"
                  aria-selected={day === i}
                  onClick={() => {
                    setDay(i);
                    setSelected(null);
                  }}
                  className={cn(
                    "px-3 py-1.5 text-[12px] rounded-lg border motion-safe:transition-all motion-safe:duration-150 shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    day === i
                      ? "border-primary bg-primary text-primary-foreground font-medium"
                      : "border-border text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                >
                  {d}
                </button>
              ))}
            </div>

            {/* slot grid */}
            <div className="grid grid-cols-4 gap-2">
              {TIMES.map((time, t) => {
                const key = `${day}-${time}`;
                let status: SlotStatus = baseStatus(day, t);
                if (bookedSlots.includes(key)) status = "booked";
                const isSelected = selected === key;
                const justBooked = bookedSlots.includes(key);
                return (
                  <button
                    key={time}
                    disabled={status !== "available"}
                    aria-label={`${time} on ${DAYS[day]} — ${justBooked ? "your booking" : status}`}
                    onClick={() => setSelected(isSelected ? null : key)}
                    className={cn(
                      "h-11 rounded-lg border text-[12px] font-medium tabular-nums motion-safe:transition-all motion-safe:duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      status === "available" &&
                        !isSelected &&
                        "border-border bg-card hover:border-[--teal-500] hover:bg-[--teal-100]/40",
                      isSelected && "border-primary bg-primary text-primary-foreground shadow-card",
                      status === "booked" &&
                        (justBooked
                          ? "border-[--pos]/40 bg-[--sage-100]/60 text-[--pos] bid-pop"
                          : "border-transparent bg-muted text-muted-foreground/60 line-through"),
                      status === "blocked" && "border-dashed border-[--line-soft] bg-muted/40 text-muted-foreground/40"
                    )}
                  >
                    {justBooked ? (
                      <span className="inline-flex items-center gap-1">
                        <BadgeCheck className="w-3.5 h-3.5" aria-hidden /> {time}
                      </span>
                    ) : (
                      time
                    )}
                  </button>
                );
              })}
            </div>

            {/* legend + confirm */}
            <div className="flex items-center justify-between gap-3 mt-4 flex-wrap">
              <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm border border-border bg-card" aria-hidden /> Available
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-muted" aria-hidden /> Booked
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm border border-dashed border-[--line-soft] bg-muted/40" aria-hidden /> Off
                </span>
              </div>
              {selected && (
                <div className="bid-pop flex items-center gap-3">
                  <span className="text-[12px] text-muted-foreground tabular-nums">
                    {DAYS[day]} · {selected.split("-")[1]} · 1 credit
                  </span>
                  <Button
                    size="sm"
                    disabled={credits < 1}
                    onClick={() => {
                      setBookedSlots((b) => [...b, selected]);
                      setSelected(null);
                      confirm(`Booked — ${DAYS[day]} at ${selected.split("-")[1]} with Yuki.`, 1);
                    }}
                  >
                    Confirm booking
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* confirmation toast */}
      <div aria-live="polite" className="px-4 md:px-6 pb-4 empty:pb-0">
        {toast && (
          <div className="bid-pop flex items-center gap-2.5 border border-[--pos]/30 bg-[--sage-100]/50 rounded-lg px-3.5 py-2.5">
            <BadgeCheck className="w-4 h-4 text-[--pos] shrink-0" aria-hidden />
            <p className="text-[13px] flex-1">{toast}</p>
            <CalendarDays className="w-4 h-4 text-muted-foreground shrink-0 hidden sm:block" aria-hidden />
          </div>
        )}
      </div>
    </div>
  );
}
