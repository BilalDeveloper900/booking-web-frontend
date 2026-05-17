/**
 * Shared chat bubble. Renders three variants:
 *   - booking_event  → centered system card (📅 / ❌ + body)
 *   - owner reply    → side-aligned with "Studio owner" badge
 *   - regular text   → primary (fromMe) or muted (theirs)
 */
"use client";

import { Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ChatMessageRow } from "@/lib/chat";

export function ChatMessage({
  message,
  alignFromMe = true,
}: {
  message: ChatMessageRow;
  /** When false (owner inbox), always show messages on the left regardless of fromMe. */
  alignFromMe?: boolean;
}) {
  const { kind, body, fromMe, senderRole, createdAt } = message;
  const time = formatTime(createdAt);

  if (kind === "booking_event") {
    return (
      <div className="flex justify-center my-1">
        <div className="text-[12px] text-muted-foreground bg-muted/60 rounded-full px-3 py-1.5 max-w-[85%] text-center">
          {body}
        </div>
      </div>
    );
  }

  const isOwner = senderRole === "owner";
  const sideRight = alignFromMe && fromMe;

  // Owner messages get a distinct visual no matter who is viewing.
  if (isOwner) {
    return (
      <div className={cn("flex flex-col", sideRight ? "items-end" : "items-start")}>
        <span className="inline-flex items-center gap-1 mb-1 px-1.5 py-0.5 rounded-full bg-[--role-accent-light] text-[--role-accent-dark] text-[10px] font-medium">
          <Shield className="w-2.5 h-2.5" /> Studio owner
        </span>
        <div
          className={cn(
            "max-w-[75%] rounded-2xl px-3.5 py-2.5 bg-[--role-accent-light] text-[--role-accent-dark] border border-[--role-accent]/30",
            sideRight ? "rounded-tr-md" : "rounded-tl-md"
          )}
        >
          <p className="text-[13px] leading-relaxed">{body}</p>
          <p className="text-[10px] mt-1 text-[--role-accent-dark]/70 tabular-nums">
            {time}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex", sideRight ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[75%] rounded-2xl px-3.5 py-2.5",
          sideRight
            ? "bg-primary text-primary-foreground rounded-br-md"
            : "bg-muted rounded-bl-md"
        )}
      >
        <p className="text-[13px] leading-relaxed whitespace-pre-wrap">{body}</p>
        <p
          className={cn(
            "text-[10px] mt-1 tabular-nums",
            sideRight ? "text-primary-foreground/60" : "text-muted-foreground"
          )}
        >
          {time}
        </p>
      </div>
    </div>
  );
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
}
