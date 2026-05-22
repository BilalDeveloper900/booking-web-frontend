/**
 * Owner overview data layer.
 *
 * Hooks that power the `/owner` dashboard. All queries scope to the owner's
 * studio_id; RLS enforces visibility (owners can read payments + subs;
 * any member can read sessions/bookings).
 *
 * - `useOwnerOverviewStats`   — revenue, bookings, subscribers, credits this month + WoW deltas
 * - `useOwnerToday`           — today's schedule across all admins
 * - `useOwnerAdminPerformance` — top admins by sessions MTD (+ revenue & utilization)
 * - `useOwnerRevenueMonths`   — last 12 months of revenue split by stream
 * - `useOwnerSubscriptionHealth` — counts per plan + churn proxy + MRR estimate
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

function addMonths(d: Date, n: number): Date {
  const x = new Date(d);
  x.setMonth(x.getMonth() + n);
  return x;
}

function fmtTime(d: Date): string {
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });
}

function pickOne<T>(maybe: T | T[] | null | undefined): T | null {
  if (Array.isArray(maybe)) return maybe[0] ?? null;
  return maybe ?? null;
}

// ─────────── Overview stats ───────────

export type OwnerOverviewStats = {
  revenueCents: number;
  revenueDeltaPct: number | null;
  bookingsCount: number;
  bookingsDeltaPct: number | null;
  activeSubscribers: number;
  newSubscribersMTD: number;
  creditsSold: number;
  creditsSoldDeltaPct: number | null;
};

const EMPTY_STATS: OwnerOverviewStats = {
  revenueCents: 0,
  revenueDeltaPct: null,
  bookingsCount: 0,
  bookingsDeltaPct: null,
  activeSubscribers: 0,
  newSubscribersMTD: 0,
  creditsSold: 0,
  creditsSoldDeltaPct: null,
};

type StatsState = {
  stats: OwnerOverviewStats;
  loading: boolean;
  error: string | null;
};

export function useOwnerOverviewStats(studioId: string | undefined) {
  const [state, setState] = useState<StatsState>(() => ({
    stats: EMPTY_STATS,
    loading: Boolean(studioId),
    error: null,
  }));

  useEffect(() => {
    if (!studioId) return;
    let cancelled = false;
    fetchStats(studioId).then((result) => {
      if (cancelled) return;
      setState({ ...result, loading: false });
    });
    return () => {
      cancelled = true;
    };
  }, [studioId]);

  return state;
}

async function fetchStats(
  studioId: string
): Promise<{ stats: OwnerOverviewStats; error: string | null }> {
  const supabase = createClient();
  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);
  const prevMonthStart = addMonths(monthStart, -1);
  const prevMonthEnd = monthStart;

  // 1) Revenue this month + last month (payments scoped to studio).
  const [revThis, revPrev] = await Promise.all([
    supabase
      .from("payments")
      .select("amount_cents")
      .eq("studio_id", studioId)
      .eq("status", "succeeded")
      .gte("created_at", monthStart.toISOString())
      .lt("created_at", monthEnd.toISOString()),
    supabase
      .from("payments")
      .select("amount_cents")
      .eq("studio_id", studioId)
      .eq("status", "succeeded")
      .gte("created_at", prevMonthStart.toISOString())
      .lt("created_at", prevMonthEnd.toISOString()),
  ]);

  const revenueCents = sumCents(revThis.data);
  const revenuePrevCents = sumCents(revPrev.data);

  // 2) Bookings this month + last month. Bookings have no studio_id —
  // filter via the embedded session.studio_id with !inner.
  const [bkThis, bkPrev] = await Promise.all([
    supabase
      .from("bookings")
      .select("id, session:sessions!inner(studio_id)", { count: "exact", head: true })
      .eq("session.studio_id", studioId)
      .neq("status", "cancelled")
      .gte("booked_at", monthStart.toISOString())
      .lt("booked_at", monthEnd.toISOString()),
    supabase
      .from("bookings")
      .select("id, session:sessions!inner(studio_id)", { count: "exact", head: true })
      .eq("session.studio_id", studioId)
      .neq("status", "cancelled")
      .gte("booked_at", prevMonthStart.toISOString())
      .lt("booked_at", prevMonthEnd.toISOString()),
  ]);

  // 3) Active subscribers + new this month. Subscriptions belong to a
  // studio_member — filter on the embedded member.studio_id.
  const [activeSubs, newSubs] = await Promise.all([
    supabase
      .from("client_subscriptions")
      .select("id, member:studio_members!inner(studio_id)", {
        count: "exact",
        head: true,
      })
      .eq("member.studio_id", studioId)
      .eq("status", "active"),
    supabase
      .from("client_subscriptions")
      .select("id, member:studio_members!inner(studio_id)", {
        count: "exact",
        head: true,
      })
      .eq("member.studio_id", studioId)
      .gte("started_at", monthStart.toISOString())
      .lt("started_at", monthEnd.toISOString()),
  ]);

  // 4) Credits sold (positive credit_transactions of type 'topup').
  const [crThis, crPrev] = await Promise.all([
    supabase
      .from("credit_transactions")
      .select("delta, member:studio_members!inner(studio_id)")
      .eq("member.studio_id", studioId)
      .eq("type", "topup")
      .gte("created_at", monthStart.toISOString())
      .lt("created_at", monthEnd.toISOString()),
    supabase
      .from("credit_transactions")
      .select("delta, member:studio_members!inner(studio_id)")
      .eq("member.studio_id", studioId)
      .eq("type", "topup")
      .gte("created_at", prevMonthStart.toISOString())
      .lt("created_at", prevMonthEnd.toISOString()),
  ]);

  const creditsSold = sumDelta(crThis.data);
  const creditsSoldPrev = sumDelta(crPrev.data);

  const firstError =
    revThis.error?.message ??
    revPrev.error?.message ??
    bkThis.error?.message ??
    bkPrev.error?.message ??
    activeSubs.error?.message ??
    newSubs.error?.message ??
    crThis.error?.message ??
    crPrev.error?.message ??
    null;

  return {
    stats: {
      revenueCents,
      revenueDeltaPct: pctDelta(revenueCents, revenuePrevCents),
      bookingsCount: bkThis.count ?? 0,
      bookingsDeltaPct: pctDelta(bkThis.count ?? 0, bkPrev.count ?? 0),
      activeSubscribers: activeSubs.count ?? 0,
      newSubscribersMTD: newSubs.count ?? 0,
      creditsSold,
      creditsSoldDeltaPct: pctDelta(creditsSold, creditsSoldPrev),
    },
    error: firstError,
  };
}

function sumCents(rows: { amount_cents: number }[] | null): number {
  if (!rows) return 0;
  return rows.reduce((sum, r) => sum + (r.amount_cents ?? 0), 0);
}

function sumDelta(rows: { delta: number }[] | null): number {
  if (!rows) return 0;
  return rows.reduce((sum, r) => sum + (r.delta ?? 0), 0);
}

function pctDelta(current: number, previous: number): number | null {
  if (previous === 0) return current === 0 ? 0 : null;
  return ((current - previous) / previous) * 100;
}

// ─────────── Today's schedule ───────────

export type OwnerTodaySession = {
  sessionId: string;
  time: string;
  duration: number;
  service: string;
  hue: number;
  status: "done" | "now" | "next" | "upcoming";
  mode: "solo" | "group";
  adminName: string;
  client?: string;
  clientHue?: number;
  capacity?: number;
  attendees: number;
};

type TodayState = {
  items: OwnerTodaySession[];
  loading: boolean;
  error: string | null;
};

export function useOwnerToday(studioId: string | undefined) {
  const [state, setState] = useState<TodayState>(() => ({
    items: [],
    loading: Boolean(studioId),
    error: null,
  }));

  useEffect(() => {
    if (!studioId) return;
    let cancelled = false;
    fetchToday(studioId).then((result) => {
      if (cancelled) return;
      setState({ ...result, loading: false });
    });
    return () => {
      cancelled = true;
    };
  }, [studioId]);

  return state;
}

async function fetchToday(
  studioId: string
): Promise<{ items: OwnerTodaySession[]; error: string | null }> {
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
        service:services!sessions_service_id_fkey(name, mode, hue),
        admin:studio_members!sessions_admin_member_id_fkey(
          user:users!studio_members_user_id_fkey(name)
        ),
        bookings(
          status,
          client:studio_members!bookings_client_member_id_fkey(
            user:users!studio_members_user_id_fkey(name, avatar_hue)
          )
        )
      `
    )
    .eq("studio_id", studioId)
    .gte("starts_at", dayStart.toISOString())
    .lte("starts_at", dayEnd.toISOString())
    .neq("status", "cancelled")
    .order("starts_at", { ascending: true });

  if (error) return { items: [], error: error.message };

  const rows = (data ?? []) as TodayRow[];

  let nextFlagged = false;
  const items: OwnerTodaySession[] = rows.map((row) => {
    const service = pickOne(row.service);
    const admin = pickOne(row.admin);
    const adminUser = admin ? pickOne(admin.user) : null;
    const startsAt = new Date(row.starts_at);
    const endsAt = new Date(startsAt.getTime() + row.duration_min * 60_000);
    const isPast = endsAt.getTime() <= now.getTime();
    const isNow =
      now.getTime() >= startsAt.getTime() && now.getTime() < endsAt.getTime();

    let status: OwnerTodaySession["status"];
    if (isNow) status = "now";
    else if (isPast) status = "done";
    else if (!nextFlagged) {
      status = "next";
      nextFlagged = true;
    } else status = "upcoming";

    const activeBookings = (row.bookings ?? []).filter(
      (b) => b.status !== "cancelled"
    );
    const firstClient = activeBookings[0]
      ? pickOne(pickOne(activeBookings[0].client)?.user ?? null)
      : null;

    const isGroup = service?.mode === "group";

    return {
      sessionId: row.id,
      time: fmtTime(startsAt),
      duration: row.duration_min,
      service: service?.name ?? "Service",
      hue: service?.hue ?? 195,
      status,
      mode: (service?.mode as "solo" | "group") ?? "solo",
      adminName: adminUser?.name ?? "—",
      client: isGroup ? undefined : firstClient?.name ?? "(open slot)",
      clientHue: isGroup ? undefined : firstClient?.avatar_hue,
      capacity: isGroup ? row.capacity : undefined,
      attendees: activeBookings.length,
    };
  });

  return { items, error: null };
}

// ─────────── Admin performance ───────────

export type OwnerAdminPerformance = {
  memberId: string;
  name: string;
  hue: number;
  role: string;
  sessionsMTD: number;
  bookingsMTD: number;
  utilizationPct: number; // bookings / capacity slots
  earnedCentsMTD: number;
};

type PerfState = {
  items: OwnerAdminPerformance[];
  loading: boolean;
  error: string | null;
};

export function useOwnerAdminPerformance(studioId: string | undefined) {
  const [state, setState] = useState<PerfState>(() => ({
    items: [],
    loading: Boolean(studioId),
    error: null,
  }));

  useEffect(() => {
    if (!studioId) return;
    let cancelled = false;
    fetchAdminPerformance(studioId).then((result) => {
      if (cancelled) return;
      setState({ ...result, loading: false });
    });
    return () => {
      cancelled = true;
    };
  }, [studioId]);

  return state;
}

async function fetchAdminPerformance(
  studioId: string
): Promise<{ items: OwnerAdminPerformance[]; error: string | null }> {
  const supabase = createClient();
  const monthStart = startOfMonth(new Date());
  const monthEnd = endOfMonth(new Date());

  // 1) Pull admins + their specialty.
  const { data: admins, error: adminsErr } = await supabase
    .from("studio_members")
    .select(
      `id, role, commission_pct, specialty, user:users!studio_members_user_id_fkey(name, avatar_hue)`
    )
    .eq("studio_id", studioId)
    .eq("role", "admin")
    .eq("status", "active");

  if (adminsErr) return { items: [], error: adminsErr.message };
  if (!admins || admins.length === 0) return { items: [], error: null };

  // 2) Sessions this month per admin (capacity + bookings count).
  const adminIds = admins.map((a) => a.id);
  const { data: sessions, error: sessErr } = await supabase
    .from("sessions")
    .select(
      `
        id,
        admin_member_id,
        capacity,
        bookings(status, credits_charged, service_price_cents:credits_charged)
      `
    )
    .eq("studio_id", studioId)
    .in("admin_member_id", adminIds)
    .gte("starts_at", monthStart.toISOString())
    .lt("starts_at", monthEnd.toISOString())
    .neq("status", "cancelled");

  if (sessErr) return { items: [], error: sessErr.message };

  type Agg = {
    sessionsCount: number;
    bookingsCount: number;
    capacitySum: number;
    creditsSpent: number;
  };
  const agg = new Map<string, Agg>();
  for (const a of admins) agg.set(a.id, { sessionsCount: 0, bookingsCount: 0, capacitySum: 0, creditsSpent: 0 });

  for (const s of sessions ?? []) {
    const cur = agg.get(s.admin_member_id);
    if (!cur) continue;
    cur.sessionsCount += 1;
    cur.capacitySum += s.capacity ?? 1;
    const active = (s.bookings ?? []).filter((b) => b.status !== "cancelled");
    cur.bookingsCount += active.length;
    cur.creditsSpent += active.reduce((sum, b) => sum + (b.credits_charged ?? 0), 0);
  }

  const items: OwnerAdminPerformance[] = admins
    .map((a) => {
      const u = Array.isArray(a.user) ? a.user[0] : a.user;
      const stats = agg.get(a.id) ?? { sessionsCount: 0, bookingsCount: 0, capacitySum: 0, creditsSpent: 0 };
      const util =
        stats.capacitySum > 0
          ? Math.min(100, Math.round((stats.bookingsCount / stats.capacitySum) * 100))
          : 0;
      // Earnings proxy: credits spent * commission% (rough; no real EUR rate
      // yet because credits are out-of-platform in v1). Treat 1 credit = 100¢
      // so the number renders sensibly when payments are empty.
      const creditValueCents = stats.creditsSpent * 100;
      const earnedCentsMTD = Math.round(creditValueCents * ((a.commission_pct ?? 0) / 100));
      return {
        memberId: a.id,
        name: u?.name ?? "Admin",
        hue: u?.avatar_hue ?? 195,
        role: a.specialty ?? "Admin",
        sessionsMTD: stats.sessionsCount,
        bookingsMTD: stats.bookingsCount,
        utilizationPct: util,
        earnedCentsMTD,
      };
    })
    .sort((a, b) => b.bookingsMTD - a.bookingsMTD);

  return { items, error: null };
}

// ─────────── Revenue last 12 months ───────────

export type OwnerRevenueMonth = {
  month: string;           // "Jun"
  subs: number;            // cents
  credits: number;         // cents
  total: number;           // cents
};

type RevState = {
  data: OwnerRevenueMonth[];
  loading: boolean;
  error: string | null;
};

const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"] as const;

export function useOwnerRevenueMonths(studioId: string | undefined) {
  const [state, setState] = useState<RevState>(() => ({
    data: blankRevenueMonths(),
    loading: Boolean(studioId),
    error: null,
  }));

  useEffect(() => {
    if (!studioId) return;
    let cancelled = false;
    fetchRevenueMonths(studioId).then((result) => {
      if (cancelled) return;
      setState({ ...result, loading: false });
    });
    return () => {
      cancelled = true;
    };
  }, [studioId]);

  return state;
}

function blankRevenueMonths(): OwnerRevenueMonth[] {
  const now = new Date();
  return Array.from({ length: 12 }, (_, i) => {
    const d = addMonths(startOfMonth(now), -(11 - i));
    return { month: MONTH_LABELS[d.getMonth()], subs: 0, credits: 0, total: 0 };
  });
}

async function fetchRevenueMonths(
  studioId: string
): Promise<{ data: OwnerRevenueMonth[]; error: string | null }> {
  const supabase = createClient();
  const now = new Date();
  const windowStart = addMonths(startOfMonth(now), -11);
  const windowEnd = endOfMonth(now);

  const { data, error } = await supabase
    .from("payments")
    .select("created_at, amount_cents, type")
    .eq("studio_id", studioId)
    .eq("status", "succeeded")
    .gte("created_at", windowStart.toISOString())
    .lt("created_at", windowEnd.toISOString());

  if (error) return { data: blankRevenueMonths(), error: error.message };

  // Bucket index for each month in the 12-month window: 0 = oldest, 11 = newest.
  function bucketIdx(d: Date): number {
    const years = d.getFullYear() - windowStart.getFullYear();
    return years * 12 + d.getMonth() - windowStart.getMonth();
  }

  const buckets = blankRevenueMonths();
  for (const row of data ?? []) {
    const d = new Date(row.created_at);
    const idx = bucketIdx(d);
    if (idx < 0 || idx > 11) continue;
    const cents = row.amount_cents ?? 0;
    if (row.type === "saas_subscription" || row.type === "client_subscription") {
      buckets[idx].subs += cents;
    } else {
      buckets[idx].credits += cents;
    }
    buckets[idx].total += cents;
  }
  return { data: buckets, error: null };
}

// ─────────── Subscription health ───────────

export type OwnerSubscriptionHealth = {
  byPlan: { planId: string; planName: string; count: number; pct: number }[];
  totalActive: number;
  payAsYouGoCount: number;
  newThisMonth: number;
  cancelledThisMonth: number;
  mrrCents: number;
};

const EMPTY_HEALTH: OwnerSubscriptionHealth = {
  byPlan: [],
  totalActive: 0,
  payAsYouGoCount: 0,
  newThisMonth: 0,
  cancelledThisMonth: 0,
  mrrCents: 0,
};

type HealthState = {
  data: OwnerSubscriptionHealth;
  loading: boolean;
  error: string | null;
};

export function useOwnerSubscriptionHealth(studioId: string | undefined) {
  const [state, setState] = useState<HealthState>(() => ({
    data: EMPTY_HEALTH,
    loading: Boolean(studioId),
    error: null,
  }));

  useEffect(() => {
    if (!studioId) return;
    let cancelled = false;
    fetchSubHealth(studioId).then((result) => {
      if (cancelled) return;
      setState({ ...result, loading: false });
    });
    return () => {
      cancelled = true;
    };
  }, [studioId]);

  return state;
}

async function fetchSubHealth(
  studioId: string
): Promise<{ data: OwnerSubscriptionHealth; error: string | null }> {
  const supabase = createClient();
  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);

  // Active subscriptions with plan info, scoped via the embedded member.studio_id.
  const [active, cancelled, totalClients] = await Promise.all([
    supabase
      .from("client_subscriptions")
      .select(
        `
          id, status, started_at, cancelled_at,
          plan:subscription_plans!client_subscriptions_plan_id_fkey(id, name, price_cents),
          member:studio_members!inner(studio_id)
        `
      )
      .eq("member.studio_id", studioId)
      .eq("status", "active"),
    supabase
      .from("client_subscriptions")
      .select("id, member:studio_members!inner(studio_id)", {
        count: "exact",
        head: true,
      })
      .eq("member.studio_id", studioId)
      .gte("cancelled_at", monthStart.toISOString())
      .lt("cancelled_at", monthEnd.toISOString()),
    supabase
      .from("studio_members")
      .select("id", { count: "exact", head: true })
      .eq("studio_id", studioId)
      .eq("role", "client")
      .eq("status", "active"),
  ]);

  if (active.error) return { data: EMPTY_HEALTH, error: active.error.message };

  type Row = {
    id: string;
    status: string;
    started_at: string;
    plan:
      | { id: string; name: string; price_cents: number }
      | Array<{ id: string; name: string; price_cents: number }>
      | null;
  };
  const rows = (active.data ?? []) as Row[];

  const planCounts = new Map<string, { name: string; count: number }>();
  let mrrCents = 0;
  let newThisMonth = 0;

  for (const r of rows) {
    const p = pickOne(r.plan);
    if (!p) continue;
    const key = p.id;
    const cur = planCounts.get(key) ?? { name: p.name, count: 0 };
    cur.count += 1;
    planCounts.set(key, cur);
    mrrCents += p.price_cents ?? 0;
    if (new Date(r.started_at) >= monthStart) newThisMonth += 1;
  }

  const totalActive = rows.length;
  const totalClientsCount = totalClients.count ?? 0;
  const payAsYouGoCount = Math.max(0, totalClientsCount - totalActive);

  const grandTotal = totalActive + payAsYouGoCount;
  const byPlan = [
    ...Array.from(planCounts.entries()).map(([planId, v]) => ({
      planId,
      planName: v.name,
      count: v.count,
      pct: grandTotal > 0 ? Math.round((v.count / grandTotal) * 100) : 0,
    })),
  ];
  if (payAsYouGoCount > 0) {
    byPlan.push({
      planId: "_payg",
      planName: "Pay-as-you-go",
      count: payAsYouGoCount,
      pct: grandTotal > 0 ? Math.round((payAsYouGoCount / grandTotal) * 100) : 0,
    });
  }

  return {
    data: {
      byPlan,
      totalActive,
      payAsYouGoCount,
      newThisMonth,
      cancelledThisMonth: cancelled.count ?? 0,
      mrrCents,
    },
    error: null,
  };
}

// ─────────── Shared shapes ───────────

type TodayRow = {
  id: string;
  starts_at: string;
  duration_min: number;
  capacity: number;
  status: string;
  service:
    | { name: string; mode: string; hue: number }
    | Array<{ name: string; mode: string; hue: number }>
    | null;
  admin:
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
