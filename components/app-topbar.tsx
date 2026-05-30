"use client";

import Link from "next/link";
import { Bell, Menu, MessageSquare, Search } from "lucide-react";
import { ProfileMenu } from "@/components/profile-menu";
import { HueAvatar } from "@/components/shared";
import { useUnread } from "@/components/chat-notifications";
import { NotificationsPopover } from "@/components/notifications-popover";
import { useNotificationsContext } from "@/components/notifications-provider";
import type { RoleConfig } from "@/lib/roles";

interface AppTopbarProps {
  title: string;
  config: RoleConfig;
  onMenuClick?: () => void;
}

export function AppTopbar({ title, config, onMenuClick }: AppTopbarProps) {
  const { user, role } = config;
  const messagesHref = `/${role}/messages`;

  const unread = useUnread();
  const unreadLabel =
    unread > 0 ? `Messages — ${unread} unread` : "Messages";
  const { unread: notifUnread } = useNotificationsContext();
  const notifLabel =
    notifUnread > 0 ? `Notifications — ${notifUnread} unread` : "Notifications";

  return (
    <div className="h-16 shrink-0 border-b border-border flex items-center px-4 md:px-8 gap-5 bg-card/80 backdrop-blur supports-backdrop-filter:bg-card/70">
      {onMenuClick && (
        <button
          onClick={onMenuClick}
          aria-label="Open menu"
          className="lg:hidden w-9 h-9 grid place-items-center rounded-lg hover:bg-muted text-muted-foreground motion-safe:transition-colors motion-safe:duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card"
        >
          <Menu className="w-5 h-5" aria-hidden />
        </button>
      )}
      <h1 className="text-[17px] font-semibold tracking-tight">{title}</h1>
      {/* <button
        type="button"
        className="ml-auto hidden md:flex items-center gap-2 bg-muted/70 hover:bg-muted px-3 py-1.5 rounded-lg md:w-56 lg:w-72 text-left motion-safe:transition-colors motion-safe:duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card"
        aria-label="Search clients, bookings, services"
      >
        <Search className="w-3.5 h-3.5 text-muted-foreground" aria-hidden />
        <span className="text-[13px] text-muted-foreground flex-1">Search </span>
        <kbd className="text-[11px] text-muted-foreground font-sans tabular-nums px-1.5 py-px rounded border border-border bg-card">
          ⌘K
        </kbd>
      </button> */}
      <div className="ml-auto md:hidden" />
      <NotificationsPopover
        side="bottom"
        align="end"
        sideOffset={10}
        seeAllHref={`/${role}/notifications`}
        trigger={
          <button
            type="button"
            aria-label={notifLabel}
            className="relative md:ml-auto w-9 h-9 grid place-items-center rounded-lg hover:bg-muted text-muted-foreground motion-safe:transition-colors motion-safe:duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card data-popup-open:bg-muted data-popup-open:text-foreground"
          >
            <Bell className="w-4 h-4" aria-hidden />
            {notifUnread > 0 && (
              <span
                aria-hidden
                className="bg-muted text-muted-foreground absolute -top-0.5 -right-0.5 min-w-4.5 h-4.5 px-1 rounded-full text-[10px] font-semibold tabular-nums grid place-items-center"
              >
                {notifUnread > 99 ? "99+" : notifUnread}
              </span>
            )}
          </button>
        }
      />
      <Link
        href={messagesHref}
        aria-label={unreadLabel}
        className="relative ml-auto md:ml-0 first:ml-auto w-9 h-9 grid place-items-center rounded-lg hover:bg-muted text-muted-foreground motion-safe:transition-colors motion-safe:duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card"
      >
        <MessageSquare className="w-4 h-4" aria-hidden />
        {unread > 0 && (
          <span
            aria-hidden
            className="bg-muted text-muted-foreground absolute -top-0.5 -right-0.5 min-w-4.5 h-4.5 px-1 rounded-full text-[10px] font-semibold tabular-nums grid place-items-center"
          >
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </Link>
      <ProfileMenu
        user={user}
        role={role}
        side="bottom"
        align="end"
        sideOffset={10}
        trigger={
          <button
            type="button"
            aria-label={`Open profile for ${user.name}`}
            className="rounded-full motion-safe:transition-shadow motion-safe:duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card data-popup-open:ring-2 data-popup-open:ring-ring data-popup-open:ring-offset-2 data-popup-open:ring-offset-card"
          >
            <HueAvatar name={user.name} hue={user.hue} size={32} src={user.avatarUrl} />
          </button>
        }
      />
    </div>
  );
}
