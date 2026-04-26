"use client";

import { useState } from "react";
import { Search, Send, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HueAvatar, PersonCell } from "@/components/shared";
import {
  STYLIST_THREADS,
  STYLIST_CHAT_MESSAGES,
  type MessageThread,
} from "@/lib/data";

const QUICK_REPLIES = [
  "On my way!",
  "Running 5 min late",
  "See you soon!",
  "Send booking link",
];

export function StylistMessages() {
  const [activeId, setActiveId] = useState<string>(STYLIST_THREADS[0].id);
  const [showConvo, setShowConvo] = useState(false);

  const activeThread = STYLIST_THREADS.find((t) => t.id === activeId)!;

  function selectThread(t: MessageThread) {
    setActiveId(t.id);
    setShowConvo(true);
  }

  return (
    <div className="flex-1 flex overflow-hidden">
      {/* Thread list — hidden on mobile when viewing conversation */}
      <div
        className={`w-full lg:w-80 lg:min-w-[280px] xl:w-[340px] shrink-0 border-r border-border flex flex-col bg-card ${
          showConvo ? "hidden lg:flex" : "flex"
        }`}
      >
        {/* Search */}
        <div className="px-4 py-3 border-b border-border">
          <div className="flex items-center gap-2 bg-muted px-3 py-1.5 rounded-lg">
            <Search className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-[13px] text-muted-foreground">
              Search messages…
            </span>
          </div>
        </div>

        {/* Thread list */}
        <div className="flex-1 overflow-auto">
          {STYLIST_THREADS.map((t) => (
            <button
              key={t.id}
              onClick={() => selectThread(t)}
              className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/50 ${
                t.id === activeId ? "bg-accent" : ""
              }`}
            >
              <div className="relative shrink-0">
                <HueAvatar name={t.name} hue={t.hue} size={36} />
                {t.online && (
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-card" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-[13px] font-medium truncate">
                    {t.name}
                  </span>
                  <span className="text-[10px] text-muted-foreground shrink-0 ml-2">
                    {t.time}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground truncate">
                  {t.lastMsg}
                </div>
              </div>
              {t.unread > 0 && (
                <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground text-[10px] font-medium grid place-items-center shrink-0">
                  {t.unread}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Conversation pane — hidden on mobile when viewing thread list */}
      <div
        className={`flex-1 flex flex-col min-w-0 ${
          showConvo ? "flex" : "hidden lg:flex"
        }`}
      >
        {/* Conversation header */}
        <div className="flex items-center gap-3 px-4 lg:px-6 py-3 border-b border-border bg-card">
          <button
            onClick={() => setShowConvo(false)}
            className="lg:hidden p-1 -ml-1 text-muted-foreground"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <PersonCell
            name={activeThread.name}
            meta={activeThread.online ? "Online" : "Offline"}
            hue={activeThread.hue}
          />
          <div className="flex-1" />
          <Button variant="outline" size="sm">
            View bookings
          </Button>
        </div>

        {/* Messages area */}
        <div className="flex-1 overflow-auto p-4 lg:p-6 flex flex-col gap-3">
          {STYLIST_CHAT_MESSAGES.map((m) => (
            <div
              key={m.id}
              className={`max-w-[75%] ${
                m.sender === "me" ? "ml-auto" : "mr-auto"
              }`}
            >
              <div
                className={`px-4 py-2.5 text-[13px] leading-relaxed ${
                  m.sender === "me"
                    ? "bg-primary text-primary-foreground rounded-2xl rounded-br-md"
                    : "bg-muted rounded-2xl rounded-bl-md"
                }`}
              >
                {m.text}
              </div>
              <div
                className={`text-[10px] text-muted-foreground mt-1 ${
                  m.sender === "me" ? "text-right" : "text-left"
                }`}
              >
                {m.time}
              </div>
            </div>
          ))}
        </div>

        {/* Quick reply chips */}
        <div className="flex items-center gap-2 px-4 lg:px-6 pb-2 flex-wrap">
          {QUICK_REPLIES.map((r) => (
            <button
              key={r}
              className="text-xs px-3 py-1.5 rounded-full border border-border bg-card hover:bg-muted transition-colors"
            >
              {r}
            </button>
          ))}
        </div>

        {/* Input bar */}
        <div className="flex items-center gap-3 px-4 lg:px-6 py-3 border-t border-border bg-card">
          <div className="flex-1 flex items-center bg-muted rounded-lg px-4 py-2.5">
            <span className="text-[13px] text-muted-foreground">
              Type a message…
            </span>
          </div>
          <Button size="icon" className="shrink-0 w-9 h-9">
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
