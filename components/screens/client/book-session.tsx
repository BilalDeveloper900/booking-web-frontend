"use client";

import { useState } from "react";
import { Users, Check, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  CLIENT_BOOKING_DATES,
  CLIENT_TIME_SLOTS,
  CLIENT_CLASS_SESSIONS,
  TRAINERS,
  type TimeSlotStatus,
  type ClientClassSession,
} from "@/lib/data";
import { cn } from "@/lib/utils";
import { HueAvatar } from "@/components/shared";

const SERVICES = [
  { id: "cut",     label: "Cut + gloss",   duration: "60m",  credits: 2 },
  { id: "balayage",label: "Balayage",      duration: "180m", credits: 3 },
  { id: "color",   label: "Color refresh", duration: "90m",  credits: 2 },
  { id: "manicure",label: "Manicure",      duration: "60m",  credits: 1 },
] as const;

type Service = (typeof SERVICES)[number];

const ADMIN_OPTIONS = [
  { id: "any", name: "Any admin", short: "Any", initials: "—", hue: undefined as number | undefined },
  ...TRAINERS.slice(0, 4).map((t) => ({
    id: t.name,
    name: t.name,
    short: t.name.split(" ")[0],
    initials: t.name.split(" ").map((n) => n[0]).slice(0, 2).join(""),
    hue: t.hue,
  })),
];

type Tab = "session" | "class";

