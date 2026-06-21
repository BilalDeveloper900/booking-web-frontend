/**
 * Client-side booking flows.
 *
 * - `useUpcomingClasses(studioId, clientMemberId)` — group classes in this
 *   studio that are still bookable (starts_at > now, status='scheduled'),
 *   joined with the service + admin + booking counts. Adds `enrolledByMe`
 *   so the client UI can show "Enrolled" badges + cancel buttons.
 * - `useMyCredits(memberId)` — current balance.
 * - `useMyCreditTransactions(memberId)` — credit ledger.
 * - `useMyBookings(memberId)` — upcoming + past bookings (joined with session
 *   + service + admin).
 * - `enrollInClass(sessionId)` — calls `book_class` RPC (atomic).
 * - `cancelMyBooking(bookingId, reason?)` — calls `cancel_my_booking` RPC.
 */
"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/lib/supabase/types";
import { sendBookingNotification } from "@/lib/email";

/**
 * Fire the "new booking" email to the relevant admin without blocking — a
 * failed notification must never fail (or slow) the booking that triggered it.
 */
function notifyAdminOfBooking(bookingId: string): void {
  void sendBookingNotification(bookingId).catch((err) => {
    console.error("[client-bookings] booking notification failed:", err);
  });
}

export type CreditTransactionRow =
  Database["public"]["Tables"]["credit_transactions"]["Row"];

export type UpcomingClass = {
  sessionId: string;
  serviceId: string;
  serviceName: string;
  serviceDescription: string | null;
  hue: number;
  startsAt: string;
  durationMin: number;
  capacity: number;
  enrolled: number;
  creditsCost: number;
  adminName: string;
  adminHue: number;
  enrolledByMe: boolean;
  myBookingId: string | null;
};

export type MyBookingItem = {
  bookingId: string;
  sessionId: string;
  status: string;
  creditsCharged: number;
  startsAt: string;
  durationMin: number;
  serviceName: string;
  serviceMode: "solo" | "group";
  hue: number;
  adminName: string;
  adminHue: number;
};

/* ────────── useUpcomingClasses ────────── */

type UpcomingState = {
  classes: UpcomingClass[];
  loading: boolean;
  error: string | null;
};

export function useUpcomingClasses(
  studioId: string | undefined,
  myMemberId: string | undefined
) {
  const [state, setState] = useState<UpcomingState>(() => ({
    classes: [],
    loading: Boolean(studioId),
    error: null,
  }));

  const refetch = useCallback(async () => {
    if (!studioId) return;
    const result = await runUpcomingQuery(studioId, myMemberId);
    setState({ ...result, loading: false });
  }, [studioId, myMemberId]);

  useEffect(() => {
    if (!studioId) return;
    let cancelled = false;
    runUpcomingQuery(studioId, myMemberId).then((result) => {
      if (cancelled) return;
      setState({ ...result, loading: false });
    });
    return () => {
      cancelled = true;
    };
  }, [studioId, myMemberId]);

  return { ...state, refetch };
}

async function runUpcomingQuery(
  studioId: string,
  myMemberId: string | undefined
): Promise<{ classes: UpcomingClass[]; error: string | null }> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("sessions")
    .select(
      `
        id,
        starts_at,
        duration_min,
        capacity,
        status,
        service:services!sessions_service_id_fkey(
          id, name, description, hue, mode, credits_cost
        ),
        admin:studio_members!sessions_admin_member_id_fkey(
          user:users!studio_members_user_id_fkey(name, avatar_hue)
        ),
        bookings(id, status, client_member_id)
      `
    )
    .eq("studio_id", studioId)
    .eq("status", "scheduled")
    .gt("starts_at", new Date().toISOString())
    .order("starts_at", { ascending: true });

  if (error) return { classes: [], error: error.message };

  const classes: UpcomingClass[] = [];
  for (const row of data ?? []) {
    const service = pickOne(row.service);
    const admin = pickOne(row.admin);
    const adminUser = admin ? pickOne(admin.user) : null;
    if (!service || !adminUser) continue;
    if (service.mode !== "group") continue;

    const active = (row.bookings ?? []).filter(
      (b: { status: string }) => b.status !== "cancelled"
    );
    const mine = myMemberId
      ? active.find(
          (b: { client_member_id: string }) => b.client_member_id === myMemberId
        )
      : undefined;

    classes.push({
      sessionId: row.id,
      serviceId: service.id,
      serviceName: service.name,
      serviceDescription: service.description,
      hue: service.hue,
      startsAt: row.starts_at,
      durationMin: row.duration_min,
      capacity: row.capacity,
      enrolled: active.length,
      creditsCost: service.credits_cost,
      adminName: adminUser.name,
      adminHue: adminUser.avatar_hue,
      enrolledByMe: Boolean(mine),
      myBookingId: mine?.id ?? null,
    });
  }
  return { classes, error: null };
}

