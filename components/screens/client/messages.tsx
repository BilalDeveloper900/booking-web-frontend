"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Send, ArrowLeft, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HueAvatar } from "@/components/shared";
import { useCurrentMember } from "@/lib/auth/use-current-member";
import {
  useChatThreads,
  useChatMessages,
  sendChatMessage,
  markThreadRead,
  type ChatThreadRow,
} from "@/lib/chat";
import { cn } from "@/lib/utils";

export function ClientMessages() {
  const { member } = useCurrentMember();
  const myMemberId = member?.member.id;
  const searchParams = useSearchParams();
  const requestedThreadId = searchParams.get("thread") ?? undefined;

  const { threads, loading: threadsLoading, refetch: refetchThreads } =
    useChatThreads({ myMemberId });

  const [selectedId, setSelectedId] = useState<string | undefined>(undefined);
  const [showChat, setShowChat] = useState(() => Boolean(requestedThreadId));
  const [inputValue, setInputValue] = useState("");
  const [sending, setSending] = useState(false);

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

  useEffect(() => {
    if (!activeId || !myMemberId) return;
    if (messages.length === 0 && messagesLoading) return;
    markThreadRead({ threadId: activeId, myMemberId })
      .then(() => refetchThreads())
      .catch((e) => console.error("[client/messages] markThreadRead:", e));
  }, [activeId, myMemberId, messages.length, messagesLoading, refetchThreads]);

  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [activeId, messages.length]);

  function openThread(id: string) {
    setSelectedId(id);
    setShowChat(true);
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
      console.error("[client/messages] sendChatMessage:", e);
      setInputValue(trimmed);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex-1 flex overflow-hidden">
      <div
        className={cn(
          "w-full lg:w-80 border-r border-border flex flex-col shrink-0 bg-card",
          showChat ? "hidden lg:flex" : "flex"
        )}
      >
        <div className="px-4 py-3 border-b border-border">
          <div className="text-[24px] font-semibold tracking-tight leading-tight mb-3">Messages</div>
          <button
            type="button"
            aria-label="Search messages"
            className="flex items-center gap-2 bg-muted/70 hover:bg-muted px-3 py-1.5 rounded-lg w-full text-left motion-safe:transition-colors motion-safe:duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card"
          >
            <Search className="w-3.5 h-3.5 text-muted-foreground" aria-hidden />
            <span className="text-[13px] text-muted-foreground">Search…</span>
          </button>
        </div>
        <div className="flex-1 overflow-auto">
          {threadsLoading && (
            <div className="px-4 py-6 text-sm text-muted-foreground">Loading…</div>
          )}
          {!threadsLoading && threads.length === 0 && (
            <div className="px-4 py-6 text-sm text-muted-foreground">
              No conversations yet.
            </div>
          )}
          {threads.map((t) => (
            <ThreadRow
              key={t.threadId}
              thread={t}
              active={t.threadId === activeId}
              onClick={() => openThread(t.threadId)}
            />
          ))}
        </div>
      </div>

      <div
        className={cn(
          "flex-1 flex flex-col min-w-0",
          !showChat ? "hidden lg:flex" : "flex"
        )}
      >
        {activeThread ? (
          <>
            <div className="px-4 py-3 border-b border-border flex items-center gap-3 bg-card">
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Back to messages"
                onClick={() => setShowChat(false)}
                className="lg:hidden"
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <HueAvatar name={activeThread.otherName} hue={activeThread.otherHue} size={32} />
              <div className="leading-tight">
                <div className="text-[13px] font-medium">{activeThread.otherName}</div>
              </div>
            </div>

            <div ref={scrollRef} className="flex-1 overflow-auto p-4 space-y-3">
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
                <ChatBubble
                  key={m.id}
                  body={m.body}
                  time={timeStamp(m.createdAt)}
                  fromMe={m.fromMe}
                />
              ))}
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                send(inputValue);
              }}
              className="border-t border-border p-3 bg-card"
            >
              <div className="flex gap-2">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Type a message…"
                  className="flex-1 h-9 rounded-lg border border-transparent bg-muted/70 hover:bg-muted focus:bg-muted focus:border-ring px-3 text-[13px] outline-none motion-safe:transition-colors motion-safe:duration-150"
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
              </div>
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

function ThreadRow({
  thread,
  active,
  onClick,
}: {
  thread: ChatThreadRow;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "w-full flex items-center gap-3 px-4 py-3 text-left motion-safe:transition-colors motion-safe:duration-150 hover:bg-muted/50 focus-visible:outline-none focus-visible:bg-muted",
        active && "bg-muted"
      )}
    >
      <HueAvatar name={thread.otherName} hue={thread.otherHue} size={36} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-0.5 gap-2">
          <span className="text-[13px] font-medium truncate">{thread.otherName}</span>
          <span className="text-[11px] text-muted-foreground shrink-0 tabular-nums">
            {thread.lastMessageAt ? relativeTime(thread.lastMessageAt) : ""}
          </span>
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className="text-[12px] text-muted-foreground truncate">
            {thread.lastMessageBody ?? "Conversation started"}
          </span>
          {thread.unreadCount > 0 && !active && (
            <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold grid place-items-center shrink-0 tabular-nums">
              {thread.unreadCount}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}

function ChatBubble({
  body,
  time,
  fromMe,
}: {
  body: string;
  time: string;
  fromMe: boolean;
}) {
  return (
    <div
      className={cn(
        "flex motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-1 motion-safe:duration-200",
        fromMe ? "justify-end" : "justify-start"
      )}
    >
      <div
        className={cn(
          "max-w-[75%] rounded-2xl px-3.5 py-2.5",
          fromMe
            ? "bg-primary text-primary-foreground rounded-br-md"
            : "bg-muted rounded-bl-md"
        )}
      >
        <p className="text-[13px] leading-relaxed">{body}</p>
        <p
          className={cn(
            "text-[10px] mt-1 tabular-nums",
            fromMe ? "text-primary-foreground/60" : "text-muted-foreground"
          )}
        >
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
