"use client";

import { CheckCheck, Inbox } from "lucide-react";
import { NotificationItem } from "@/components/notification-item";
import { useNotificationsContext } from "@/components/notifications-provider";
import { Skeleton } from "@/components/skeletons";

export function NotificationsScreen() {
  const { items, loading, unread, markRead, markAllRead } =
    useNotificationsContext();

  const grouped = groupByDay(items);

  return (
    <div className="flex-1 overflow-auto p-6 lg:p-8">
      <div className="flex items-end justify-between gap-4 mb-6">
        <div>
          <h2 className="text-[24px] font-semibold tracking-tight leading-tight">
            Notifications
          </h2>
          <p className="text-[13px] text-muted-foreground mt-1">
            {unread > 0
              ? `${unread} unread`
              : "You're up to date."}
          </p>
        </div>
        <button
          type="button"
          onClick={markAllRead}
          disabled={unread === 0}
          className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg text-[12px] font-medium border border-border hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed motion-safe:transition-colors motion-safe:duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <CheckCheck className="w-4 h-4" aria-hidden />
          Mark all read
        </button>
      </div>

      <div className="max-w-3xl">
        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-16 w-full rounded-lg" />
            <Skeleton className="h-16 w-full rounded-lg" />
            <Skeleton className="h-16 w-full rounded-lg" />
          </div>
        ) : items.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="space-y-6">
            {grouped.map((group) => (
              <section key={group.label}>
                <h3 className="text-[11px] font-medium tracking-[0.08em] uppercase text-muted-foreground mb-2 px-3">
                  {group.label}
                </h3>
                <ul className="bg-card border border-border rounded-xl divide-y divide-border overflow-hidden">
                  {group.items.map((n) => (
                    <li key={n.id}>
                      <NotificationItem
                        item={n}
                        onActivate={() => markRead(n.id)}
                      />
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="bg-card border border-border rounded-xl px-6 py-16 text-center">
      <div className="w-12 h-12 mx-auto rounded-full bg-muted grid place-items-center mb-3 text-muted-foreground">
        <Inbox className="w-5 h-5" aria-hidden />
      </div>
      <div className="text-[14px] font-medium">No notifications yet</div>
      <p className="text-[12px] text-muted-foreground mt-1 max-w-xs mx-auto">
        Bookings, credit purchases, gifts, and refunds will show up here.
      </p>
    </div>
  );
}

type Group = { label: string; items: ReturnType<typeof useNotificationsContext>["items"] };

function groupByDay(
  items: ReturnType<typeof useNotificationsContext>["items"]
): Group[] {
  if (items.length === 0) return [];
  const now = new Date();
  const today = startOfDay(now).getTime();
  const yesterday = today - DAY_MS;
  const weekAgo = today - 6 * DAY_MS;

  const buckets = new Map<string, Group["items"]>();
  const order: string[] = [];
  function push(label: string, item: Group["items"][number]) {
    let arr = buckets.get(label);
    if (!arr) {
      arr = [];
      buckets.set(label, arr);
      order.push(label);
    }
    arr.push(item);
  }

  for (const item of items) {
    const t = new Date(item.createdAt).getTime();
    let label: string;
    if (t >= today) label = "Today";
    else if (t >= yesterday) label = "Yesterday";
    else if (t >= weekAgo) label = "Earlier this week";
    else label = "Older";
    push(label, item);
  }

  return order.map((label) => ({ label, items: buckets.get(label) ?? [] }));
}

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

const DAY_MS = 24 * 60 * 60 * 1000;
