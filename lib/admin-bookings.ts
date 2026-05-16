/**
 * Admin bookings data layer.
 *
 * Hooks for `/admin/bookings`. All queries filter to bookings on sessions
 * owned by the current admin (`sessions.admin_member_id = me`); RLS does
 * the rest.
 *
 * - `useAdminBookings(tab)` — upcoming / pending / past
 * - `useAdminBookingStats()` — confirmed-next-7d, pending, hours week, credits week
 */
"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export type AdminBookingTab = "upcoming" | "pending" | "past";

export type AdminBookingRow = {
  bookingId: string;
  sessionId: string;
  dateLabel: string;
  timeLabel: string;
  startsAt: string;
  client: string;
  clientHue: number;
  service: string;
  serviceHue: number;
  mode: "solo" | "group";
  duration: number;
  durationLabel: string;
  credits: number;
  status: AdminBookingStatus;
};

export type AdminBookingStatus =
  | "confirmed"
  | "pending"
  | "now"
  | "attended"
  | "no_show"
  | "cancelled"
  | "waitlist";

type BookingsState = {
  rows: AdminBookingRow[];
  loading: boolean;
  error: string | null;
};

// ─────────── Bookings list ───────────

export function useAdminBookings(args: {
  studioId: string | undefined;
  adminMemberId: string | undefined;
  tab: AdminBookingTab;
}) {
  const { studioId, adminMemberId, tab } = args;
  const [state, setState] = useState<BookingsState>(() => ({
    rows: [],
    loading: Boolean(studioId && adminMemberId),
    error: null,
  }));

  useEffect(() => {
    if (!studioId || !adminMemberId) return;
    let cancelled = false;
    fetchBookings(studioId, adminMemberId, tab).then((result) => {
      if (cancelled) return;
      setState({ ...result, loading: false });
    });
    return () => {
      cancelled = true;
    };
  }, [studioId, adminMemberId, tab]);

  return state;
}

async function fetchBookings(
  studioId: string,
  adminMemberId: string,
  tab: AdminBookingTab
): Promise<{ rows: AdminBookingRow[]; error: string | null }> {
  const supabase = createClient();
  const nowIso = new Date().toISOString();

  // We filter sessions by admin_member_id via the FK join. The `!inner` hint
  // turns this into an inner join so the where on sessions.admin_member_id
  // actually narrows the result set.
  let q = supabase
    .from("bookings")
    .select(
      `
        id,
        status,
        credits_charged,
        session:sessions!bookings_session_id_fkey!inner(
          id,
          starts_at,
          duration_min,
          admin_member_id,
          studio_id,
          service:services!sessions_service_id_fkey(name, mode, hue)
        ),
        client:studio_members!bookings_client_member_id_fkey(
          user:users!studio_members_user_id_fkey(name, avatar_hue)
        )
      `
    )
    .eq("session.admin_member_id", adminMemberId)
    .eq("session.studio_id", studioId);

  // Note: PostgREST can filter on referenced-table columns through `!inner`
  // joins, but ordering by them sorts the embedded rows, not the parent. We
  // sort the bookings client-side by session.starts_at below.
  if (tab === "upcoming") {
    q = q.eq("status", "confirmed").gte("session.starts_at", nowIso);
  } else if (tab === "pending") {
    q = q.eq("status", "pending").gte("session.starts_at", nowIso);
  } else {
    // past — anything that's already started (confirmed, attended, no_show)
    q = q
      .in("status", ["confirmed", "attended", "no_show"])
      .lt("session.starts_at", nowIso)
      .limit(100);
  }

  const { data, error } = await q;
  if (error) return { rows: [], error: error.message };

  const sortedData = [...(data ?? [])].sort((a, b) => {
    const sa = pickOne(a.session);
    const sb = pickOne(b.session);
    const ta = sa ? new Date(sa.starts_at).getTime() : 0;
    const tb = sb ? new Date(sb.starts_at).getTime() : 0;
    return tab === "past" ? tb - ta : ta - tb;
  });
  const dataToMap = tab === "past" ? sortedData.slice(0, 50) : sortedData;

  const now = Date.now();
  const rows: AdminBookingRow[] = dataToMap.flatMap((b) => {
    const session = pickOne(b.session);
    if (!session) return [];
    const service = pickOne(session.service);
    const client = pickOne(b.client);
    const clientUser = client ? pickOne(client.user) : null;

    const startsAt = new Date(session.starts_at);
    const endsAt = new Date(startsAt.getTime() + session.duration_min * 60_000);
    const isLive =
      now >= startsAt.getTime() && now < endsAt.getTime() && b.status === "confirmed";

    return [
      {
        bookingId: b.id,
        sessionId: session.id,
        startsAt: session.starts_at,
        dateLabel: formatDate(startsAt),
        timeLabel: formatTime(startsAt),
        client: clientUser?.name ?? "Unknown",
        clientHue: clientUser?.avatar_hue ?? 195,
        service: service?.name ?? "Service",
        serviceHue: service?.hue ?? 195,
        mode: (service?.mode as "solo" | "group") ?? "solo",
        duration: session.duration_min,
        durationLabel: formatDuration(session.duration_min),
        credits: b.credits_charged,
        status: (isLive ? "now" : b.status) as AdminBookingStatus,
      },
    ];
  });

  return { rows, error: null };
}

