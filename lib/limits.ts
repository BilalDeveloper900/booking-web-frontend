/**
 * Plan limits — client-side mirror + helpers.
 *
 * The numbers here are DISPLAY ONLY. The real enforcement lives in the database
 * (migration 20260622000001_plan_limits.sql) via INSERT triggers, so it can't be
 * bypassed by a hand-crafted request. Keep these in sync with the SQL lookups
 * (`plan_max_admins` / `plan_max_clients` / `plan_max_bookings_per_month`).
 *
 * `null` = unlimited.
 */
"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { effectivePlan, type PlanId } from "@/lib/plans";

export type PlanLimits = {
  admins: number | null;
  clients: number | null;
  bookingsPerMonth: number | null;
};

export const PLAN_LIMITS: Record<PlanId, PlanLimits> = {
  free: { admins: 1, clients: 30, bookingsPerMonth: 50 },
  solo: { admins: 1, clients: 150, bookingsPerMonth: null },
  studio: { admins: 5, clients: 500, bookingsPerMonth: null },
};

/** A churned/expired studio falls back to Free limits — mirror of effective_plan(). */
export function limitsForPlan(plan: PlanId | string | null | undefined): PlanLimits {
  if (plan === "solo" || plan === "studio" || plan === "free") {
    return PLAN_LIMITS[plan];
  }
  return PLAN_LIMITS.free;
}

// ─────────────────────────────────────────────────────────────────────────────
// Error detection — the DB raises with hint 'upgrade_required' and a detail token
// ('admins' | 'clients' | 'bookings'). supabase-js surfaces these on the error.
// ─────────────────────────────────────────────────────────────────────────────

export type PlanLimitResource = "admins" | "clients" | "bookings";

type SupabaseLikeError = {
  message?: string;
  details?: string;
  hint?: string;
  code?: string;
};

/** True when the error is one of our plan-limit guards. */
export function isPlanLimitError(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  const e = err as SupabaseLikeError;
  return e.hint === "upgrade_required";
}

/** Which resource hit its cap, if this is a plan-limit error. */
export function planLimitResource(err: unknown): PlanLimitResource | null {
  if (!isPlanLimitError(err)) return null;
  const detail = (err as SupabaseLikeError).details;
  if (detail === "admins" || detail === "clients" || detail === "bookings") {
    return detail;
  }
  return null;
}

/**
 * A user-facing message for a thrown/returned error. Returns the DB's friendly
 * limit message when it's a plan-limit error, otherwise `fallback`.
 */
export function planLimitMessage(err: unknown, fallback: string): string {
  if (isPlanLimitError(err)) {
    const e = err as SupabaseLikeError;
    return e.message?.trim() || "You've reached a plan limit. Upgrade to continue.";
  }
  return fallback;
}

// ─────────────────────────────────────────────────────────────────────────────
// Usage hook — live counts vs. the studio's limits, for "3 / 5 admins" displays
// and pre-disabling "add" buttons. Reads the plan from studio_subscriptions.
// ─────────────────────────────────────────────────────────────────────────────

export type StudioUsage = {
  plan: PlanId;
  limits: PlanLimits;
  admins: number;
  clients: number;
  bookingsThisMonth: number;
  loading: boolean;
  error: string | null;
};

const EMPTY_USAGE: Omit<StudioUsage, "loading" | "error"> = {
  plan: "free",
  limits: PLAN_LIMITS.free,
  admins: 0,
  clients: 0,
  bookingsThisMonth: 0,
};

export function useStudioUsage(studioId: string | undefined): StudioUsage {
  const [state, setState] = useState<StudioUsage>(() => ({
    ...EMPTY_USAGE,
    loading: Boolean(studioId),
    error: null,
  }));

  useEffect(() => {
    if (!studioId) return;
    let cancelled = false;
    const supabase = createClient();

    (async () => {
      const monthStart = new Date();
      monthStart.setUTCDate(1);
      monthStart.setUTCHours(0, 0, 0, 0);

      const [subRes, adminsRes, clientsRes, bookingsRes] = await Promise.all([
        supabase
          .from("studio_subscriptions")
          .select("plan, status")
          .eq("studio_id", studioId)
          .maybeSingle(),
        supabase
          .from("studio_members")
          .select("id", { count: "exact", head: true })
          .eq("studio_id", studioId)
          .eq("role", "admin")
          .eq("status", "active"),
        supabase
          .from("studio_members")
          .select("id", { count: "exact", head: true })
          .eq("studio_id", studioId)
          .eq("role", "client")
          .eq("status", "active"),
        supabase
          .from("bookings")
          .select("id, session:sessions!inner(studio_id)", { count: "exact", head: true })
          .eq("session.studio_id", studioId)
          .neq("status", "cancelled")
          .gte("booked_at", monthStart.toISOString()),
      ]);

      if (cancelled) return;

      const churned =
        subRes.data?.status === "cancelled" || subRes.data?.status === "expired";
      const plan = (churned ? "free" : subRes.data?.plan ?? "free") as PlanId;

      setState({
        plan,
        limits: limitsForPlan(plan),
        admins: adminsRes.count ?? 0,
        clients: clientsRes.count ?? 0,
        bookingsThisMonth: bookingsRes.count ?? 0,
        loading: false,
        error:
          subRes.error?.message ??
          adminsRes.error?.message ??
          clientsRes.error?.message ??
          bookingsRes.error?.message ??
          null,
      });
    })();

    return () => {
      cancelled = true;
    };
  }, [studioId]);

  return state;
}

// ─────────────────────────────────────────────────────────────────────────────
// useEffectivePlan — the studio's churn-adjusted plan, readable by ANY active
// member (owner/admin/client) via the `studio_effective_plan` RPC. Used to gate
// nav items, pages, and in-screen controls. Lighter than useStudioUsage (no
// count queries) — use this when you only need the plan, not usage numbers.
// ─────────────────────────────────────────────────────────────────────────────

export type EffectivePlanState = { plan: PlanId; loading: boolean };

export function useEffectivePlan(studioId: string | undefined): EffectivePlanState {
  const [state, setState] = useState<EffectivePlanState>(() => ({
    plan: "free",
    loading: Boolean(studioId),
  }));

  useEffect(() => {
    if (!studioId) {
      setState({ plan: "free", loading: false });
      return;
    }
    let cancelled = false;
    const supabase = createClient();
    // Generated supabase types won't include the new RPC until `npm run db:gen`;
    // use the untyped overload — runtime is unchanged.
    (
      supabase.rpc as unknown as (
        fn: string,
        args: Record<string, unknown>,
      ) => PromiseLike<{ data: unknown; error: { message: string } | null }>
    )("studio_effective_plan", { p_studio_id: studioId }).then(({ data, error }) => {
      if (cancelled) return;
      const plan = !error && typeof data === "string" ? effectivePlan(data) : "free";
      setState({ plan, loading: false });
    });
    return () => {
      cancelled = true;
    };
  }, [studioId]);

  return state;
}
