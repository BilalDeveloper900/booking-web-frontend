"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  CLIENT_BOOKING_DATES,
  CLIENT_TIME_SLOTS,
  TRAINERS,
  type TimeSlotStatus,
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

const STYLIST_OPTIONS = [
  { id: "any", name: "Any stylist", short: "Any", initials: "—", hue: undefined as number | undefined },
  ...TRAINERS.slice(0, 4).map((t) => ({
    id: t.name,
    name: t.name,
    short: t.name.split(" ")[0],
    initials: t.name.split(" ").map((n) => n[0]).slice(0, 2).join(""),
    hue: t.hue,
  })),
];

export function ClientBookSession() {
  const initialDate = Math.max(0, CLIENT_BOOKING_DATES.findIndex((d) => d.selected));
  const [selectedService, setSelectedService] = useState<Service["id"]>("cut");
  const [selectedStylist, setSelectedStylist] = useState<string>("Camille Roux");
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
  const stylist = STYLIST_OPTIONS.find((s) => s.id === selectedStylist) ?? STYLIST_OPTIONS[1];
  const selectedSlot = slots.find((s) => s.status === "selected");
  const selectedDateInfo = CLIENT_BOOKING_DATES[selectedDate];
  const canConfirm = selectedSlot != null;

  return (
    <div className="flex-1 overflow-auto p-4 md:p-6 lg:p-8">
      <h2 className="text-[20px] md:text-[24px] font-semibold tracking-tight leading-tight mb-1">
        Book a session
      </h2>
      <p className="text-[13px] text-muted-foreground mb-5">
        Choose a service, stylist, and time
      </p>

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

          <Section label="2. Stylist">
            <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
              {STYLIST_OPTIONS.map((s) => {
                const on = s.id === selectedStylist;
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setSelectedStylist(s.id)}
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
              <SummaryRow label="Stylist" value={stylist.name} />
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
    </div>
  );
}

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
