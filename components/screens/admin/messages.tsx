"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Search, Send, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HueAvatar, PersonCell } from "@/components/shared";
import { ChatMessage } from "@/components/chat-message";
import { useCurrentMember } from "@/lib/auth/use-current-member";
import {
  useChatThreads,
  useChatMessages,
  sendChatMessage,
  markThreadRead,
  type ChatThreadRow,
} from "@/lib/chat";
import { cn } from "@/lib/utils";

const QUICK_REPLIES = [
  "On my way!",
  "Running 5 min late",
  "See you soon!",
  "Send booking link",
];

export function AdminMessages() {
  const { member } = useCurrentMember();
  const myMemberId = member?.member.id;
  const searchParams = useSearchParams();
  const requestedThreadId = searchParams.get("thread") ?? undefined;

  const { threads, loading: threadsLoading, refetch: refetchThreads } =
    useChatThreads({ myMemberId });

  const [selectedId, setSelectedId] = useState<string | undefined>(undefined);
  // Initial mobile state: if we deep-linked to a thread, show it; otherwise
  // show the inbox.
  const [showConvo, setShowConvo] = useState(() => Boolean(requestedThreadId));
  const [inputValue, setInputValue] = useState("");
  const [sending, setSending] = useState(false);

  // Effective active thread is derived: user pick > URL param > first thread.
  // We derive instead of writing to state so we don't violate
  // react-hooks/set-state-in-effect.
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

  // Mark as read when opening / receiving in the active thread.
  useEffect(() => {
    if (!activeId || !myMemberId) return;
    if (messages.length === 0 && messagesLoading) return;
    markThreadRead({ threadId: activeId, myMemberId })
      .then(() => refetchThreads())
      .catch((e) => console.error("[admin/messages] markThreadRead:", e));
  }, [activeId, myMemberId, messages.length, messagesLoading, refetchThreads]);

  // Auto-scroll on new message or thread switch.
  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [activeId, messages.length]);

  function selectThread(t: ChatThreadRow) {
    setSelectedId(t.threadId);
    setShowConvo(true);
    setInputValue("");
  }

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || !activeId || !myMemberId || sending) return;
    setSending(true);
    setInputValue("");
    try {
      await sendChatMessage({
        threadId: activeId,
        senderMemberId: myMemberId,
        body: trimmed,
      });
    } catch (e) {
      console.error("[admin/messages] sendChatMessage:", e);
      setInputValue(trimmed); // restore on failure
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex-1 flex overflow-hidden">
      <div
        className={cn(
          "w-full lg:w-80 lg:min-w-70 xl:w-85 shrink-0 border-r border-border flex flex-col bg-card",
          showConvo ? "hidden lg:flex" : "flex"
        )}
      >
        <div className="px-4 py-3 border-b border-border">
          <button
            type="button"
            aria-label="Search messages"
            className="flex items-center gap-2 bg-muted/70 hover:bg-muted px-3 py-1.5 rounded-lg w-full text-left motion-safe:transition-colors motion-safe:duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card"
          >
            <Search className="w-3.5 h-3.5 text-muted-foreground" aria-hidden />
            <span className="text-[13px] text-muted-foreground">Search messages…</span>
          </button>
        </div>

        <div className="flex-1 overflow-auto">
          {threadsLoading && (
            <div className="px-4 py-6 text-sm text-muted-foreground">Loading…</div>
          )}
          {!threadsLoading && threads.length === 0 && (
            <div className="px-4 py-6 text-sm text-muted-foreground">
              No conversations yet. Start one from your clients list.
            </div>
          )}
          {threads.map((t) => (
            <button
              key={t.threadId}
              onClick={() => selectThread(t)}
              aria-pressed={t.threadId === activeId}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 text-left motion-safe:transition-colors motion-safe:duration-150 hover:bg-muted/50 focus-visible:outline-none focus-visible:bg-muted",
                t.threadId === activeId && "bg-muted"
              )}
            >
              <HueAvatar name={t.otherName} hue={t.otherHue} size={36} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between mb-0.5 gap-2">
                  <span className="text-[13px] font-medium truncate">{t.otherName}</span>
                  <span className="text-[10px] text-muted-foreground shrink-0 tabular-nums">
                    {t.lastMessageAt ? relativeTime(t.lastMessageAt) : ""}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground truncate">
                  {t.lastMessageBody ?? "Conversation started"}
                </div>
              </div>
              {t.unreadCount > 0 && t.threadId !== activeId && (
                <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground text-[10px] font-medium grid place-items-center shrink-0 tabular-nums">
                  {t.unreadCount}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

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
              <PersonCell name={activeThread.otherName} hue={activeThread.otherHue} />
            </div>

            <div ref={scrollRef} className="flex-1 overflow-auto p-4 lg:p-6 flex flex-col gap-3">
              {messagesLoading && messages.length === 0 && (
                <div className="text-center text-sm text-muted-foreground py-8">
                  Loading messages…
                </div>
              )}
              {!messagesLoading && messages.length === 0 && (
                <div className="text-center text-sm text-muted-foreground py-8">
                  No messages yet — say hi.
                </div>
              )}
              {messages.map((m) => (
                <ChatMessage key={m.id} message={m} />
              ))}
            </div>

            <div className="flex items-center gap-2 px-4 lg:px-6 pb-2 flex-wrap">
              {QUICK_REPLIES.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => send(r)}
                  disabled={sending}
                  className="text-xs px-3 py-1.5 rounded-full border border-border bg-card hover:bg-muted hover:border-[--role-accent] motion-safe:transition-colors motion-safe:duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
                >
                  {r}
                </button>
              ))}
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                send(inputValue);
              }}
              className="flex items-center gap-3 px-4 lg:px-6 py-3 border-t border-border bg-card"
            >
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Type a message…"
                className="flex-1 bg-muted/70 hover:bg-muted focus:bg-muted rounded-lg px-4 py-2.5 text-[13px] outline-none border border-transparent focus:border-ring motion-safe:transition-colors motion-safe:duration-150"
                aria-label="Message"
                disabled={sending}
              />
              <Button
                type="submit"
                size="icon"
                aria-label="Send message"
                className="shrink-0"
                disabled={inputValue.trim().length === 0 || sending}
              >
                <Send className="w-4 h-4" />
              </Button>
            </form>
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
