"use client";

import { useState } from "react";
import { Send, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HueAvatar } from "@/components/shared";
import { CLIENT_THREADS, CLIENT_CHAT_MESSAGES, type MessageThread, type ChatMessage } from "@/lib/data";
import { cn } from "@/lib/utils";

export function ClientMessages() {
  const [activeThread, setActiveThread] = useState<string>(CLIENT_THREADS[0].id);
  const [showChat, setShowChat] = useState(false);
  const thread = CLIENT_THREADS.find((t) => t.id === activeThread)!;

  function openThread(id: string) {
    setActiveThread(id);
    setShowChat(true);
  }

  return (
    <div className="flex-1 flex overflow-hidden">
      {/* Thread list */}
      <div
        className={cn(
          "w-full lg:w-80 border-r border-border flex flex-col shrink-0",
          showChat ? "hidden lg:flex" : "flex"
        )}
      >
        <div className="px-4 py-3 border-b border-border">
          <h2 className="text-[15px] font-semibold tracking-tight">Messages</h2>
        </div>
        <div className="flex-1 overflow-auto">
          {CLIENT_THREADS.map((t) => (
            <ThreadRow
              key={t.id}
              thread={t}
              active={t.id === activeThread}
              onClick={() => openThread(t.id)}
            />
          ))}
        </div>
      </div>

      {/* Chat pane */}
      <div
        className={cn(
          "flex-1 flex flex-col min-w-0",
          !showChat ? "hidden lg:flex" : "flex"
        )}
      >
        {/* Chat header */}
        <div className="px-4 py-3 border-b border-border flex items-center gap-3">
          <button
            className="lg:hidden p-1 -ml-1"
            onClick={() => setShowChat(false)}
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <HueAvatar name={thread.name} hue={thread.hue} size={32} />
          <div>
            <div className="text-[13px] font-medium">{thread.name}</div>
            {thread.online && (
              <div className="text-[11px] text-[--pos]">Online</div>
            )}
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-auto p-4 space-y-3">
          {CLIENT_CHAT_MESSAGES.map((msg) => (
            <ChatBubble key={msg.id} message={msg} />
          ))}
        </div>

        {/* Input */}
        <div className="border-t border-border p-3">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Type a message..."
              className="flex-1 h-9 rounded-lg border border-border bg-background px-3 text-[13px] outline-none focus:border-foreground transition-colors"
            />
            <Button size="icon" className="shrink-0">
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ThreadRow({
  thread,
  active,
  onClick,
}: {
  thread: MessageThread;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 px-4 py-3 text-left transition-colors",
        active ? "bg-muted" : "hover:bg-muted/50"
      )}
    >
      <div className="relative shrink-0">
        <HueAvatar name={thread.name} hue={thread.hue} size={36} />
        {thread.online && (
          <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-[--pos] rounded-full border-2 border-background" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-0.5">
          <span className="text-[13px] font-medium truncate">{thread.name}</span>
          <span className="text-[11px] text-muted-foreground shrink-0 ml-2">
            {thread.time}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[12px] text-muted-foreground truncate">
            {thread.lastMsg}
          </span>
          {thread.unread > 0 && (
            <span className="w-5 h-5 rounded-full bg-foreground text-background text-[10px] font-bold grid place-items-center shrink-0 ml-2">
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
    <div className={cn("flex", isMe ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[75%] rounded-2xl px-3.5 py-2.5",
          isMe
            ? "bg-foreground text-background rounded-br-md"
            : "bg-muted rounded-bl-md"
        )}
      >
        <p className="text-[13px] leading-relaxed">{message.text}</p>
        <p
          className={cn(
            "text-[10px] mt-1",
            isMe ? "text-background/50" : "text-muted-foreground"
          )}
        >
          {message.time}
        </p>
      </div>
    </div>
  );
}
