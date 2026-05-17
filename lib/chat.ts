/**
 * Real-time chat data layer.
 *
 * Backed by `threads` / `thread_participants` / `messages` + two RPCs:
 * `start_thread()` and `my_threads_overview()`. Realtime is enabled on
 * `messages` + `threads` (see migration 20260515000001_chat.sql).
 *
 * Exports:
 *   useChatThreads        — inbox list, refreshes when any of my threads bumps
 *   useChatMessages       — messages for one thread, live INSERT subscription
 *   sendChatMessage       — insert + bump-thread (trigger handles bump)
 *   markThreadRead        — update my thread_participants.last_read_at
 *   startThreadWith       — find or create a 1-1 thread via RPC
 *
 * The hooks assume the caller is authenticated and a member of the studio.
 * They do nothing while `myMemberId` is undefined.
 */
"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

// ─────────── Types ───────────

export type SenderRole = "owner" | "admin" | "client" | null;
export type MessageKind = "text" | "booking_event";

export type ChatThreadRow = {
  threadId: string;
  studioId: string;
  myMemberId: string;
  otherMemberId: string | null;
  otherName: string;
  otherHue: number;
  lastMessageAt: string | null;
  lastMessageBody: string | null;
  lastMessageSenderMemberId: string | null;
  lastMessageSenderRole: SenderRole;
  unreadCount: number;
};

export type ChatMessageRow = {
  id: string;
  threadId: string;
  senderMemberId: string;
  senderRole: SenderRole;
  body: string;
  kind: MessageKind;
  attachedBookingId: string | null;
  createdAt: string;
  fromMe: boolean;
};

export type StudioThreadRow = {
  threadId: string;
  studioId: string;
  clientMemberId: string | null;
  clientName: string | null;
  clientHue: number | null;
  adminMemberId: string | null;
  adminName: string | null;
  adminHue: number | null;
  lastMessageAt: string | null;
  lastMessageBody: string | null;
  lastMessageRole: SenderRole;
  lastMessageSenderId: string | null;
  unreadAny: boolean;
};

export type StudioThreadFilter = "all" | "today" | "unread";

// ─────────── useChatThreads ───────────

type ThreadsState = {
  threads: ChatThreadRow[];
  loading: boolean;
  error: string | null;
};

