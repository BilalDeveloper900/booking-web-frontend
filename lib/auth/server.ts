import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { CurrentMember, Role } from "./types";

/**
 * Server-side: resolves the current user's primary membership.
 *
 * Returns null when there is no session, or when the session is valid but
 * the user has no active membership yet (e.g. fresh signup before
 * create_studio_for_owner ran).
 *
 * Wrapped in React's `cache()` so multiple Server Components in the same
 * request only hit Supabase once.
 */
export const getCurrentMember = cache(async (): Promise<CurrentMember | null> => {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
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
    .order("role", { ascending: true }) // 'admin' < 'client' < 'owner' alphabetically — re-sort below
    .limit(5);

  if (error || !data || data.length === 0) {
    if (error) console.error("[auth/server] getCurrentMember:", error.message);
    return null;
  }

  // Pick highest-priority membership: owner > admin > client.
  const ROLE_RANK: Record<Role, number> = { owner: 0, admin: 1, client: 2 };
  const sorted = [...data].sort(
    (a, b) =>
      (ROLE_RANK[a.role as Role] ?? 99) - (ROLE_RANK[b.role as Role] ?? 99)
  );
  const row = sorted[0];

  // Supabase types these as singular when there's one FK, but be safe.
  const userObj = Array.isArray(row.user) ? row.user[0] : row.user;
  const studioObj = Array.isArray(row.studio) ? row.studio[0] : row.studio;
  if (!userObj || !studioObj) return null;

  return {
    userId: user.id,
    user: userObj,
    studio: studioObj,
    member: row as Database_StudioMemberRow,
    role: row.role as Role,
  };
});

// Internal alias to keep the cast above readable.
type Database_StudioMemberRow =
  import("@/lib/supabase/types").Database["public"]["Tables"]["studio_members"]["Row"];
