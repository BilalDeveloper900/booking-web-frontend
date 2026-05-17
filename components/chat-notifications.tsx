/**
 * Global chat notifications:
 *   - Owns the single source of truth for the unread total (context).
 *   - Subscribes to realtime INSERT on `messages` and fires a toast for any
 *     message that is NOT mine, NOT a booking auto-post, and NOT on the
 *     messages page I'm currently viewing.
 *   - Reflects the unread count in `document.title` so the count is visible
 *     when the tab is in the background.
 *
 * Mount once at the top of the dashboard tree (in DashboardShell) and read
 * the count anywhere via `useUnread()`.
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
import toast from "react-hot-toast";
import { createClient } from "@/lib/supabase/client";
import { useCurrentMember } from "@/lib/auth/use-current-member";
import { useUnreadTotal } from "@/lib/chat";

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
      <ChatToastListener
        myMemberId={myMemberId}
        role={role}
      />
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

/* ────────── Toast on new message ────────── */

function ChatToastListener({
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

          // Don't toast my own messages.
          if (row.sender_member_id === myMemberId) return;

          // Don't toast booking auto-posts — they're not human chat.
          if (row.kind === "booking_event") return;

          // If I'm already on the messages page, the inbox will update
          // on its own and a toast would be noisy.
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

          toast(
            (t) => (
              <button
                type="button"
                onClick={() => {
                  toast.dismiss(t.id);
                  router.push(`/${role}/messages?thread=${row.thread_id}`);
                }}
                className="flex flex-col items-start text-left -my-1 -mx-1 px-1 py-1 rounded-md cursor-pointer motion-safe:transition-colors motion-safe:duration-150 hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <span className="text-[12px] font-semibold text-foreground mb-0.5">
                  {senderName}
                </span>
                <span className="text-[12px] text-muted-foreground line-clamp-2">
                  {preview}
                </span>
              </button>
            ),
            {
              duration: 5000,
              icon: "💬",
            }
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [myMemberId, role, router, instanceId]);

  return null;
}
