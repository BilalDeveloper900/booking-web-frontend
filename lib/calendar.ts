/**
 * Calendar data layer.
 *
 * - `useCalendarSessions({ studioId, weekOffset, adminMemberId })` — fetches
 *   real sessions + bookings for the visible week and maps them to the
 *   `LiveCalendarEvent` shape the CalendarScreen renders.
 * - `weekBounds(offset)` / `weekDays(offset)` — pure date math.
 *
 * Admin scope filtering: pass `adminMemberId` to restrict to one admin's
 * sessions. Owner view passes `undefined` to see all studio sessions.
 */
"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

/** Mon-first weekday labels in display order. */
const WEEKDAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

export const HOURS_START = 8; // calendar grid starts at 8 AM
export const HOURS_COUNT = 12; // covers 8 AM..7 PM (last slot 7-8 PM)

export type CalendarDay = {
  d: (typeof WEEKDAY_LABELS)[number];
  n: number; // date-of-month
  date: Date;
  today: boolean;
};

export type LiveCalendarEvent = {
  // Visual position
  day: number; // 0..6 index into the visible week
  start: number; // decimal hours since 8 AM (HOURS_START)
  len: number; // decimal hours duration

  // Display
  client: string; // for solo: attendee name; for group: empty
  service: string;
  hue: number;
  now?: boolean;
  closed?: boolean;
  mode?: "solo" | "group";
  capacity?: number;
  attendees?: string[];

  // Live identifiers (used to skip the hacky TRAINERS-by-hue lookup)
  sessionId: string;
  adminMemberId: string;
  adminName: string;
  adminHue: number;
};

/** Monday 00:00 of the offset week, in the user's local TZ. End = next Monday. */
export function weekBounds(offset: number): { start: Date; end: Date } {
  const today = new Date();
  const dow = today.getDay(); // 0=Sun..6=Sat
  const diffToMon = dow === 0 ? -6 : 1 - dow;
  const start = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate() + diffToMon + offset * 7
  );
  const end = new Date(start);
  end.setDate(start.getDate() + 7);
  return { start, end };
}

export function weekDays(offset: number): CalendarDay[] {
  const { start } = weekBounds(offset);
  const today = new Date();
  return WEEKDAY_LABELS.map((label, i) => {
    const date = new Date(start);
    date.setDate(start.getDate() + i);
    return { d: label, n: date.getDate(), date, today: sameDay(date, today) };
  });
}

function sameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/* ────────── Range label for the toolbar ────────── */

const MONTH_SHORT = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
] as const;

export function weekRangeLabel(offset: number): string {
  const { start, end } = weekBounds(offset);
  const sun = new Date(end);
  sun.setDate(end.getDate() - 1);
  const sameMonth = start.getMonth() === sun.getMonth();
  const left = `${MONTH_SHORT[start.getMonth()]} ${start.getDate()}`;
  const right = sameMonth
    ? `${sun.getDate()}`
    : `${MONTH_SHORT[sun.getMonth()]} ${sun.getDate()}`;
  return `${left} – ${right}`;
}

/* ────────── Hook ────────── */

type State = {
  events: LiveCalendarEvent[];
  loading: boolean;
  error: string | null;
};

type Args = {
  studioId: string | undefined;
  weekOffset: number;
  adminMemberId?: string;
};

export function useCalendarSessions({ studioId, weekOffset, adminMemberId }: Args) {
  const [state, setState] = useState<State>(() => ({
    events: [],
    loading: Boolean(studioId),
    error: null,
  }));

  const refetch = useCallback(async () => {
    if (!studioId) return;
    const { start, end } = weekBounds(weekOffset);
    const result = await runQuery(studioId, start, end, adminMemberId);
    setState({ ...result, loading: false });
  }, [studioId, weekOffset, adminMemberId]);

  useEffect(() => {
    if (!studioId) return;
    let cancelled = false;
    const { start, end } = weekBounds(weekOffset);
    runQuery(studioId, start, end, adminMemberId).then((result) => {
      if (cancelled) return;
      setState({ ...result, loading: false });
    });
    return () => {
      cancelled = true;
    };
  }, [studioId, weekOffset, adminMemberId]);

  return { ...state, refetch };
}

