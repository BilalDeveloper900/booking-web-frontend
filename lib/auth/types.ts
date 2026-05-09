/**
 * The "who am I" object that every authenticated screen reads from.
 *
 * Resolved by joining `studio_members` -> `users` and `studios` for the
 * currently logged-in `auth.uid()`. A user can belong to multiple studios in
 * different roles; for v1 we always pick the first active membership (sorted
 * by role precedence: owner > admin > client, then most-recent).
 */
import type { Database } from "@/lib/supabase/types";

type StudioMemberRow = Database["public"]["Tables"]["studio_members"]["Row"];
type UserRow = Database["public"]["Tables"]["users"]["Row"];
type StudioRow = Database["public"]["Tables"]["studios"]["Row"];

export type Role = "owner" | "admin" | "client";

export type CurrentMember = {
  /** The auth.users id (== public.users.id). */
  userId: string;
  /** Profile shown in the avatar/profile menu. */
  user: Pick<UserRow, "id" | "email" | "name" | "avatar_hue" | "avatar_url">;
  /** Studio context for every read/write. */
  studio: Pick<StudioRow, "id" | "name" | "slug" | "logo_url" | "currency" | "timezone">;
  /** The membership row itself: role + per-admin/client config. */
  member: StudioMemberRow;
  /** Convenience: same as member.role, narrowed to our union. */
  role: Role;
};
