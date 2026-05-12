/**
 * Services catalog — Supabase reads + mutations.
 *
 * - `useServices(adminMemberId)` — React hook for live services owned by an admin.
 * - `createService` / `updateService` / `deleteService` / `setServiceActive`
 *   — plain async helpers called from event handlers. They don't manage
 *   loading state; callers refetch via the hook's `refetch()` after success.
 *
 * Reads/writes go through the user's anon Supabase client, so RLS applies
 * (admin can only touch their own services; owner can touch any in the studio).
 */
"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/lib/supabase/types";

export type ServiceRow = Database["public"]["Tables"]["services"]["Row"];
export type ServiceInsert = Database["public"]["Tables"]["services"]["Insert"];
export type ServiceUpdate = Database["public"]["Tables"]["services"]["Update"];

type ServicesState = {
  services: ServiceRow[];
  loading: boolean;
  error: string | null;
};

/**
 * Reads services owned by a given admin member. All state lives in a single
 * `useState` object so the effect only writes to it via `.then()` callbacks
 * (avoids `react-hooks/set-state-in-effect`).
 */
export function useServices(adminMemberId: string | undefined) {
  // Lazy initializer handles the "no adminMemberId yet" case without
  // touching state inside an effect.
  const [state, setState] = useState<ServicesState>(() => ({
    services: [],
    loading: Boolean(adminMemberId),
    error: null,
  }));

  const refetch = useCallback(async () => {
    if (!adminMemberId) return;
    const supabase = createClient();
    const { data, error } = await supabase
      .from("services")
      .select("*")
      .eq("admin_member_id", adminMemberId)
      .order("mode", { ascending: true })
      .order("name", { ascending: true });
    setState({
      services: data ?? [],
      loading: false,
      error: error?.message ?? null,
    });
  }, [adminMemberId]);

  useEffect(() => {
    if (!adminMemberId) return;
    let cancelled = false;
    const supabase = createClient();
    supabase
      .from("services")
      .select("*")
      .eq("admin_member_id", adminMemberId)
      .order("mode", { ascending: true })
      .order("name", { ascending: true })
      .then(({ data, error }) => {
        if (cancelled) return;
        setState({
          services: data ?? [],
          loading: false,
          error: error?.message ?? null,
        });
      });
    return () => {
      cancelled = true;
    };
  }, [adminMemberId]);

  return {
    services: state.services,
    loading: state.loading,
    error: state.error,
    refetch,
  };
}

/* ───────── mutations ───────── */

export async function createService(input: ServiceInsert): Promise<ServiceRow> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("services")
    .insert(input)
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

export async function updateService(
  id: string,
  patch: ServiceUpdate
): Promise<ServiceRow> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("services")
    .update(patch)
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

export async function deleteService(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("services").delete().eq("id", id);
  if (error) throw error;
}

export async function setServiceActive(id: string, active: boolean): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("services").update({ active }).eq("id", id);
  if (error) throw error;
}
