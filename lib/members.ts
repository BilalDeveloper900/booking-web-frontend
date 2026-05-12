/**
 * Members & invitations — Supabase reads + mutations.
 *
 * - `useStudioMembers(studioId, role)` — live list of active members of a role.
 * - `useStudioInvitations(studioId, role?)` — live list of pending invites.
 * - `createInvitation` / `cancelInvitation` — owner-only mutations.
 *
 * RLS enforces owner-only writes; reads are scoped to studio members.
 */
"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/lib/supabase/types";

export type Role = "owner" | "admin" | "client";

type StudioMemberRow = Database["public"]["Tables"]["studio_members"]["Row"];
type UserPreview = Pick<
  Database["public"]["Tables"]["users"]["Row"],
  "id" | "email" | "name" | "avatar_hue" | "avatar_url"
>;

export type MemberWithUser = StudioMemberRow & {
  user: UserPreview;
};

type InvitationRow = Database["public"]["Tables"]["invitations"]["Row"];

type MembersState = {
  members: MemberWithUser[];
  loading: boolean;
  error: string | null;
};

export function useStudioMembers(studioId: string | undefined, role: Role) {
  const [state, setState] = useState<MembersState>(() => ({
    members: [],
    loading: Boolean(studioId),
    error: null,
  }));

  const refetch = useCallback(async () => {
    if (!studioId) return;
    const supabase = createClient();
    const { data, error } = await supabase
      .from("studio_members")
      .select(
        `*, user:users!studio_members_user_id_fkey(id, email, name, avatar_hue, avatar_url)`
      )
      .eq("studio_id", studioId)
      .eq("role", role)
      .eq("status", "active")
      .order("joined_at", { ascending: true });
    setState({
      members: ((data ?? []) as MemberWithUser[]) ?? [],
      loading: false,
      error: error?.message ?? null,
    });
  }, [studioId, role]);

  useEffect(() => {
    if (!studioId) return;
    let cancelled = false;
    const supabase = createClient();
    supabase
      .from("studio_members")
      .select(
        `*, user:users!studio_members_user_id_fkey(id, email, name, avatar_hue, avatar_url)`
      )
      .eq("studio_id", studioId)
      .eq("role", role)
      .eq("status", "active")
      .order("joined_at", { ascending: true })
      .then(({ data, error }) => {
        if (cancelled) return;
        setState({
          members: ((data ?? []) as MemberWithUser[]) ?? [],
          loading: false,
          error: error?.message ?? null,
        });
      });
    return () => {
      cancelled = true;
    };
  }, [studioId, role]);

  return { ...state, refetch };
}

type InvitationsState = {
  invitations: InvitationRow[];
  loading: boolean;
  error: string | null;
};

export function useStudioInvitations(
  studioId: string | undefined,
  role?: Role
) {
  const [state, setState] = useState<InvitationsState>(() => ({
    invitations: [],
    loading: Boolean(studioId),
    error: null,
  }));

  const refetch = useCallback(async () => {
    if (!studioId) return;
    const supabase = createClient();
    let q = supabase
      .from("invitations")
      .select("*")
      .eq("studio_id", studioId)
      .is("accepted_at", null)
      .is("cancelled_at", null)
      .order("created_at", { ascending: false });
    if (role) q = q.eq("role", role);
    const { data, error } = await q;
    setState({
      invitations: data ?? [],
      loading: false,
      error: error?.message ?? null,
    });
  }, [studioId, role]);

  useEffect(() => {
    if (!studioId) return;
    let cancelled = false;
    const supabase = createClient();
    let q = supabase
      .from("invitations")
      .select("*")
      .eq("studio_id", studioId)
      .is("accepted_at", null)
      .is("cancelled_at", null)
      .order("created_at", { ascending: false });
    if (role) q = q.eq("role", role);
    q.then(({ data, error }) => {
      if (cancelled) return;
      setState({
        invitations: data ?? [],
        loading: false,
        error: error?.message ?? null,
      });
    });
    return () => {
      cancelled = true;
    };
  }, [studioId, role]);

  return { ...state, refetch };
}

export async function createInvitation(
  studio_id: string,
  email: string,
  role: "admin" | "client",
  invited_by: string
): Promise<InvitationRow> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("invitations")
    .insert({ studio_id, email: email.trim().toLowerCase(), role, invited_by })
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

export async function cancelInvitation(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.rpc("cancel_invitation", { p_id: id });
  if (error) throw error;
}

/**
 * Build the shareable URL that a recipient opens to accept an invite.
 * Points to `/join` — a dedicated invitee experience, distinct from the
 * owner-only `/signup` flow.
 */
export function inviteUrl(token: string): string {
  if (typeof window === "undefined") return `/join?invite=${token}`;
  return `${window.location.origin}/join?invite=${token}`;
}
