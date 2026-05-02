"use client";

import { useEffect, useRef, useState } from "react";
import { Send, ArrowLeft, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HueAvatar } from "@/components/shared";
import {
  CLIENT_THREADS,
  CLIENT_CHAT_MESSAGES,
  type ChatMessage,
  type MessageThread,
} from "@/lib/data";
import { cn } from "@/lib/utils";

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

export function ClientMessages() {
  const [activeThread, setActiveThread] = useState<string>(CLIENT_THREADS[0].id);
  const [showChat, setShowChat] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [messagesByThread, setMessagesByThread] = useState<Record<string, ChatMessage[]>>(
    () => ({ [CLIENT_THREADS[0].id]: [...CLIENT_CHAT_MESSAGES] })
  );

  const thread = CLIENT_THREADS.find((t) => t.id === activeThread)!;
  const messages = messagesByThread[activeThread] ?? [];
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [activeThread, messages.length]);

  function openThread(id: string) {
    setActiveThread(id);
    setShowChat(true);
    setInputValue("");
    setMessagesByThread((prev) =>
      prev[id] ? prev : { ...prev, [id]: [...CLIENT_CHAT_MESSAGES] }
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
      [activeThread]: [...(prev[activeThread] ?? CLIENT_CHAT_MESSAGES), msg],
    }));
    setInputValue("");
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
          {CLIENT_THREADS.map((t) => (
            <ThreadRow
              key={t.id}
              thread={t}
              active={t.id === activeThread}
              lastMsg={messagesByThread[t.id]?.at(-1)}
              onClick={() => openThread(t.id)}
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
          <HueAvatar name={thread.name} hue={thread.hue} size={32} />
          <div className="leading-tight">
            <div className="text-[13px] font-medium">{thread.name}</div>
            {thread.online && (
              <div className="text-[11px] text-[--pos]">Online</div>
            )}
          </div>
        </div>

        <div ref={scrollRef} className="flex-1 overflow-auto p-4 space-y-3">
          {messages.map((msg) => (
            <ChatBubble key={msg.id} message={msg} />
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
          </div>
        </form>
      </div>
    </div>
  );
}

function ThreadRow({
  thread,
  active,
  lastMsg,
  onClick,
}: {
  thread: MessageThread;
  active: boolean;
  lastMsg?: ChatMessage;
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
      <div className="relative shrink-0">
        <HueAvatar name={thread.name} hue={thread.hue} size={36} />
        {thread.online && (
          <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-[--pos] rounded-full border-2 border-card" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-0.5 gap-2">
          <span className="text-[13px] font-medium truncate">{thread.name}</span>
          <span className="text-[11px] text-muted-foreground shrink-0 tabular-nums">
            {lastMsg?.time ?? thread.time}
          </span>
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className="text-[12px] text-muted-foreground truncate">
            {lastMsg?.text ?? thread.lastMsg}
          </span>
          {thread.unread > 0 && !active && (
            <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold grid place-items-center shrink-0 tabular-nums">
              {thread.unread}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}

function ChatBubble({ message }: { message: ChatMessage }) {
  const isMe = message.sender === "me";
  return (
    <div
      className={cn(
        "flex motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-1 motion-safe:duration-200",
        isMe ? "justify-end" : "justify-start"
      )}
    >
      <div
        className={cn(
          "max-w-[75%] rounded-2xl px-3.5 py-2.5",
          isMe
            ? "bg-primary text-primary-foreground rounded-br-md"
            : "bg-muted rounded-bl-md"
        )}
      >
        <p className="text-[13px] leading-relaxed">{message.text}</p>
        <p
          className={cn(
            "text-[10px] mt-1 tabular-nums",
            isMe ? "text-primary-foreground/60" : "text-muted-foreground"
          )}
        >
          {message.time}
        </p>
      </div>
    </div>
  );
}
