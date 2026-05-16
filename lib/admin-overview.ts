/**
 * Admin overview data layer.
 *
 * Hooks that power the `/admin` dashboard. All queries scope to the
 * current admin's member id; RLS does the rest.
 *
 * - `useAdminToday`           — today's sessions with bookings + attendees
 * - `useAdminOverviewStats`   — today / week / sessions-MTD / avg rating
 * - `useAdminWeekSessions`    — count per weekday for the current week
 * - `useAdminMessagePreview`  — top 3 active threads
 */
"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

// ─────────── Date helpers ───────────

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function endOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

function startOfWeek(d: Date): Date {
  const x = startOfDay(d);
  const dow = x.getDay(); // 0=Sun..6=Sat
  const diffToMon = dow === 0 ? -6 : 1 - dow;
  x.setDate(x.getDate() + diffToMon);
  return x;
}

function endOfWeek(d: Date): Date {
  const x = startOfWeek(d);
  x.setDate(x.getDate() + 7);
  return x;
}

function startOfMonth(d: Date): Date {
  const x = startOfDay(d);
  x.setDate(1);
  return x;
}

function endOfMonth(d: Date): Date {
  const x = startOfMonth(d);
  x.setMonth(x.getMonth() + 1);
  return x;
}

function fmtTime(d: Date): string {
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });
}

// ─────────── Today's sessions ───────────

export type AdminTodaySession = {
  sessionId: string;
  time: string;
  duration: number;
  service: string;
  hue: number;
  credits: number;
  status: "done" | "now" | "next" | "upcoming";
  mode: "solo" | "group";
  client?: string;
  clientHue?: number;
  capacity?: number;
  attendees?: string[];
};

type TodayState = {
  items: AdminTodaySession[];
  loading: boolean;
  error: string | null;
};

export function useAdminToday(args: {
  studioId: string | undefined;
  adminMemberId: string | undefined;
}) {
  const { studioId, adminMemberId } = args;
  const [state, setState] = useState<TodayState>(() => ({
    items: [],
    loading: Boolean(studioId && adminMemberId),
    error: null,
  }));

  useEffect(() => {
    if (!studioId || !adminMemberId) return;
    let cancelled = false;
    fetchToday(studioId, adminMemberId).then((result) => {
      if (cancelled) return;
      setState({ ...result, loading: false });
    });
    return () => {
      cancelled = true;
    };
  }, [studioId, adminMemberId]);

  return state;
}

async function fetchToday(
  studioId: string,
  adminMemberId: string
): Promise<{ items: AdminTodaySession[]; error: string | null }> {
  const supabase = createClient();
  const now = new Date();
  const dayStart = startOfDay(now);
  const dayEnd = endOfDay(now);

  const { data, error } = await supabase
    .from("sessions")
    .select(
      `
        id,
        starts_at,
        duration_min,
        capacity,
        status,
        service:services!sessions_service_id_fkey(name, mode, hue, credits_cost),
        bookings(
          status,
          client:studio_members!bookings_client_member_id_fkey(
            user:users!studio_members_user_id_fkey(name, avatar_hue)
          )
        )
      `
    )
    .eq("studio_id", studioId)
    .eq("admin_member_id", adminMemberId)
    .gte("starts_at", dayStart.toISOString())
    .lte("starts_at", dayEnd.toISOString())
    .neq("status", "cancelled")
    .order("starts_at", { ascending: true });

  if (error) return { items: [], error: error.message };

  const rows = (data ?? []) as TodayRow[];

  // Find the earliest "upcoming" so it gets the "next" status pill.
  let nextFlagged = false;
  const items: AdminTodaySession[] = rows.map((row) => {
    const service = pickOne(row.service);
    const startsAt = new Date(row.starts_at);
    const endsAt = new Date(startsAt.getTime() + row.duration_min * 60_000);
    const isPast = endsAt.getTime() <= now.getTime();
    const isNow =
      now.getTime() >= startsAt.getTime() && now.getTime() < endsAt.getTime();

    let status: AdminTodaySession["status"];
    if (isNow) status = "now";
    else if (isPast) status = "done";
    else if (!nextFlagged) {
      status = "next";
      nextFlagged = true;
    } else status = "upcoming";

    const activeBookings = (row.bookings ?? []).filter(
      (b) => b.status !== "cancelled"
    );
    const attendees = activeBookings.map((b) => {
      const c = pickOne(b.client);
      return c ? pickOne(c.user) : null;
    });

    const isGroup = service?.mode === "group";
    const primaryAttendee = pickOne(attendees[0] ?? null);

    return {
      sessionId: row.id,
      time: fmtTime(startsAt),
      duration: row.duration_min,
      service: service?.name ?? "Service",
      hue: service?.hue ?? 195,
      credits: service?.credits_cost ?? 0,
      status,
      mode: (service?.mode as "solo" | "group") ?? "solo",
      client: isGroup ? undefined : primaryAttendee?.name ?? "(open slot)",
      clientHue: isGroup ? undefined : primaryAttendee?.avatar_hue,
      capacity: isGroup ? row.capacity : undefined,
      attendees: isGroup
        ? attendees.filter(Boolean).map((u) => u!.name)
        : undefined,
    };
  });

  return { items, error: null };
}

