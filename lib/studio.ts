/**
 * Studio + studio_hours hooks and mutations.
 *
 * - `useStudio(studioId)` — read the studio row (any active member).
 * - `useStudioHours(studioId)` — read the 7-row weekly hours.
 * - `updateStudio` / `upsertStudioHours` — owner-only writes (RLS enforces).
 */
"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/lib/supabase/types";

export type StudioRow = Database["public"]["Tables"]["studios"]["Row"];
export type StudioUpdate = Database["public"]["Tables"]["studios"]["Update"];

export type StudioHourRow = Database["public"]["Tables"]["studio_hours"]["Row"];

/* ────────── useStudio ────────── */

type StudioState = {
  studio: StudioRow | null;
  loading: boolean;
  error: string | null;
};

export function useStudio(studioId: string | undefined) {
  const [state, setState] = useState<StudioState>(() => ({
    studio: null,
    loading: Boolean(studioId),
    error: null,
  }));

  const refetch = useCallback(async () => {
    if (!studioId) return;
    const supabase = createClient();
    const { data, error } = await supabase
      .from("studios")
      .select("*")
      .eq("id", studioId)
      .maybeSingle();
    setState({
      studio: data ?? null,
      loading: false,
      error: error?.message ?? null,
    });
  }, [studioId]);

  useEffect(() => {
    if (!studioId) return;
    let cancelled = false;
    const supabase = createClient();
    supabase
      .from("studios")
      .select("*")
      .eq("id", studioId)
      .maybeSingle()
      .then(({ data, error }) => {
        if (cancelled) return;
        setState({
          studio: data ?? null,
          loading: false,
          error: error?.message ?? null,
        });
      });
    return () => {
      cancelled = true;
    };
  }, [studioId]);

  return { ...state, refetch };
}

export async function updateStudio(id: string, patch: StudioUpdate): Promise<StudioRow> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("studios")
    .update(patch)
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

/* ────────── useStudioHours ────────── */

/**
 * Stable display order: Mon..Sun (the UI rhythm). We sort defensively
 * after reading since the DB doesn't guarantee Mon-first.
 */
const DISPLAY_WEEKDAY_ORDER = [1, 2, 3, 4, 5, 6, 0] as const;

type HoursState = {
  hours: StudioHourRow[]; // sorted Mon..Sun, exactly 7 rows when seeded
  loading: boolean;
  error: string | null;
};

export function useStudioHours(studioId: string | undefined) {
  const [state, setState] = useState<HoursState>(() => ({
    hours: [],
    loading: Boolean(studioId),
    error: null,
  }));

  const refetch = useCallback(async () => {
    if (!studioId) return;
    const supabase = createClient();
    const { data, error } = await supabase
      .from("studio_hours")
      .select("*")
      .eq("studio_id", studioId);
    setState({
      hours: sortByDisplayOrder(data ?? []),
      loading: false,
      error: error?.message ?? null,
    });
  }, [studioId]);

  useEffect(() => {
    if (!studioId) return;
    let cancelled = false;
    const supabase = createClient();
    supabase
      .from("studio_hours")
      .select("*")
      .eq("studio_id", studioId)
      .then(({ data, error }) => {
        if (cancelled) return;
        setState({
          hours: sortByDisplayOrder(data ?? []),
          loading: false,
          error: error?.message ?? null,
        });
      });
    return () => {
      cancelled = true;
    };
  }, [studioId]);

  return { ...state, refetch };
}

function sortByDisplayOrder(rows: StudioHourRow[]): StudioHourRow[] {
  const byWeekday = new Map<number, StudioHourRow>();
  for (const r of rows) byWeekday.set(r.weekday, r);
  return DISPLAY_WEEKDAY_ORDER.map((w) => byWeekday.get(w)).filter(
    (r): r is StudioHourRow => Boolean(r)
  );
}

/**
 * Bulk-upsert all 7 days of studio hours. Missing weekdays in the input are
 * NOT touched — pass all 7 every time for predictability.
 */
export async function upsertStudioHours(
  studioId: string,
  rows: { weekday: number; open_time: string | null; close_time: string | null; closed: boolean }[]
): Promise<void> {
  const supabase = createClient();
  const payload = rows.map((r) => ({
    studio_id: studioId,
    weekday: r.weekday,
    open_time: r.closed ? null : r.open_time,
    close_time: r.closed ? null : r.close_time,
    closed: r.closed,
  }));
  const { error } = await supabase
    .from("studio_hours")
    .upsert(payload, { onConflict: "studio_id,weekday" });
  if (error) throw error;
}
