"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, Search, Send, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HueAvatar } from "@/components/shared";
import { useCurrentMember } from "@/lib/auth/use-current-member";
import {
  useStudioThreads,
  useChatMessages,
  sendChatMessage,
  type StudioThreadRow,
  type StudioThreadFilter,
} from "@/lib/chat";
import { cn } from "@/lib/utils";

const FILTERS: { id: StudioThreadFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "today", label: "Today" },
  { id: "unread", label: "Unread" },
];

export function OwnerMessages() {
  const { member } = useCurrentMember();
  const studioId = member?.studio.id;
  const myMemberId = member?.member.id;

  const searchParams = useSearchParams();
  const requestedThreadId = searchParams.get("thread") ?? undefined;

  const [filter, setFilter] = useState<StudioThreadFilter>("all");
  const { threads, loading: threadsLoading, error: threadsError } =
    useStudioThreads({ studioId, filter });

  const [selectedId, setSelectedId] = useState<string | undefined>(undefined);
  const [showConvo, setShowConvo] = useState(() => Boolean(requestedThreadId));
  const [inputValue, setInputValue] = useState("");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);

  const activeId = useMemo<string | undefined>(() => {
    if (selectedId && threads.some((t) => t.threadId === selectedId)) {
      return selectedId;
    }
    if (
      requestedThreadId &&
      threads.some((t) => t.threadId === requestedThreadId)
    ) {
      return requestedThreadId;
    }
    return threads[0]?.threadId;
  }, [selectedId, requestedThreadId, threads]);

  const activeThread = useMemo(
    () => threads.find((t) => t.threadId === activeId),
    [threads, activeId]
  );

  const { messages, loading: messagesLoading } = useChatMessages({
    threadId: activeId,
    myMemberId,
  });

  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [activeId, messages.length]);

  function selectThread(t: StudioThreadRow) {
    setSelectedId(t.threadId);
    setShowConvo(true);
    setInputValue("");
    setSendError(null);
  }

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || !activeId || !myMemberId || sending) return;
    setSending(true);
    setSendError(null);
    setInputValue("");
    try {
      await sendChatMessage({
        threadId: activeId,
        senderMemberId: myMemberId,
        body: trimmed,
      });
    } catch (e) {
      setSendError(e instanceof Error ? e.message : String(e));
      setInputValue(trimmed);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex-1 flex overflow-hidden">
      {/* Thread list */}
      <div
        className={cn(
          "w-full lg:w-80 xl:w-96 shrink-0 border-r border-border flex flex-col bg-card",
          showConvo ? "hidden lg:flex" : "flex"
        )}
      >
        <div className="px-4 py-3 border-b border-border space-y-3">
          <div>
            <div className="text-[24px] font-semibold tracking-tight leading-tight">
              All conversations
            </div>
            <div className="text-[11px] text-muted-foreground mt-0.5">
              Read every admin↔client chat in your studio. Reply if you need
              to — your messages are tagged as the studio owner.
            </div>
          </div>
          <button
            type="button"
            aria-label="Search messages"
            className="flex items-center gap-2 bg-muted/70 hover:bg-muted px-3 py-1.5 rounded-lg w-full text-left motion-safe:transition-colors motion-safe:duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Search className="w-3.5 h-3.5 text-muted-foreground" aria-hidden />
            <span className="text-[13px] text-muted-foreground">Search…</span>
          </button>
          <div role="tablist" className="flex gap-0.5 p-0.5 bg-muted rounded-lg">
            {FILTERS.map((f) => {
              const active = filter === f.id;
              return (
                <button
                  key={f.id}
                  role="tab"
                  aria-selected={active}
                  onClick={() => setFilter(f.id)}
                  className={cn(
                    "flex-1 text-xs px-2 py-1.5 rounded-md motion-safe:transition-colors motion-safe:duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    active
                      ? "bg-card text-foreground shadow-sm font-medium"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {f.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex-1 overflow-auto">
          {threadsError && (
            <div className="px-4 py-3 text-[12px] text-[--neg]">
              {threadsError}
            </div>
          )}
          {threadsLoading && threads.length === 0 && (
            <div className="px-4 py-6 text-sm text-muted-foreground">
              Loading…
            </div>
          )}
          {!threadsLoading && threads.length === 0 && (
            <div className="px-4 py-8 text-sm text-muted-foreground text-center">
              No conversations match this filter.
            </div>
          )}
          {threads.map((t) => (
            <OwnerThreadRow
              key={t.threadId}
              thread={t}
              active={t.threadId === activeId}
              onClick={() => selectThread(t)}
            />
          ))}
        </div>
      </div>

      {/* Conversation */}
      <div
        className={cn(
          "flex-1 flex flex-col min-w-0",
          showConvo ? "flex" : "hidden lg:flex"
        )}
      >
        {activeThread ? (
          <>
            <div className="flex items-center gap-3 px-4 lg:px-6 py-3 border-b border-border bg-card">
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Back to messages"
                onClick={() => setShowConvo(false)}
                className="lg:hidden"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              {activeThread.adminName && activeThread.adminHue !== null && (
                <HueAvatar
                  name={activeThread.adminName}
                  hue={activeThread.adminHue}
                  size={32}
                />
              )}
              <div className="flex items-baseline gap-1.5 flex-wrap leading-tight min-w-0">
                <span className="text-[13px] font-medium truncate">
                  {activeThread.adminName ?? "—"}
                </span>
                <span className="text-[11px] text-muted-foreground">with</span>
                <span className="text-[13px] font-medium truncate">
                  {activeThread.clientName ?? "—"}
                </span>
              </div>
            </div>

            <div
              ref={scrollRef}
              className="flex-1 overflow-auto p-4 lg:p-6 space-y-3"
            >
              {messagesLoading && messages.length === 0 && (
                <div className="text-center text-sm text-muted-foreground py-8">
                  Loading…
                </div>
              )}
              {!messagesLoading && messages.length === 0 && (
                <div className="text-center text-sm text-muted-foreground py-8">
                  No messages in this thread yet.
                </div>
              )}
              {messages.map((m) => (
                <OwnerMessageBubble
                  key={m.id}
                  body={m.body}
                  kind={m.kind}
                  senderRole={m.senderRole}
                  senderName={
                    m.senderMemberId === activeThread.adminMemberId
                      ? activeThread.adminName ?? "Admin"
                      : m.senderMemberId === activeThread.clientMemberId
                        ? activeThread.clientName ?? "Client"
                        : "Owner"
                  }
                  time={timeStamp(m.createdAt)}
                />
              ))}
            </div>

            <div className="border-t border-border bg-card">
              {sendError && (
                <div className="px-4 lg:px-6 pt-2 text-[12px] text-[--neg]">
                  {sendError}
                </div>
              )}
              <div className="px-4 lg:px-6 pt-2 text-[11px] text-muted-foreground flex items-center gap-1.5">
                <Shield className="w-3 h-3" />
                Your replies are tagged <strong>Studio owner</strong> so
                everyone knows it&rsquo;s you.
              </div>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  send(inputValue);
                }}
                className="flex items-center gap-3 px-4 lg:px-6 py-3"
              >
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Reply as Studio owner…"
                  className="flex-1 bg-muted/70 hover:bg-muted focus:bg-muted rounded-lg px-4 py-2.5 text-[13px] outline-none border border-transparent focus:border-ring motion-safe:transition-colors motion-safe:duration-150"
                  aria-label="Reply as owner"
                  disabled={sending}
                />
                <Button
                  type="submit"
                  size="icon"
                  aria-label="Send"
                  className="shrink-0"
                  disabled={inputValue.trim().length === 0 || sending}
                >
                  <Send className="w-4 h-4" />
                </Button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 grid place-items-center text-sm text-muted-foreground">
            {threadsLoading ? "Loading…" : "Select a conversation"}
          </div>
        )}
      </div>
    </div>
  );
}

function OwnerThreadRow({
  thread,
  active,
  onClick,
}: {
  thread: StudioThreadRow;
  active: boolean;
  onClick: () => void;
}) {
  const lastFrom =
    thread.lastMessageRole === "owner"
      ? "You (owner)"
      : thread.lastMessageRole === "admin"
        ? thread.adminName ?? "Admin"
        : thread.lastMessageRole === "client"
          ? thread.clientName ?? "Client"
          : "—";

  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "w-full flex items-start gap-3 px-4 py-3 text-left motion-safe:transition-colors motion-safe:duration-150 hover:bg-muted/50 border-b border-[--line-soft]",
        active && "bg-muted"
      )}
    >
      <div className="relative shrink-0">
        {thread.adminHue !== null && (
          <HueAvatar
            name={thread.adminName ?? "?"}
            hue={thread.adminHue}
            size={28}
          />
        )}
        {thread.clientHue !== null && (
          <div className="absolute -bottom-1 -right-1 ring-2 ring-card rounded-full">
            <HueAvatar
              name={thread.clientName ?? "?"}
              hue={thread.clientHue}
              size={20}
            />
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0 pl-1">
        <div className="flex items-center justify-between gap-2 mb-0.5">
          <span className="text-[13px] font-medium truncate">
            {thread.adminName ?? "?"}{" "}
            <span className="text-muted-foreground">·</span>{" "}
            {thread.clientName ?? "?"}
          </span>
          <span className="text-[10px] text-muted-foreground shrink-0 tabular-nums">
            {thread.lastMessageAt ? relativeTime(thread.lastMessageAt) : ""}
          </span>
        </div>
        <div className="text-[12px] text-muted-foreground truncate">
          {thread.lastMessageBody
            ? `${lastFrom}: ${thread.lastMessageBody}`
            : "No messages yet"}
        </div>
      </div>
      {thread.unreadAny && !active && (
        <span
          className="w-2 h-2 rounded-full bg-[--neg] shrink-0 mt-2"
          aria-label="Unread by at least one participant"
        />
      )}
    </button>
  );
}

function OwnerMessageBubble({
  body,
  kind,
  senderRole,
  senderName,
  time,
}: {
  body: string;
  kind: string;
  senderRole: string | null;
  senderName: string;
  time: string;
}) {
  if (kind === "booking_event") {
    return (
      <div className="flex justify-center">
        <div className="text-[12px] text-muted-foreground bg-muted/50 rounded-full px-3 py-1.5 max-w-[80%] text-center">
          {body}
        </div>
      </div>
    );
  }

  const isOwner = senderRole === "owner";
  return (
    <div className="flex flex-col items-start">
      <div className="flex items-center gap-1.5 mb-1 px-1">
        <span className="text-[11px] text-muted-foreground">{senderName}</span>
        {isOwner && (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-[--role-accent-light] text-[--role-accent-dark] text-[10px] font-medium">
            <Shield className="w-2.5 h-2.5" /> Owner
          </span>
        )}
        {senderRole === "admin" && (
          <span className="text-[10px] text-muted-foreground">Admin</span>
        )}
        {senderRole === "client" && (
          <span className="text-[10px] text-muted-foreground">Client</span>
        )}
      </div>
      <div
        className={cn(
          "max-w-[75%] rounded-2xl rounded-tl-md px-3.5 py-2.5",
          isOwner
            ? "bg-[--role-accent-light] text-[--role-accent-dark] border border-[--role-accent]/30"
            : "bg-muted"
        )}
      >
        <p className="text-[13px] leading-relaxed">{body}</p>
        <p className="text-[10px] mt-1 text-muted-foreground tabular-nums">
          {time}
        </p>
      </div>
    </div>
  );
}

function timeStamp(iso: string): string {
  return new Date(iso).toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
}

function relativeTime(iso: string): string {
  const d = new Date(iso);
  const diffMs = Date.now() - d.getTime();
  const diffMin = Math.floor(diffMs / 60_000);
  if (diffMin < 1) return "now";
  if (diffMin < 60) return `${diffMin}m`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 7) return `${diffDay}d`;
  return d.toLocaleDateString([], { day: "numeric", month: "short" });
}