export function ClientBookSession() {
  const [tab, setTab] = useState<Tab>("session");

  return (
    <div className="flex-1 overflow-auto p-4 md:p-6 lg:p-8">
      <h2 className="text-[20px] md:text-[24px] font-semibold tracking-tight leading-tight mb-1">
        Book a session
      </h2>
      <p className="text-[13px] text-muted-foreground mb-5">
        {tab === "session"
          ? "Choose a service, admin, and time"
          : "Browse upcoming group classes and reserve your spot"}
      </p>

      <div role="tablist" className="inline-flex items-center gap-0.5 p-0.5 bg-muted rounded-lg mb-6">
        {(
          [
            { id: "session", label: "1-on-1 sessions" },
            { id: "class",   label: "Classes" },
          ] as const
        ).map((t) => {
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              role="tab"
              aria-selected={active}
              onClick={() => setTab(t.id)}
              className={cn(
                "px-4 py-1.5 text-[13px] rounded-md motion-safe:transition-all motion-safe:duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                active
                  ? "bg-card text-foreground shadow-sm font-medium"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      {tab === "session" ? <SoloFlow /> : <ClassFlow />}
    </div>
  );
}

/* ───────── 1-on-1 (existing flow, extracted) ───────── */

function SoloFlow() {
  const initialDate = Math.max(0, CLIENT_BOOKING_DATES.findIndex((d) => d.selected));
  const [selectedService, setSelectedService] = useState<Service["id"]>("cut");
  const [selectedAdmin, setSelectedAdmin] = useState<string>("Camille Roux");
  const [selectedDate, setSelectedDate] = useState(initialDate);
  const [slots, setSlots] = useState(CLIENT_TIME_SLOTS);

  function selectDate(i: number) {
    setSelectedDate(i);
    setSlots(
      CLIENT_TIME_SLOTS.map((s) =>
        s.status === "selected" ? { ...s, status: "available" as TimeSlotStatus } : s
      )
    );
  }

  function selectTime(index: number) {
    setSlots((prev) =>
      prev.map((s, i) => {
        if (s.status === "taken") return s;
        const status: TimeSlotStatus = i === index ? "selected" : "available";
        return { ...s, status };
      })
    );
  }

  const service = SERVICES.find((s) => s.id === selectedService) ?? SERVICES[0];
  const admin = ADMIN_OPTIONS.find((s) => s.id === selectedAdmin) ?? ADMIN_OPTIONS[1];
  const selectedSlot = slots.find((s) => s.status === "selected");
  const selectedDateInfo = CLIENT_BOOKING_DATES[selectedDate];
  const canConfirm = selectedSlot != null;

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-6">
      <div className="space-y-6">
        <Section label="1. Service">
          <div className="grid grid-cols-2 gap-2">
            {SERVICES.map((s) => {
              const on = s.id === selectedService;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setSelectedService(s.id)}
                  aria-pressed={on}
                  className={cn(
                    "p-3 rounded-xl border text-left motion-safe:transition-colors motion-safe:duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    on
                      ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                      : "border-border hover:border-primary/50 bg-card"
                  )}
                >
                  <div className="text-[13px] font-semibold">{s.label}</div>
                  <div className="text-[11px] text-muted-foreground mt-0.5 tabular-nums">
                    {s.duration} · {s.credits} cr
                  </div>
                </button>
              );
            })}
          </div>
        </Section>

        <Section label="2. Admin">
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
            {ADMIN_OPTIONS.map((s) => {
              const on = s.id === selectedAdmin;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setSelectedAdmin(s.id)}
                  aria-pressed={on}
                  className={cn(
                    "shrink-0 inline-flex items-center gap-2 pl-1 pr-3 py-1 rounded-full border motion-safe:transition-colors motion-safe:duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    on
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-card hover:border-primary/50"
                  )}
                >
                  {s.hue != null ? (
                    <HueAvatar name={s.name} hue={s.hue} size={26} />
                  ) : (
                    <span className="w-[26px] h-[26px] rounded-full bg-muted text-muted-foreground grid place-items-center text-[11px] font-semibold">
                      {s.initials}
                    </span>
                  )}
                  <span className="text-[13px] font-medium">{s.short}</span>
                </button>
              );
            })}
          </div>
        </Section>

        <Section label="3. Date & time">
          <div className="text-[12px] font-medium text-muted-foreground mb-2.5">May 2026</div>
          <div className="grid grid-cols-7 gap-1.5 mb-4">
            {CLIENT_BOOKING_DATES.map((d, i) => {
              const on = selectedDate === i;
              return (
                <button
                  key={d.num}
                  type="button"
                  disabled={!d.available}
                  onClick={() => selectDate(i)}
                  aria-pressed={on}
                  className={cn(
                    "flex flex-col items-center justify-center py-2 rounded-lg border text-sm motion-safe:transition-colors motion-safe:duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                    on
                      ? "bg-primary text-primary-foreground border-primary"
                      : d.available
                        ? "border-border hover:border-primary bg-card"
                        : "border-border opacity-40 cursor-not-allowed"
                  )}
                >
                  <span className={cn("text-[10px] tracking-wider uppercase", on ? "opacity-70" : "text-muted-foreground")}>
                    {d.day[0]}
                  </span>
                  <span className="text-[15px] font-semibold tabular-nums mt-0.5">{d.num}</span>
                </button>
              );
            })}
          </div>

          <div className="text-[11px] text-muted-foreground mb-2 px-1">
            Slots derived from {admin.short}&apos;s working hours · 30 min increments
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {slots.map((s, i) => (
              <button
                key={s.time}
                type="button"
                disabled={s.status === "taken"}
                onClick={() => selectTime(i)}
                aria-pressed={s.status === "selected"}
                className={cn(
                  "h-10 rounded-lg text-[13px] font-medium tabular-nums motion-safe:transition-all motion-safe:duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                  s.status === "available" &&
                    "border border-border hover:border-primary hover:bg-primary/10 cursor-pointer",
                  s.status === "selected" &&
                    "bg-primary text-primary-foreground shadow-card",
                  s.status === "taken" &&
                    "bg-muted text-muted-foreground opacity-50 line-through cursor-not-allowed"
                )}
              >
                {s.time}
              </button>
            ))}
          </div>
        </Section>
      </div>

      <div className="xl:sticky xl:top-8 h-fit">
        <div className="bg-card border border-border rounded-xl p-5 shadow-card">
          <h3 className="text-[13px] font-semibold mb-4">Booking summary</h3>
          <div className="space-y-3 text-[13px]">
            <SummaryRow label="Service" value={service.label} />
            <SummaryRow label="Admin" value={admin.name} />
            <SummaryRow label="Duration" value={service.duration} />
            <SummaryRow
              label="Date"
              value={selectedDateInfo ? `${selectedDateInfo.day}, ${selectedDateInfo.num} May` : "—"}
            />
            <SummaryRow label="Time" value={selectedSlot?.time ?? "—"} />
            <div className="h-px bg-border" />
            <SummaryRow label="Cost" value={`${service.credits} credits`} bold />
            <SummaryRow label="After booking" value={`${Math.max(0, 6 - service.credits)} credits left`} />
          </div>

          <Button className="w-full mt-5" size="lg" disabled={!canConfirm}>
            Confirm booking
          </Button>
          <p className="text-[11px] text-muted-foreground text-center mt-3">
            Free reschedule up to 24h before your appointment
          </p>
        </div>
      </div>
    </div>
  );
}

/* ───────── Classes tab ───────── */

