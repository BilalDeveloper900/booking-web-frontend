"use client";

import { useState } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  Check,
  Eye,
  CreditCard,
  Layers,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Pill } from "@/components/shared";
import {
  useSubscriptionPlans,
  useCreditPacks,
  createPlan,
  updatePlan,
  deletePlan,
  setPlanActive,
  createPack,
  updatePack,
  deletePack,
  setPackActive,
  planFeatures,
  formatPrice,
  type PlanRow,
  type PackRow,
} from "@/lib/offers";
import { useCurrentMember } from "@/lib/auth/use-current-member";
import { cn } from "@/lib/utils";

/* ────────── Form draft types (UI works in whole-currency units) ────────── */

type PlanDraft = {
  id: string; // "" = new
  studio_id: string;
  name: string;
  description: string;
  price: number; // whole units (e.g. 89 EUR)
  credits: number;
  features: string[];
  sort_order: number;
  active: boolean;
};

type PackDraft = {
  id: string; // "" = new
  studio_id: string;
  credits: number;
  price: number; // whole units
  label: string;
  sort_order: number;
  active: boolean;
};

function planToDraft(row: PlanRow): PlanDraft {
  return {
    id: row.id,
    studio_id: row.studio_id,
    name: row.name,
    description: row.description ?? "",
    price: row.price_cents / 100,
    credits: row.credits_granted,
    features: planFeatures(row),
    sort_order: row.sort_order,
    active: row.active,
  };
}

function packToDraft(row: PackRow): PackDraft {
  return {
    id: row.id,
    studio_id: row.studio_id,
    credits: row.credits,
    price: row.price_cents / 100,
    label: row.label ?? "",
    sort_order: row.sort_order,
    active: row.active,
  };
}

/* ────────── Screen ────────── */

