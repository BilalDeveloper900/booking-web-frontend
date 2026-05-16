/**
 * Credit operations — wrappers around the `gift_credits` RPC and a hook for
 * reading a single client's balance.
 *
 * RLS on `client_credits` allows owners to read balances in their own studio,
 * so the read is a direct table query.
 */
"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export async function giftCredits(args: {
  memberId: string;
  amount: number;
  reason: string;
}): Promise<number> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("gift_credits", {
    p_member_id: args.memberId,
    p_amount: args.amount,
    p_reason: args.reason,
  });
  if (error) throw error;
  return data ?? 0;
}

/** Human-readable error for known gift_credits error codes. */
export function humanizeGiftError(err: unknown): string {
  if (err instanceof Error) {
    const m = err.message;
    if (m.includes("amount_must_be_nonzero")) return "Enter a non-zero amount.";
    if (m.includes("reason_required")) return "Add a short reason.";
    if (m.includes("insufficient_balance"))
      return "That deduction would put the client below 0 credits.";
    if (m.includes("forbidden")) return "Only the studio owner can gift credits.";
    if (m.includes("target_is_not_a_client"))
      return "Credits can only be gifted to clients.";
    if (m.includes("member_not_found")) return "Client not found.";
    return m;
  }
  return String(err);
}

type BalanceState = {
  balance: number | null;
  loading: boolean;
  error: string | null;
};

export function useClientCreditBalance(memberId: string | undefined) {
  const [state, setState] = useState<BalanceState>(() => ({
    balance: null,
    loading: Boolean(memberId),
    error: null,
  }));

  const refetch = useCallback(async () => {
    if (!memberId) return;
    const supabase = createClient();
    const { data, error } = await supabase
      .from("client_credits")
      .select("balance")
      .eq("member_id", memberId)
      .maybeSingle();
    setState({
      balance: data?.balance ?? 0,
      loading: false,
      error: error?.message ?? null,
    });
  }, [memberId]);

  useEffect(() => {
    if (!memberId) return;
    let cancelled = false;
    const supabase = createClient();
    supabase
      .from("client_credits")
      .select("balance")
      .eq("member_id", memberId)
      .maybeSingle()
      .then(({ data, error }) => {
        if (cancelled) return;
        setState({
          balance: data?.balance ?? 0,
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
