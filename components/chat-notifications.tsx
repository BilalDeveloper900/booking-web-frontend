/**
 * Global chat notifications:
 *   - Owns the single source of truth for the unread total (context).
 *   - Subscribes to realtime INSERT on `messages` and fires an OS-level
 *     desktop notification (via the Web Notification API) for any message
 *     that is NOT mine, NOT a booking auto-post, and NOT on the messages
 *     page I'm currently viewing. No in-app toast — the topbar / sidebar
 *     unread badges are the in-app indicator.
 *   - Reflects the unread count in `document.title` so the count is visible
 *     when the tab is in the background.
 *
 * Mount once at the top of the dashboard tree (in DashboardShell) and read
 * the count anywhere via `useUnread()`. The user opts in to OS notifications
 * via the profile menu → "Browser notifications".
 */
"use client";

import {
  createContext,
  useContext,
  useEffect,
  useId,
  useRef,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useCurrentMember } from "@/lib/auth/use-current-member";
import { useUnreadTotal } from "@/lib/chat";
import { fireDesktopNotification } from "@/lib/desktop-notifications";

const UnreadContext = createContext<number>(0);

export function useUnread(): number {
  return useContext(UnreadContext);
}

export function ChatNotificationsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { member } = useCurrentMember();
  const role = member?.role;
  const studioId = member?.studio.id;
  const myMemberId = member?.member.id;

  const unread = useUnreadTotal({ role, studioId, myMemberId });

  return (
    <UnreadContext.Provider value={unread}>
      {children}
      <ChatPushListener myMemberId={myMemberId} role={role} />
      <TitleUnreadBadge unread={unread} />
    </UnreadContext.Provider>
  );
}

/* ────────── Document title ────────── */

function TitleUnreadBadge({ unread }: { unread: number }) {
  useEffect(() => {
    // Strip any existing "(N)" prefix, then re-apply.
    const base = document.title.replace(/^\(\d+(?:\+)?\)\s+/, "");
    const prefix = unread > 0 ? `(${unread > 99 ? "99+" : unread}) ` : "";
    document.title = prefix + base;
  }, [unread]);
  return null;
}

/* ────────── Desktop push on new message ────────── */

function ChatPushListener({
  myMemberId,
  role,
}: {
  myMemberId: string | undefined;
  role: "owner" | "admin" | "client" | undefined;
}) {
  const pathname = usePathname();
  const router = useRouter();
  // Track latest pathname in a ref so the realtime handler always uses the
  // current value without resubscribing.
  const pathRef = useRef(pathname);
  pathRef.current = pathname;
  const instanceId = useId();

  useEffect(() => {
    if (!myMemberId || !role) return;
    const supabase = createClient();
    const channel = supabase
      .channel(`chat:toasts:${myMemberId}:${instanceId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        async (payload) => {
          const row = payload.new as {
            id: string;
            thread_id: string;
            sender_member_id: string;
            body: string;
            kind: string;
          };

          // Don't notify on my own messages.
          if (row.sender_member_id === myMemberId) return;

          // Don't notify on booking auto-posts — they're not human chat.
          if (row.kind === "booking_event") return;

          // If I'm already on the messages page, the inbox updates on
          // its own — no point pinging me about a message I can already see.
          if (pathRef.current.startsWith(`/${role}/messages`)) return;

          // Resolve the sender's name. The realtime payload only includes
          // raw columns, so we look up the studio_member → user row.
          let senderName = "New message";
          const { data: senderRow } = await supabase
            .from("studio_members")
            .select(
              "user:users!studio_members_user_id_fkey(name)"
            )
            .eq("id", row.sender_member_id)
            .maybeSingle();
          const userObj = Array.isArray(senderRow?.user)
            ? senderRow.user[0]
            : senderRow?.user;
          if (userObj?.name) senderName = userObj.name;

          const preview =
            row.body.length > 80 ? row.body.slice(0, 80) + "…" : row.body;
          const threadHref = `/${role}/messages?thread=${row.thread_id}`;

          // Fire OS-level desktop notification only — no in-app toast.
          // The unread badges on the topbar + sidebar are the in-app
          // indicators; toasts on top would be redundant noise.
          //
          // If browser permission isn't granted yet, this is a no-op.
          // The user opts in from profile menu → "Browser notifications".
          fireDesktopNotification({
            title: senderName,
            body: preview,
            tag: `thread-${row.thread_id}`,
            onClick: () => router.push(threadHref),
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [myMemberId, role, router, instanceId]);

  return null;
}