export function useChatThreads(args: { myMemberId: string | undefined }) {
  const { myMemberId } = args;
  // useId gives us a stable-per-component-instance suffix so multiple
  // components on the same page (e.g. topbar badge + messages screen) don't
  // try to reuse the same realtime channel name — which fails with
  // "cannot add `postgres_changes` callbacks after `subscribe()`".
  const instanceId = useId();
  const [state, setState] = useState<ThreadsState>(() => ({
    threads: [],
    loading: Boolean(myMemberId),
    error: null,
  }));

  const refetch = useCallback(async () => {
    if (!myMemberId) return;
    const supabase = createClient();
    const { data, error } = await callMyThreadsOverview(supabase);
    if (error) {
      setState({ threads: [], loading: false, error: error.message });
      return;
    }
    setState({
      threads: (data ?? []).map(mapThreadRow),
      loading: false,
      error: null,
    });
  }, [myMemberId]);

  useEffect(() => {
    if (!myMemberId) return;
    let cancelled = false;
    const supabase = createClient();

    callMyThreadsOverview(supabase).then(({ data, error }) => {
      if (cancelled) return;
      if (error) {
        setState({ threads: [], loading: false, error: error.message });
        return;
      }
      setState({
        threads: (data ?? []).map(mapThreadRow),
        loading: false,
        error: null,
      });
    });

    // Realtime: any new message in any of my threads → refetch overview.
    // RLS filters the subscription server-side; we only see messages in
    // threads we participate in.
    const channel = supabase
      .channel(`chat:inbox:${myMemberId}:${instanceId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        () => {
          callMyThreadsOverview(supabase).then(({ data, error }) => {
            if (cancelled || error) return;
            setState({
              threads: (data ?? []).map(mapThreadRow),
              loading: false,
              error: null,
            });
          });
        }
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [myMemberId, instanceId]);

  return { ...state, refetch };
}

/** Generated supabase types may lag on the new last_message_sender_role
 * column. This wrapper casts the rpc call to a stable local shape. */
function callMyThreadsOverview(supabase: ReturnType<typeof createClient>) {
  return (
    supabase.rpc as unknown as (
      fn: string
    ) => PromiseLike<{
      data: MyThreadsOverviewRow[] | null;
      error: { message: string } | null;
    }>
  )("my_threads_overview");
}

function mapThreadRow(
  r: NonNullable<MyThreadsOverviewRow>
): ChatThreadRow {
  return {
    threadId: r.thread_id,
    studioId: r.studio_id,
    myMemberId: r.my_member_id,
    otherMemberId: r.other_member_id,
    otherName: r.other_name ?? "Unknown",
    otherHue: r.other_hue ?? 195,
    lastMessageAt: r.last_message_at,
    lastMessageBody: r.last_message_body,
    lastMessageSenderMemberId: r.last_message_sender_member_id,
    lastMessageSenderRole: (r.last_message_sender_role as SenderRole) ?? null,
    unreadCount: Number(r.unread_count ?? 0),
  };
}

// ─────────── useChatMessages ───────────

type MessagesState = {
  messages: ChatMessageRow[];
  loading: boolean;
  error: string | null;
};

export function useChatMessages(args: {
  threadId: string | undefined;
  myMemberId: string | undefined;
}) {
  const { threadId, myMemberId } = args;
  const instanceId = useId();
  const [state, setState] = useState<MessagesState>(() => ({
    messages: [],
    loading: Boolean(threadId && myMemberId),
    error: null,
  }));
  // Track current threadId so an INSERT for a stale subscription doesn't
  // leak into a freshly-switched thread.
  const activeThreadRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    activeThreadRef.current = threadId;
    if (!threadId || !myMemberId) return;
    let cancelled = false;
    const supabase = createClient();

    supabase
      .from("messages")
      // Cast: generated types haven't been regenerated with the new
      // sender_role / kind / attached_booking_id columns yet.
      .select(
        "id, thread_id, sender_member_id, sender_role, body, kind, attached_booking_id, created_at" as "*"
      )
      .eq("thread_id", threadId)
      .order("created_at", { ascending: true })
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) {
          setState({ messages: [], loading: false, error: error.message });
          return;
        }
        setState({
          messages: ((data ?? []) as unknown as MessageInsertPayload[]).map(
            (m) => mapMessageRow(m, myMemberId)
          ),
          loading: false,
          error: null,
        });
      });

    const channel = supabase
      .channel(`chat:thread:${threadId}:${instanceId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `thread_id=eq.${threadId}`,
        },
        (payload) => {
          if (activeThreadRef.current !== threadId) return;
          const row = payload.new as MessageInsertPayload;
          setState((prev) => {
            // De-dup: if we already have this id (e.g. optimistic), skip
            if (prev.messages.some((m) => m.id === row.id)) return prev;
            return {
              ...prev,
              messages: [...prev.messages, mapMessageRow(row, myMemberId)],
            };
          });
        }
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [threadId, myMemberId, instanceId]);

  return state;
}

function mapMessageRow(
  r: MessageInsertPayload,
  myMemberId: string
): ChatMessageRow {
  return {
    id: r.id,
    threadId: r.thread_id,
    senderMemberId: r.sender_member_id,
    senderRole: (r.sender_role as SenderRole) ?? null,
    body: r.body,
    kind: ((r.kind as MessageKind) ?? "text"),
    attachedBookingId: r.attached_booking_id ?? null,
    createdAt: r.created_at,
    fromMe: r.sender_member_id === myMemberId,
  };
}

// ─────────── Mutations ───────────

export async function sendChatMessage(args: {
  threadId: string;
  senderMemberId: string;
  body: string;
}): Promise<void> {
  const trimmed = args.body.trim();
  if (!trimmed) return;
  const supabase = createClient();
  const { error } = await supabase.from("messages").insert({
    thread_id: args.threadId,
    sender_member_id: args.senderMemberId,
    body: trimmed,
  });
  if (error) throw error;
}

export async function markThreadRead(args: {
  threadId: string;
  myMemberId: string;
}): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("thread_participants")
    .update({ last_read_at: new Date().toISOString() })
    .eq("thread_id", args.threadId)
    .eq("member_id", args.myMemberId);
  if (error) throw error;
}

export async function startThreadWith(otherMemberId: string): Promise<string> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("start_thread", {
    p_other_member_id: otherMemberId,
  });
  if (error) throw error;
  if (!data) throw new Error("start_thread returned no thread id");
  return data;
}