// ─────────── Stats ───────────

export type AdminBookingStats = {
  confirmedNext7d: number;
  pendingCount: number;
  hoursThisWeek: number;
  creditsThisWeek: number;
};

const EMPTY_STATS: AdminBookingStats = {
  confirmedNext7d: 0,
  pendingCount: 0,
  hoursThisWeek: 0,
  creditsThisWeek: 0,
};

type StatsState = {
  stats: AdminBookingStats;
  loading: boolean;
  error: string | null;
};

export function useAdminBookingStats(args: {
  studioId: string | undefined;
  adminMemberId: string | undefined;
}) {
  const { studioId, adminMemberId } = args;
  const [state, setState] = useState<StatsState>(() => ({
    stats: EMPTY_STATS,
    loading: Boolean(studioId && adminMemberId),
    error: null,
  }));

  useEffect(() => {
    if (!studioId || !adminMemberId) return;
    let cancelled = false;
    fetchStats(studioId, adminMemberId).then((result) => {
      if (cancelled) return;
      setState({ ...result, loading: false });
    });
    return () => {
      cancelled = true;
    };
  }, [studioId, adminMemberId]);

  return state;
}

async function fetchStats(
  studioId: string,
  adminMemberId: string
): Promise<{ stats: AdminBookingStats; error: string | null }> {
  const supabase = createClient();
  const now = new Date();
  const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const weekStart = startOfWeek(now);
  const weekEnd = endOfWeek(now);

  const [confirmed, pending, weekly] = await Promise.all([
    supabase
      .from("bookings")
      .select("id, session:sessions!bookings_session_id_fkey!inner(starts_at, admin_member_id, studio_id)", {
        count: "exact",
        head: true,
      })
      .eq("session.admin_member_id", adminMemberId)
      .eq("session.studio_id", studioId)
      .eq("status", "confirmed")
      .gte("session.starts_at", now.toISOString())
      .lt("session.starts_at", in7Days.toISOString()),
    supabase
      .from("bookings")
      .select("id, session:sessions!bookings_session_id_fkey!inner(admin_member_id, studio_id, starts_at)", {
        count: "exact",
        head: true,
      })
      .eq("session.admin_member_id", adminMemberId)
      .eq("session.studio_id", studioId)
      .eq("status", "pending")
      .gte("session.starts_at", now.toISOString()),
    supabase
      .from("bookings")
      .select(
        `
          credits_charged,
          session:sessions!bookings_session_id_fkey!inner(
            starts_at, duration_min, admin_member_id, studio_id
          )
        `
      )
      .eq("session.admin_member_id", adminMemberId)
      .eq("session.studio_id", studioId)
      .in("status", ["confirmed", "attended"])
      .gte("session.starts_at", weekStart.toISOString())
      .lt("session.starts_at", weekEnd.toISOString()),
  ]);

  if (confirmed.error || pending.error || weekly.error) {
    return {
      stats: EMPTY_STATS,
      error:
        confirmed.error?.message ??
        pending.error?.message ??
        weekly.error?.message ??
        "Failed to load stats",
    };
  }

  let minutes = 0;
  let credits = 0;
  for (const row of weekly.data ?? []) {
    const session = pickOne(row.session);
    if (!session) continue;
    minutes += session.duration_min;
    credits += row.credits_charged;
  }

  return {
    stats: {
      confirmedNext7d: confirmed.count ?? 0,
      pendingCount: pending.count ?? 0,
      hoursThisWeek: Math.round((minutes / 60) * 10) / 10, // 1 decimal
      creditsThisWeek: credits,
    },
    error: null,
  };
}

// ─────────── Helpers ───────────

function startOfWeek(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  const dow = x.getDay();
  const diffToMon = dow === 0 ? -6 : 1 - dow;
  x.setDate(x.getDate() + diffToMon);
  return x;
}

function endOfWeek(d: Date): Date {
  const x = startOfWeek(d);
  x.setDate(x.getDate() + 7);
  return x;
}

function formatDate(d: Date): string {
  return d.toLocaleDateString(undefined, { day: "numeric", month: "short" });
}

function formatTime(d: Date): string {
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });
}

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

function pickOne<T>(maybe: T | T[] | null | undefined): T | null {
  if (Array.isArray(maybe)) return maybe[0] ?? null;
  return maybe ?? null;
}