function ClassFlow() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = CLIENT_CLASS_SESSIONS.find((c) => c.id === selectedId) ?? null;

  // Group sessions by date label for visual rhythm.
  const grouped = CLIENT_CLASS_SESSIONS.reduce<Record<string, ClientClassSession[]>>((acc, c) => {
    (acc[c.date] ??= []).push(c);
    return acc;
  }, {});
  const dateOrder = Object.keys(grouped);

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-6">
      <div className="space-y-6">
        {dateOrder.map((date) => (
          <div key={date}>
            <div className="text-[11px] font-medium tracking-[0.08em] uppercase text-muted-foreground mb-2.5 px-1">
              {date}
            </div>
            <div className="space-y-2">
              {grouped[date].map((c) => (
                <ClassCard
                  key={c.id}
                  session={c}
                  selected={selectedId === c.id}
                  onSelect={() => {
                    if (c.enrolled >= c.capacity && !c.enrolledByMe) return;
                    setSelectedId((prev) => (prev === c.id ? null : c.id));
                  }}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="xl:sticky xl:top-8 h-fit">
        <div className="bg-card border border-border rounded-xl p-5 shadow-card">
          <h3 className="text-[13px] font-semibold mb-4">
            {selected ? "Class summary" : "Pick a class"}
          </h3>

          {!selected ? (
            <div className="text-[13px] text-muted-foreground py-6 text-center border border-dashed border-border rounded-lg">
              Tap a class on the left to see details and enroll.
            </div>
          ) : (
            <>
              <div className="space-y-3 text-[13px]">
                <SummaryRow label="Class" value={selected.service} />
                <SummaryRow label="Instructor" value={selected.admin} />
                <SummaryRow label="When" value={`${selected.date} · ${selected.time}`} />
                <SummaryRow label="Duration" value={`${selected.durationMin}m`} />
                <SummaryRow
                  label="Enrollment"
                  value={`${selected.enrolled} / ${selected.capacity}`}
                />
                <div className="h-px bg-border" />
                <SummaryRow label="Cost" value={`${selected.credits} credit${selected.credits === 1 ? "" : "s"}`} bold />
                <SummaryRow
                  label="After enrolling"
                  value={`${Math.max(0, 6 - selected.credits)} credits left`}
                />
              </div>

              {selected.enrolledByMe ? (
                <Button variant="outline" className="w-full mt-5" size="lg">
                  Cancel enrollment
                </Button>
              ) : (
                <Button className="w-full mt-5" size="lg">
                  <Sparkles className="w-4 h-4" /> Enroll in class
                </Button>
              )}

              <p className="text-[11px] text-muted-foreground text-center mt-3">
                Free cancel up to 24h before class start
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function ClassCard({
  session,
  selected,
  onSelect,
}: {
  session: ClientClassSession;
  selected: boolean;
  onSelect: () => void;
}) {
  const full = session.enrolled >= session.capacity;
  const seatsLeft = session.capacity - session.enrolled;
  const enrolled = session.enrolledByMe;
  const disabled = full && !enrolled;

  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={disabled}
      aria-pressed={selected}
      className={cn(
        "w-full text-left rounded-xl border p-4 motion-safe:transition-all motion-safe:duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        selected
          ? "border-primary bg-primary/5 ring-1 ring-primary/30"
          : disabled
            ? "border-border bg-muted/30 cursor-not-allowed opacity-60"
            : "border-border hover:border-primary/50 bg-card"
      )}
    >
      <div className="flex items-start gap-3">
        <HueAvatar name={session.service} hue={session.hue} size={36} />

        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2 flex-wrap">
            <span className="text-[14px] font-semibold tracking-tight">
              {session.service}
            </span>
            {enrolled && (
              <span className="inline-flex items-center gap-0.5 text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-[--sage-100] text-[oklch(0.4_0.05_165)]">
                <Check className="w-2.5 h-2.5" /> Enrolled
              </span>
            )}
          </div>
          <div className="text-[12px] text-muted-foreground mt-0.5">
            with {session.admin} · {session.durationMin}m
          </div>
        </div>

        <div className="text-right shrink-0">
          <div className="text-[14px] font-semibold tabular-nums">{session.time}</div>
          <div
            className={cn(
              "inline-flex items-center gap-1 text-[11px] font-medium tabular-nums mt-1 px-1.5 py-0.5 rounded-full",
              full
                ? "bg-[--neg]/15 text-[--neg]"
                : seatsLeft <= 2
                  ? "bg-[oklch(0.96_0.04_70)] text-[oklch(0.45_0.1_60)]"
                  : "bg-muted text-muted-foreground"
            )}
          >
            <Users className="w-2.5 h-2.5" />
            {full ? "Full" : `${session.enrolled}/${session.capacity}`}
          </div>
        </div>
      </div>
    </button>
  );
}

/* ───────── shared bits ───────── */

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <section>
      <div className="text-[11px] font-medium tracking-[0.08em] uppercase text-muted-foreground mb-2.5 px-1">
        {label}
      </div>
      {children}
    </section>
  );
}

function SummaryRow({
  label,
  value,
  bold,
}: {
  label: string;
  value: string;
  bold?: boolean;
}) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-muted-foreground">{label}</span>
      <span className={cn("text-right tabular-nums", bold ? "font-semibold" : "font-medium")}>
        {value}
      </span>
    </div>
  );
}