// ─────────── Overview stats ───────────

export type AdminOverviewStats = {
  todayCount: number;
  weekCount: number;
  sessionsMTD: number;
  avgRating: number | null;
  reviewCount: number;
};

type StatsState = {
  stats: AdminOverviewStats;
  loading: boolean;
  error: string | null;
};

const EMPTY_STATS: AdminOverviewStats = {
  todayCount: 0,
  weekCount: 0,
  sessionsMTD: 0,
  avgRating: null,
  reviewCount: 0,
};

export function useAdminOverviewStats(args: {
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
): Promise<{ stats: AdminOverviewStats; error: string | null }> {
  const supabase = createClient();
  const now = new Date();

  const [today, week, month, reviews] = await Promise.all([
    countSessions(supabase, studioId, adminMemberId, startOfDay(now), endOfDay(now)),
    countSessions(supabase, studioId, adminMemberId, startOfWeek(now), endOfWeek(now)),
    countSessions(supabase, studioId, adminMemberId, startOfMonth(now), endOfMonth(now)),
    supabase
      .from("reviews")
      .select("rating", { count: "exact" })
      .eq("admin_member_id", adminMemberId),
  ]);

  const ratings = reviews.data ?? [];
  const reviewCount = reviews.count ?? ratings.length;
  const avgRating =
    ratings.length === 0
      ? null
      : ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length;

  if (today.error || week.error || month.error || reviews.error) {
    return {
      stats: EMPTY_STATS,
      error:
        today.error?.message ??
        week.error?.message ??
        month.error?.message ??
        reviews.error?.message ??
        "Failed to load stats",
    };
  }

  return {
    stats: {
      todayCount: today.count ?? 0,
      weekCount: week.count ?? 0,
      sessionsMTD: month.count ?? 0,
      avgRating,
      reviewCount,
    },
    error: null,
  };
}

function countSessions(
  supabase: ReturnType<typeof createClient>,
  studioId: string,
  adminMemberId: string,
  from: Date,
  to: Date
) {
  return supabase
    .from("sessions")
    .select("id", { count: "exact", head: true })
    .eq("studio_id", studioId)
    .eq("admin_member_id", adminMemberId)
    .gte("starts_at", from.toISOString())
    .lt("starts_at", to.toISOString())
    .neq("status", "cancelled");
}

// ─────────── Week-by-day session counts (replaces mock earnings bars) ───────────

export type AdminWeekDay = {
  day: string; // "Mon", "Tue", ...
  sessions: number;
};

type WeekState = {
  data: AdminWeekDay[];
  loading: boolean;
  error: string | null;
};

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

export function useAdminWeekSessions(args: {
  studioId: string | undefined;
  adminMemberId: string | undefined;
}) {
  const { studioId, adminMemberId } = args;
  const [state, setState] = useState<WeekState>(() => ({
    data: WEEKDAYS.map((day) => ({ day, sessions: 0 })),
    loading: Boolean(studioId && adminMemberId),
    error: null,
  }));

  useEffect(() => {
    if (!studioId || !adminMemberId) return;
    let cancelled = false;
    fetchWeek(studioId, adminMemberId).then((result) => {
      if (cancelled) return;
      setState({ ...result, loading: false });
    });
    return () => {
      cancelled = true;
    };
  }, [studioId, adminMemberId]);

  return state;
}

async function fetchWeek(
  studioId: string,
  adminMemberId: string
): Promise<{ data: AdminWeekDay[]; error: string | null }> {
  const supabase = createClient();
  const weekStart = startOfWeek(new Date());
  const weekEnd = endOfWeek(new Date());

  const { data, error } = await supabase
    .from("sessions")
    .select("starts_at")
    .eq("studio_id", studioId)
    .eq("admin_member_id", adminMemberId)
    .gte("starts_at", weekStart.toISOString())
    .lt("starts_at", weekEnd.toISOString())
    .neq("status", "cancelled");

  if (error) {
    return {
      data: WEEKDAYS.map((day) => ({ day, sessions: 0 })),
      error: error.message,
    };
  }

  const counts = new Array(7).fill(0) as number[];
  for (const row of data ?? []) {
    const d = new Date(row.starts_at);
    const dow = d.getDay(); // 0=Sun..6=Sat
    const idx = dow === 0 ? 6 : dow - 1; // 0=Mon..6=Sun
    counts[idx] += 1;
  }
  return {
    data: WEEKDAYS.map((day, i) => ({ day, sessions: counts[i] })),
    error: null,
  };
}

// ─────────── Message thread preview ───────────

export type AdminMessagePreview = {
  threadId: string;
  name: string;
  hue: number;
  lastMsg: string;
  time: string;
  unread: number;
};

type PreviewState = {
  threads: AdminMessagePreview[];
  loading: boolean;
  error: string | null;
};

export function useAdminMessagePreview(args: {
  adminMemberId: string | undefined;
  limit?: number;
}) {
  const { adminMemberId, limit = 3 } = args;
  const [state, setState] = useState<PreviewState>(() => ({
    threads: [],
    loading: Boolean(adminMemberId),
    error: null,
  }));

  useEffect(() => {
    if (!adminMemberId) return;
    let cancelled = false;
    fetchMessagePreview(adminMemberId, limit).then((result) => {
      if (cancelled) return;
      setState({ ...result, loading: false });
    });
    return () => {
      cancelled = true;
    };
  }, [adminMemberId, limit]);

  return state;
}

async function fetchMessagePreview(
  adminMemberId: string,
  limit: number
): Promise<{ threads: AdminMessagePreview[]; error: string | null }> {
  const supabase = createClient();

  // 1) Threads I'm in, with my last_read_at
  const { data: mine, error: mineErr } = await supabase
    .from("thread_participants")
    .select("thread_id, last_read_at")
    .eq("member_id", adminMemberId);

  if (mineErr) return { threads: [], error: mineErr.message };
  if (!mine || mine.length === 0) return { threads: [], error: null };

  const lastReadByThread: Record<string, string> = {};
  for (const m of mine) lastReadByThread[m.thread_id] = m.last_read_at;
  const threadIds = mine.map((m) => m.thread_id);

  // 2) Top-N threads by last_message_at, with all participants + recent messages
  const { data: threads, error: threadsErr } = await supabase
    .from("threads")
    .select(
      `
        id,
        last_message_at,
        participants:thread_participants(
          member_id,
          member:studio_members!thread_participants_member_id_fkey(
            id,
            user:users!studio_members_user_id_fkey(name, avatar_hue)
          )
        ),
        messages(body, created_at)
      `
    )
    .in("id", threadIds)
    .order("last_message_at", { ascending: false, nullsFirst: false })
    .limit(limit);

  if (threadsErr) return { threads: [], error: threadsErr.message };

  const previews: AdminMessagePreview[] = (threads ?? []).map((t) => {
    const participants = (t.participants ?? []) as ParticipantRow[];
    const other = participants.find((p) => p.member_id !== adminMemberId);
    const otherMember = other ? pickOne(other.member) : null;
    const otherUser = otherMember ? pickOne(otherMember.user) : null;

    const messages = (t.messages ?? []) as MessageRow[];
    const sorted = [...messages].sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
    const latest = sorted[0];

    const lastRead = lastReadByThread[t.id]
      ? new Date(lastReadByThread[t.id]).getTime()
      : 0;
    const unread = messages.filter(
      (m) => new Date(m.created_at).getTime() > lastRead
    ).length;

    return {
      threadId: t.id,
      name: otherUser?.name ?? "Unknown",
      hue: otherUser?.avatar_hue ?? 195,
      lastMsg: latest?.body ?? "",
      time: latest ? relativeTime(new Date(latest.created_at)) : "",
      unread,
    };
  });

  return { threads: previews, error: null };
}

function relativeTime(d: Date): string {
  const diffMs = Date.now() - d.getTime();
  const diffMin = Math.floor(diffMs / 60_000);
  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 7) return `${diffDay}d ago`;
  return d.toLocaleDateString([], { day: "numeric", month: "short" });
}

// ─────────── Shared shapes ───────────

function pickOne<T>(maybe: T | T[] | null | undefined): T | null {
  if (Array.isArray(maybe)) return maybe[0] ?? null;
  return maybe ?? null;
}

type TodayRow = {
  id: string;
  starts_at: string;
  duration_min: number;
  capacity: number;
  status: string;
  service:
    | { name: string; mode: string; hue: number; credits_cost: number }
    | Array<{ name: string; mode: string; hue: number; credits_cost: number }>
    | null;
  bookings: Array<{
    status: string;
    client:
      | {
          user:
            | { name: string; avatar_hue: number }
            | Array<{ name: string; avatar_hue: number }>
            | null;
        }
      | Array<{
          user:
            | { name: string; avatar_hue: number }
            | Array<{ name: string; avatar_hue: number }>
            | null;
        }>
      | null;
  }> | null;
};

type ParticipantRow = {
  member_id: string;
  member:
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
};

type MessageRow = {
  body: string;
  created_at: string;
};
