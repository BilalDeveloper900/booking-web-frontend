/**
 * Notifications context — owns the single realtime subscription for the
 * current member's notifications feed. The bell button (for the badge) and
 * the popover (for the list) both read from this context so we don't open
 * two parallel postgres_changes channels.
 *
 * Mount once at the top of the dashboard tree (in DashboardShell).
 */
"use client";

import { createContext, useContext } from "react";
import { useCurrentMember } from "@/lib/auth/use-current-member";
import { useNotifications, type NotificationRow } from "@/lib/notifications";

type Ctx = {
  items: NotificationRow[];
  loading: boolean;
  error: string | null;
  unread: number;
  markRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
};

const NotificationsContext = createContext<Ctx>({
  items: [],
  loading: false,
  error: null,
  unread: 0,
  markRead: async () => {},
  markAllRead: async () => {},
});

export function useNotificationsContext(): Ctx {
  return useContext(NotificationsContext);
}

export function NotificationsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { member } = useCurrentMember();
  const myMemberId = member?.member.id;
  const value = useNotifications(myMemberId);

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  );
}
