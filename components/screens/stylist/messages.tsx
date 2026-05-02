"use client";

import { useEffect, useRef, useState } from "react";
import { Search, Send, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HueAvatar, PersonCell } from "@/components/shared";
import {
  STYLIST_THREADS,
  STYLIST_CHAT_MESSAGES,
  type ChatMessage,
  type MessageThread,
} from "@/lib/data";
import { cn } from "@/lib/utils";

const QUICK_REPLIES = [
  "On my way!",
  "Running 5 min late",
  "See you soon!",
  "Send booking link",
];

function nowStamp() {
  return new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

function newId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `m-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function StylistMessages() {
  const [activeId, setActiveId] = useState<string>(STYLIST_THREADS[0].id);
  const [showConvo, setShowConvo] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [messagesByThread, setMessagesByThread] = useState<Record<string, ChatMessage[]>>(
    () => ({ [STYLIST_THREADS[0].id]: [...STYLIST_CHAT_MESSAGES] })
  );

  const activeThread = STYLIST_THREADS.find((t) => t.id === activeId)!;
  const messages = messagesByThread[activeId] ?? [];
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new message or thread switch
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [activeId, messages.length]);

  function selectThread(t: MessageThread) {
    setActiveId(t.id);
    setShowConvo(true);
    setInputValue("");
    // Lazy-init each thread with the demo log the first time it's opened
    setMessagesByThread((prev) =>
      prev[t.id] ? prev : { ...prev, [t.id]: [...STYLIST_CHAT_MESSAGES] }
    );
  }

  function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed) return;
    const msg: ChatMessage = {
      id: newId(),
      sender: "me",
      text: trimmed,
      time: nowStamp(),
    };
    setMessagesByThread((prev) => ({
      ...prev,
      [activeId]: [...(prev[activeId] ?? STYLIST_CHAT_MESSAGES), msg],
    }));
    setInputValue("");
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
          {STYLIST_THREADS.map((t) => {
            const last = messagesByThread[t.id]?.at(-1);
            return (
              <button
                key={t.id}
                onClick={() => selectThread(t)}
                aria-pressed={t.id === activeId}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 text-left motion-safe:transition-colors motion-safe:duration-150 hover:bg-muted/50 focus-visible:outline-none focus-visible:bg-muted",
                  t.id === activeId && "bg-muted"
                )}
              >
                <div className="relative shrink-0">
                  <HueAvatar name={t.name} hue={t.hue} size={36} />
                  {t.online && (
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-[--pos] border-2 border-card" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between mb-0.5 gap-2">
                    <span className="text-[13px] font-medium truncate">{t.name}</span>
                    <span className="text-[10px] text-muted-foreground shrink-0 tabular-nums">
                      {last?.time ?? t.time}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground truncate">
                    {last?.text ?? t.lastMsg}
                  </div>
                </div>
                {t.unread > 0 && t.id !== activeId && (
                  <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground text-[10px] font-medium grid place-items-center shrink-0 tabular-nums">
                    {t.unread}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div
        className={cn(
          "flex-1 flex flex-col min-w-0",
          showConvo ? "flex" : "hidden lg:flex"
        )}
      >
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
          <PersonCell
            name={activeThread.name}
            meta={activeThread.online ? "Online" : "Offline"}
            hue={activeThread.hue}
          />
          <div className="flex-1" />
          <Button variant="outline" size="sm">View bookings</Button>
        </div>

        <div ref={scrollRef} className="flex-1 overflow-auto p-4 lg:p-6 flex flex-col gap-3">
          {messages.map((m) => (
            <div
              key={m.id}
              className={cn(
                "max-w-[75%] motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-1 motion-safe:duration-200",
                m.sender === "me" ? "ml-auto" : "mr-auto"
              )}
            >
              <div
                className={cn(
                  "px-4 py-2.5 text-[13px] leading-relaxed",
                  m.sender === "me"
                    ? "bg-primary text-primary-foreground rounded-2xl rounded-br-md"
                    : "bg-muted rounded-2xl rounded-bl-md"
                )}
              >
                {m.text}
              </div>
              <div
                className={cn(
                  "text-[10px] text-muted-foreground mt-1 tabular-nums",
                  m.sender === "me" ? "text-right" : "text-left"
                )}
              >
                {m.time}
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-2 px-4 lg:px-6 pb-2 flex-wrap">
          {QUICK_REPLIES.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => send(r)}
              className="text-xs px-3 py-1.5 rounded-full border border-border bg-card hover:bg-muted hover:border-[--role-accent] motion-safe:transition-colors motion-safe:duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
          />
          <Button
            type="submit"
            size="icon"
            aria-label="Send message"
            className="shrink-0"
            disabled={inputValue.trim().length === 0}
          >
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