export function OffersScreen() {
  const { member } = useCurrentMember();
  const studioId = member?.studio.id;
  const currency = member?.studio.currency ?? "EUR";

  const {
    plans,
    loading: plansLoading,
    error: plansError,
    refetch: refetchPlans,
  } = useSubscriptionPlans(studioId);

  const {
    packs,
    loading: packsLoading,
    error: packsError,
    refetch: refetchPacks,
  } = useCreditPacks(studioId);

  const [editingPlan, setEditingPlan] = useState<PlanDraft | null>(null);
  const [editingPack, setEditingPack] = useState<PackDraft | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  async function savePlan(draft: PlanDraft) {
    const features = draft.features.filter((f) => f.trim().length > 0);
    if (draft.id === "") {
      await createPlan({
        studio_id: draft.studio_id,
        name: draft.name,
        description: draft.description || null,
        price_cents: Math.round(draft.price * 100),
        credits_granted: draft.credits,
        features,
        sort_order: draft.sort_order,
        active: draft.active,
      });
    } else {
      await updatePlan(draft.id, {
        name: draft.name,
        description: draft.description || null,
        price_cents: Math.round(draft.price * 100),
        credits_granted: draft.credits,
        features,
        sort_order: draft.sort_order,
        active: draft.active,
      });
    }
    await refetchPlans();
    setEditingPlan(null);
  }

  async function removePlan(id: string) {
    await deletePlan(id);
    await refetchPlans();
    setEditingPlan(null);
  }

  async function togglePlan(id: string, next: boolean) {
    await setPlanActive(id, next);
    await refetchPlans();
  }

  async function savePack(draft: PackDraft) {
    if (draft.id === "") {
      await createPack({
        studio_id: draft.studio_id,
        credits: draft.credits,
        price_cents: Math.round(draft.price * 100),
        label: draft.label || null,
        sort_order: draft.sort_order,
        active: draft.active,
      });
    } else {
      await updatePack(draft.id, {
        credits: draft.credits,
        price_cents: Math.round(draft.price * 100),
        label: draft.label || null,
        sort_order: draft.sort_order,
        active: draft.active,
      });
    }
    await refetchPacks();
    setEditingPack(null);
  }

  async function removePack(id: string) {
    await deletePack(id);
    await refetchPacks();
    setEditingPack(null);
  }

  async function togglePack(id: string, next: boolean) {
    await setPackActive(id, next);
    await refetchPacks();
  }

  function newPlanDraft() {
    if (!studioId) return;
    setEditingPlan({
      id: "",
      studio_id: studioId,
      name: "",
      description: "",
      price: 0,
      credits: 0,
      features: [],
      sort_order: plans.length,
      active: true,
    });
  }

  function newPackDraft() {
    if (!studioId) return;
    setEditingPack({
      id: "",
      studio_id: studioId,
      credits: 5,
      price: 50,
      label: "",
      sort_order: packs.length,
      active: true,
    });
  }

  return (
    <div className="flex-1 overflow-auto p-4 md:p-6 lg:p-8">
      <div className="flex items-start mb-6 gap-4 flex-wrap">
        <div>
          <h2 className="text-[20px] md:text-[24px] font-semibold tracking-tight leading-tight">
            Offers
          </h2>
          <p className="text-[13px] text-muted-foreground mt-1">
            Build the subscription plans and credit packs your clients see when they book.
          </p>
        </div>
        <div className="flex-1" />
        <Button variant="outline" size="sm" className="gap-2" onClick={() => setPreviewOpen(true)}>
          <Eye className="w-3.5 h-3.5" /> Preview as client
        </Button>
      </div>

      {(plansError || packsError) && (
        <div
          role="alert"
          className="rounded-lg border border-[--neg]/30 bg-[--neg]/10 px-3 py-2 text-[12px] text-[--neg] mb-4 inline-flex items-center gap-2"
        >
          <AlertCircle className="w-3.5 h-3.5" />
          {plansError ?? packsError}
        </div>
      )}

      <Section
        eyebrow="Subscription plans"
        title="Recurring revenue offers"
        sub="Clients pay monthly. Each plan includes a credit allotment they can use for bookings."
        icon={Layers}
        action={
          <Button size="sm" className="gap-2" onClick={newPlanDraft} disabled={!studioId}>
            <Plus className="w-3.5 h-3.5" /> New plan
          </Button>
        }
      >
        {plansLoading && plans.length === 0 ? (
          <GridSkeleton cols="md:grid-cols-2 lg:grid-cols-3" />
        ) : plans.length === 0 ? (
          <EmptyState
            text="No plans yet."
            hint="Subscription plans give clients recurring credits each month."
            onAdd={newPlanDraft}
            label="Create your first plan"
            disabled={!studioId}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {plans.map((p) => (
              <PlanCard
                key={p.id}
                plan={p}
                currency={currency}
                onEdit={() => setEditingPlan(planToDraft(p))}
                onToggle={(next) => togglePlan(p.id, next)}
              />
            ))}
          </div>
        )}
      </Section>

      <Section
        eyebrow="Credit packs"
        title="One-time top-ups"
        sub="Clients pay once and get a bundle of credits. Great for casual users and as upsells when subscribers run low."
        icon={CreditCard}
        action={
          <Button size="sm" className="gap-2" onClick={newPackDraft} disabled={!studioId}>
            <Plus className="w-3.5 h-3.5" /> New pack
          </Button>
        }
      >
        {packsLoading && packs.length === 0 ? (
          <GridSkeleton cols="sm:grid-cols-2 lg:grid-cols-4" />
        ) : packs.length === 0 ? (
          <EmptyState
            text="No packs yet."
            hint="Credit packs are one-time purchases for top-ups."
            onAdd={newPackDraft}
            label="Create your first pack"
            disabled={!studioId}
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {packs.map((p) => (
              <PackCard
                key={p.id}
                pack={p}
                currency={currency}
                onEdit={() => setEditingPack(packToDraft(p))}
                onToggle={(next) => togglePack(p.id, next)}
              />
            ))}
          </div>
        )}
      </Section>

      <PlanSheet
        draft={editingPlan}
        currency={currency}
        onChange={setEditingPlan}
        onSave={savePlan}
        onDelete={editingPlan && editingPlan.id !== "" ? () => removePlan(editingPlan.id) : undefined}
        onCancel={() => setEditingPlan(null)}
      />
      <PackSheet
        draft={editingPack}
        currency={currency}
        onChange={setEditingPack}
        onSave={savePack}
        onDelete={editingPack && editingPack.id !== "" ? () => removePack(editingPack.id) : undefined}
        onCancel={() => setEditingPack(null)}
      />
      <PreviewSheet
        open={previewOpen}
        plans={plans.filter((p) => p.active)}
        packs={packs.filter((p) => p.active)}
        currency={currency}
        onOpenChange={setPreviewOpen}
      />
    </div>
  );
}

