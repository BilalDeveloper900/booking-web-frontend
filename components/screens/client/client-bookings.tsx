"use client";

import { useMemo, useState } from "react";
import { Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { PersonCell, Pill } from "@/components/shared";
import { useCurrentMember } from "@/lib/auth/use-current-member";
import {
  useMyBookings,
  cancelMyBooking,
  type MyBookingItem,
} from "@/lib/client-bookings";
import { cn } from "@/lib/utils";

export function ClientBookings() {
  const { member } = useCurrentMember();
  const { bookings, loading, error, refetch } = useMyBookings(member?.member.id);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const { upcoming, past, cancelled } = useMemo(
    () => partitionBookings(bookings),
    [bookings]
  );

  async function handleCancel(bookingId: string) {
    if (cancellingId) return;
    setCancellingId(bookingId);
    setActionError(null);
    try {
      await cancelMyBooking(bookingId, "Cancelled by client");
      await refetch();
    } catch (e) {
      setActionError(e instanceof Error ? e.message : String(e));
    } finally {
      setCancellingId(null);
    }
  }

  return (
    <div className="flex-1 overflow-auto p-6 lg:p-8">
      <div className="mb-6">
        <h2 className="text-[24px] font-semibold tracking-tight leading-tight">My bookings</h2>
        <p className="text-[13px] text-muted-foreground mt-1">
          View and manage your appointments
        </p>
      </div>

      {(error || actionError) && (
        <div
          role="alert"
          className="rounded-lg border border-[--neg]/30 bg-[--neg]/10 px-3 py-2 text-[12px] text-[--neg] mb-4 inline-flex items-center gap-2"
        >
          <AlertCircle className="w-3.5 h-3.5" /> {error ?? actionError}
        </div>
      )}

      <Tabs defaultValue="upcoming">
        <TabsList variant="line" className="mb-5">
          <TabsTrigger value="upcoming">Upcoming ({upcoming.length})</TabsTrigger>
          <TabsTrigger value="past">Past ({past.length})</TabsTrigger>
          <TabsTrigger value="cancelled">Cancelled ({cancelled.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming">
          <BookingList
            items={upcoming}
            loading={loading}
            emptyText="No upcoming bookings."
            emptyHint="Browse classes or 1-on-1 services on the Book tab."
            renderActions={(b) => (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleCancel(b.bookingId)}
                disabled={cancellingId === b.bookingId}
              >
                {cancellingId === b.bookingId ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Cancelling
                  </>
                ) : (
                  "Cancel"
                )}
              </Button>
            )}
          />
        </TabsContent>

        <TabsContent value="past">
          <BookingList
            items={past}
            loading={loading}
            emptyText="No past bookings yet."
            emptyHint="Once you've taken a class or session, it'll appear here."
            showStatus={false}
          />
        </TabsContent>

        <TabsContent value="cancelled">
          <BookingList
            items={cancelled}
            loading={loading}
            emptyText="No cancelled bookings."
            emptyHint="Cancellations show up here if you change plans."
            showStatus={false}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

/* ────────── building blocks ────────── */

function BookingList({
  items,
  loading,
  emptyText,
  emptyHint,
  showStatus = true,
  renderActions,
}: {
  items: MyBookingItem[];
  loading: boolean;
  emptyText: string;
  emptyHint: string;
  showStatus?: boolean;
  renderActions?: (b: MyBookingItem) => React.ReactNode;
}) {
  if (loading && items.length === 0) {
    return (
      <div className="space-y-3">
        {[0, 1].map((i) => (
          <div
            key={i}
            className="h-22 rounded-xl border border-border bg-muted/30 animate-pulse"
          />
        ))}
      </div>
    );
  }
  if (items.length === 0) {
    return (
      <div className="bg-card border border-border rounded-xl shadow-card p-10 text-center">
        <div className="text-[13px] font-medium mb-1">{emptyText}</div>
        <div className="text-[12px] text-muted-foreground">{emptyHint}</div>
      </div>
    );
  }
  return (
    <div className="grid grid-cols-1 gap-3">
      {items.map((b) => (
        <BookingCard
          key={b.bookingId}
          booking={b}
          showStatus={showStatus}
          actions={renderActions?.(b)}
        />
      ))}
    </div>
  );
}

function BookingCard({
  booking,
  showStatus,
  actions,
}: {
  booking: MyBookingItem;
  showStatus: boolean;
  actions?: React.ReactNode;
}) {
  const { day, monthShort } = splitDate(booking.startsAt);
  const accent = booking.status === "confirmed" || booking.status === "pending";
  return (
    <div className="bg-card border border-border rounded-xl shadow-card p-4 flex flex-col sm:flex-row sm:items-center gap-4 motion-safe:transition-all motion-safe:duration-200 hover:shadow-hero hover:-translate-y-px">
      <DateBlock day={day} monthShort={monthShort} accent={accent} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 mb-0.5 flex-wrap">
          <span className="text-[13px] font-medium">{booking.serviceName}</span>
          {showStatus && <StatusPill status={booking.status} />}
          {booking.serviceMode === "group" && <Pill>Class</Pill>}
        </div>
        <div className="text-xs text-muted-foreground tabular-nums">
          {formatTime(booking.startsAt)} · {booking.durationMin}m · {booking.creditsCharged}{" "}
          credit{booking.creditsCharged === 1 ? "" : "s"}
        </div>
        <div className="mt-1.5">
          <PersonCell name={booking.adminName} hue={booking.adminHue} />
        </div>
      </div>
      {actions && <div className="flex gap-2 shrink-0 sm:ml-auto">{actions}</div>}
    </div>
  );
}

function DateBlock({
  day,
  monthShort,
  accent,
}: {
  day: number;
  monthShort: string;
  accent?: boolean;
}) {
  return (
    <div
      className={cn(
        "w-12 h-14 rounded-lg flex flex-col items-center justify-center shrink-0",
        accent
          ? "bg-[--role-accent-light] text-[--role-accent-dark]"
          : "bg-muted text-muted-foreground"
      )}
    >
      <span className="text-[11px] font-medium leading-none">{monthShort}</span>
      <span className="text-lg font-bold leading-tight tabular-nums">{day}</span>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  if (status === "confirmed") return <Pill kind="teal" dot>Confirmed</Pill>;
  if (status === "pending") return <Pill kind="warn" dot>Pending</Pill>;
  if (status === "waitlist") return <Pill kind="warn" dot>Waitlist</Pill>;
  if (status === "attended") return <Pill kind="sage">Attended</Pill>;
  if (status === "no_show") return <Pill kind="warn">No show</Pill>;
  if (status === "cancelled") return <Pill>Cancelled</Pill>;
  return <Pill>{status}</Pill>;
}

/* ────────── helpers ────────── */

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

function partitionBookings(bookings: MyBookingItem[]) {
  const now = Date.now();
  const upcoming: MyBookingItem[] = [];
  const past: MyBookingItem[] = [];
  const cancelled: MyBookingItem[] = [];
  for (const b of bookings) {
    if (b.status === "cancelled") {
      cancelled.push(b);
    } else if (new Date(b.startsAt).getTime() > now) {
      upcoming.push(b);
    } else {
      past.push(b);
    }
  }
  // Upcoming sorted ascending (soonest first); past + cancelled descending (newest first).
  upcoming.sort(
    (a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime()
  );
  past.sort(
    (a, b) => new Date(b.startsAt).getTime() - new Date(a.startsAt).getTime()
  );
  cancelled.sort(
    (a, b) => new Date(b.startsAt).getTime() - new Date(a.startsAt).getTime()
  );
  return { upcoming, past, cancelled };
}

function splitDate(iso: string): { day: number; monthShort: string } {
  const d = new Date(iso);
  return { day: d.getDate(), monthShort: MONTHS[d.getMonth()] };
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  const h = d.getHours();
  const m = d.getMinutes();
  const h12 = ((h + 11) % 12) + 1;
  const ampm = h < 12 ? "AM" : "PM";
  return `${h12}:${m.toString().padStart(2, "0")} ${ampm}`;
}
