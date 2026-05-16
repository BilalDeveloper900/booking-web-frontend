"use client";

import { useState } from "react";
import { Gift, Loader2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { HueAvatar } from "@/components/shared";
import {
  giftCredits,
  humanizeGiftError,
  useClientCreditBalance,
} from "@/lib/credits";
import { cn } from "@/lib/utils";

/**
 * Owner-only sheet to add (or deduct) credits on a single client's account.
 * Shows current balance up front so the owner has context before submitting.
 *
 * `onGifted()` is fired after a successful gift — wire it to refetch any
 * client lists / dashboards that show balances.
 */
export function GiftCreditsSheet({
  open,
  onOpenChange,
  client,
  onGifted,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client:
    | {
        memberId: string;
        name: string;
        hue: number;
        email?: string;
      }
    | null;
  onGifted?: (newBalance: number) => void;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md p-0">
        {client && (
          <GiftForm
            client={client}
            onClose={() => onOpenChange(false)}
            onGifted={onGifted}
            // Reset internal state whenever a different client is targeted
            key={client.memberId}
          />
        )}
      </SheetContent>
    </Sheet>
  );
}

function GiftForm({
  client,
  onClose,
  onGifted,
}: {
  client: { memberId: string; name: string; hue: number; email?: string };
  onClose: () => void;
  onGifted?: (newBalance: number) => void;
}) {
  const { balance, loading: balanceLoading, refetch: refetchBalance } =
    useClientCreditBalance(client.memberId);

  const [amount, setAmount] = useState<string>("");
  const [reason, setReason] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [donePayload, setDonePayload] = useState<{
    amount: number;
    newBalance: number;
  } | null>(null);

  const parsedAmount = parseInt(amount, 10);
  const validAmount = Number.isFinite(parsedAmount) && parsedAmount !== 0;
  const validReason = reason.trim().length > 0;
  const canSubmit = validAmount && validReason && !submitting && !donePayload;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      const newBalance = await giftCredits({
        memberId: client.memberId,
        amount: parsedAmount,
        reason: reason.trim(),
      });
      setDonePayload({ amount: parsedAmount, newBalance });
      onGifted?.(newBalance);
      refetchBalance();
    } catch (err) {
      setError(humanizeGiftError(err));
    } finally {
      setSubmitting(false);
    }
  }

  function reset() {
    setAmount("");
    setReason("");
    setDonePayload(null);
    setError(null);
  }

  // Preset chips for fast gifting
  const presets = [1, 2, 5, 10];

  return (
    <>
      <SheetHeader className="p-6 pb-4">
        <div className="inline-flex items-center gap-2 self-start px-2 py-1 rounded-md text-[11px] font-medium mb-3 bg-[--role-accent-light] text-[--role-accent-dark]">
          <Gift className="w-3 h-3" />
          Gift credits
        </div>
        <SheetTitle className="text-[20px] font-semibold tracking-tight">
          {donePayload ? "Credits applied" : `Gift credits to ${client.name.split(" ")[0]}`}
        </SheetTitle>
        <SheetDescription>
          {donePayload
            ? "Adjustment recorded on the client's ledger."
            : "Add credits as a comp, refund, or loyalty bonus. Deductions allowed for corrections."}
        </SheetDescription>
      </SheetHeader>

      <div className="px-6 pb-2">
        <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/40 p-3">
          <HueAvatar name={client.name} hue={client.hue} size={36} />
          <div className="min-w-0 flex-1">
            <div className="text-[13px] font-medium truncate">{client.name}</div>
            {client.email && (
              <div className="text-[11px] text-muted-foreground truncate">
                {client.email}
              </div>
            )}
          </div>
          <div className="text-right shrink-0">
            <div className="text-[10px] uppercase tracking-[0.08em] text-muted-foreground">
              Balance
            </div>
            <div className="text-[15px] font-semibold tabular-nums">
              {balanceLoading ? "…" : balance ?? 0}
            </div>
          </div>
        </div>
      </div>

      {donePayload ? (
        <div className="px-6 pb-4 pt-4 space-y-4">
          <div className="rounded-lg border border-[--pos]/30 bg-[--pos]/10 px-3 py-2.5 text-[13px] text-[oklch(0.35_0.06_165)] flex items-center gap-2">
            <Check className="w-4 h-4" />
            {donePayload.amount > 0 ? "+" : ""}
            {donePayload.amount} credit
            {Math.abs(donePayload.amount) === 1 ? "" : "s"} applied. New balance:{" "}
            <span className="font-semibold tabular-nums">
              {donePayload.newBalance}
            </span>
            .
          </div>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="px-6 pb-4 pt-3 space-y-4">
          <div>
            <label className="block text-[11px] font-medium tracking-[0.08em] uppercase text-muted-foreground mb-1.5">
              Amount
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                inputMode="numeric"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="e.g. 5"
                className={cn(
                  "w-full h-10 rounded-lg border border-border bg-background px-3 text-[13px] outline-none tabular-nums motion-safe:transition-colors motion-safe:duration-150",
                  "hover:border-foreground/30 focus:border-ring focus:ring-2 focus:ring-ring/20"
                )}
                step={1}
              />
            </div>
            <div className="flex items-center gap-1.5 mt-2 flex-wrap">
              {presets.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setAmount(String(p))}
                  className="text-xs px-2.5 py-1 rounded-full border border-border bg-card hover:bg-muted hover:border-[--role-accent] motion-safe:transition-colors motion-safe:duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  +{p}
                </button>
              ))}
              <span className="mx-1 text-muted-foreground text-xs">·</span>
              <button
                type="button"
                onClick={() => setAmount("-1")}
                className="text-xs px-2.5 py-1 rounded-full border border-border bg-card hover:bg-muted hover:border-[--neg] motion-safe:transition-colors motion-safe:duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                Deduct
              </button>
            </div>
            <p className="text-[11px] text-muted-foreground mt-1.5">
              Positive = gift. Negative = correction. Cannot put the balance below 0.
            </p>
          </div>

          <div>
            <label className="block text-[11px] font-medium tracking-[0.08em] uppercase text-muted-foreground mb-1.5">
              Reason
            </label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Birthday bonus"
              maxLength={120}
              className={cn(
                "w-full h-10 rounded-lg border border-border bg-background px-3 text-[13px] outline-none motion-safe:transition-colors motion-safe:duration-150",
                "hover:border-foreground/30 focus:border-ring focus:ring-2 focus:ring-ring/20"
              )}
            />
            <p className="text-[11px] text-muted-foreground mt-1.5">
              Shows up on the client&apos;s credit ledger.
            </p>
          </div>

          {error && (
            <div
              role="alert"
              className="rounded-lg border border-[--neg]/30 bg-[--neg]/10 px-3 py-2 text-[12px] text-[--neg]"
            >
              {error}
            </div>
          )}
        </form>
      )}

      <div className="mt-auto p-6 pt-4 border-t border-border flex flex-col gap-2">
        {donePayload ? (
          <>
            <Button className="w-full" onClick={reset}>
              Apply another
            </Button>
            <Button variant="ghost" className="w-full" onClick={onClose}>
              Done
            </Button>
          </>
        ) : (
          <>
            <Button
              className="w-full gap-2"
              onClick={onSubmit}
              disabled={!canSubmit}
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Applying
                </>
              ) : (
                <>
                  <Gift className="w-4 h-4" /> {parsedAmount < 0 ? "Apply deduction" : "Gift credits"}
                </>
              )}
            </Button>
            <Button
              variant="ghost"
              className="w-full"
              onClick={onClose}
              disabled={submitting}
            >
              Cancel
            </Button>
          </>
        )}
      </div>
    </>
  );
}
