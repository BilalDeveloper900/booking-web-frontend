/**
 * Offers — subscription plans + credit packs that the owner exposes to clients.
 *
 * Stores prices as `cents` in the DB; the UI surfaces them as whole units in
 * the studio's currency (EUR by default). Features on plans are a `jsonb`
 * array of strings.
 */
"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/lib/supabase/types";

export type PlanRow = Database["public"]["Tables"]["subscription_plans"]["Row"];
export type PlanInsert = Database["public"]["Tables"]["subscription_plans"]["Insert"];
export type PlanUpdate = Database["public"]["Tables"]["subscription_plans"]["Update"];

export type PackRow = Database["public"]["Tables"]["credit_packs"]["Row"];
export type PackInsert = Database["public"]["Tables"]["credit_packs"]["Insert"];
export type PackUpdate = Database["public"]["Tables"]["credit_packs"]["Update"];

type PlansState = { plans: PlanRow[]; loading: boolean; error: string | null };
type PacksState = { packs: PackRow[]; loading: boolean; error: string | null };

export function useSubscriptionPlans(studioId: string | undefined) {
  const [state, setState] = useState<PlansState>(() => ({
    plans: [],
    loading: Boolean(studioId),
    error: null,
  }));

  const refetch = useCallback(async () => {
    if (!studioId) return;
    const supabase = createClient();
    const { data, error } = await supabase
      .from("subscription_plans")
      .select("*")
      .eq("studio_id", studioId)
      .order("sort_order", { ascending: true })
      .order("price_cents", { ascending: true });
    setState({
      plans: data ?? [],
      loading: false,
      error: error?.message ?? null,
    });
  }, [studioId]);

  useEffect(() => {
    if (!studioId) return;
    let cancelled = false;
    const supabase = createClient();
    supabase
      .from("subscription_plans")
      .select("*")
      .eq("studio_id", studioId)
      .order("sort_order", { ascending: true })
      .order("price_cents", { ascending: true })
      .then(({ data, error }) => {
        if (cancelled) return;
        setState({
          plans: data ?? [],
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

export function useCreditPacks(studioId: string | undefined) {
  const [state, setState] = useState<PacksState>(() => ({
    packs: [],
    loading: Boolean(studioId),
    error: null,
  }));

  const refetch = useCallback(async () => {
    if (!studioId) return;
    const supabase = createClient();
    const { data, error } = await supabase
      .from("credit_packs")
      .select("*")
      .eq("studio_id", studioId)
      .order("sort_order", { ascending: true })
      .order("credits", { ascending: true });
    setState({
      packs: data ?? [],
      loading: false,
      error: error?.message ?? null,
    });
  }, [studioId]);

  useEffect(() => {
    if (!studioId) return;
    let cancelled = false;
    const supabase = createClient();
    supabase
      .from("credit_packs")
      .select("*")
      .eq("studio_id", studioId)
      .order("sort_order", { ascending: true })
      .order("credits", { ascending: true })
      .then(({ data, error }) => {
        if (cancelled) return;
        setState({
          packs: data ?? [],
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

/* ────────── Plan mutations ────────── */

export async function createPlan(input: PlanInsert): Promise<PlanRow> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("subscription_plans")
    .insert(input)
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

export async function updatePlan(id: string, patch: PlanUpdate): Promise<PlanRow> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("subscription_plans")
    .update(patch)
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

export async function deletePlan(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("subscription_plans").delete().eq("id", id);
  if (error) throw error;
}

export async function setPlanActive(id: string, active: boolean): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("subscription_plans")
    .update({ active })
    .eq("id", id);
  if (error) throw error;
}

/* ────────── Pack mutations ────────── */

export async function createPack(input: PackInsert): Promise<PackRow> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("credit_packs")
    .insert(input)
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

export async function updatePack(id: string, patch: PackUpdate): Promise<PackRow> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("credit_packs")
    .update(patch)
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

export async function deletePack(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("credit_packs").delete().eq("id", id);
  if (error) throw error;
}

export async function setPackActive(id: string, active: boolean): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("credit_packs").update({ active }).eq("id", id);
  if (error) throw error;
}

/* ────────── Helpers ────────── */

/** Extract a string[] from the `features` jsonb column (defensive). */
export function planFeatures(plan: Pick<PlanRow, "features">): string[] {
  const raw = plan.features;
  if (Array.isArray(raw)) return raw.filter((f): f is string => typeof f === "string");
  return [];
}

/** Format a cents amount in a currency code. Cheap; no Intl dependency setup. */
export function formatPrice(cents: number, currency: string = "EUR"): string {
  const whole = cents / 100;
  const symbol = currencySymbol(currency);
  // Show whole numbers without trailing .00 to keep the UI tight.
  const formatted =
    whole === Math.floor(whole) ? String(whole) : whole.toFixed(2);
  return `${symbol}${formatted}`;
}

export function currencySymbol(currency: string): string {
  switch (currency.toUpperCase()) {
    case "EUR":
      return "€";
    case "USD":
      return "$";
    case "GBP":
      return "£";
    case "PKR":
      return "₨";
    default:
      return `${currency.toUpperCase()} `;
  }
}