/* ────────── useMyCredits ────────── */

type CreditsState = {
  balance: number;
  lastGrantAt: string | null;
  loading: boolean;
  error: string | null;
};

export function useMyCredits(memberId: string | undefined) {
  const [state, setState] = useState<CreditsState>(() => ({
    balance: 0,
    lastGrantAt: null,
    loading: Boolean(memberId),
    error: null,
  }));

  const refetch = useCallback(async () => {
    if (!memberId) return;
    const supabase = createClient();
    const { data, error } = await supabase
      .from("client_credits")
      .select("balance, last_grant_at")
      .eq("member_id", memberId)
      .maybeSingle();
    setState({
      balance: data?.balance ?? 0,
      lastGrantAt: data?.last_grant_at ?? null,
      loading: false,
      error: error?.message ?? null,
    });
  }, [memberId]);

  useEffect(() => {
    if (!memberId) return;
    let cancelled = false;
    const supabase = createClient();
    supabase
      .from("client_credits")
      .select("balance, last_grant_at")
      .eq("member_id", memberId)
      .maybeSingle()
      .then(({ data, error }) => {
        if (cancelled) return;
        setState({
          balance: data?.balance ?? 0,
          lastGrantAt: data?.last_grant_at ?? null,
          loading: false,
          error: error?.message ?? null,
        });
      });
    return () => {
      cancelled = true;
    };
  }, [memberId]);

  return { ...state, refetch };
}

/* ────────── useMyCreditTransactions ────────── */

type TxState = {
  transactions: CreditTransactionRow[];
  loading: boolean;
  error: string | null;
};

export function useMyCreditTransactions(
  memberId: string | undefined,
  limit = 20
) {
  const [state, setState] = useState<TxState>(() => ({
    transactions: [],
    loading: Boolean(memberId),
    error: null,
  }));

  const refetch = useCallback(async () => {
    if (!memberId) return;
    const supabase = createClient();
    const { data, error } = await supabase
      .from("credit_transactions")
      .select("*")
      .eq("member_id", memberId)
      .order("created_at", { ascending: false })
      .limit(limit);
    setState({
      transactions: data ?? [],
      loading: false,
      error: error?.message ?? null,
    });
  }, [memberId, limit]);

  useEffect(() => {
    if (!memberId) return;
    let cancelled = false;
    const supabase = createClient();
    supabase
      .from("credit_transactions")
      .select("*")
      .eq("member_id", memberId)
      .order("created_at", { ascending: false })
      .limit(limit)
      .then(({ data, error }) => {
        if (cancelled) return;
        setState({
          transactions: data ?? [],
          loading: false,
          error: error?.message ?? null,
        });
      });
    return () => {
      cancelled = true;
    };
  }, [memberId, limit]);

  return { ...state, refetch };
}

/* ────────── useMyBookings ────────── */

type MyBookingsState = {
  bookings: MyBookingItem[];
  loading: boolean;
  error: string | null;
};

export function useMyBookings(memberId: string | undefined) {
  const [state, setState] = useState<MyBookingsState>(() => ({
    bookings: [],
    loading: Boolean(memberId),
    error: null,
  }));

  const refetch = useCallback(async () => {
    if (!memberId) return;
    const result = await runMyBookingsQuery(memberId);
    setState({ ...result, loading: false });
  }, [memberId]);

  useEffect(() => {
    if (!memberId) return;
    let cancelled = false;
    runMyBookingsQuery(memberId).then((result) => {
      if (cancelled) return;
      setState({ ...result, loading: false });
    });
    return () => {
      cancelled = true;
    };
  }, [memberId]);

  return { ...state, refetch };
}

async function runMyBookingsQuery(
  memberId: string
): Promise<{ bookings: MyBookingItem[]; error: string | null }> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("bookings")
    .select(
      `
        id, status, credits_charged,
        session:sessions!bookings_session_id_fkey(
          id, starts_at, duration_min,
          service:services!sessions_service_id_fkey(name, hue, mode),
          admin:studio_members!sessions_admin_member_id_fkey(
            user:users!studio_members_user_id_fkey(name, avatar_hue)
          )
        )
      `
    )
    .eq("client_member_id", memberId)
    .order("booked_at", { ascending: false });

  const bookings: MyBookingItem[] = [];
  for (const row of data ?? []) {
    const session = pickOne(row.session);
    if (!session) continue;
    const service = pickOne(session.service);
    const admin = pickOne(session.admin);
    const adminUser = admin ? pickOne(admin.user) : null;
    if (!service || !adminUser) continue;
    bookings.push({
      bookingId: row.id,
      sessionId: session.id,
      status: row.status,
      creditsCharged: row.credits_charged,
      startsAt: session.starts_at,
      durationMin: session.duration_min,
      serviceName: service.name,
      serviceMode: service.mode as "solo" | "group",
      hue: service.hue,
      adminName: adminUser.name,
      adminHue: adminUser.avatar_hue,
    });
  }
  return {
    bookings,
    error: error?.message ?? null,
  };
}

