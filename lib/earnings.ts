/**
 * Admin earnings data layer.
 *
 * Powers `/admin/earnings`. An admin earns a commission on every session they
 * deliver: commission base = the service's gross price
 * (`services.gross_price_cents`) × the admin's `commission_pct`. We read
 * delivered (non-cancelled, already-started) bookings for the admin and derive
 * the statement, weekly bars, service mix, and month totals from the same set.
 *
 * v1: the app is the ledger + report — it computes what the owner owes the
 * admin; it does not move money. (No payout records yet, so "owed" == earned.)
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
function startOfWeek(d: Date): Date {
  const x = startOfDay(d);
  const dow = x.getDay(); // 0=Sun..6=Sat
  x.setDate(x.getDate() + (dow === 0 ? -6 : 1 - dow));
  return x;
}
function startOfMonth(d: Date): Date {
  const x = startOfDay(d);
  x.setDate(1);
  return x;
}
function addDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function pickOne<T>(maybe: T | T[] | null | undefined): T | null {
  if (Array.isArray(maybe)) return maybe[0] ?? null;
  return maybe ?? null;
}

const WEEKS = 8;

// ─────────── Types ───────────

export type EarningRow = {
  bookingId: string;
  date: string; // ISO
  clientName: string;
  clientHue: number;
  serviceName: string;
  credits: number;
  grossCents: number;
  commissionPct: number;
  netCents: number;
};

export type EarningsServiceMix = {
  service: string;
  sessions: number;
  revenueCents: number; // net to the admin
  pct: number; // share of net
};

export type EarningsWeek = { week: string; earnedCents: number };

export type AdminEarnings = {
  commissionPct: number;
  earnedMTDCents: number;
  sessionsMTD: number;
  clientsMTD: number;
  avgPerSessionCents: number;
  statement: EarningRow[];
  weekly: EarningsWeek[];
  serviceMix: EarningsServiceMix[];
};

const EMPTY: AdminEarnings = {
  commissionPct: 0,
  earnedMTDCents: 0,
  sessionsMTD: 0,
  clientsMTD: 0,
  avgPerSessionCents: 0,
  statement: [],
  weekly: [],
  serviceMix: [],
};

type State = { data: AdminEarnings; loading: boolean; error: string | null };

export function useAdminEarnings(args: {
  studioId: string | undefined;
  adminMemberId: string | undefined;
}) {
  const { studioId, adminMemberId } = args;
  const [state, setState] = useState<State>(() => ({
    data: EMPTY,
    loading: Boolean(studioId && adminMemberId),
    error: null,
  }));

  useEffect(() => {
    if (!studioId || !adminMemberId) return;
    let cancelled = false;
    fetchEarnings(studioId, adminMemberId).then((result) => {
      if (cancelled) return;
      setState({ ...result, loading: false });
    });
    return () => {
      cancelled = true;
    };
  }, [studioId, adminMemberId]);

  return state;
}

type SessionRow = {
  id: string;
  starts_at: string;
  service:
    | { name: string; gross_price_cents: number }
    | Array<{ name: string; gross_price_cents: number }>
    | null;
  bookings: Array<{
    id: string;
    status: string;
    credits_charged: number;
    client:
      | { user: { name: string; avatar_hue: number } | Array<{ name: string; avatar_hue: number }> | null }
      | Array<{ user: { name: string; avatar_hue: number } | Array<{ name: string; avatar_hue: number }> | null }>
      | null;
  }> | null;
};

async function fetchEarnings(
  studioId: string,
  adminMemberId: string
): Promise<{ data: AdminEarnings; error: string | null }> {
  const supabase = createClient();
  const now = new Date();
  const windowStart = addDays(startOfWeek(now), -(WEEKS - 1) * 7);
  const monthStart = startOfMonth(now);

  // The admin's commission rate.
  const { data: me, error: meErr } = await supabase
    .from("studio_members")
    .select("commission_pct")
    .eq("id", adminMemberId)
    .maybeSingle();
  if (meErr) return { data: EMPTY, error: meErr.message };
  const pct = me?.commission_pct ?? 0;

  // Delivered (started) non-cancelled sessions in the 8-week window.
  const { data, error } = await supabase
    .from("sessions")
    .select(
      `
        id, starts_at,
        service:services!sessions_service_id_fkey(name, gross_price_cents),
        bookings(
          id, status, credits_charged,
          client:studio_members!bookings_client_member_id_fkey(
            user:users!studio_members_user_id_fkey(name, avatar_hue)
          )
        )
      `
    )
    .eq("studio_id", studioId)
    .eq("admin_member_id", adminMemberId)
    .neq("status", "cancelled")
    .gte("starts_at", windowStart.toISOString())
    .lte("starts_at", now.toISOString())
    .order("starts_at", { ascending: false });

  if (error) return { data: EMPTY, error: error.message };

  // Flatten to per-booking earning rows.
  const rows: EarningRow[] = [];
  for (const s of (data ?? []) as SessionRow[]) {
    const service = pickOne(s.service);
    const grossCents = service?.gross_price_cents ?? 0;
    for (const b of s.bookings ?? []) {
      if (b.status === "cancelled") continue;
      const clientUser = pickOne(pickOne(b.client)?.user ?? null);
      rows.push({
        bookingId: b.id,
        date: s.starts_at,
        clientName: clientUser?.name ?? "Client",
        clientHue: clientUser?.avatar_hue ?? 195,
        serviceName: service?.name ?? "Service",
        credits: b.credits_charged ?? 0,
        grossCents,
        commissionPct: pct,
        netCents: Math.round((grossCents * pct) / 100),
      });
    }
  }

  // Month subset.
  const monthRows = rows.filter((r) => new Date(r.date) >= monthStart);
  const earnedMTDCents = monthRows.reduce((s, r) => s + r.netCents, 0);
  const monthSessions = new Set(
    monthRows.map((r) => r.bookingId) // distinct bookings == delivered slots
  );
  const monthClients = new Set(monthRows.map((r) => r.clientName));
  const sessionsMTD = monthSessions.size;
  const avgPerSessionCents = sessionsMTD > 0 ? Math.round(earnedMTDCents / sessionsMTD) : 0;

  // Service mix (net share) for the month.
  const mixMap = new Map<string, { sessions: number; revenueCents: number }>();
  for (const r of monthRows) {
    const cur = mixMap.get(r.serviceName) ?? { sessions: 0, revenueCents: 0 };
    cur.sessions += 1;
    cur.revenueCents += r.netCents;
    mixMap.set(r.serviceName, cur);
  }
  const mixTotal = monthRows.reduce((s, r) => s + r.netCents, 0) || 1;
  const serviceMix: EarningsServiceMix[] = Array.from(mixMap.entries())
    .map(([service, v]) => ({
      service,
      sessions: v.sessions,
      revenueCents: v.revenueCents,
      pct: Math.round((v.revenueCents / mixTotal) * 100),
    }))
    .sort((a, b) => b.revenueCents - a.revenueCents);

  // Weekly bars over the 8-week window.
  const buckets = new Array(WEEKS).fill(0) as number[];
  for (const r of rows) {
    const idx = Math.floor((new Date(r.date).getTime() - windowStart.getTime()) / (7 * 86_400_000));
    if (idx >= 0 && idx < WEEKS) buckets[idx] += r.netCents;
  }
  const weekly: EarningsWeek[] = buckets.map((earnedCents, i) => {
    const ws = addDays(windowStart, i * 7);
    return { week: `${ws.getDate()} ${MONTHS[ws.getMonth()]}`, earnedCents };
  });

  return {
    data: {
      commissionPct: pct,
      earnedMTDCents,
      sessionsMTD,
      clientsMTD: monthClients.size,
      avgPerSessionCents,
      statement: monthRows.slice(0, 60),
      weekly,
      serviceMix,
    },
    error: null,
  };
}
