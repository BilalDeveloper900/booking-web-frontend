"use client";

import { useState } from "react";
import { Wallet, Loader2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { HueAvatar } from "@/components/shared";
import { useClientCreditBalance } from "@/lib/credits";
import { recordManualSale, humanizeSaleError } from "@/lib/payments";
import { useCreditPacks, formatPrice, currencySymbol } from "@/lib/offers";
import { cn } from "@/lib/utils";

/**
 * Owner-only sheet to record a sale the client already paid for (bank transfer,
 * the owner's own payment link, cash) and grant the matching credits. Logs a
 * succeeded payment + a topup on the client's ledger via `record_manual_sale`.
 *
 * `onRecorded()` fires after success — wire it to refetch client lists/dashboards.
 */
export function RecordPaymentSheet({
  open,
  onOpenChange,
  client,
  studioId,
  currency,
  onRecorded,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client: { memberId: string; name: string; hue: number; email?: string } | null;
  studioId: string | undefined;
  currency: string;
  onRecorded?: (newBalance: number) => void;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md p-0">
        {client && (
          <RecordForm
            client={client}
            studioId={studioId}
            currency={currency}
            onClose={() => onOpenChange(false)}
            onRecorded={onRecorded}
            key={client.memberId}
          />
        )}
      </SheetContent>
    </Sheet>
  );
}

function RecordForm({
  client,
  studioId,
  currency,
  onClose,
  onRecorded,
}: {
  client: { memberId: string; name: string; hue: number; email?: string };
  studioId: string | undefined;
  currency: string;
  onClose: () => void;
  onRecorded?: (newBalance: number) => void;
}) {
  const { balance, loading: balanceLoading, refetch: refetchBalance } =
    useClientCreditBalance(client.memberId);
  const { packs } = useCreditPacks(studioId);
  const activePacks = packs.filter((p) => p.active);

  const [credits, setCredits] = useState<string>("");
  const [amount, setAmount] = useState<string>(""); // major units
  const [note, setNote] = useState<string>("");
  const [selectedPackId, setSelectedPackId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<{ credits: number; newBalance: number } | null>(null);

  const parsedCredits = parseInt(credits, 10);
  const parsedAmount = parseFloat(amount);
  const amountCents = Number.isFinite(parsedAmount) ? Math.round(parsedAmount * 100) : NaN;
  const validCredits = Number.isFinite(parsedCredits) && parsedCredits > 0;
  const validAmount = Number.isFinite(amountCents) && amountCents >= 0;
  const canSubmit = validCredits && validAmount && !submitting && !done;

  function selectPack(p: (typeof activePacks)[number]) {
    setSelectedPackId(p.id);
    setCredits(String(p.credits));
    setAmount(String(p.price_cents / 100));
    setNote(`${p.credits}-credit pack${p.label ? ` · ${p.label}` : ""}`);
  }

  function onCustom() {
    setSelectedPackId(null);
    setCredits("");
    setAmount("");
    setNote("");
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      const newBalance = await recordManualSale({
        memberId: client.memberId,
        credits: parsedCredits,
        amountCents,
        currency,
        description: note.trim() || undefined,
      });
      setDone({ credits: parsedCredits, newBalance });
      onRecorded?.(newBalance);
      refetchBalance();
    } catch (err) {
      setError(humanizeSaleError(err));
    } finally {
      setSubmitting(false);
    }
  }

  function reset() {
    onCustom();
    setDone(null);
    setError(null);
  }

  return (
    <>
      <SheetHeader className="p-6 pb-4">
        <div className="inline-flex items-center gap-2 self-start px-2 py-1 rounded-md text-[11px] font-medium mb-3 bg-[--role-accent-light] text-[--role-accent-dark]">
          <Wallet className="w-3 h-3" />
          Record payment
        </div>
        <SheetTitle className="text-[20px] font-semibold tracking-tight">
          {done ? "Payment recorded" : `Record a sale for ${client.name.split(" ")[0]}`}
        </SheetTitle>
        <SheetDescription>
          {done
            ? "Income logged and credits added to the client's balance."
            : "Use this after the client has paid you (bank, cash, or your own link). We log the income and add their credits."}
        </SheetDescription>
      </SheetHeader>

      <div className="px-6 pb-2">
        <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/40 p-3">
          <HueAvatar name={client.name} hue={client.hue} size={36} />
          <div className="min-w-0 flex-1">
            <div className="text-[13px] font-medium truncate">{client.name}</div>
            {client.email && (
              <div className="text-[11px] text-muted-foreground truncate">{client.email}</div>
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

      {done ? (
        <div className="px-6 pb-4 pt-4 space-y-4">
          <div className="rounded-lg border border-[--pos]/30 bg-[--pos]/10 px-3 py-2.5 text-[13px] text-[oklch(0.35_0.06_165)] flex items-center gap-2">
            <Check className="w-4 h-4" />
            +{done.credits} credit{done.credits === 1 ? "" : "s"} added. New balance:{" "}
            <span className="font-semibold tabular-nums">{done.newBalance}</span>.
          </div>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="px-6 pb-4 pt-3 space-y-4">
          {activePacks.length > 0 && (
            <div>
              <label className="block text-[11px] font-medium tracking-[0.08em] uppercase text-muted-foreground mb-1.5">
                Pack
              </label>
              <div className="flex items-center gap-1.5 flex-wrap">
                {activePacks.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => selectPack(p)}
                    className={cn(
                      "text-xs px-2.5 py-1 rounded-full border motion-safe:transition-colors motion-safe:duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      selectedPackId === p.id
                        ? "border-[--role-accent] bg-[--role-accent-light] text-[--role-accent-dark] font-medium"
                        : "border-border bg-card hover:bg-muted hover:border-[--role-accent]"
                    )}
                  >
                    {p.credits} cr · {formatPrice(p.price_cents, currency)}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={onCustom}
                  className={cn(
                    "text-xs px-2.5 py-1 rounded-full border motion-safe:transition-colors motion-safe:duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    selectedPackId === null
                      ? "border-foreground/40 bg-muted font-medium"
                      : "border-border bg-card hover:bg-muted"
                  )}
                >
                  Custom
                </button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-medium tracking-[0.08em] uppercase text-muted-foreground mb-1.5">
                Credits
              </label>
              <input
                type="number"
                inputMode="numeric"
                min={1}
                step={1}
                value={credits}
                onChange={(e) => {
                  setCredits(e.target.value);
                  setSelectedPackId(null);
                }}
                placeholder="e.g. 10"
                className={cn(
                  "w-full h-10 rounded-lg border border-border bg-background px-3 text-[13px] outline-none tabular-nums motion-safe:transition-colors motion-safe:duration-150",
                  "hover:border-foreground/30 focus:border-ring focus:ring-2 focus:ring-ring/20"
                )}
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium tracking-[0.08em] uppercase text-muted-foreground mb-1.5">
                Amount ({currencySymbol(currency).trim() || currency})
              </label>
              <input
                type="number"
                inputMode="decimal"
                min={0}
                step="0.01"
                value={amount}
                onChange={(e) => {
                  setAmount(e.target.value);
                  setSelectedPackId(null);
                }}
                placeholder="e.g. 100"
                className={cn(
                  "w-full h-10 rounded-lg border border-border bg-background px-3 text-[13px] outline-none tabular-nums motion-safe:transition-colors motion-safe:duration-150",
                  "hover:border-foreground/30 focus:border-ring focus:ring-2 focus:ring-ring/20"
                )}
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-medium tracking-[0.08em] uppercase text-muted-foreground mb-1.5">
              Note
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. 10-credit pack (bank transfer)"
              maxLength={120}
              className={cn(
                "w-full h-10 rounded-lg border border-border bg-background px-3 text-[13px] outline-none motion-safe:transition-colors motion-safe:duration-150",
                "hover:border-foreground/30 focus:border-ring focus:ring-2 focus:ring-ring/20"
              )}
            />
            <p className="text-[11px] text-muted-foreground mt-1.5">
              Shows on the client&apos;s ledger and your finance log.
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
        {done ? (
          <>
            <Button className="w-full" onClick={reset}>
              Record another
            </Button>
            <Button variant="ghost" className="w-full" onClick={onClose}>
              Done
            </Button>
          </>
        ) : (
          <>
            <Button className="w-full gap-2" onClick={onSubmit} disabled={!canSubmit}>
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Recording
                </>
              ) : (
                <>
                  <Wallet className="w-4 h-4" /> Mark paid &amp; add credits
                </>
              )}
            </Button>
            <Button variant="ghost" className="w-full" onClick={onClose} disabled={submitting}>
              Cancel
            </Button>
          </>
        )}
      </div>
    </>
  );
}
