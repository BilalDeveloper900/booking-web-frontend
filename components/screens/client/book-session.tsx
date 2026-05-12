"use client";

import { useMemo, useState } from "react";
import { Users, Check, Sparkles, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { HueAvatar } from "@/components/shared";
import { useCurrentMember } from "@/lib/auth/use-current-member";
import {
  useUpcomingClasses,
  useMyCredits,
  useSoloServices,
  useFreeSoloSlots,
  enrollInClass,
  cancelMyBooking,
  bookSolo,
  type UpcomingClass,
} from "@/lib/client-bookings";

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

/* ───────── 1-on-1 (live data) ───────── */

const NEXT_DAYS = 7;

function SoloFlow() {
  const { member } = useCurrentMember();
  const studioId = member?.studio.id;
  const myMemberId = member?.member.id;

  const { services, loading: servicesLoading, error: servicesError } =
    useSoloServices(studioId);
  const { balance, refetch: refetchBalance } = useMyCredits(myMemberId);

  const dates = useMemo(() => buildNextDays(NEXT_DAYS), []);

  const [serviceId, setServiceId] = useState<string | null>(null);
  const [dateIdx, setDateIdx] = useState(0);
  const [pickedSlot, setPickedSlot] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Default to the first service whenever the list changes (and current pick disappears).
  const effectiveServiceId =
    serviceId && services.some((s) => s.id === serviceId)
      ? serviceId
      : services[0]?.id ?? null;
  const service = services.find((s) => s.id === effectiveServiceId) ?? null;

  const selectedDate = dates[dateIdx];
  const dateKey = selectedDate?.iso;

  const {
    slots,
    loading: slotsLoading,
    error: slotsError,
  } = useFreeSoloSlots(effectiveServiceId ?? undefined, dateKey);

  // Drop the picked slot if it's no longer in the fresh list (date changed, slot taken).
  const pickedIsValid = pickedSlot && slots.includes(pickedSlot);
  const effectivePicked = pickedIsValid ? pickedSlot : null;

  async function handleConfirm() {
    if (!service || !effectivePicked || submitting) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      await bookSolo(service.id, new Date(effectivePicked));
      await refetchBalance();
      setPickedSlot(null);
      // Trigger a slots refetch by bumping date selection then restoring.
      // The hook re-runs on (serviceId, date) change; simplest is to leave
      // the user on the same date and refetch happens on next view.
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : String(e));
    } finally {
      setSubmitting(false);
    }
  }

  const cost = service?.creditsCost ?? 0;
  const afterBalance = Math.max(0, balance - cost);
  const canConfirm = Boolean(service && effectivePicked) && balance >= cost && !submitting;

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-6">
      <div className="space-y-6">
        {servicesError && (
          <div
            role="alert"
            className="rounded-lg border border-[--neg]/30 bg-[--neg]/10 px-3 py-2 text-[12px] text-[--neg] inline-flex items-center gap-2"
          >
            <AlertCircle className="w-3.5 h-3.5" /> {servicesError}
          </div>
        )}

        <Section label="1. Service">
          {servicesLoading && services.length === 0 ? (
            <div className="grid grid-cols-2 gap-2">
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-18 rounded-xl border border-border bg-muted/30 animate-pulse"
                />
              ))}
            </div>
          ) : services.length === 0 ? (
            <div className="border border-dashed border-border rounded-xl p-6 text-center">
              <div className="text-[13px] font-medium mb-1">
                No 1-on-1 services available
              </div>
              <p className="text-[12px] text-muted-foreground">
                Your studio hasn&rsquo;t published any 1-on-1 services yet.
                Try the Classes tab.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {services.map((s) => {
                const on = s.id === effectiveServiceId;
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => {
                      setServiceId(s.id);
                      setPickedSlot(null);
                    }}
                    aria-pressed={on}
                    className={cn(
                      "p-3 rounded-xl border text-left motion-safe:transition-colors motion-safe:duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      on
                        ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                        : "border-border hover:border-primary/50 bg-card"
                    )}
                  >
                    <div className="text-[13px] font-semibold truncate">{s.name}</div>
                    <div className="text-[11px] text-muted-foreground mt-0.5 tabular-nums">
                      {s.durationMin}m · {s.creditsCost} cr · {s.adminName.split(" ")[0]}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </Section>

        {service && (
          <Section label="2. Date & time">
            <div className="grid grid-cols-7 gap-1.5 mb-4">
              {dates.map((d, i) => {
                const on = dateIdx === i;
                return (
                  <button
                    key={d.iso}
                    type="button"
                    onClick={() => {
                      setDateIdx(i);
                      setPickedSlot(null);
                    }}
                    aria-pressed={on}
                    className={cn(
                      "flex flex-col items-center justify-center py-2 rounded-lg border text-sm motion-safe:transition-colors motion-safe:duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      on
                        ? "bg-primary text-primary-foreground border-primary"
                        : "border-border hover:border-primary bg-card"
                    )}
                  >
                    <span
                      className={cn(
                        "text-[10px] tracking-wider uppercase",
                        on ? "opacity-70" : "text-muted-foreground"
                      )}
                    >
                      {d.dayShort[0]}
                    </span>
                    <span className="text-[15px] font-semibold tabular-nums mt-0.5">
                      {d.dayNum}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="text-[11px] text-muted-foreground mb-2 px-1">
              Slots from {service.adminName.split(" ")[0]}&rsquo;s working hours · 30 min steps
            </div>

            {slotsError && (
              <div
                role="alert"
                className="rounded-lg border border-[--neg]/30 bg-[--neg]/10 px-3 py-2 text-[12px] text-[--neg] mb-2 inline-flex items-center gap-2"
              >
                <AlertCircle className="w-3.5 h-3.5" /> {slotsError}
              </div>
            )}

            {slotsLoading ? (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {[0, 1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="h-10 rounded-lg bg-muted/40 animate-pulse" />
                ))}
              </div>
            ) : slots.length === 0 ? (
              <div className="text-[12px] text-muted-foreground border border-dashed border-border rounded-lg py-6 text-center">
                No free slots that day. Try another date.
              </div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {slots.map((iso) => {
                  const on = effectivePicked === iso;
                  return (
                    <button
                      key={iso}
                      type="button"
                      onClick={() => setPickedSlot(iso)}
                      aria-pressed={on}
                      className={cn(
                        "h-10 rounded-lg text-[13px] font-medium tabular-nums motion-safe:transition-all motion-safe:duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                        on
                          ? "bg-primary text-primary-foreground shadow-card"
                          : "border border-border hover:border-primary hover:bg-primary/10"
                      )}
                    >
                      {formatTime(iso)}
                    </button>
                  );
                })}
              </div>
            )}
          </Section>
        )}
      </div>

      <div className="xl:sticky xl:top-8 h-fit">
        <div className="bg-card border border-border rounded-xl p-5 shadow-card">
          <h3 className="text-[13px] font-semibold mb-4">Booking summary</h3>
          {service ? (
            <div className="space-y-3 text-[13px]">
              <SummaryRow label="Service" value={service.name} />
              <SummaryRow
                label="Admin"
                value={service.adminName}
                icon={<HueAvatar name={service.adminName} hue={service.adminHue} size={20} />}
              />
              <SummaryRow label="Duration" value={`${service.durationMin}m`} />
              <SummaryRow
                label="Date"
                value={selectedDate ? selectedDate.fullLabel : "—"}
              />
              <SummaryRow
                label="Time"
                value={effectivePicked ? formatTime(effectivePicked) : "—"}
              />
              <div className="h-px bg-border" />
              <SummaryRow
                label="Cost"
                value={`${service.creditsCost} credit${service.creditsCost === 1 ? "" : "s"}`}
                bold
              />
              <SummaryRow
                label="After booking"
                value={`${afterBalance} credits left`}
              />
            </div>
          ) : (
            <div className="text-[12px] text-muted-foreground py-6 text-center border border-dashed border-border rounded-lg">
              Pick a service to see details.
            </div>
          )}

          {submitError && (
            <div
              role="alert"
              className="rounded-lg border border-[--neg]/30 bg-[--neg]/10 px-3 py-2 text-[12px] text-[--neg] mt-4"
            >
              {submitError}
            </div>
          )}

          <Button
            className="w-full mt-5"
            size="lg"
            disabled={!canConfirm}
            onClick={handleConfirm}
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Booking
              </>
            ) : !service ? (
              "Pick a service"
            ) : !effectivePicked ? (
              "Pick a time"
            ) : balance < cost ? (
              "Not enough credits"
            ) : (
              "Confirm booking"
            )}
          </Button>
          <p className="text-[11px] text-muted-foreground text-center mt-3">
            Free reschedule up to 24h before your appointment
          </p>
        </div>
      </div>
    </div>
  );
}

/* ────────── helpers (solo) ────────── */

function buildNextDays(count: number) {
  const result: { iso: string; dayShort: string; dayNum: number; fullLabel: string }[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (let i = 0; i < count; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    result.push({
      iso: toLocalIsoDate(d),
      dayShort: DAYS_SHORT[d.getDay()],
      dayNum: d.getDate(),
      fullLabel: `${DAYS_SHORT[d.getDay()]} ${d.getDate()} ${MONTHS_SHORT[d.getMonth()]}`,
    });
  }
  return result;
}

function toLocalIsoDate(d: Date): string {
  const y = d.getFullYear();
  const m = (d.getMonth() + 1).toString().padStart(2, "0");
  const day = d.getDate().toString().padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/* ───────── Classes tab ───────── */

function ClassFlow() {
  const { member } = useCurrentMember();
  const studioId = member?.studio.id;
  const myMemberId = member?.member.id;

  const { classes, loading, error, refetch } = useUpcomingClasses(
    studioId,
    myMemberId
  );
  const { balance, refetch: refetchBalance } = useMyCredits(myMemberId);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = classes.find((c) => c.sessionId === selectedId) ?? null;

  const [actionError, setActionError] = useState<string | null>(null);
  const [actioning, setActioning] = useState(false);

  // Group by human-readable date label, in calendar order.
  const grouped = useMemo(() => {
    const map = new Map<string, UpcomingClass[]>();
    for (const c of classes) {
      const key = formatDayLabel(c.startsAt);
      const arr = map.get(key) ?? [];
      arr.push(c);
      map.set(key, arr);
    }
    return Array.from(map.entries());
  }, [classes]);

  async function handleEnroll() {
    if (!selected || actioning) return;
    setActioning(true);
    setActionError(null);
    try {
      await enrollInClass(selected.sessionId);
      await Promise.all([refetch(), refetchBalance()]);
    } catch (e) {
      setActionError(e instanceof Error ? e.message : String(e));
    } finally {
      setActioning(false);
    }
  }

  async function handleCancel() {
    if (!selected?.myBookingId || actioning) return;
    setActioning(true);
    setActionError(null);
    try {
      await cancelMyBooking(selected.myBookingId, "Cancelled by client");
      await Promise.all([refetch(), refetchBalance()]);
      setSelectedId(null);
    } catch (e) {
      setActionError(e instanceof Error ? e.message : String(e));
    } finally {
      setActioning(false);
    }
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-6">
      <div className="space-y-6">
        {error && (
          <div
            role="alert"
            className="rounded-lg border border-[--neg]/30 bg-[--neg]/10 px-3 py-2 text-[12px] text-[--neg] inline-flex items-center gap-2"
          >
            <AlertCircle className="w-3.5 h-3.5" /> {error}
          </div>
        )}

        {loading && classes.length === 0 ? (
          <div className="space-y-2">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="h-20 rounded-xl border border-border bg-muted/30 animate-pulse"
              />
            ))}
          </div>
        ) : classes.length === 0 ? (
          <div className="border border-dashed border-border rounded-xl p-10 text-center">
            <div className="text-[13px] font-medium mb-1">No upcoming classes</div>
            <p className="text-[12px] text-muted-foreground">
              Your studio hasn&rsquo;t scheduled any group classes yet. Check back soon!
            </p>
          </div>
        ) : (
          grouped.map(([dateLabel, items]) => (
            <div key={dateLabel}>
              <div className="text-[11px] font-medium tracking-[0.08em] uppercase text-muted-foreground mb-2.5 px-1">
                {dateLabel}
              </div>
              <div className="space-y-2">
                {items.map((c) => (
                  <ClassCard
                    key={c.sessionId}
                    session={c}
                    selected={selectedId === c.sessionId}
                    onSelect={() => {
                      if (c.enrolled >= c.capacity && !c.enrolledByMe) return;
                      setSelectedId((prev) => (prev === c.sessionId ? null : c.sessionId));
                    }}
                  />
                ))}
              </div>
            </div>
          ))
        )}
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
                <SummaryRow label="Class" value={selected.serviceName} />
                <SummaryRow label="Instructor" value={selected.adminName} />
                <SummaryRow
                  label="When"
                  value={`${formatDayLabel(selected.startsAt)} · ${formatTime(selected.startsAt)}`}
                />
                <SummaryRow label="Duration" value={`${selected.durationMin}m`} />
                <SummaryRow
                  label="Enrollment"
                  value={`${selected.enrolled} / ${selected.capacity}`}
                />
                <div className="h-px bg-border" />
                <SummaryRow
                  label="Cost"
                  value={`${selected.creditsCost} credit${selected.creditsCost === 1 ? "" : "s"}`}
                  bold
                />
                <SummaryRow
                  label={selected.enrolledByMe ? "Balance" : "After enrolling"}
                  value={`${
                    selected.enrolledByMe ? balance : Math.max(0, balance - selected.creditsCost)
                  } credits`}
                />
              </div>

              {actionError && (
                <div
                  role="alert"
                  className="rounded-lg border border-[--neg]/30 bg-[--neg]/10 px-3 py-2 text-[12px] text-[--neg] mt-4"
                >
                  {actionError}
                </div>
              )}

              {selected.enrolledByMe ? (
                <Button
                  variant="outline"
                  className="w-full mt-5"
                  size="lg"
                  onClick={handleCancel}
                  disabled={actioning}
                >
                  {actioning ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Cancelling
                    </>
                  ) : (
                    "Cancel enrollment"
                  )}
                </Button>
              ) : (
                <Button
                  className="w-full mt-5"
                  size="lg"
                  onClick={handleEnroll}
                  disabled={actioning || balance < selected.creditsCost}
                >
                  {actioning ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Enrolling
                    </>
                  ) : balance < selected.creditsCost ? (
                    "Not enough credits"
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" /> Enroll in class
                    </>
                  )}
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
  session: UpcomingClass;
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
        <HueAvatar name={session.serviceName} hue={session.hue} size={36} />

        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2 flex-wrap">
            <span className="text-[14px] font-semibold tracking-tight">
              {session.serviceName}
            </span>
            {enrolled && (
              <span className="inline-flex items-center gap-0.5 text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-[--sage-100] text-[oklch(0.4_0.05_165)]">
                <Check className="w-2.5 h-2.5" /> Enrolled
              </span>
            )}
          </div>
          <div className="text-[12px] text-muted-foreground mt-0.5">
            with {session.adminName} · {session.durationMin}m
          </div>
        </div>

        <div className="text-right shrink-0">
          <div className="text-[14px] font-semibold tabular-nums">
            {formatTime(session.startsAt)}
          </div>
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

/* ───────── date helpers ───────── */

const DAYS_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS_SHORT = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

function formatDayLabel(iso: string): string {
  const d = new Date(iso);
  return `${DAYS_SHORT[d.getDay()]} ${d.getDate()} ${MONTHS_SHORT[d.getMonth()]}`;
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  const h = d.getHours();
  const m = d.getMinutes();
  const h12 = ((h + 11) % 12) + 1;
  const ampm = h < 12 ? "AM" : "PM";
  return `${h12}:${m.toString().padStart(2, "0")} ${ampm}`;
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
  icon,
}: {
  label: string;
  value: string;
  bold?: boolean;
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-muted-foreground">{label}</span>
      <span
        className={cn(
          "text-right tabular-nums inline-flex items-center gap-1.5",
          bold ? "font-semibold" : "font-medium"
        )}
      >
        {icon}
        {value}
      </span>
    </div>
  );
}
