/**
 * Per-admin availability — working hours (recurring) + time off (exceptions).
 *
 * - `useAvailabilityRules(memberId)` — list of recurring weekly rules.
 * - `useTimeOff(memberId)` — list of date-range exceptions.
 * - `replaceAvailabilityRules(memberId, studioId, dayHours)` — wipes and
 *   re-inserts the weekly grid. Simpler than diffing for v1; admin's grid
 *   is small (≤ 14 rows even with split shifts).
 * - `addTimeOff` / `deleteTimeOff` — single-row mutations.
 *
 * RLS gates writes to the admin themselves (or owner).
 */
"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/lib/supabase/types";

export type AvailabilityRuleRow =
  Database["public"]["Tables"]["availability_rules"]["Row"];
export type AvailabilityExceptionRow =
  Database["public"]["Tables"]["availability_exceptions"]["Row"];

/* ────────── Rules ────────── */

type RulesState = {
  rules: AvailabilityRuleRow[];
  loading: boolean;
  error: string | null;
};

export function useAvailabilityRules(memberId: string | undefined) {
  const [state, setState] = useState<RulesState>(() => ({
    rules: [],
    loading: Boolean(memberId),
    error: null,
  }));

  const refetch = useCallback(async () => {
    if (!memberId) return;
    const supabase = createClient();
    const { data, error } = await supabase
      .from("availability_rules")
      .select("*")
      .eq("admin_member_id", memberId)
      .order("weekday", { ascending: true })
      .order("start_time", { ascending: true });
    setState({
      rules: data ?? [],
      loading: false,
      error: error?.message ?? null,
    });
  }, [memberId]);

  useEffect(() => {
    if (!memberId) return;
    let cancelled = false;
    const supabase = createClient();
    supabase
      .from("availability_rules")
      .select("*")
      .eq("admin_member_id", memberId)
      .order("weekday", { ascending: true })
      .order("start_time", { ascending: true })
      .then(({ data, error }) => {
        if (cancelled) return;
        setState({
          rules: data ?? [],
          loading: false,
          error: error?.message ?? null,
        });
      });
    return () => {
      cancelled = true;
    };
  }, [memberId]);

  return { ...state, refetch };
}

/**
 * Wipe this admin's recurring weekly rules and re-insert them from `rows`.
 * The UI exposes one (start, end) range per weekday with an "open" boolean;
 * closed days produce zero rule rows.
 */
export async function replaceAvailabilityRules(
  studioId: string,
  memberId: string,
  rows: { weekday: number; open: boolean; start_time: string; end_time: string }[]
): Promise<void> {
  const supabase = createClient();

  const { error: delError } = await supabase
    .from("availability_rules")
    .delete()
    .eq("admin_member_id", memberId);
  if (delError) throw delError;

  const inserts = rows
    .filter((r) => r.open && r.start_time < r.end_time)
    .map((r) => ({
      studio_id: studioId,
      admin_member_id: memberId,
      weekday: r.weekday,
      start_time: r.start_time,
      end_time: r.end_time,
    }));

  if (inserts.length === 0) return;
  const { error: insError } = await supabase
    .from("availability_rules")
    .insert(inserts);
  if (insError) throw insError;
}

/* ────────── Time off (exceptions) ────────── */

type ExceptionsState = {
  exceptions: AvailabilityExceptionRow[];
  loading: boolean;
  error: string | null;
};

export function useTimeOff(memberId: string | undefined) {
  const [state, setState] = useState<ExceptionsState>(() => ({
    exceptions: [],
    loading: Boolean(memberId),
    error: null,
  }));

  const refetch = useCallback(async () => {
    if (!memberId) return;
    const supabase = createClient();
    const { data, error } = await supabase
      .from("availability_exceptions")
      .select("*")
      .eq("admin_member_id", memberId)
      .eq("type", "block")
      .order("date", { ascending: true });
    setState({
      exceptions: data ?? [],
      loading: false,
      error: error?.message ?? null,
    });
  }, [memberId]);

  useEffect(() => {
    if (!memberId) return;
    let cancelled = false;
    const supabase = createClient();
    supabase
      .from("availability_exceptions")
      .select("*")
      .eq("admin_member_id", memberId)
      .eq("type", "block")
      .order("date", { ascending: true })
      .then(({ data, error }) => {
        if (cancelled) return;
        setState({
          exceptions: data ?? [],
          loading: false,
          error: error?.message ?? null,
        });
      });
    return () => {
      cancelled = true;
    };
  }, [memberId]);

  return { ...state, refetch };
}

export async function addTimeOff(
  studioId: string,
  memberId: string,
  date: string,
  reason: string
): Promise<AvailabilityExceptionRow> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("availability_exceptions")
    .insert({
      studio_id: studioId,
      admin_member_id: memberId,
      date,
      type: "block",
      reason: reason || null,
    })
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

export async function deleteTimeOff(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("availability_exceptions")
    .delete()
    .eq("id", id);
  if (error) throw error;
}

/* ────────── Whole-day time off for one admin (client booking UI) ────────── */

/**
 * Map of ISO date (`YYYY-MM-DD`) → reason for an admin's whole-day blocks.
 * Used by the client booking screen to mark/disable time-off dates with a
 * clear message instead of a generic "no slots". Whole-day blocks have both
 * `start_time` and `end_time` null.
 */
const EMPTY_TIMEOFF: ReadonlyMap<string, string> = new Map();

export function useAdminTimeOffDates(adminMemberId: string | undefined): ReadonlyMap<string, string> {
  const [byDate, setByDate] = useState<Map<string, string>>(new Map());

  useEffect(() => {
    if (!adminMemberId) return;
    let cancelled = false;
    const supabase = createClient();
    supabase
      .from("availability_exceptions")
      .select("date, reason")
      .eq("admin_member_id", adminMemberId)
      .eq("type", "block")
      .is("start_time", null)
      .then(({ data }) => {
        if (cancelled) return;
        const map = new Map<string, string>();
        for (const r of data ?? []) map.set(r.date, r.reason ?? "Time off");
        setByDate(map);
      });
    return () => {
      cancelled = true;
    };
  }, [adminMemberId]);

  // No admin selected → stable empty map (avoids a synchronous setState reset).
  return adminMemberId ? byDate : EMPTY_TIMEOFF;
}
