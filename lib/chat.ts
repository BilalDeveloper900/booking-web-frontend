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

import { useCallback, useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

// ─────────── Types ───────────

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
  unreadCount: number;
};

export type ChatMessageRow = {
  id: string;
  threadId: string;
  senderMemberId: string;
  body: string;
  createdAt: string;
  fromMe: boolean;
};

// ─────────── useChatThreads ───────────

type ThreadsState = {
  threads: ChatThreadRow[];
  loading: boolean;
  error: string | null;
};

export function useChatThreads(args: { myMemberId: string | undefined }) {
  const { myMemberId } = args;
  const [state, setState] = useState<ThreadsState>(() => ({
    threads: [],
    loading: Boolean(myMemberId),
    error: null,
  }));

  const refetch = useCallback(async () => {
    if (!myMemberId) return;
    const supabase = createClient();
    const { data, error } = await supabase.rpc("my_threads_overview");
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

    supabase.rpc("my_threads_overview").then(({ data, error }) => {
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
      .channel(`chat:inbox:${myMemberId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        () => {
          supabase.rpc("my_threads_overview").then(({ data, error }) => {
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
  }, [myMemberId]);

  return { ...state, refetch };
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
      .select("id, thread_id, sender_member_id, body, created_at")
      .eq("thread_id", threadId)
      .order("created_at", { ascending: true })
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) {
          setState({ messages: [], loading: false, error: error.message });
          return;
        }
        setState({
          messages: (data ?? []).map((m) => mapMessageRow(m, myMemberId)),
          loading: false,
          error: null,
        });
      });

    const channel = supabase
      .channel(`chat:thread:${threadId}`)
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
  }, [threadId, myMemberId]);

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
    body: r.body,
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
  unread_count: number | null;
};

type MessageInsertPayload = {
  id: string;
  thread_id: string;
  sender_member_id: string;
  body: string;
  created_at: string;
};
