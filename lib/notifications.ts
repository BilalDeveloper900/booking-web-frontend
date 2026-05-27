/**
 * In-app notifications data layer.
 *
 * Backed by the `notifications` table (see migration
 * 20260525000001_notifications.sql). Triggers on `bookings` and
 * `credit_transactions` fan out per-role recipient rows; this hook owns
 * the recipient's slice of that feed for the bell dropdown.
 *
 * Realtime is enabled on `notifications` so new rows show up without polling.
 */
"use client";

import { useCallback, useEffect, useId, useState } from "react";
import { createClient } from "@/lib/supabase/client";

// The `notifications` table + `mark_all_notifications_read` RPC were added in
// migration 20260525000001 but `lib/supabase/types.ts` is generated and hasn't
// been regenerated yet. Until `npm run db:gen` is re-run, we route these
// queries through a minimally-typed view of the client. Drop this once the
// generated types include the new table.
type UntypedSupabase = {
  from: (table: string) => {
    select: (cols: string) => {
      eq: (col: string, val: string) => {
        order: (col: string, opts: { ascending: boolean }) => {
          limit: (n: number) => PromiseLike<{ data: DbRow[] | null; error: { message: string } | null }>;
        };
      };
    };
    update: (patch: Record<string, unknown>) => {
      eq: (col: string, val: string) => {
        is: (col: string, val: null) => PromiseLike<{ error: { message: string } | null }>;
      };
    };
  };
  rpc: (fn: string) => PromiseLike<{ error: { message: string } | null }>;
};
function untyped(): UntypedSupabase {
  return createClient() as unknown as UntypedSupabase;
}

export type NotificationKind =
  | "booking_created"
  | "booking_cancelled"
  | "credit_topup"
  | "credit_gift"
  | "credit_refund"
  | "credit_adjustment";

export type NotificationRow = {
  id: string;
  kind: NotificationKind;
  title: string;
  body: string | null;
  href: string | null;
  relatedBookingId: string | null;
  relatedTransactionId: string | null;
  relatedMemberId: string | null;
  readAt: string | null;
  createdAt: string;
};

type DbRow = {
  id: string;
  kind: string;
  title: string;
  body: string | null;
  href: string | null;
  related_booking_id: string | null;
  related_transaction_id: string | null;
  related_member_id: string | null;
  read_at: string | null;
  created_at: string;
};

function mapRow(r: DbRow): NotificationRow {
  return {
    id: r.id,
    kind: r.kind as NotificationKind,
    title: r.title,
    body: r.body,
    href: r.href,
    relatedBookingId: r.related_booking_id,
    relatedTransactionId: r.related_transaction_id,
    relatedMemberId: r.related_member_id,
    readAt: r.read_at,
    createdAt: r.created_at,
  };
}

const SELECT_COLS =
  "id, kind, title, body, href, related_booking_id, related_transaction_id, related_member_id, read_at, created_at";

type NotificationsState = {
  items: NotificationRow[];
  loading: boolean;
  error: string | null;
};

/**
 * Live feed of the current user's notifications. Pulls the latest 30 on mount
 * and subscribes to INSERT/UPDATE for the recipient. The recipient filter is
 * scoped to `recipient_member_id`, which RLS also enforces server-side.
 */
export function useNotifications(myMemberId: string | undefined) {
  const [state, setState] = useState<NotificationsState>(() => ({
    items: [],
    loading: Boolean(myMemberId),
    error: null,
  }));
  const instanceId = useId();

  useEffect(() => {
    if (!myMemberId) {
      setState({ items: [], loading: false, error: null });
      return;
    }
    let cancelled = false;
    const supabase = createClient();
    const u = untyped();

    u
      .from("notifications")
      .select(SELECT_COLS)
      .eq("recipient_member_id", myMemberId)
      .order("created_at", { ascending: false })
      .limit(30)
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) {
          setState({ items: [], loading: false, error: error.message });
          return;
        }
        setState({
          items: (data ?? []).map(mapRow),
          loading: false,
          error: null,
        });
      });

    const channel = supabase
      .channel(`notifications:${myMemberId}:${instanceId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `recipient_member_id=eq.${myMemberId}`,
        },
        (payload) => {
          const row = mapRow(payload.new as DbRow);
          setState((prev) => {
            if (prev.items.some((i) => i.id === row.id)) return prev;
            return { ...prev, items: [row, ...prev.items].slice(0, 50) };
          });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "notifications",
          filter: `recipient_member_id=eq.${myMemberId}`,
        },
        (payload) => {
          const row = mapRow(payload.new as DbRow);
          setState((prev) => ({
            ...prev,
            items: prev.items.map((i) => (i.id === row.id ? row : i)),
          }));
        }
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [myMemberId, instanceId]);

  const markRead = useCallback(
    async (id: string) => {
      // Optimistic: flip locally first; revert on error.
      const now = new Date().toISOString();
      setState((prev) => ({
        ...prev,
        items: prev.items.map((i) =>
          i.id === id && i.readAt === null ? { ...i, readAt: now } : i
        ),
      }));
      const { error } = await untyped()
        .from("notifications")
        .update({ read_at: now })
        .eq("id", id)
        .is("read_at", null);
      if (error) {
        setState((prev) => ({
          ...prev,
          items: prev.items.map((i) =>
            i.id === id ? { ...i, readAt: null } : i
          ),
        }));
      }
    },
    []
  );

  const markAllRead = useCallback(async () => {
    if (!myMemberId) return;
    const now = new Date().toISOString();
    const previous = state.items;
    setState((prev) => ({
      ...prev,
      items: prev.items.map((i) =>
        i.readAt === null ? { ...i, readAt: now } : i
      ),
    }));
    const { error } = await untyped().rpc("mark_all_notifications_read");
    if (error) {
      setState((prev) => ({ ...prev, items: previous }));
    }
  }, [myMemberId, state.items]);

  const unread = state.items.reduce(
    (sum, i) => (i.readAt === null ? sum + 1 : sum),
    0
  );

  return { ...state, unread, markRead, markAllRead };
}
