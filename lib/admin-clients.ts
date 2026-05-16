/**
 * Admin clients data layer.
 *
 * Hook for `/admin/clients`. Reads from the `admin_client_summary` view,
 * which aggregates per (admin, client) pair. RLS lives on the underlying
 * tables (security_invoker view).
 *
 * Search is client-side over the loaded rows — fine for a typical admin's
 * client list. If it grows past a few hundred, push search into the query.
 */
"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export type AdminClient = {
  clientMemberId: string;
  name: string;
  hue: number;
  visits: number;
  lastVisitLabel: string;
  nextVisitLabel: string;
  favouriteService: string | null;
  totalCreditsCharged: number;
};

type State = {
  clients: AdminClient[];
  loading: boolean;
  error: string | null;
};

export function useAdminClients(args: {
  adminMemberId: string | undefined;
  search?: string;
}) {
  const { adminMemberId, search = "" } = args;
  const [state, setState] = useState<State>(() => ({
    clients: [],
    loading: Boolean(adminMemberId),
    error: null,
  }));

  useEffect(() => {
    if (!adminMemberId) return;
    let cancelled = false;
    fetchClients(adminMemberId).then((result) => {
      if (cancelled) return;
      setState({ ...result, loading: false });
    });
    return () => {
      cancelled = true;
    };
  }, [adminMemberId]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return state.clients;
    return state.clients.filter((c) => c.name.toLowerCase().includes(q));
  }, [state.clients, search]);

  return { ...state, clients: filtered, total: state.clients.length };
}

async function fetchClients(
  adminMemberId: string
): Promise<{ clients: AdminClient[]; error: string | null }> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("admin_client_summary")
    .select("*")
    .eq("admin_member_id", adminMemberId)
    .order("last_visit_at", { ascending: false, nullsFirst: false });

  if (error) return { clients: [], error: error.message };

  const now = new Date();
  const clients: AdminClient[] = (data ?? []).flatMap((row) => {
    if (!row.client_member_id) return [];
    return [
      {
        clientMemberId: row.client_member_id,
        name: row.client_name ?? "Unknown",
        hue: row.client_hue ?? 195,
        visits: row.visits ?? 0,
        lastVisitLabel: relativePast(row.last_visit_at, now),
        nextVisitLabel: relativeFuture(row.next_visit_at, now),
        favouriteService: row.favourite_service,
        totalCreditsCharged: row.total_credits_charged ?? 0,
      },
    ];
  });

  return { clients, error: null };
}

// ─────────── Date helpers ───────────

function relativePast(iso: string | null, now: Date): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (sameDay(d, now)) return "Today";
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (sameDay(d, yesterday)) return "Yesterday";

  const diffDays = Math.floor((now.getTime() - d.getTime()) / DAY_MS);
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return weeks === 1 ? "1 week ago" : `${weeks} weeks ago`;
  }
  if (diffDays < 365) {
    const months = Math.floor(diffDays / 30);
    return months === 1 ? "1 month ago" : `${months} months ago`;
  }
  return d.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

function relativeFuture(iso: string | null, now: Date): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (sameDay(d, now)) return "Today";
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  if (sameDay(d, tomorrow)) return "Tomorrow";
  return d.toLocaleDateString(undefined, { day: "numeric", month: "short" });
}

function sameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

const DAY_MS = 24 * 60 * 60 * 1000;
