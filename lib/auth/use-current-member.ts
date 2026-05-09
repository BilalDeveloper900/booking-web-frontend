"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { CurrentMember, Role } from "./types";

/**
 * Client-side: subscribes to auth state and reads the user's primary
 * membership. Returns the same shape as `getCurrentMember()`.
 *
 * Use in `"use client"` components (DashboardShell, ProfileMenu, etc).
 * Server Components should use `getCurrentMember()` from `./server` instead.
 */
export function useCurrentMember() {
  const [data, setData] = useState<CurrentMember | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setData(null);
      setLoading(false);
      return;
    }

    const { data: rows, error } = await supabase
      .from("studio_members")
      .select(
        `
          *,
          user:users!studio_members_user_id_fkey (
            id, email, name, avatar_hue, avatar_url
          ),
          studio:studios!studio_members_studio_id_fkey (
            id, name, slug, logo_url, currency, timezone
          )
        `
      )
      .eq("user_id", user.id)
      .eq("status", "active")
      .limit(5);

    if (error || !rows || rows.length === 0) {
      if (error) console.error("[auth/client] useCurrentMember:", error.message);
      setData(null);
      setLoading(false);
      return;
    }

    const RANK: Record<Role, number> = { owner: 0, admin: 1, client: 2 };
    const sorted = [...rows].sort(
      (a, b) => (RANK[a.role as Role] ?? 99) - (RANK[b.role as Role] ?? 99)
    );
    const row = sorted[0];

    const userObj = Array.isArray(row.user) ? row.user[0] : row.user;
    const studioObj = Array.isArray(row.studio) ? row.studio[0] : row.studio;
    if (!userObj || !studioObj) {
      setData(null);
      setLoading(false);
      return;
    }

    setData({
      userId: user.id,
      user: userObj,
      studio: studioObj,
      member: row as DatabaseStudioMemberRow,
      role: row.role as Role,
    });
    setLoading(false);
  }, []);

  useEffect(() => {
    // Supabase fires onAuthStateChange with INITIAL_SESSION on subscribe,
    // so we don't need a separate initial load(). Triggering load() from the
    // callback satisfies the react-hooks/set-state-in-effect lint rule.
    const supabase = createClient();
    const { data: sub } = supabase.auth.onAuthStateChange(() => {
      load();
    });
    return () => sub.subscription.unsubscribe();
  }, [load]);

  return { member: data, loading };
}

type DatabaseStudioMemberRow =
  import("@/lib/supabase/types").Database["public"]["Tables"]["studio_members"]["Row"];
