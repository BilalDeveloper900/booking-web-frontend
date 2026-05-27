"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight, CheckCheck } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
  PopoverClose,
} from "@/components/ui/popover";
import { NotificationItem } from "@/components/notification-item";
import { useNotificationsContext } from "@/components/notifications-provider";

const DROPDOWN_LIMIT = 3;

interface NotificationsPopoverProps {
  trigger: React.ReactNode;
  /** Link target for the "See all" footer, e.g. `/owner/notifications`. */
  seeAllHref: string;
  align?: "start" | "center" | "end";
  side?: "top" | "right" | "bottom" | "left";
  sideOffset?: number;
}

export function NotificationsPopover({
  trigger,
  seeAllHref,
  align = "end",
  side = "bottom",
  sideOffset = 10,
}: NotificationsPopoverProps) {
  const { items, loading, unread, markRead, markAllRead } =
    useNotificationsContext();

  // Dropdown shows only unread, capped at DROPDOWN_LIMIT — once read, items
  // disappear from here and live only on the full /notifications page.
  const unreadItems = items.filter((i) => i.readAt === null);
  const visible = unreadItems.slice(0, DROPDOWN_LIMIT);

  return (
    <Popover>
      <PopoverTrigger render={trigger as React.ReactElement} />
      <PopoverContent
        align={align}
        side={side}
        sideOffset={sideOffset}
        className="w-[22rem] sm:w-[26rem] p-0 flex flex-col"
      >
        <div className="flex items-center justify-between px-3 py-2.5 border-b border-border">
          <div className="text-[13px] font-semibold">Notifications</div>
          <button
            type="button"
            onClick={markAllRead}
            disabled={unread === 0}
            className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground disabled:opacity-40 disabled:cursor-not-allowed motion-safe:transition-colors motion-safe:duration-150"
          >
            <CheckCheck className="w-3.5 h-3.5" aria-hidden />
            Mark all read
          </button>
        </div>

        <div className="flex-1">
          {loading ? (
            <EmptyState text="Loading…" />
          ) : visible.length === 0 ? (
            <EmptyState text="You're all caught up." />
          ) : (
            <ul className="py-1">
              {visible.map((n) => (
                <li key={n.id}>
                  <NotificationItem
                    item={n}
                    onActivate={() => markRead(n.id)}
                    closePopover
                  />
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="border-t border-border">
          <PopoverClose
            render={
              <Link
                href={seeAllHref}
                className="flex items-center justify-center gap-1.5 px-3 py-2.5 text-[12px] font-medium text-foreground hover:bg-muted motion-safe:transition-colors motion-safe:duration-150 focus-visible:outline-none focus-visible:bg-muted"
              >
                See all notifications
                <ArrowRight className="w-3.5 h-3.5" aria-hidden />
              </Link>
            }
          />
        </div>
      </PopoverContent>
    </Popover>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="px-3 py-10 text-center text-[12px] text-muted-foreground">
      {text}
    </div>
  );
}
