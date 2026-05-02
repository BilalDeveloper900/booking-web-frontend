"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CLIENT_BOOKING_DATES, CLIENT_TIME_SLOTS, type TimeSlotStatus } from "@/lib/data";
import { cn } from "@/lib/utils";

const STEPS = ["Service", "Stylist", "Date & time"] as const;

export function ClientBookSession() {
  const initialDate = Math.max(0, CLIENT_BOOKING_DATES.findIndex((d) => d.selected));
  const [selectedDate, setSelectedDate] = useState(initialDate);
  const [slots, setSlots] = useState(CLIENT_TIME_SLOTS);

  function selectDate(i: number) {
    setSelectedDate(i);
    // Reset any selected slot when changing date
    setSlots(CLIENT_TIME_SLOTS.map((s) => (s.status === "selected" ? { ...s, status: "available" as TimeSlotStatus } : s)));
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

  const selectedSlot = slots.find((s) => s.status === "selected");
  const selectedDateInfo = CLIENT_BOOKING_DATES[selectedDate];
  const canConfirm = selectedSlot != null;

  return (
    <div className="flex-1 overflow-auto p-6 lg:p-8">
      <div
        className="mb-6"
        role="progressbar"
        aria-valuenow={3}
        aria-valuemin={1}
        aria-valuemax={STEPS.length}
        aria-label={`Booking step 3 of ${STEPS.length}`}
      >
        <div className="text-[11px] font-medium tracking-[0.08em] uppercase text-muted-foreground mb-2">
          Step 3 of {STEPS.length}
        </div>
        <ol className="flex gap-1.5 w-48" aria-hidden>
          {STEPS.map((s) => (
            <li key={s} className="h-1.5 flex-1 rounded-full bg-foreground" title={s} />
          ))}
        </ol>
      </div>

      <h2 className="text-[24px] font-semibold tracking-tight leading-tight mb-1">
        Choose a date &amp; time
      </h2>
      <p className="text-[13px] text-muted-foreground mb-6">
        Select your preferred appointment slot
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
        <div>
          <div className="mb-6">
            <h3 className="text-[13px] font-medium text-muted-foreground mb-3">May 2026</h3>
            <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
              {CLIENT_BOOKING_DATES.map((d, i) => (
                <button
                  key={d.num}
                  type="button"
                  disabled={!d.available}
                  onClick={() => selectDate(i)}
                  aria-pressed={selectedDate === i}
                  className={cn(
                    "flex flex-col items-center justify-center w-14 h-16 rounded-lg border text-sm shrink-0 motion-safe:transition-all motion-safe:duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                    selectedDate === i
                      ? "bg-foreground text-background border-foreground"
                      : d.available
                        ? "border-border hover:border-[--role-accent] hover:bg-[--role-accent-light]/30 cursor-pointer"
                        : "border-border opacity-40 cursor-not-allowed"
                  )}
                >
                  <span className="text-[11px] font-medium opacity-70">{d.day}</span>
                  <span className="text-base font-semibold tabular-nums">{d.num}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-[13px] font-medium text-muted-foreground mb-3">Available times</h3>
            <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
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
                      "border border-border hover:border-[--role-accent] hover:bg-[--role-accent-light]/30 cursor-pointer",
                    s.status === "selected" &&
                      "bg-foreground text-background shadow-card",
                    s.status === "taken" &&
                      "bg-muted text-muted-foreground opacity-50 line-through cursor-not-allowed"
                  )}
                >
                  {s.time}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:sticky lg:top-8 h-fit">
          <div className="bg-card border border-border rounded-xl p-5 shadow-card">
            <h3 className="text-[13px] font-semibold mb-4">Booking summary</h3>
            <div className="space-y-3 text-[13px]">
              <SummaryRow label="Service" value="Balayage touch-up" />
              <SummaryRow label="Stylist" value="Camille Roux" />
              <SummaryRow label="Duration" value="1h 30m" />
              <SummaryRow
                label="Date"
                value={
                  selectedDateInfo
                    ? `${selectedDateInfo.day}, ${selectedDateInfo.num} May`
                    : "—"
                }
              />
              <SummaryRow label="Time" value={selectedSlot?.time ?? "—"} />
              <div className="h-px bg-border" />
              <SummaryRow label="Cost" value="3 credits" bold />
              <SummaryRow label="After booking" value="3 credits remaining" />
            </div>

            <Button className="w-full mt-5" size="lg" disabled={!canConfirm}>
              Confirm booking
            </Button>
            <Button variant="ghost" className="w-full mt-2" size="lg">
              Save as draft
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
