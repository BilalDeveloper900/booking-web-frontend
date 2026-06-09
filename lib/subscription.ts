/**
 * The studio's own Book It Daily subscription (`studio_subscriptions`) — i.e.
 * the plan the owner pays us for. Read-only here; writes happen via the
 * payment provider webhook (Polar) server-side.
 */
"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/lib/supabase/types";

export type StudioSubscriptionRow =
  Database["public"]["Tables"]["studio_subscriptions"]["Row"];

type State = {
  subscription: StudioSubscriptionRow | null;
  loading: boolean;
  error: string | null;
};

/**
 * Reads the single `studio_subscriptions` row for this studio. A studio with
 * no row is treated as the Free plan by callers (the table only gets a row once
 * a paid plan / trial starts).
 */
export function useStudioSubscription(studioId: string | undefined) {
  const [state, setState] = useState<State>(() => ({
    subscription: null,
    loading: Boolean(studioId),
    error: null,
  }));

  useEffect(() => {
    if (!studioId) {
      setState({ subscription: null, loading: false, error: null });
      return;
    }
    let cancelled = false;
    const supabase = createClient();
    supabase
      .from("studio_subscriptions")
      .select("*")
      .eq("studio_id", studioId)
      .maybeSingle()
      .then(({ data, error }) => {
        if (cancelled) return;
        setState({
          subscription: data ?? null,
          loading: false,
          error: error?.message ?? null,
        });
      });
    return () => {
      cancelled = true;
    };
  }, [studioId]);

  return state;
}