/* ────────── mutations ────────── */

export async function enrollInClass(sessionId: string): Promise<string> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("book_class", {
    p_session_id: sessionId,
  });
  if (error) throw new Error(humanizeRpcError(error.message));
  const bookingId = String(data);
  notifyAdminOfBooking(bookingId);
  return bookingId;
}

/* ────────── Solo booking ────────── */

export type SoloServiceCard = {
  id: string;
  name: string;
  description: string | null;
  hue: number;
  durationMin: number;
  creditsCost: number;
  adminMemberId: string;
  adminName: string;
  adminHue: number;
};

type SoloServicesState = {
  services: SoloServiceCard[];
  loading: boolean;
  error: string | null;
};

export function useSoloServices(studioId: string | undefined) {
  const [state, setState] = useState<SoloServicesState>(() => ({
    services: [],
    loading: Boolean(studioId),
    error: null,
  }));

  useEffect(() => {
    if (!studioId) return;
    let cancelled = false;
    const supabase = createClient();
    supabase
      .from("services")
      .select(
        `
          id, name, description, hue, duration_min, credits_cost,
          admin_member_id,
          admin:studio_members!services_admin_member_id_fkey(
            user:users!studio_members_user_id_fkey(name, avatar_hue)
          )
        `
      )
      .eq("studio_id", studioId)
      .eq("mode", "solo")
      .eq("active", true)
      .not("admin_member_id", "is", null)
      .order("name", { ascending: true })
      .then(({ data, error }) => {
        if (cancelled) return;
        const services: SoloServiceCard[] = [];
        for (const row of data ?? []) {
          const admin = pickOne(row.admin);
          const adminUser = admin ? pickOne(admin.user) : null;
          if (!adminUser || !row.admin_member_id) continue;
          services.push({
            id: row.id,
            name: row.name,
            description: row.description,
            hue: row.hue,
            durationMin: row.duration_min,
            creditsCost: row.credits_cost,
            adminMemberId: row.admin_member_id,
            adminName: adminUser.name,
            adminHue: adminUser.avatar_hue,
          });
        }
        setState({
          services,
          loading: false,
          error: error?.message ?? null,
        });
      });
    return () => {
      cancelled = true;
    };
  }, [studioId]);

  return state;
}

type SlotsState = {
  slots: string[]; // ISO timestamps
  loading: boolean;
  error: string | null;
};

/**
 * Reads free slots for (serviceId, date) via the `free_solo_slots` RPC.
 * Returns ISO timestamps; the UI formats them to local time-of-day.
 */
export function useFreeSoloSlots(
  serviceId: string | undefined,
  date: string | undefined // YYYY-MM-DD
) {
  const [state, setState] = useState<SlotsState>(() => ({
    slots: [],
    loading: Boolean(serviceId && date),
    error: null,
  }));

  useEffect(() => {
    if (!serviceId || !date) return;
    let cancelled = false;
    const supabase = createClient();
    supabase
      .rpc("free_solo_slots", {
        p_service_id: serviceId,
        p_date: date,
        p_step_minutes: 30,
      })
      .then(({ data, error }) => {
        if (cancelled) return;
        // Supabase returns setof timestamptz as an array of { free_solo_slots: string }
        // OR a flat array of strings depending on the generator. Handle both shapes.
        const flat: string[] = Array.isArray(data)
          ? (data as unknown[]).map((v) =>
              typeof v === "string" ? v : (v as { free_solo_slots?: string }).free_solo_slots ?? ""
            ).filter(Boolean)
          : [];
        setState({
          slots: flat,
          loading: false,
          error: error?.message ?? null,
        });
      });
    return () => {
      cancelled = true;
    };
  }, [serviceId, date]);

  return state;
}

/* ────────── useSoloSlotGrid ────────── */

export type SlotStatus = "available" | "booked" | "blocked" | "past";
export type SlotCell = { startsAt: string; status: SlotStatus };

type GridState = {
  cells: SlotCell[];
  loading: boolean;
  error: string | null;
};

/**
 * Reads the full slot grid for (serviceId, date) via `solo_slot_grid`. Unlike
 * `useFreeSoloSlots`, this returns every candidate slot in the studio's hours
 * window with a status flag so the UI can render blocked/booked/past slots
 * (disabled) alongside available ones — that way the user sees the full day
 * and understands what's already taken.
 */
