import { Filter, Plus, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CALENDAR_DAYS, HOURS, CALENDAR_EVENTS, type CalendarEvent } from "@/lib/data";

const ROW_H = 56;

const EVENTS_BY_DAY = new Map<number, CalendarEvent[]>();
for (const e of CALENDAR_EVENTS) {
  const list = EVENTS_BY_DAY.get(e.day) ?? [];
  list.push(e);
  EVENTS_BY_DAY.set(e.day, list);
}

export function CalendarScreen() {
  return (
    <div className="flex-1 overflow-hidden flex flex-col p-6">
      <div className="flex items-center mb-4">
        <div>
          <h2 className="text-[15px] font-semibold tracking-tight">April 27 – May 3</h2>
          <p className="text-[13px] text-muted-foreground">412 bookings · 92% utilization · 6 stylists</p>
        </div>
        <div className="flex-1" />
        <div className="flex items-center gap-1 p-1 bg-muted rounded-lg mr-2">
          {["Day", "Week", "Month"].map((v) => (
            <button
              key={v}
              className="px-3.5 py-1 text-xs rounded-md transition-colors"
              style={{
                background: v === "Week" ? "white" : "transparent",
                fontWeight: v === "Week" ? 500 : 400,
                color: v === "Week" ? "var(--ink-900)" : "var(--ink-500)",
                boxShadow: v === "Week" ? "0 1px 2px rgba(0,0,0,0.06)" : "none",
              }}
            >
              {v}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1.5 mr-2">
          <Button variant="outline" size="icon" className="w-9 h-9"><ChevronLeft className="w-4 h-4" /></Button>
          <Button variant="outline" size="sm">Today</Button>
          <Button variant="outline" size="icon" className="w-9 h-9"><ChevronRight className="w-4 h-4" /></Button>
        </div>
        <Button variant="outline" size="sm" className="gap-2 mr-2"><Filter className="w-3.5 h-3.5" /> All stylists</Button>
        <Button size="sm" className="gap-2"><Plus className="w-3.5 h-3.5" /> Booking</Button>
      </div>

      <div className="bg-card border border-border rounded-lg flex-1 overflow-hidden flex flex-col">
        <div className="grid shrink-0" style={{ gridTemplateColumns: "60px repeat(7, 1fr)" }}>
          <div className="border-b border-border" />
          {CALENDAR_DAYS.map((d, i) => (
            <div
              key={i}
              className="py-3.5 px-3 border-l border-b border-[--line-soft]"
              style={{ background: d.today ? "var(--teal-100)" : "transparent" }}
            >
              <div
                className="text-[11px] tracking-[0.08em] uppercase font-medium"
                style={{ color: d.today ? "var(--teal-900)" : "var(--ink-500)" }}
              >
                {d.d}
              </div>
              <div
                className="text-2xl tracking-tight mt-0.5 font-semibold"
                style={{ color: d.today ? "var(--teal-900)" : "var(--ink-900)" }}
              >
                {d.n}
              </div>
            </div>
          ))}
        </div>

        <div className="flex-1 overflow-auto">
          <div className="grid relative" style={{ gridTemplateColumns: "60px repeat(7, 1fr)" }}>
            <div>
              {HOURS.map((h, i) => (
                <div key={i} className="text-right pr-2 text-[10px] text-muted-foreground tracking-wider" style={{ height: ROW_H, paddingTop: 4 }}>
                  {h}
                </div>
              ))}
            </div>
            {CALENDAR_DAYS.map((d, di) => (
              <div key={di} className="border-l border-[--line-soft] relative" style={{ background: d.today ? "rgba(255,255,255,0.4)" : "transparent" }}>
                {HOURS.map((_, hi) => (
                  <div key={hi} className="border-b border-[--line-soft]" style={{ height: ROW_H }} />
                ))}
                {(EVENTS_BY_DAY.get(di) ?? []).map((e, ei) => (
                  <CalendarEventBlock key={ei} event={e} />
                ))}
                {d.today && <NowLine />}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function CalendarEventBlock({ event }: { event: CalendarEvent }) {
  const top = event.start * ROW_H + 1;
  const h = event.len * ROW_H - 4;

  if (event.closed) {
    return (
      <div
        className="absolute left-1 right-1 grid place-items-center rounded-md text-[11px] text-muted-foreground"
        style={{
          top,
          height: h,
          background: "repeating-linear-gradient(45deg, transparent 0 6px, var(--ink-100) 6px 12px)",
        }}
      >
        Closed
      </div>
    );
  }

  const bg = `oklch(0.95 0.03 ${event.hue})`;
  const accent = `oklch(0.55 0.08 ${event.hue})`;

  return (
    <div
      className="absolute left-1 right-1 rounded overflow-hidden px-2 py-1.5"
      style={{
        top,
        height: h,
        background: bg,
        borderLeft: `3px solid ${accent}`,
        boxShadow: event.now ? `0 0 0 2px ${accent}` : "none",
      }}
    >
      <div className="text-[11px] font-semibold tracking-tight" style={{ color: accent }}>{event.client}</div>
      <div className="text-[10px] text-muted-foreground mt-0.5">{event.service}</div>
    </div>
  );
}

function NowLine() {
  return (
    <div className="absolute left-0 right-0 h-0.5 bg-[--neg] z-10" style={{ top: 4 * ROW_H + 18 }}>
      <div className="absolute -left-1 -top-1 w-2.5 h-2.5 rounded-full bg-[--neg]" />
    </div>
  );
}
