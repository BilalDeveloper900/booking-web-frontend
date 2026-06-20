/**
 * Owner finance data layer.
 *
 * Powers `/owner/finance`. Reads the real ledger:
 *  • Incoming  — succeeded client `payments` (top-ups, memberships, manual sales)
 *  • Outgoing  — `payouts` marked paid
 *  • Owed      — commission the owner owes admins on delivered sessions
 *                (service gross_price_cents × the admin's commission_pct)
 *
 * All amounts are in cents; the screen formats them with the studio currency.
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
function startOfMonth(d: Date): Date {
  const x = startOfDay(d);
  x.setDate(1);
  return x;
}
function addMonths(d: Date, n: number): Date {
  const x = new Date(d);
  x.setMonth(x.getMonth() + n);
  return x;
}
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function pickOne<T>(maybe: T | T[] | null | undefined): T | null {
  if (Array.isArray(maybe)) return maybe[0] ?? null;
  return maybe ?? null;
}

/** Client money lands as these payment types (excludes saas_subscription = the owner paying us). */
const CLIENT_INCOME_TYPES = new Set(["client_topup", "client_subscription", "manual"]);
const FLOW_MONTHS = 6;

// ─────────── Types ───────────

export type FinanceFlowMonth = { month: string; incomingCents: number; outgoingCents: number };
export type FinanceMixSegment = { name: string; cents: number; pct: number };
export type FinanceAdminOwed = {
  memberId: string;
  name: string;
  hue: number;
  sessions: number;
  ratePct: number;
  payoutCents: number;
};
export type FinanceTxn = {
  id: string;
  date: string;
  description: string;
  kind: "in" | "out";
  amountCents: number;
};

export type OwnerFinance = {
  incomingCents: number;
  outgoingCents: number;
  netCents: number;
  pendingPayoutCents: number;
  flow: FinanceFlowMonth[];
  mix: FinanceMixSegment[];
  adminPayouts: FinanceAdminOwed[];
  recent: FinanceTxn[];
};

function blankFlow(): FinanceFlowMonth[] {
  const now = new Date();
  return Array.from({ length: FLOW_MONTHS }, (_, i) => {
    const d = addMonths(startOfMonth(now), -(FLOW_MONTHS - 1 - i));
    return { month: MONTHS[d.getMonth()], incomingCents: 0, outgoingCents: 0 };
  });
}

const EMPTY: OwnerFinance = {
  incomingCents: 0,
  outgoingCents: 0,
  netCents: 0,
  pendingPayoutCents: 0,
  flow: blankFlow(),
  mix: [],
  adminPayouts: [],
  recent: [],
};

type State = { data: OwnerFinance; loading: boolean; error: string | null };

export function useOwnerFinance(studioId: string | undefined) {
  const [state, setState] = useState<State>(() => ({
    data: EMPTY,
    loading: Boolean(studioId),
    error: null,
  }));

  useEffect(() => {
    if (!studioId) return;
    let cancelled = false;
    fetchFinance(studioId).then((result) => {
      if (cancelled) return;
      setState({ ...result, loading: false });
    });
    return () => {
      cancelled = true;
    };
  }, [studioId]);

  return state;
}

type SessionRow = {
  admin_member_id: string;
  service: { gross_price_cents: number } | Array<{ gross_price_cents: number }> | null;
  bookings: Array<{ status: string }> | null;
};