/* ────────── Plan card ────────── */

function PlanCard({
  plan,
  currency,
  onEdit,
  onToggle,
}: {
  plan: PlanRow;
  currency: string;
  onEdit: () => void;
  onToggle: (next: boolean) => void;
}) {
  const features = planFeatures(plan);
  return (
    <div
      className={cn(
        "bg-card border border-border rounded-xl shadow-card p-5 flex flex-col motion-safe:transition-all motion-safe:duration-200 hover:-translate-y-px hover:shadow-hero",
        !plan.active && "opacity-60"
      )}
    >
      <div className="flex items-start gap-2 mb-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[15px] font-semibold">{plan.name}</span>
            {!plan.active && <Pill kind="warn">Hidden</Pill>}
          </div>
          <p className="text-[12px] text-muted-foreground mt-0.5 line-clamp-1">
            {plan.description || "—"}
          </p>
        </div>
      </div>

      <div className="flex items-baseline gap-1 mt-1">
        <span className="text-[24px] font-semibold tracking-tight tabular-nums">
          {plan.price_cents === 0 ? "Free" : formatPrice(plan.price_cents, currency)}
        </span>
        {plan.price_cents > 0 && (
          <span className="text-[12px] text-muted-foreground">/mo</span>
        )}
      </div>
      <div className="text-[11px] text-muted-foreground mb-3 tabular-nums">
        {plan.credits_granted > 0
          ? `${plan.credits_granted} credits / month`
          : "No credits included"}
      </div>

      {features.length > 0 && (
        <ul className="text-[12px] space-y-1 mb-4 flex-1">
          {features.slice(0, 3).map((f, i) => (
            <li key={`${f}-${i}`} className="flex gap-1.5 items-start">
              <Check className="w-3 h-3 text-[--pos] mt-0.5 shrink-0" aria-hidden />
              <span className="line-clamp-1">{f}</span>
            </li>
          ))}
          {features.length > 3 && (
            <li className="text-[11px] text-muted-foreground pl-4.5">
              + {features.length - 3} more
            </li>
          )}
        </ul>
      )}

      <div className="mt-auto pt-3 border-t border-[--line-soft] flex items-center gap-2">
        <label className="flex items-center gap-2 text-[11px] text-muted-foreground cursor-pointer">
          <Switch checked={plan.active} onCheckedChange={onToggle} />
          {plan.active ? "Live" : "Hidden"}
        </label>
        <div className="flex-1" />
        <Button variant="ghost" size="icon-sm" aria-label="Edit plan" onClick={onEdit}>
          <Pencil className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  );
}

/* ────────── Pack card ────────── */