async function runQuery(
  studioId: string,
  weekStart: Date,
  weekEnd: Date,
  adminMemberId: string | undefined
): Promise<{ events: LiveCalendarEvent[]; error: string | null }> {
  const supabase = createClient();
  let q = supabase
    .from("sessions")
    .select(
      `
        id,
        starts_at,
        duration_min,
        capacity,
        status,
        admin_member_id,
        service:services!sessions_service_id_fkey(name, mode, hue),
        admin:studio_members!sessions_admin_member_id_fkey(
          id,
          user:users!studio_members_user_id_fkey(name, avatar_hue)
        ),
        bookings(
          status,
          client:studio_members!bookings_client_member_id_fkey(
            user:users!studio_members_user_id_fkey(name)
          )
        )
      `
    )
    .eq("studio_id", studioId)
    .gte("starts_at", weekStart.toISOString())
    .lt("starts_at", weekEnd.toISOString())
    .neq("status", "cancelled")
    .order("starts_at", { ascending: true });

  if (adminMemberId) q = q.eq("admin_member_id", adminMemberId);

  const { data, error } = await q;
  if (error) return { events: [], error: error.message };

  const events: LiveCalendarEvent[] = [];
  const now = new Date();

  for (const row of data ?? []) {
    const event = sessionToEvent(row, weekStart, now);
    if (event) events.push(event);
  }
  return { events, error: null };
}

/**
 * Map a session row + its nested service/admin/bookings into the visual
 * coordinate system the CalendarScreen renders.
 *
 * Returns null when the session falls outside the visible 8 AM..8 PM window;
 * we drop it rather than clip, since clipping makes the layout ambiguous.
 */
function sessionToEvent(
  // Supabase returns nested relations as either an object or an array depending
  // on the FK cardinality. We accept both shapes defensively.
  row: SessionWithRelations,
  weekStart: Date,
  now: Date
): LiveCalendarEvent | null {
  const startsAt = new Date(row.starts_at);
  const dayIndex = Math.floor(
    (startsAt.getTime() - weekStart.getTime()) / DAY_MS
  );
  if (dayIndex < 0 || dayIndex > 6) return null;

  const hoursIntoDay = startsAt.getHours() + startsAt.getMinutes() / 60;
  const start = hoursIntoDay - HOURS_START;
  const len = row.duration_min / 60;
  if (start < 0 || start + len > HOURS_COUNT) return null;

  const service = pickOne(row.service);
  const admin = pickOne(row.admin);
  const adminUser = admin ? pickOne(admin.user) : null;
  if (!service || !admin || !adminUser) return null;

  const activeBookings = (row.bookings ?? []).filter(
    (b) => b.status !== "cancelled"
  );
  const attendees = activeBookings
    .map((b) => {
      const c = pickOne(b.client);
      return c ? pickOne(c.user)?.name ?? null : null;
    })
    .filter((n): n is string => Boolean(n));

  const isGroup = service.mode === "group";
  const sessionEnd = startsAt.getTime() + row.duration_min * 60_000;
  const isNow = now.getTime() >= startsAt.getTime() && now.getTime() < sessionEnd;

  return {
    day: dayIndex,
    start,
    len,
    client: isGroup ? "" : attendees[0] ?? "(open slot)",
    service: service.name,
    hue: service.hue,
    now: isNow || undefined,
    mode: service.mode as "solo" | "group",
    capacity: isGroup ? row.capacity : undefined,
    attendees: isGroup ? attendees : undefined,
    sessionId: row.id,
    adminMemberId: admin.id,
    adminName: adminUser.name,
    adminHue: adminUser.avatar_hue,
  };
}

const DAY_MS = 24 * 60 * 60 * 1000;

function pickOne<T>(maybe: T | T[] | null | undefined): T | null {
  if (Array.isArray(maybe)) return maybe[0] ?? null;
  return maybe ?? null;
}

/* ────────── Local query-row shape ────────── */

type SessionWithRelations = {
  id: string;
  starts_at: string;
  duration_min: number;
  capacity: number;
  status: string;
  admin_member_id: string;
  service:
    | { name: string; mode: string; hue: number }
    | Array<{ name: string; mode: string; hue: number }>
    | null;
  admin:
    | {
        id: string;
        user:
          | { name: string; avatar_hue: number }
          | Array<{ name: string; avatar_hue: number }>
          | null;
      }
    | Array<{
        id: string;
        user:
          | { name: string; avatar_hue: number }
          | Array<{ name: string; avatar_hue: number }>
          | null;
      }>
    | null;
  bookings: Array<{
    status: string;
    client:
      | {
          user:
            | { name: string }
            | Array<{ name: string }>
            | null;
        }
      | Array<{
          user:
            | { name: string }
            | Array<{ name: string }>
            | null;
        }>
      | null;
  }> | null;
};