export function useSoloSlotGrid(
  serviceId: string | undefined,
  date: string | undefined,
  /** Slot step in minutes. Use the service's duration_min so a 60-min
   * service produces non-overlapping 60-min slots. */
  stepMinutes: number | undefined
) {
  const [state, setState] = useState<GridState>(() => ({
    cells: [],
    loading: Boolean(serviceId && date && stepMinutes),
    error: null,
  }));

  const runQuery = useCallback(async (): Promise<GridState> => {
    if (!serviceId || !date || !stepMinutes) {
      return { cells: [], loading: false, error: null };
    }
    try {
      const supabase = createClient();
      // Generated supabase types don't yet include `solo_slot_grid` (would
      // come from `npm run gen:types` after migration push). Use the
      // untyped overload; runtime is unchanged.
      const { data, error } = await (
        supabase.rpc as unknown as (
          fn: string,
          args: Record<string, unknown>
        ) => PromiseLike<{
          data: unknown;
          error: { message: string } | null;
        }>
      )("solo_slot_grid", {
        p_service_id: serviceId,
        p_date: date,
        p_step_minutes: stepMinutes,
      });
      if (error) return { cells: [], loading: false, error: error.message };
      const rows = Array.isArray(data) ? (data as Array<Record<string, unknown>>) : [];
      const cells: SlotCell[] = rows.map((r) => ({
        startsAt: String(r.slot_at),
        status: r.slot_status as SlotStatus,
      }));
      return { cells, loading: false, error: null };
    } catch (e) {
      return {
        cells: [],
        loading: false,
        error: e instanceof Error ? e.message : String(e),
      };
    }
  }, [serviceId, date, stepMinutes]);

  const refetch = useCallback(async () => {
    const next = await runQuery();
    setState(next);
  }, [runQuery]);

  useEffect(() => {
    if (!serviceId || !date || !stepMinutes) {
      setState({ cells: [], loading: false, error: null });
      return;
    }
    let cancelled = false;
    setState((s) => ({ ...s, loading: true, error: null }));
    runQuery().then((next) => {
      if (cancelled) return;
      setState(next);
    });
    return () => {
      cancelled = true;
    };
  }, [serviceId, date, stepMinutes, runQuery]);

  return { ...state, refetch };
}

export async function bookSolo(
  serviceId: string,
  startsAt: Date
): Promise<string> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("book_solo", {
    p_service_id: serviceId,
    p_starts_at: startsAt.toISOString(),
  });
  if (error) throw new Error(humanizeRpcError(error.message));
  const bookingId = String(data);
  notifyAdminOfBooking(bookingId);
  return bookingId;
}

export async function cancelMyBooking(
  bookingId: string,
  reason?: string
): Promise<void> {
  const supabase = createClient();
  const args: { p_booking_id: string; p_reason?: string } = {
    p_booking_id: bookingId,
  };
  if (reason) args.p_reason = reason;
  const { error } = await supabase.rpc("cancel_my_booking", args);
  if (error) throw new Error(humanizeRpcError(error.message));
}

function humanizeRpcError(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes("insufficient_credits")) {
    // Postgres often appends our custom message via `using message = `.
    const m = message.match(/needs (\d+) credit\(s\), you have (\d+)/i);
    if (m) return `You need ${m[1]} credit(s) — you have ${m[2]}. Top up first.`;
    return "Not enough credits. Top up first.";
  }
  if (lower.includes("session_full")) return "This class is already full.";
  if (lower.includes("session_not_available")) return "This class is no longer available.";
  if (lower.includes("session_already_started")) return "This class has already started.";
  if (lower.includes("session_not_found")) return "This class no longer exists.";
  if (lower.includes("not_a_client_of_studio")) {
    return "You're not a client of this studio. Ask the owner for an invite.";
  }
  if (lower.includes("not_a_member_of_studio")) {
    return "You don't belong to this studio.";
  }
  if (lower.includes("not_a_group_class")) return "That's not a group class.";
  if (lower.includes("not_a_solo_service")) return "That's not a 1-on-1 service.";
  if (lower.includes("service_has_no_admin")) {
    return "This service has no admin assigned — ask the owner to assign one.";
  }
  if (lower.includes("service_not_found")) return "This service is no longer available.";
  if (lower.includes("slot_in_past")) return "That time has already passed. Pick a later slot.";
  if (lower.includes("sessions_no_overlap_per_admin")) {
    return "That slot was just taken. Pick another one.";
  }
  if (lower.includes("not_authenticated")) return "Please sign in first.";
  if (lower.includes("booking_not_found")) return "Booking not found.";
  if (lower.includes("forbidden")) return "You can only cancel your own bookings.";
  return message;
}

/* ────────── helpers ────────── */

function pickOne<T>(maybe: T | T[] | null | undefined): T | null {
  if (Array.isArray(maybe)) return maybe[0] ?? null;
  return maybe ?? null;
}