async function fetchFinance(
  studioId: string
): Promise<{ data: OwnerFinance; error: string | null }> {
  const supabase = createClient();
  const now = new Date();
  const monthStart = startOfMonth(now);
  const windowStart = addMonths(monthStart, -(FLOW_MONTHS - 1));

  const [paymentsRes, payoutsRes, adminsRes, sessionsRes] = await Promise.all([
    // Client payments over the 6-month flow window.
    supabase
      .from("payments")
      .select("id, created_at, amount_cents, type, status, description")
      .eq("studio_id", studioId)
      .eq("status", "succeeded")
      .gte("created_at", windowStart.toISOString())
      .order("created_at", { ascending: false }),
    // Payouts (outgoing) over the same window.
    supabase
      .from("payouts")
      .select("id, net_cents, status, paid_at, admin_member_id")
      .eq("studio_id", studioId)
      .gte("paid_at", windowStart.toISOString()),
    // Admins + their commission rate.
    supabase
      .from("studio_members")
      .select("id, commission_pct, user:users!studio_members_user_id_fkey(name, avatar_hue)")
      .eq("studio_id", studioId)
      .eq("role", "admin")
      .eq("status", "active"),
    // Delivered (started) non-cancelled sessions this month → owed commission.
    supabase
      .from("sessions")
      .select(
        `admin_member_id,
         service:services!sessions_service_id_fkey(gross_price_cents),
         bookings(status)`
      )
      .eq("studio_id", studioId)
      .neq("status", "cancelled")
      .gte("starts_at", monthStart.toISOString())
      .lte("starts_at", now.toISOString()),
  ]);

  const firstError =
    paymentsRes.error?.message ??
    payoutsRes.error?.message ??
    adminsRes.error?.message ??
    sessionsRes.error?.message ??
    null;
  if (firstError) return { data: EMPTY, error: firstError };

  const payments = (paymentsRes.data ?? []).filter((p) => CLIENT_INCOME_TYPES.has(p.type));
  const payouts = payoutsRes.data ?? [];

  // ── Flow buckets (6 months) ──
  const flow = blankFlow();
  function bucketIdx(d: Date): number {
    return (d.getFullYear() - windowStart.getFullYear()) * 12 + d.getMonth() - windowStart.getMonth();
  }
  for (const p of payments) {
    const idx = bucketIdx(new Date(p.created_at));
    if (idx >= 0 && idx < FLOW_MONTHS) flow[idx].incomingCents += p.amount_cents ?? 0;
  }
  for (const po of payouts) {
    if (po.status !== "paid" || !po.paid_at) continue;
    const idx = bucketIdx(new Date(po.paid_at));
    if (idx >= 0 && idx < FLOW_MONTHS) flow[idx].outgoingCents += po.net_cents ?? 0;
  }

  // ── Month totals ──
  const monthPayments = payments.filter((p) => new Date(p.created_at) >= monthStart);
  const incomingCents = monthPayments.reduce((s, p) => s + (p.amount_cents ?? 0), 0);
  const outgoingCents = payouts
    .filter((po) => po.status === "paid" && po.paid_at && new Date(po.paid_at) >= monthStart)
    .reduce((s, po) => s + (po.net_cents ?? 0), 0);

  // ── Revenue mix (this month, by stream) ──
  let membershipCents = 0;
  let topupCents = 0;
  for (const p of monthPayments) {
    if (p.type === "client_subscription") membershipCents += p.amount_cents ?? 0;
    else topupCents += p.amount_cents ?? 0; // client_topup + manual
  }
  const mixTotal = membershipCents + topupCents || 1;
  const mix: FinanceMixSegment[] = [
    { name: "Memberships", cents: membershipCents, pct: Math.round((membershipCents / mixTotal) * 100) },
    { name: "Credit top-ups", cents: topupCents, pct: Math.round((topupCents / mixTotal) * 100) },
  ].filter((s) => s.cents > 0);

  // ── Owed per admin (commission on delivered sessions this month) ──
  const admins = adminsRes.data ?? [];
  const owedByAdmin = new Map<string, { sessions: number; grossCents: number }>();
  for (const s of (sessionsRes.data ?? []) as SessionRow[]) {
    const hasActiveBooking = (s.bookings ?? []).some((b) => b.status !== "cancelled");
    if (!hasActiveBooking) continue; // only sessions that actually earned
    const gross = pickOne(s.service)?.gross_price_cents ?? 0;
    const active = (s.bookings ?? []).filter((b) => b.status !== "cancelled").length;
    const cur = owedByAdmin.get(s.admin_member_id) ?? { sessions: 0, grossCents: 0 };
    cur.sessions += 1;
    cur.grossCents += gross * active; // each attendee pays the service price
    owedByAdmin.set(s.admin_member_id, cur);
  }

  const adminPayouts: FinanceAdminOwed[] = admins
    .map((a) => {
      const u = pickOne(a.user);
      const agg = owedByAdmin.get(a.id) ?? { sessions: 0, grossCents: 0 };
      const ratePct = a.commission_pct ?? 0;
      return {
        memberId: a.id,
        name: u?.name ?? "Admin",
        hue: u?.avatar_hue ?? 195,
        sessions: agg.sessions,
        ratePct,
        payoutCents: Math.round((agg.grossCents * ratePct) / 100),
      };
    })
    .sort((a, b) => b.payoutCents - a.payoutCents);

  const pendingPayoutCents = adminPayouts.reduce((s, a) => s + a.payoutCents, 0);

  // ── Recent transactions (income + outflow merged) ──
  const recentIn: FinanceTxn[] = payments.slice(0, 8).map((p) => ({
    id: p.id,
    date: p.created_at,
    description: p.description ?? "Payment",
    kind: "in" as const,
    amountCents: p.amount_cents ?? 0,
  }));
  const recentOut: FinanceTxn[] = payouts
    .filter((po) => po.status === "paid" && po.paid_at)
    .map((po) => ({
      id: po.id,
      date: po.paid_at as string,
      description: "Admin payout",
      kind: "out" as const,
      amountCents: po.net_cents ?? 0,
    }));
  const recent = [...recentIn, ...recentOut]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 8);

  return {
    data: {
      incomingCents,
      outgoingCents,
      netCents: incomingCents - outgoingCents,
      pendingPayoutCents,
      flow,
      mix,
      adminPayouts,
      recent,
    },
    error: null,
  };
}