function PackCard({
  pack,
  currency,
  onEdit,
  onToggle,
}: {
  pack: PackRow;
  currency: string;
  onEdit: () => void;
  onToggle: (next: boolean) => void;
}) {
  const perCreditCents = pack.credits > 0 ? pack.price_cents / pack.credits : 0;
  const featured = pack.label === "Best value" || pack.label === "Pro";

  return (
    <div
      className={cn(
        "bg-card border border-border rounded-xl shadow-card p-4 flex flex-col motion-safe:transition-all motion-safe:duration-200 hover:-translate-y-px hover:shadow-hero relative",
        featured && "border-primary ring-1 ring-primary/30",
        !pack.active && "opacity-60"
      )}
    >
      {pack.label && (
        <span className="absolute top-3 right-3">
          <Pill kind={featured ? "teal" : "sage"}>{pack.label}</Pill>
        </span>
      )}
      <div className="text-[20px] font-semibold tabular-nums mb-0.5">{pack.credits} credits</div>
      <div className="text-[12px] text-muted-foreground tabular-nums mb-1">
        {formatPrice(pack.price_cents, currency)} ·{" "}
        {formatPrice(perCreditCents, currency)}/credit
      </div>
      <div className="flex-1" />
      <div className="mt-3 pt-3 border-t border-[--line-soft] flex items-center gap-2">
        <label className="flex items-center gap-2 text-[11px] text-muted-foreground cursor-pointer">
          <Switch checked={pack.active} onCheckedChange={onToggle} />
          {pack.active ? "Live" : "Hidden"}
        </label>
        <div className="flex-1" />
        <Button variant="ghost" size="icon-sm" aria-label="Edit pack" onClick={onEdit}>
          <Pencil className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  );
}

/* ────────── Plan editor sheet ────────── */

