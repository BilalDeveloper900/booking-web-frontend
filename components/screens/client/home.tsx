"use client";

import { useMemo } from "react";
import Link from "next/link";
import { ArrowRight, AlertCircle } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { PersonCell, Pill } from "@/components/shared";
import {
  Skeleton,
  SkeletonLine,
  CardSkeleton,
  TableSkeletonRows,
} from "@/components/skeletons";
import { useCurrentMember } from "@/lib/auth/use-current-member";
import { useEffectivePlan } from "@/lib/limits";
import { useMyBookings, useMyCredits } from "@/lib/client-bookings";
import type { MyBookingItem } from "@/lib/client-bookings";

export function ClientHome() {
  const { member } = useCurrentMember();
  const memberId = member?.member.id;
  const { balance, loading: balanceLoading } = useMyCredits(memberId);
  const { bookings, loading: bookingsLoading, error } = useMyBookings(memberId);
  // Credits are a Studio feature; below that, bookings are free reservations.
  const { plan } = useEffectivePlan(member?.studio.id);
  const creditsEnabled = plan === "studio";

  const { upcoming, past, bookAgain } = useMemo(
    () => splitBookings(bookings),
    [bookings]
  );

  const greetingName = member?.user.name.split(" ")[0];
  const nextBooking = upcoming[0];
  const memberLoaded = Boolean(member);

  return (
    <div className="flex-1 overflow-auto p-6 lg:p-8">
      <div className="mb-6">
        {memberLoaded ? (
          <h2 className="text-[24px] font-semibold tracking-tight leading-tight">
            Welcome back, {greetingName}
          </h2>
        ) : (
          <SkeletonLine w="w-72" h="h-7" />
        )}
        <div className="mt-2">
          {bookingsLoading ? (
            <SkeletonLine w="w-80" h="h-3" />
          ) : (
            <p className="text-[13px] text-muted-foreground">
              {nextBooking
                ? `Your next visit is ${formatDay(nextBooking.startsAt)} at ${formatTime(
                    nextBooking.startsAt
                  )}`
                : "No upcoming visits yet — head to Book a Session to schedule one."}
            </p>
          )}
        </div>
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-lg border border-[--neg]/30 bg-[--neg]/10 px-3 py-2 text-[12px] text-[--neg] mb-4 inline-flex items-center gap-2"
        >
          <AlertCircle className="w-3.5 h-3.5" /> {error}
        </div>
      )}

      {/* Hero credits (Studio only) + small stats */}
      <div
        className={cn(
          "grid grid-cols-1 gap-4 mb-8",
          creditsEnabled ? "lg:grid-cols-[1.4fr_1fr_1fr]" : "lg:grid-cols-2"
        )}
      >
        {creditsEnabled && <CreditsHero balance={balance} loading={balanceLoading} />}
        <SmallStat
          label="Upcoming"
          value={String(upcoming.length)}
          unit={upcoming.length === 1 ? "booking" : "bookings"}
          foot={upcoming.length === 0 ? "Nothing scheduled" : "Sessions + classes"}
          loading={bookingsLoading}
        />
        <SmallStat
          label="Visits"
          value={String(past.length)}
          unit="lifetime"
          foot={past.length === 0 ? "Your first visit awaits" : "Across all services"}
          loading={bookingsLoading}
        />
      </div>

      <Section title="Upcoming appointments" right={<SectionLink href="/client/bookings">View all</SectionLink>}>
        {bookingsLoading && upcoming.length === 0 ? (
          <div className="grid grid-cols-1 gap-3">
            <CardSkeleton />
            <CardSkeleton />
          </div>
        ) : upcoming.length === 0 ? (
          <EmptyHint text="No upcoming bookings — go book a session or class." href="/client/book" />
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {upcoming.slice(0, 3).map((b) => (
              <UpcomingCard key={b.bookingId} booking={b} showCredits={creditsEnabled} />
            ))}
          </div>
        )}
      </Section>

      <Section title="Book again" right={<SectionLink href="/client/book">Browse all</SectionLink>}>
        {bookingsLoading && bookAgain.length === 0 ? (
          <div className="flex gap-3 overflow-x-auto pb-1 -mx-1 px-1">
            <CardSkeleton className="min-w-50 shrink-0" />
            <CardSkeleton className="min-w-50 shrink-0" />
            <CardSkeleton className="min-w-50 shrink-0" />
          </div>
        ) : bookAgain.length === 0 ? (
          <EmptyHint text="No history yet. Once you take a class or session, we'll surface quick rebook here." href="/client/book" />
        ) : (
          <div className="flex gap-3 overflow-x-auto pb-1 -mx-1 px-1">
            {bookAgain.map((b) => (
              <BookAgainCard
                key={b.serviceName + b.adminName}
                item={b}
                showCredits={creditsEnabled}
              />
            ))}
          </div>
        )}
      </Section>

      <Section title="Recent visits">
        {bookingsLoading && past.length === 0 ? (
          <div className="bg-card border border-border rounded-xl shadow-card overflow-hidden">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-border">
                  <Th>Date</Th>
                  <Th>Service</Th>
                  <Th>Admin</Th>
                  {creditsEnabled && <Th align="right">Credits</Th>}
                  <Th>Status</Th>
                </tr>
              </thead>
              <tbody>
                <TableSkeletonRows rows={4} cols={creditsEnabled ? 5 : 4} />
              </tbody>
            </table>
          </div>
        ) : past.length === 0 ? (
          <EmptyHint text="No past visits to show." href="/client/book" />
        ) : (
          <div className="bg-card border border-border rounded-xl shadow-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="border-b border-border">
                    <Th>Date</Th>
                    <Th>Service</Th>
                    <Th>Admin</Th>
                    {creditsEnabled && <Th align="right">Credits</Th>}
                    <Th>Status</Th>
                  </tr>
                </thead>
                <tbody>
                  {past.slice(0, 6).map((v) => (
                    <tr
                      key={v.bookingId}
                      className="border-b border-[--line-soft] last:border-0 hover:bg-muted/40 motion-safe:transition-colors motion-safe:duration-150"
                    >
                      <td className="px-4 py-3 tabular-nums">{formatDay(v.startsAt)}</td>
                      <td className="px-4 py-3">{v.serviceName}</td>
                      <td className="px-4 py-3">{v.adminName}</td>
                      {creditsEnabled && (
                        <td className="px-4 py-3 text-right tabular-nums">{v.creditsCharged}</td>
                      )}
                      <td className="px-4 py-3">
                        {v.status === "attended" ? (
                          <Pill kind="sage">Attended</Pill>
                        ) : (
                          <Pill>Past</Pill>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </Section>
    </div>
  );
}

/* ────────── cards ────────── */

function CreditsHero({ balance, loading }: { balance: number; loading: boolean }) {
  return (
    <div className="bg-foreground text-background rounded-xl p-6 flex flex-col justify-between shadow-hero motion-safe:transition-shadow motion-safe:duration-200 hover:shadow-overlay">
      <div className="text-[11px] font-medium tracking-[0.08em] uppercase opacity-60 mb-4">
        Credits balance
      </div>
      {loading ? (
        // bg-background/10 mimics shadcn skeleton against the dark hero
        // surface — primitives default to bg-muted which would be too light.
        <div className="h-12 w-40 bg-background/15 rounded-lg motion-safe:animate-pulse mb-3" />
      ) : (
        <div className="flex items-baseline gap-2 mb-3">
          <span className="text-[42px] font-bold tracking-tight leading-none tabular-nums">
            {balance}
          </span>
          <span className="text-sm opacity-50">
            credit{balance === 1 ? "" : "s"}
          </span>
        </div>
      )}
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs opacity-60">
          {balance === 0
            ? "Top up to book a session"
            : "Use them for sessions + classes"}
        </span>
        <Link
          href="/client/credits"
          className="text-xs font-medium underline-offset-2 hover:underline"
        >
          Top up →
        </Link>
      </div>
    </div>
  );
}

function UpcomingCard({
  booking,
  showCredits,
}: {
  booking: MyBookingItem;
  showCredits: boolean;
}) {
  const { day, monthShort } = splitDate(booking.startsAt);
  return (
    <div className="bg-card border border-border rounded-xl shadow-card p-4 flex flex-col sm:flex-row sm:items-center gap-4 motion-safe:transition-all motion-safe:duration-200 hover:shadow-hero hover:-translate-y-px">
      <div className="flex items-center gap-4 sm:gap-5">
        <div className="w-12 h-14 rounded-lg bg-[--role-accent-light] text-[--role-accent-dark] flex flex-col items-center justify-center shrink-0">
          <span className="text-[11px] font-medium leading-none">{monthShort}</span>
          <span className="text-lg font-bold leading-tight tabular-nums">{day}</span>
        </div>
        <div className="min-w-0">
          <div className="text-[13px] font-medium">{booking.serviceName}</div>
          <div className="text-xs text-muted-foreground tabular-nums">
            {formatTime(booking.startsAt)} · {booking.durationMin}m
            {showCredits
              ? ` · ${booking.creditsCharged} credit${booking.creditsCharged === 1 ? "" : "s"}`
              : ""}
          </div>
          <div className="mt-1.5">
            <PersonCell name={booking.adminName} hue={booking.adminHue} />
          </div>
        </div>
      </div>
      <div className="flex-1" />
      <div className="flex gap-2 shrink-0">
        <Link
          href="/client/bookings"
          className="text-xs font-medium text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
        >
          Details <ArrowRight className="w-3 h-3" aria-hidden />
        </Link>
      </div>
    </div>
  );
}

function BookAgainCard({
  item,
  showCredits,
}: {
  item: { serviceName: string; adminName: string; durationMin: number; creditsCharged: number };
  showCredits: boolean;
}) {
  return (
    <div className="bg-card border border-border rounded-xl shadow-card p-4 min-w-50 shrink-0 flex flex-col motion-safe:transition-all motion-safe:duration-200 hover:shadow-hero hover:-translate-y-px">
      <div className="text-[13px] font-medium mb-1 truncate">{item.serviceName}</div>
      <div className="text-xs text-muted-foreground mb-1 truncate">{item.adminName}</div>
      <div className="text-xs text-muted-foreground mb-3 tabular-nums">
        {item.durationMin}m
        {showCredits
          ? ` · ${item.creditsCharged} credit${item.creditsCharged === 1 ? "" : "s"}`
          : ""}
      </div>
      <div className="flex-1" />
      <Link
        href="/client/book"
        className="text-xs font-medium text-[--role-accent] hover:underline inline-flex items-center gap-1"
      >
        Book again <ArrowRight className="w-3 h-3" aria-hidden />
      </Link>
    </div>
  );
}

function SmallStat({
  label,
  value,
  unit,
  foot,
  loading,
}: {
  label: string;
  value: string | number;
  unit?: string;
  foot: string;
  loading?: boolean;
}) {
  return (
    <div className="bg-card border border-border rounded-xl shadow-card p-4.5 motion-safe:transition-shadow motion-safe:duration-200 hover:shadow-hero">
      <div className="text-[11px] font-medium tracking-[0.08em] uppercase text-muted-foreground mb-3.5">
        {label}
      </div>
      {loading ? (
        <>
          <Skeleton className="h-7 w-16 rounded" />
          <SkeletonLine w="w-24" h="h-2.5" className="mt-3" />
        </>
      ) : (
        <>
          <div className="text-[28px] font-semibold tracking-tight leading-none tabular-nums">
            {value}
            {unit && (
              <span className="text-sm text-muted-foreground ml-1 font-normal">{unit}</span>
            )}
          </div>
          <div className="text-xs text-muted-foreground mt-3">{foot}</div>
        </>
      )}
    </div>
  );
}

function EmptyHint({ text, href }: { text: string; href: string }) {
  return (
    <div className="bg-card border border-border rounded-xl shadow-card p-6 text-center">
      <div className="text-[12px] text-muted-foreground mb-3">{text}</div>
      <Link href={href} className={buttonVariants({ size: "sm" })}>
        Browse
      </Link>
    </div>
  );
}

function Section({
  title,
  right,
  children,
}: {
  title: string;
  right?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-6">
      <div className="flex items-baseline justify-between mb-3 gap-3">
        <h3 className="text-[13px] font-medium text-foreground">{title}</h3>
        {right}
      </div>
      {children}
    </div>
  );
}

function SectionLink({ href, children }: { href: string; children: React.ReactNode }) {
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

function Th({
  children,
  align = "left",
}: {
  children: React.ReactNode;
  align?: "left" | "right";
}) {
  return (
    <th
      className={`text-[11px] font-medium tracking-[0.08em] uppercase text-muted-foreground px-4 py-3 ${
        align === "right" ? "text-right" : "text-left"
      }`}
    >
      {children}
    </th>
  );
}

/* ────────── helpers ────────── */

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];
const DAYS_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function splitBookings(bookings: MyBookingItem[]) {
  const now = Date.now();
  const upcoming: MyBookingItem[] = [];
  const past: MyBookingItem[] = [];
  for (const b of bookings) {
    if (b.status === "cancelled") continue;
    if (new Date(b.startsAt).getTime() > now) upcoming.push(b);
    else past.push(b);
  }
  upcoming.sort(
    (a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime()
  );
  past.sort(
    (a, b) => new Date(b.startsAt).getTime() - new Date(a.startsAt).getTime()
  );

  // "Book again" — pick unique (service, admin) pairs from the most recent past bookings.
  const seen = new Set<string>();
  const bookAgain: typeof past = [];
  for (const b of past) {
    const key = `${b.serviceName}::${b.adminName}`;
    if (seen.has(key)) continue;
    seen.add(key);
    bookAgain.push(b);
    if (bookAgain.length >= 4) break;
  }

  return { upcoming, past, bookAgain };
}

function splitDate(iso: string): { day: number; monthShort: string } {
  const d = new Date(iso);
  return { day: d.getDate(), monthShort: MONTHS[d.getMonth()] };
}

function formatDay(iso: string): string {
  const d = new Date(iso);
  return `${DAYS_SHORT[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  const h = d.getHours();
  const m = d.getMinutes();
  const h12 = ((h + 11) % 12) + 1;
  const ampm = h < 12 ? "AM" : "PM";
  return `${h12}:${m.toString().padStart(2, "0")} ${ampm}`;
}