// ─────────── useUnreadTotal — single number for the topbar badge ───────────

/**
 * Returns the total unread "thing" for the current user, role-aware:
 *   - owner   → number of studio threads with any participant unread
 *   - admin   → sum of unread messages across all of admin's threads
 *   - client  → sum of unread messages across all of client's threads
 *
 * Live-updates via the same realtime channels the inbox hooks use.
 */
export function useUnreadTotal(args: {
  role: "owner" | "admin" | "client" | undefined;
  studioId: string | undefined;
  myMemberId: string | undefined;
}) {
  const { role } = args;
  const personal = useChatThreads({
    myMemberId: role === "owner" ? undefined : args.myMemberId,
  });
  const studio = useStudioThreads({
    studioId: role === "owner" ? args.studioId : undefined,
    filter: "unread",
  });

  if (role === "owner") return studio.threads.length;
  return personal.threads.reduce((sum, t) => sum + t.unreadCount, 0);
}

// ─────────── useStudioThreads (owner inbox) ───────────

type StudioThreadsState = {
  threads: StudioThreadRow[];
  loading: boolean;
  error: string | null;
};

export function useStudioThreads(args: {
  studioId: string | undefined;
  filter: StudioThreadFilter;
}) {
  const { studioId, filter } = args;
  const instanceId = useId();
  const [state, setState] = useState<StudioThreadsState>(() => ({
    threads: [],
    loading: Boolean(studioId),
    error: null,
  }));

  const refetch = useCallback(async () => {
    if (!studioId) return;
    const supabase = createClient();
    const { data, error } = await (
      supabase.rpc as unknown as (
        fn: string,
        args: Record<string, unknown>
      ) => PromiseLike<{
        data: StudioThreadsOverviewRow[] | null;
        error: { message: string } | null;
      }>
    )("studio_threads_overview", { p_filter: filter });
    if (error) {
      setState({ threads: [], loading: false, error: error.message });
      return;
    }
    setState({
      threads: (data ?? []).map(mapStudioThreadRow),
      loading: false,
      error: null,
    });
  }, [studioId, filter]);

  useEffect(() => {
    if (!studioId) return;
    let cancelled = false;
    setState((s) => ({ ...s, loading: true }));

    refetch().catch(() => {
      /* refetch captures error into state */
    });

    // Realtime: any message insert in this studio's threads → refetch overview.
    const supabase = createClient();
    const channel = supabase
      .channel(`chat:owner-inbox:${studioId}:${instanceId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        () => {
          if (cancelled) return;
          refetch().catch(() => {});
        }
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [studioId, filter, instanceId, refetch]);

  return { ...state, refetch };
}

function mapStudioThreadRow(r: StudioThreadsOverviewRow): StudioThreadRow {
  return {
    threadId: r.thread_id,
    studioId: r.studio_id,
    clientMemberId: r.client_member_id,
    clientName: r.client_name,
    clientHue: r.client_hue,
    adminMemberId: r.admin_member_id,
    adminName: r.admin_name,
    adminHue: r.admin_hue,
    lastMessageAt: r.last_message_at,
    lastMessageBody: r.last_message_body,
    lastMessageRole: (r.last_message_role as SenderRole) ?? null,
    lastMessageSenderId: r.last_message_sender_id,
    unreadAny: Boolean(r.unread_any),
  };
}

// ─────────── Local-shape types ───────────

type MyThreadsOverviewRow = {
  thread_id: string;
  studio_id: string;
  my_member_id: string;
  other_member_id: string | null;
  other_name: string | null;
  other_hue: number | null;
  last_message_at: string | null;
  last_message_body: string | null;
  last_message_sender_member_id: string | null;
  last_message_sender_role: string | null;
  unread_count: number | null;
};

type StudioThreadsOverviewRow = {
  thread_id: string;
  studio_id: string;
  client_member_id: string | null;
  client_name: string | null;
  client_hue: number | null;
  admin_member_id: string | null;
  admin_name: string | null;
  admin_hue: number | null;
  last_message_at: string | null;
  last_message_body: string | null;
  last_message_role: string | null;
  last_message_sender_id: string | null;
  unread_any: boolean | null;
};

type MessageInsertPayload = {
  id: string;
  thread_id: string;
  sender_member_id: string;
  sender_role: string | null;
  body: string;
  kind: string | null;
  attached_booking_id: string | null;
  created_at: string;
};
