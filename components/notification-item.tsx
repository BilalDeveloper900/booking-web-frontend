"use client";

import * as React from "react";
import Link from "next/link";
import {
  Bell,
  Calendar,
  CalendarX,
  CreditCard,
  Gift,
  MinusCircle,
  RotateCcw,
} from "lucide-react";
import { PopoverClose } from "@/components/ui/popover";
import type { NotificationKind, NotificationRow } from "@/lib/notifications";
import { cn } from "@/lib/utils";

interface NotificationItemProps {
  item: NotificationRow;
  onActivate: () => void;
  /**
   * When true (inside a Popover), wraps the link in PopoverClose so navigation
   * also closes the dropdown. For the standalone page, set to false.
   */
  closePopover?: boolean;
}

export function NotificationItem({
  item,
  onActivate,
  closePopover = false,
}: NotificationItemProps) {
  const Icon = ICON_BY_KIND[item.kind] ?? Bell;
  const unread = item.readAt === null;
  const content = (
    <div
      className={cn(
        "flex items-start gap-2.5 px-3 py-2.5 mx-1 rounded-md motion-safe:transition-colors motion-safe:duration-100 focus-visible:outline-none focus-visible:bg-muted",
        unread ? "bg-muted/50 hover:bg-muted" : "hover:bg-muted"
      )}
    >
      <span
        className={cn(
          "mt-0.5 w-7 h-7 grid place-items-center rounded-full shrink-0",
          unread
            ? "bg-[--primary]/12 text-[--primary]"
            : "bg-muted text-muted-foreground"
        )}
        aria-hidden
      >
        <Icon className="w-3.5 h-3.5" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <span
            className={cn(
              "text-[13px] truncate",
              unread ? "font-semibold" : "font-medium"
            )}
          >
            {item.title}
          </span>
          <span className="ml-auto text-[10px] text-muted-foreground tabular-nums shrink-0">
            {formatRelative(item.createdAt)}
          </span>
        </div>
        {item.body && (
          <div className="text-[12px] text-muted-foreground mt-0.5 line-clamp-2">
            {item.body}
          </div>
        )}
      </div>
      {unread && (
        <span
          aria-hidden
          className="mt-2 w-1.5 h-1.5 rounded-full bg-[--primary] shrink-0"
        />
      )}
    </div>
  );

  const ariaLabel = `${item.title}${item.body ? " — " + item.body : ""}`;

  if (item.href) {
    const link = (
      <Link
        href={item.href}
        onClick={onActivate}
        className="block w-full text-left"
        aria-label={ariaLabel}
      >
        {content}
      </Link>
    );
    return closePopover ? <PopoverClose render={link} /> : link;
  }

  return (
    <button
      type="button"
      onClick={onActivate}
      className="block w-full text-left"
      aria-label={ariaLabel}
    >
      {content}
    </button>
  );
}

const ICON_BY_KIND: Record<
  NotificationKind,
  React.ComponentType<{ className?: string }>
> = {
  booking_created: Calendar,
  booking_cancelled: CalendarX,
  credit_topup: CreditCard,
  credit_gift: Gift,
  credit_refund: RotateCcw,
  credit_adjustment: MinusCircle,
};

export function formatRelative(iso: string): string {
  const then = new Date(iso).getTime();
  const now = Date.now();
  const secs = Math.max(0, Math.floor((now - then) / 1000));
  if (secs < 60) return "now";
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `${weeks}w`;
  return new Date(iso).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
  });
}