function PlanSheet({
  draft,
  currency,
  onChange,
  onSave,
  onDelete,
  onCancel,
}: {
  draft: PlanDraft | null;
  currency: string;
  onChange: (next: PlanDraft) => void;
  onSave: (draft: PlanDraft) => Promise<void>;
  onDelete?: () => Promise<void>;
  onCancel: () => void;
}) {
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const open = draft !== null;
  if (!draft) {
    return (
      <Sheet open={open} onOpenChange={(o) => !o && onCancel()}>
        <SheetContent side="right" className="w-full sm:max-w-md p-0" />
      </Sheet>
    );
  }
  const isNew = draft.id === "";

  function set<K extends keyof PlanDraft>(key: K, value: PlanDraft[K]) {
    onChange({ ...draft!, [key]: value });
  }

  function addFeature() {
    onChange({ ...draft!, features: [...draft!.features, ""] });
  }
  function updateFeature(i: number, v: string) {
    onChange({
      ...draft!,
      features: draft!.features.map((f, idx) => (idx === i ? v : f)),
    });
  }
  function removeFeature(i: number) {
    onChange({
      ...draft!,
      features: draft!.features.filter((_, idx) => idx !== i),
    });
  }

  async function handleSave() {
    if (saving) return;
    setSaving(true);
    setError(null);
    try {
      await onSave(draft!);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!onDelete || deleting) return;
    setDeleting(true);
    setError(null);
    try {
      await onDelete();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setDeleting(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onCancel()}>
      <SheetContent side="right" className="w-full sm:max-w-md p-0 flex flex-col">
        <SheetHeader className="p-5 border-b border-border">
          <SheetTitle>{isNew ? "New plan" : "Edit plan"}</SheetTitle>
          <SheetDescription>How this offer appears to clients.</SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-auto p-5 space-y-4">
          <Field label="Name">
            <Input
              value={draft.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="e.g. Studio"
            />
          </Field>
          <Field label="Tagline">
            <Input
              value={draft.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder="One short line shown under the name"
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label={`Price (${currency} / mo)`}>
              <Input
                type="number"
                min={0}
                step="0.01"
                value={draft.price}
                onChange={(e) => set("price", Math.max(0, Number(e.target.value) || 0))}
              />
            </Field>
            <Field label="Credits / mo">
              <Input
                type="number"
                min={0}
                value={draft.credits}
                onChange={(e) => set("credits", Math.max(0, Number(e.target.value) || 0))}
              />
            </Field>
          </div>

          <Field
            label="Features"
            hint="What clients see as bullet points under the price."
          >
            <div className="space-y-2">
              {draft.features.map((f, i) => (
                <div key={i} className="flex gap-2">
                  <Input
                    value={f}
                    onChange={(e) => updateFeature(i, e.target.value)}
                    placeholder="e.g. Free reschedule up to 24h"
                  />
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Remove feature"
                    onClick={() => removeFeature(i)}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              ))}
              <Button variant="outline" size="sm" className="w-full gap-1.5" onClick={addFeature}>
                <Plus className="w-3 h-3" /> Add feature
              </Button>
            </div>
          </Field>

          <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/30">
            <div className="flex items-center gap-2 text-[13px]">
              <Eye className="w-4 h-4 text-muted-foreground" />
              <div>
                <div className="font-medium">Live</div>
                <div className="text-[11px] text-muted-foreground">
                  Clients can see and buy this plan when on.
                </div>
              </div>
            </div>
            <Switch
              checked={draft.active}
              onCheckedChange={(v: boolean) => set("active", v)}
            />
          </div>

          {error && (
            <div
              role="alert"
              className="rounded-lg border border-[--neg]/30 bg-[--neg]/10 px-3 py-2 text-[12px] text-[--neg]"
            >
              {error}
            </div>
          )}
        </div>

        <div className="border-t border-border p-4 flex items-center gap-2">
          {onDelete && (
            <Button
              variant="destructive"
              onClick={handleDelete}
              className="gap-1.5"
              disabled={saving || deleting}
            >
              {deleting ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Trash2 className="w-3.5 h-3.5" />
              )}{" "}
              Delete
            </Button>
          )}
          <div className="flex-1" />
          <Button variant="ghost" onClick={onCancel} disabled={saving || deleting}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!draft.name.trim() || saving || deleting}>
            {saving ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" /> {isNew ? "Creating" : "Saving"}
              </>
            ) : isNew ? (
              "Create plan"
            ) : (
              "Save plan"
            )}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

/* ────────── Pack editor sheet ────────── */

function PackSheet({
  draft,
  currency,
  onChange,
  onSave,
  onDelete,
  onCancel,
}: {
  draft: PackDraft | null;
  currency: string;
  onChange: (next: PackDraft) => void;
  onSave: (draft: PackDraft) => Promise<void>;
  onDelete?: () => Promise<void>;
  onCancel: () => void;
}) {
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const open = draft !== null;
  if (!draft) {
    return (
      <Sheet open={open} onOpenChange={(o) => !o && onCancel()}>
        <SheetContent side="right" className="w-full sm:max-w-md p-0" />
      </Sheet>
    );
  }
  const isNew = draft.id === "";
  const perCredit = draft.credits > 0 ? draft.price / draft.credits : 0;

  function set<K extends keyof PackDraft>(key: K, value: PackDraft[K]) {
    onChange({ ...draft!, [key]: value });
  }

  async function handleSave() {
    if (saving) return;
    setSaving(true);
    setError(null);
    try {
      await onSave(draft!);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!onDelete || deleting) return;
    setDeleting(true);
    setError(null);
    try {
      await onDelete();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setDeleting(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onCancel()}>
      <SheetContent side="right" className="w-full sm:max-w-md p-0 flex flex-col">
        <SheetHeader className="p-5 border-b border-border">
          <SheetTitle>{isNew ? "New credit pack" : "Edit credit pack"}</SheetTitle>
          <SheetDescription>
            One-time purchase. Clients pay once and credits land in their wallet.
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-auto p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Credits">
              <Input
                type="number"
                min={1}
                value={draft.credits}
                onChange={(e) => set("credits", Math.max(1, Number(e.target.value) || 1))}
              />
            </Field>
            <Field label={`Price (${currency})`}>
              <Input
                type="number"
                min={0}
                step="0.01"
                value={draft.price}
                onChange={(e) => set("price", Math.max(0, Number(e.target.value) || 0))}
              />
            </Field>
          </div>

          <div className="text-[12px] p-3 rounded-lg bg-muted/40 border border-border tabular-nums">
            {formatPrice(perCredit * 100, currency)} per credit
          </div>

          <Field label="Badge (optional)" hint="Shown as a small tag on the pack card.">
            <select
              value={draft.label}
              onChange={(e) => set("label", e.target.value)}
              className="w-full h-10 rounded-lg border border-border bg-background px-3 text-[13px] outline-none focus:border-ring focus:ring-2 focus:ring-ring/20"
            >
              <option value="">No badge</option>
              <option value="Popular">Popular</option>
              <option value="Best value">Best value</option>
              <option value="Pro">Pro</option>
            </select>
          </Field>

          <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/30">
            <div className="flex items-center gap-2 text-[13px]">
              <Eye className="w-4 h-4 text-muted-foreground" />
              <div>
                <div className="font-medium">Live</div>
                <div className="text-[11px] text-muted-foreground">
                  Clients can see and buy this pack when on.
                </div>
              </div>
            </div>
            <Switch
              checked={draft.active}
              onCheckedChange={(v: boolean) => set("active", v)}
            />
          </div>

          {error && (
            <div
              role="alert"
              className="rounded-lg border border-[--neg]/30 bg-[--neg]/10 px-3 py-2 text-[12px] text-[--neg]"
            >
              {error}
            </div>
          )}
        </div>

        <div className="border-t border-border p-4 flex items-center gap-2">
          {onDelete && (
            <Button
              variant="destructive"
              onClick={handleDelete}
              className="gap-1.5"
              disabled={saving || deleting}
            >
              {deleting ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Trash2 className="w-3.5 h-3.5" />
              )}{" "}
              Delete
            </Button>
          )}
          <div className="flex-1" />
          <Button variant="ghost" onClick={onCancel} disabled={saving || deleting}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving || deleting}>
            {saving ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" /> {isNew ? "Creating" : "Saving"}
              </>
            ) : isNew ? (
              "Create pack"
            ) : (
              "Save pack"
            )}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

/* ────────── Preview sheet ────────── */

function PreviewSheet({
  open,
  plans,
  packs,
  currency,
  onOpenChange,
}: {
  open: boolean;
  plans: PlanRow[];
  packs: PackRow[];
  currency: string;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-lg p-0 flex flex-col">
        <SheetHeader className="p-5 border-b border-border">
          <SheetTitle>Preview as client</SheetTitle>
          <SheetDescription>
            What your clients see when they open Credits in their app.
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-auto p-5 space-y-5">
          <div>
            <div className="text-[11px] tracking-[0.08em] uppercase font-medium text-muted-foreground mb-2">
              Plans
            </div>
            <div className="grid grid-cols-1 gap-2">
              {plans.length === 0 ? <EmptyMini text="No active plans." /> : null}
              {plans.map((p) => {
                const features = planFeatures(p);
                return (
                  <div key={p.id} className="border border-border rounded-lg p-4">
                    <div className="flex items-center gap-2">
                      <div className="text-[14px] font-semibold flex-1">{p.name}</div>
                    </div>
                    <div className="text-[20px] font-bold tabular-nums mt-1">
                      {p.price_cents === 0 ? "Free" : formatPrice(p.price_cents, currency)}
                      {p.price_cents > 0 && (
                        <span className="text-xs font-normal text-muted-foreground">/mo</span>
                      )}
                    </div>
                    {p.credits_granted > 0 && (
                      <div className="text-[11px] text-muted-foreground tabular-nums">
                        {p.credits_granted} credits/month
                      </div>
                    )}
                    {features.length > 0 && (
                      <ul className="text-[12px] space-y-1 mt-2">
                        {features.map((f, i) => (
                          <li key={`${f}-${i}`} className="flex gap-1.5 items-start">
                            <Check className="w-3 h-3 text-[--pos] mt-0.5 shrink-0" />
                            <span>{f}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div>
            <div className="text-[11px] tracking-[0.08em] uppercase font-medium text-muted-foreground mb-2">
              Top-up packs
            </div>
            <div className="grid grid-cols-2 gap-2">
              {packs.length === 0 ? <EmptyMini text="No active packs." /> : null}
              {packs.map((p) => {
                const featured = p.label === "Best value" || p.label === "Pro";
                return (
                  <div
                    key={p.id}
                    className={cn(
                      "border rounded-lg p-3 relative",
                      featured
                        ? "border-primary ring-1 ring-primary/30"
                        : "border-border"
                    )}
                  >
                    {p.label && (
                      <span className="absolute top-2 right-2">
                        <Pill kind={featured ? "teal" : "sage"}>{p.label}</Pill>
                      </span>
                    )}
                    <div className="text-[15px] font-bold tabular-nums">
                      {p.credits} credits
                    </div>
                    <div className="text-[11px] text-muted-foreground tabular-nums">
                      {formatPrice(p.price_cents, currency)} ·{" "}
                      {formatPrice(
                        p.credits > 0 ? p.price_cents / p.credits : 0,
                        currency
                      )}
                      /cr
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="border-t border-border p-4 flex justify-end">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function EmptyMini({ text }: { text: string }) {
  return (
    <div className="border border-dashed border-border rounded-lg p-4 text-[12px] text-muted-foreground text-center">
      {text}
    </div>
  );
}

/* ────────── Section + primitives ────────── */

function Section({
  eyebrow,
  title,
  sub,
  icon: Icon,
  action,
  children,
}: {
  eyebrow: string;
  title: string;
  sub: string;
  icon: React.ComponentType<{ className?: string }>;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-8">
      <header className="flex items-end gap-4 mb-4 flex-wrap">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <span className="w-9 h-9 rounded-lg bg-[--role-accent-light]/60 text-[--role-accent-dark] grid place-items-center shrink-0">
            <Icon className="w-4 h-4" />
          </span>
          <div className="min-w-0">
            <div className="text-[11px] tracking-[0.08em] uppercase font-medium text-muted-foreground">
              {eyebrow}
            </div>
            <h3 className="text-[16px] font-semibold tracking-tight">{title}</h3>
            <p className="text-[12px] text-muted-foreground mt-0.5 max-w-prose">{sub}</p>
          </div>
        </div>
        {action}
      </header>
      {children}
    </section>
  );
}

function GridSkeleton({ cols }: { cols: string }) {
  return (
    <div className={cn("grid grid-cols-1 gap-3", cols)}>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="h-44 rounded-xl border border-border bg-muted/30 animate-pulse"
        />
      ))}
    </div>
  );
}

function EmptyState({
  text,
  hint,
  label,
  onAdd,
  disabled,
}: {
  text: string;
  hint: string;
  label: string;
  onAdd: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onAdd}
      disabled={disabled}
      className="block w-full border border-dashed border-border rounded-xl py-10 text-center motion-safe:transition-colors motion-safe:duration-150 hover:border-primary/50 hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <div className="text-[13px] font-medium mb-1">{text}</div>
      <div className="text-[12px] text-muted-foreground mb-3">{hint}</div>
      <span className="inline-flex items-center gap-1.5 text-[12px] font-medium text-[--role-accent]">
        <Plus className="w-3.5 h-3.5" /> {label}
      </span>
    </button>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-[11px] font-medium tracking-[0.08em] uppercase text-muted-foreground mb-1.5">
        {label}
      </label>
      {children}
      {hint && <p className="text-[11px] text-muted-foreground mt-1.5">{hint}</p>}
    </div>
  );
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={cn(
        "w-full h-10 rounded-lg border border-border bg-background px-3 text-[13px] outline-none motion-safe:transition-colors motion-safe:duration-150",
        "hover:border-foreground/30 focus:border-ring focus:ring-2 focus:ring-ring/20"
      )}
    />
  );
}
