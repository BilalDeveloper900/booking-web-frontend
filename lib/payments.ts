/**
 * Studio payment-account (Stripe Connect) status for the owner UI.
 * Reads `studio_payment_accounts` (RLS: owner-select). Writes happen
 * server-side via the Connect routes + the stripe-connect-webhook function.
 */
"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export type StudioPaymentAccount = {
  provider: string;
  stripe_account_id: string | null;
  charges_enabled: boolean;
  payouts_enabled: boolean;
  details_submitted: boolean;
  status: "pending" | "connected" | "restricted" | "disconnected";
};

type State = {
  account: StudioPaymentAccount | null;
  loading: boolean;
};

/**
 * UI gate: show the "Connect payouts" button only when the platform has
 * enabled payments. The actual Stripe calls use the server-only
 * STRIPE_SECRET_KEY — the browser can't read that, so we use a plain public
 * flag here. Set NEXT_PUBLIC_PAYMENTS_ENABLED=true once Stripe is configured.
 */
export const stripeConfigured = process.env.NEXT_PUBLIC_PAYMENTS_ENABLED === "true";

export function useStudioPaymentAccount(studioId: string | undefined) {
  const [state, setState] = useState<State>(() => ({
    account: null,
    loading: Boolean(studioId),
  }));

  useEffect(() => {
    if (!studioId) return;
    let cancelled = false;
    const supabase = createClient();
    // Table added after types were generated — query loosely.
    (supabase as unknown as {
      from: (t: string) => {
        select: (c: string) => {
          eq: (col: string, val: string) => {
            maybeSingle: () => Promise<{ data: StudioPaymentAccount | null }>;
          };
        };
      };
    })
      .from("studio_payment_accounts")
      .select("provider, stripe_account_id, charges_enabled, payouts_enabled, details_submitted, status")
      .eq("studio_id", studioId)
      .maybeSingle()
      .then(({ data }) => {
        if (cancelled) return;
        setState({ account: data ?? null, loading: false });
      });
    return () => {
      cancelled = true;
    };
  }, [studioId]);

  return state;
}

/* ────────── Manual payments (Option A) ────────── */

/**
 * Generic RPC caller — the manual-payment RPCs were added after the supabase
 * types were generated (`npm run db:gen`), so they aren't in the typed
 * `.rpc()` overloads yet. Call them through this loose shim; runtime unchanged.
 */
function callRpc<T>(fn: string, args: Record<string, unknown>) {
  const supabase = createClient();
  return (
    supabase.rpc as unknown as (
      f: string,
      a: Record<string, unknown>
    ) => PromiseLike<{ data: T; error: { message: string } | null }>
  )(fn, args);
}

/**
 * Owner records a sale the client already paid for (bank/cash/own link) and
 * grants the credits. Logs a succeeded `payments` row + a `topup` credit
 * transaction atomically. Returns the client's new balance.
 */
export async function recordManualSale(args: {
  memberId: string;
  credits: number;
  amountCents: number;
  currency?: string;
  description?: string;
}): Promise<number> {
  const { data, error } = await callRpc<number>("record_manual_sale", {
    p_member_id: args.memberId,
    p_credits: args.credits,
    p_amount_cents: args.amountCents,
    p_currency: args.currency ?? "EUR",
    p_description: args.description ?? null,
  });
  if (error) throw new Error(error.message);
  return data ?? 0;
}

/** Friendly copy for known record_manual_sale error codes. */
export function humanizeSaleError(err: unknown): string {
  const m = err instanceof Error ? err.message : String(err);
  if (m.includes("credits_must_be_positive")) return "Enter how many credits to add (1 or more).";
  if (m.includes("amount_invalid")) return "Enter a valid amount.";
  if (m.includes("target_is_not_a_client")) return "Payments can only be recorded for clients.";
  if (m.includes("member_not_found")) return "Client not found.";
  if (m.includes("forbidden")) return "Only the studio owner can record payments.";
  return m;
}

/** Owner saves the "how clients pay me" instructions shown to clients. */
export async function setPayoutNote(studioId: string, note: string): Promise<void> {
  const { error } = await callRpc<null>("set_studio_payout_note", {
    p_studio_id: studioId,
    p_note: note,
  });
  if (error) throw new Error(error.message);
}

export type StudioPaymentInfo = {
  provider: string | null;
  payoutNote: string | null;
};

type PayoutInfoState = StudioPaymentInfo & { loading: boolean; error: string | null };

/**
 * Reads the studio's payment provider + payout note via `get_studio_payment_info`
 * (works for owners AND clients — the table SELECT policy is owner-only, so the
 * security-definer RPC is the read path for non-owners).
 */
export function useStudioPayoutInfo(studioId: string | undefined) {
  const [state, setState] = useState<PayoutInfoState>(() => ({
    provider: null,
    payoutNote: null,
    loading: Boolean(studioId),
    error: null,
  }));

  const load = useCallback(async () => {
    if (!studioId) return;
    const { data, error } = await callRpc<
      Array<{ provider: string | null; payout_note: string | null }>
    >("get_studio_payment_info", { p_studio_id: studioId });
    const row = Array.isArray(data) ? data[0] : null;
    setState({
      provider: row?.provider ?? null,
      payoutNote: row?.payout_note ?? null,
      loading: false,
      error: error?.message ?? null,
    });
  }, [studioId]);

  useEffect(() => {
    if (!studioId) return;
    let cancelled = false;
    callRpc<Array<{ provider: string | null; payout_note: string | null }>>(
      "get_studio_payment_info",
      { p_studio_id: studioId }
    ).then(({ data, error }) => {
      if (cancelled) return;
      const row = Array.isArray(data) ? data[0] : null;
      setState({
        provider: row?.provider ?? null,
        payoutNote: row?.payout_note ?? null,
        loading: false,
        error: error?.message ?? null,
      });
    });
    return () => {
      cancelled = true;
    };
  }, [studioId]);

  return { ...state, refetch: load };
}
