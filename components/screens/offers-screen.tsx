"use client";

import { useState } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  Check,
  Star,
  Eye,
  CreditCard,
  Layers,
  GripVertical,
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
import { CLIENT_PLANS, CLIENT_TOPUP_PACKS } from "@/lib/data";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type Plan = {
  id: string;
  name: string;
  price: number;
  credits: number;
  desc: string;
  features: string[];
  current?: boolean;
  popular?: boolean;
  active: boolean;
};

type Pack = {
  id: string;
  credits: number;
  price: number;
  label: string;
  active: boolean;
};

const newId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `id-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

/* ------------------------------------------------------------------ */
/*  Screen                                                             */
/* ------------------------------------------------------------------ */

export function OffersScreen() {
  const [plans, setPlans] = useState<Plan[]>(() =>
    CLIENT_PLANS.map((p) => ({ ...p, active: true, popular: !!p.current, features: [...p.features] }))
  );
  const [packs, setPacks] = useState<Pack[]>(() =>
    CLIENT_TOPUP_PACKS.map((p, i) => ({
      id: `pk-${i}`,
      credits: p.credits,
      price: p.price,
      label: p.label,
      active: true,
    }))
  );

  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [editingPack, setEditingPack] = useState<Pack | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  function savePlan(next: Plan) {
    setPlans((prev) => {
      const exists = prev.some((p) => p.id === next.id);
      return exists ? prev.map((p) => (p.id === next.id ? next : p)) : [...prev, next];
    });
    setEditingPlan(null);
  }

  function savePack(next: Pack) {
    setPacks((prev) => {
      const exists = prev.some((p) => p.id === next.id);
      return exists ? prev.map((p) => (p.id === next.id ? next : p)) : [...prev, next];
    });
    setEditingPack(null);
  }

  function deletePlan(id: string) {
    setPlans((prev) => prev.filter((p) => p.id !== id));
    setEditingPlan(null);
  }
  function deletePack(id: string) {
    setPacks((prev) => prev.filter((p) => p.id !== id));
    setEditingPack(null);
  }

  function toggleActivePlan(id: string) {
    setPlans((prev) => prev.map((p) => (p.id === id ? { ...p, active: !p.active } : p)));
  }
  function toggleActivePack(id: string) {
    setPacks((prev) => prev.map((p) => (p.id === id ? { ...p, active: !p.active } : p)));
  }

  function newPlan() {
    setEditingPlan({
      id: newId(),
      name: "New plan",
      price: 0,
      credits: 0,
      desc: "",
      features: [],
      active: true,
    });
  }
  function newPack() {
    setEditingPack({
      id: newId(),
      credits: 5,
      price: 50,
      label: "",
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

      {/* Subscription plans */}
      <Section
        eyebrow="Subscription plans"
        title="Recurring revenue offers"
        sub="Clients pay monthly. Each plan includes a credit allotment they can use for bookings."
        icon={Layers}
        action={
          <Button size="sm" className="gap-2" onClick={newPlan}>
            <Plus className="w-3.5 h-3.5" /> New plan
          </Button>
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {plans.map((p) => (
            <PlanCard
              key={p.id}
              plan={p}
              onEdit={() => setEditingPlan({ ...p, features: [...p.features] })}
              onToggle={() => toggleActivePlan(p.id)}
            />
          ))}
        </div>
      </Section>

      {/* Credit packs */}
      <Section
        eyebrow="Credit packs"
        title="One-time top-ups"
        sub="Clients pay once and get a bundle of credits. Great for casual users and as upsells when subscribers run low."
        icon={CreditCard}
        action={
          <Button size="sm" className="gap-2" onClick={newPack}>
            <Plus className="w-3.5 h-3.5" /> New pack
          </Button>
        }
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {packs.map((p) => (
            <PackCard
              key={p.id}
              pack={p}
              onEdit={() => setEditingPack({ ...p })}
              onToggle={() => toggleActivePack(p.id)}
            />
          ))}
        </div>
      </Section>

      {/* Sheets */}
      <PlanSheet
        plan={editingPlan}
        onSave={savePlan}
        onDelete={editingPlan ? () => deletePlan(editingPlan.id) : undefined}
        onCancel={() => setEditingPlan(null)}
      />
      <PackSheet
        pack={editingPack}
        onSave={savePack}
        onDelete={editingPack ? () => deletePack(editingPack.id) : undefined}
        onCancel={() => setEditingPack(null)}
      />
      <PreviewSheet
        open={previewOpen}
        plans={plans.filter((p) => p.active)}
        packs={packs.filter((p) => p.active)}
        onOpenChange={setPreviewOpen}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Plan card                                                          */
/* ------------------------------------------------------------------ */

function PlanCard({
  plan,
  onEdit,
  onToggle,
}: {
  plan: Plan;
  onEdit: () => void;
  onToggle: () => void;
}) {
  return (
    <div
      className={cn(
        "bg-card border rounded-xl shadow-card p-5 flex flex-col motion-safe:transition-all motion-safe:duration-200 hover:-translate-y-px hover:shadow-hero",
        plan.popular ? "border-primary ring-1 ring-primary/30" : "border-border",
        !plan.active && "opacity-60"
      )}
    >
      <div className="flex items-start gap-2 mb-2">
        <GripVertical className="w-4 h-4 text-muted-foreground/40 mt-1 shrink-0" aria-hidden />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[15px] font-semibold">{plan.name}</span>
            {plan.popular && (
              <Pill kind="teal">
                <Star className="w-2.5 h-2.5" /> Popular
              </Pill>
            )}
          </div>
          <p className="text-[12px] text-muted-foreground mt-0.5 line-clamp-1">
            {plan.desc || "—"}
          </p>
        </div>
      </div>

      <div className="flex items-baseline gap-1 mt-1">
        <span className="text-[24px] font-semibold tracking-tight tabular-nums">
          {plan.price === 0 ? "Free" : `$${plan.price}`}
        </span>
        {plan.price > 0 && (
          <span className="text-[12px] text-muted-foreground">/mo</span>
        )}
      </div>
      <div className="text-[11px] text-muted-foreground mb-3 tabular-nums">
        {plan.credits > 0 ? `${plan.credits} credits / month` : "No credits included"}
      </div>

      {plan.features.length > 0 && (
        <ul className="text-[12px] space-y-1 mb-4 flex-1">
          {plan.features.slice(0, 3).map((f) => (
            <li key={f} className="flex gap-1.5 items-start">
              <Check className="w-3 h-3 text-[--pos] mt-0.5 shrink-0" aria-hidden />
              <span className="line-clamp-1">{f}</span>
            </li>
          ))}
          {plan.features.length > 3 && (
            <li className="text-[11px] text-muted-foreground pl-4.5">
              + {plan.features.length - 3} more
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

/* ------------------------------------------------------------------ */
/*  Pack card                                                          */
/* ------------------------------------------------------------------ */

function PackCard({
  pack,
  onEdit,
  onToggle,
}: {
  pack: Pack;
  onEdit: () => void;
  onToggle: () => void;
}) {
  const perCredit = pack.credits > 0 ? pack.price / pack.credits : 0;
  const featured = pack.label === "Best value" || pack.label === "Pro";

  return (
    <div
      className={cn(
        "bg-card border rounded-xl shadow-card p-4 flex flex-col motion-safe:transition-all motion-safe:duration-200 hover:-translate-y-px hover:shadow-hero relative",
        featured ? "border-primary ring-1 ring-primary/30" : "border-border",
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
        ${pack.price} · ${perCredit.toFixed(2)}/credit
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

/* ------------------------------------------------------------------ */
/*  Plan editor sheet                                                  */
/* ------------------------------------------------------------------ */

function PlanSheet({
  plan,
  onSave,
  onDelete,
  onCancel,
}: {
  plan: Plan | null;
  onSave: (p: Plan) => void;
  onDelete?: () => void;
  onCancel: () => void;
}) {
  const open = plan !== null;
  const [draft, setDraft] = useState<Plan | null>(plan);
  // Keep draft in sync when sheet opens with a different plan
  if (open && draft?.id !== plan!.id) setDraft(plan);
  if (!open && draft !== null) setDraft(null);

  if (!draft) {
    return (
      <Sheet open={open} onOpenChange={(o) => !o && onCancel()}>
        <SheetContent side="right" className="w-full sm:max-w-md p-0" />
      </Sheet>
    );
  }

  function set<K extends keyof Plan>(key: K, value: Plan[K]) {
    setDraft((d) => (d ? { ...d, [key]: value } : d));
  }

  function addFeature() {
    setDraft((d) => (d ? { ...d, features: [...d.features, ""] } : d));
  }
  function updateFeature(i: number, v: string) {
    setDraft((d) =>
      d ? { ...d, features: d.features.map((f, idx) => (idx === i ? v : f)) } : d
    );
  }
  function removeFeature(i: number) {
    setDraft((d) => (d ? { ...d, features: d.features.filter((_, idx) => idx !== i) } : d));
  }

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onCancel()}>
      <SheetContent side="right" className="w-full sm:max-w-md p-0 flex flex-col">
        <SheetHeader className="p-5 border-b border-border">
          <SheetTitle>Edit plan</SheetTitle>
          <SheetDescription>
            Edit how this offer appears to clients.
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-auto p-5 space-y-4">
          <Field label="Name">
            <Input value={draft.name} onChange={(e) => set("name", e.target.value)} />
          </Field>
          <Field label="Tagline">
            <Input value={draft.desc} onChange={(e) => set("desc", e.target.value)} placeholder="One short line shown under the name" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Price (USD / mo)">
              <Input
                type="number"
                min={0}
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
              <Star className="w-4 h-4 text-muted-foreground" />
              <div>
                <div className="font-medium">Mark as popular</div>
                <div className="text-[11px] text-muted-foreground">
                  Highlights this plan in the client view.
                </div>
              </div>
            </div>
            <Switch
              checked={!!draft.popular}
              onCheckedChange={(v: boolean) => set("popular", v)}
            />
          </div>

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
        </div>

        <div className="border-t border-border p-4 flex items-center gap-2">
          {onDelete && (
            <Button variant="destructive" onClick={onDelete} className="gap-1.5">
              <Trash2 className="w-3.5 h-3.5" /> Delete
            </Button>
          )}
          <div className="flex-1" />
          <Button variant="ghost" onClick={onCancel}>Cancel</Button>
          <Button onClick={() => onSave(draft)}>Save plan</Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

/* ------------------------------------------------------------------ */
/*  Pack editor sheet                                                  */
/* ------------------------------------------------------------------ */

function PackSheet({
  pack,
  onSave,
  onDelete,
  onCancel,
}: {
  pack: Pack | null;
  onSave: (p: Pack) => void;
  onDelete?: () => void;
  onCancel: () => void;
}) {
  const open = pack !== null;
  const [draft, setDraft] = useState<Pack | null>(pack);
  if (open && draft?.id !== pack!.id) setDraft(pack);
  if (!open && draft !== null) setDraft(null);

  if (!draft) {
    return (
      <Sheet open={open} onOpenChange={(o) => !o && onCancel()}>
        <SheetContent side="right" className="w-full sm:max-w-md p-0" />
      </Sheet>
    );
  }

  function set<K extends keyof Pack>(key: K, value: Pack[K]) {
    setDraft((d) => (d ? { ...d, [key]: value } : d));
  }

  const perCredit = draft.credits > 0 ? draft.price / draft.credits : 0;

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onCancel()}>
      <SheetContent side="right" className="w-full sm:max-w-md p-0 flex flex-col">
        <SheetHeader className="p-5 border-b border-border">
          <SheetTitle>Edit credit pack</SheetTitle>
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
            <Field label="Price (USD)">
              <Input
                type="number"
                min={0}
                value={draft.price}
                onChange={(e) => set("price", Math.max(0, Number(e.target.value) || 0))}
              />
            </Field>
          </div>

          <div className="text-[12px] p-3 rounded-lg bg-muted/40 border border-border tabular-nums">
            ${perCredit.toFixed(2)} per credit
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
        </div>

        <div className="border-t border-border p-4 flex items-center gap-2">
          {onDelete && (
            <Button variant="destructive" onClick={onDelete} className="gap-1.5">
              <Trash2 className="w-3.5 h-3.5" /> Delete
            </Button>
          )}
          <div className="flex-1" />
          <Button variant="ghost" onClick={onCancel}>Cancel</Button>
          <Button onClick={() => onSave(draft)}>Save pack</Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

/* ------------------------------------------------------------------ */
/*  Preview sheet (what clients see)                                   */
/* ------------------------------------------------------------------ */

function PreviewSheet({
  open,
  plans,
  packs,
  onOpenChange,
}: {
  open: boolean;
  plans: Plan[];
  packs: Pack[];
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
              {plans.length === 0 && (
                <EmptyMini text="No active plans." />
              )}
              {plans.map((p) => (
                <div
                  key={p.id}
                  className={cn(
                    "border rounded-lg p-4",
                    p.popular ? "border-primary ring-1 ring-primary/30" : "border-border"
                  )}
                >
                  <div className="flex items-center gap-2">
                    <div className="text-[14px] font-semibold flex-1">{p.name}</div>
                    {p.popular && <Pill kind="teal">Popular</Pill>}
                  </div>
                  <div className="text-[20px] font-bold tabular-nums mt-1">
                    {p.price === 0 ? "Free" : `$${p.price}`}
                    {p.price > 0 && <span className="text-xs font-normal text-muted-foreground">/mo</span>}
                  </div>
                  {p.credits > 0 && (
                    <div className="text-[11px] text-muted-foreground tabular-nums">
                      {p.credits} credits/month
                    </div>
                  )}
                  {p.features.length > 0 && (
                    <ul className="text-[12px] space-y-1 mt-2">
                      {p.features.map((f) => (
                        <li key={f} className="flex gap-1.5 items-start">
                          <Check className="w-3 h-3 text-[--pos] mt-0.5 shrink-0" />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="text-[11px] tracking-[0.08em] uppercase font-medium text-muted-foreground mb-2">
              Top-up packs
            </div>
            <div className="grid grid-cols-2 gap-2">
              {packs.length === 0 && <EmptyMini text="No active packs." />}
              {packs.map((p) => (
                <div
                  key={p.id}
                  className={cn(
                    "border rounded-lg p-3 relative",
                    (p.label === "Best value" || p.label === "Pro")
                      ? "border-primary ring-1 ring-primary/30"
                      : "border-border"
                  )}
                >
                  {p.label && (
                    <span className="absolute top-2 right-2">
                      <Pill kind={p.label === "Best value" || p.label === "Pro" ? "teal" : "sage"}>
                        {p.label}
                      </Pill>
                    </span>
                  )}
                  <div className="text-[15px] font-bold tabular-nums">{p.credits} credits</div>
                  <div className="text-[11px] text-muted-foreground tabular-nums">
                    ${p.price} · ${(p.price / Math.max(1, p.credits)).toFixed(2)}/cr
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="border-t border-border p-4 flex justify-end">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Close</Button>
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

/* ------------------------------------------------------------------ */
/*  Section + form primitives                                          */
/* ------------------------------------------------------------------ */

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
