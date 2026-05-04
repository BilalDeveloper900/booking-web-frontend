"use client";

import { useMemo, useState } from "react";
import {
  Plus,
  Trash2,
  User,
  Users,
  Sparkles,
  ChevronRight,
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
import { SERVICES, type Service, type ServiceMode } from "@/lib/data";
import { cn } from "@/lib/utils";

const ME = "Camille Roux"; // mock — current admin

type EditableService = Service & { active: boolean };

const newId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `svc-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

/**
 * Embeddable services panel for the admin overview.
 * Two sub-sections: 1-on-1 services and Classes. Each row is click-to-edit
 * with an inline active toggle; sub-sections have their own contextual "Add".
 */
export function ServicesPanel() {
  const [services, setServices] = useState<EditableService[]>(() => {
    const mine = SERVICES.filter((s) => s.adminName === ME).map((s) => ({ ...s, active: true }));
    if (mine.length === 0) {
      return SERVICES.slice(0, 4).map((s) => ({ ...s, adminName: ME, active: true }));
    }
    return mine;
  });

  const [editing, setEditing] = useState<EditableService | null>(null);

  const { soloList, groupList } = useMemo(() => {
    const soloList = services.filter((s) => s.mode === "solo");
    const groupList = services.filter((s) => s.mode === "group");
    return { soloList, groupList };
  }, [services]);

  function save(next: EditableService) {
    setServices((prev) => {
      const exists = prev.some((s) => s.id === next.id);
      return exists ? prev.map((s) => (s.id === next.id ? next : s)) : [...prev, next];
    });
    setEditing(null);
  }

  function remove(id: string) {
    setServices((prev) => prev.filter((s) => s.id !== id));
    setEditing(null);
  }

  function toggle(id: string) {
    setServices((prev) =>
      prev.map((s) => (s.id === id ? { ...s, active: !s.active } : s))
    );
  }

  function startNew(mode: ServiceMode) {
    setEditing({
      id: newId(),
      adminName: ME,
      name: "",
      mode,
      defaultCapacity: mode === "solo" ? 1 : 12,
      durationMin: 60,
      credits: 1,
      hue: 195,
      description: "",
      active: true,
    });
  }

  return (
    <>
      <div className="mb-5">
        <div className="text-[15px] font-semibold tracking-tight">Services</div>
        <p className="text-[12px] text-muted-foreground mt-0.5">
          What you offer your clients. Inactive ones are hidden from the booking flow.
        </p>
      </div>

      <div className="space-y-5">
        <ServiceSection
          icon={User}
          title="1-on-1 services"
          subtitle="One client at a time."
          count={soloList.length}
          onAdd={() => startNew("solo")}
          emptyHint="Add a service like a haircut or training session."
          mode="solo"
        >
          {soloList.map((s) => (
            <ServiceRow
              key={s.id}
              service={s}
              onEdit={() => setEditing(s)}
              onToggle={() => toggle(s.id)}
            />
          ))}
        </ServiceSection>

        <ServiceSection
          icon={Users}
          title="Classes"
          subtitle="Group sessions with a capacity."
          count={groupList.length}
          onAdd={() => startNew("group")}
          emptyHint="Add a class like Yoga Flow or Spin."
          mode="group"
        >
          {groupList.map((s) => (
            <ServiceRow
              key={s.id}
              service={s}
              onEdit={() => setEditing(s)}
              onToggle={() => toggle(s.id)}
            />
          ))}
        </ServiceSection>
      </div>

      <ServiceEditorSheet
        editing={editing}
        onClose={() => setEditing(null)}
        onSave={save}
        onDelete={remove}
      />
    </>
  );
}

/* ───────── Section (header + list / empty state) ───────── */

function ServiceSection({
  icon: Icon,
  title,
  subtitle,
  count,
  onAdd,
  emptyHint,
  mode,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  subtitle: string;
  count: number;
  onAdd: () => void;
  emptyHint: string;
  mode: ServiceMode;
  children: React.ReactNode;
}) {
  const isEmpty = count === 0;
  return (
    <section>
      <div className="flex items-center gap-3 mb-2.5">
        <span className="w-7 h-7 rounded-md bg-muted text-muted-foreground grid place-items-center shrink-0">
          <Icon className="w-3.5 h-3.5" />
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2 flex-wrap">
            <h4 className="text-[13px] font-semibold tracking-tight">{title}</h4>
            <span className="text-[11px] text-muted-foreground tabular-nums">{count}</span>
          </div>
          <p className="text-[11px] text-muted-foreground leading-tight">{subtitle}</p>
        </div>
        <Button variant="outline" size="sm" className="gap-1.5 shrink-0" onClick={onAdd}>
          <Plus className="w-3.5 h-3.5" /> Add
        </Button>
      </div>

      {isEmpty ? (
        <button
          type="button"
          onClick={onAdd}
          className="block w-full border border-dashed border-border rounded-lg py-5 text-center motion-safe:transition-colors motion-safe:duration-150 hover:border-primary/50 hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <div className="text-[12px] text-muted-foreground">
            No {mode === "group" ? "classes" : "1-on-1 services"} yet.
          </div>
          <div className="text-[11px] text-muted-foreground/80 mt-0.5">{emptyHint}</div>
        </button>
      ) : (
        <div className="space-y-1.5">{children}</div>
      )}
    </section>
  );
}

/* ───────── Row ───────── */

function ServiceRow({
  service,
  onEdit,
  onToggle,
}: {
  service: EditableService;
  onEdit: () => void;
  onToggle: () => void;
}) {
  const isGroup = service.mode === "group";
  const stripe = `oklch(0.6 0.10 ${service.hue})`;

  return (
    <div
      className={cn(
        "group/row flex items-stretch border border-border rounded-lg overflow-hidden bg-card motion-safe:transition-colors motion-safe:duration-150 hover:border-foreground/30",
        !service.active && "bg-muted/40"
      )}
    >
      <div
        aria-hidden
        className="w-1 shrink-0 motion-safe:transition-opacity motion-safe:duration-150"
        style={{
          background: stripe,
          opacity: service.active ? 1 : 0.35,
        }}
      />

      <button
        type="button"
        onClick={onEdit}
        aria-label={`Edit ${service.name}`}
        className="flex-1 min-w-0 flex items-center gap-3 pl-3 pr-2 py-2.5 text-left motion-safe:transition-colors motion-safe:duration-150 hover:bg-muted/40 focus-visible:outline-none focus-visible:bg-muted/40"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2 flex-wrap">
            <span
              className={cn(
                "text-[13px] font-semibold tracking-tight truncate",
                !service.active && "text-muted-foreground"
              )}
            >
              {service.name || "Untitled service"}
            </span>
            {!service.active && <Pill kind="warn">Off</Pill>}
          </div>
          {service.description && (
            <p className="text-[11px] text-muted-foreground truncate mt-0.5">
              {service.description}
            </p>
          )}
        </div>

        <div className="hidden sm:flex items-center gap-3 text-[11px] text-muted-foreground tabular-nums shrink-0">
          <span>{service.durationMin}m</span>
          <span>·</span>
          <span>
            {service.credits} cr{service.credits === 1 ? "" : "s"}
          </span>
          {isGroup && (
            <>
              <span>·</span>
              <span>{service.defaultCapacity} seats</span>
            </>
          )}
        </div>

        <ChevronRight className="hidden sm:block w-4 h-4 text-muted-foreground/40 shrink-0 motion-safe:transition-transform motion-safe:duration-150 group-hover/row:translate-x-0.5 group-hover/row:text-muted-foreground" />
      </button>

      <div
        className="flex items-center px-3 border-l border-border bg-card"
        onClick={(e) => e.stopPropagation()}
      >
        <Switch
          checked={service.active}
          onCheckedChange={onToggle}
          aria-label={`${service.active ? "Deactivate" : "Activate"} ${service.name}`}
          size="sm"
        />
      </div>
    </div>
  );
}

/* ───────── Editor sheet ───────── */

function ServiceEditorSheet({
  editing,
  onClose,
  onSave,
  onDelete,
}: {
  editing: EditableService | null;
  onClose: () => void;
  onSave: (s: EditableService) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <Sheet open={editing !== null} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-md p-0">
        {editing && (
          <ServiceEditorForm
            initial={editing}
            onCancel={onClose}
            onSave={onSave}
            onDelete={() => onDelete(editing.id)}
          />
        )}
      </SheetContent>
    </Sheet>
  );
}

const HUE_PALETTE = [195, 165, 220, 280, 330, 60, 130, 25];

function ServiceEditorForm({
  initial,
  onCancel,
  onSave,
  onDelete,
}: {
  initial: EditableService;
  onCancel: () => void;
  onSave: (s: EditableService) => void;
  onDelete: () => void;
}) {
  const [draft, setDraft] = useState<EditableService>(initial);
  const isGroup = draft.mode === "group";
  const isNew = initial.name.trim() === "";

  function set<K extends keyof EditableService>(key: K, value: EditableService[K]) {
    setDraft((d) => ({ ...d, [key]: value }));
  }

  function setMode(mode: ServiceMode) {
    setDraft((d) => ({
      ...d,
      mode,
      defaultCapacity: mode === "solo" ? 1 : Math.max(2, d.defaultCapacity),
    }));
  }

  return (
    <>
      <SheetHeader className="p-6 pb-4">
        <div className="inline-flex items-center gap-2 self-start px-2 py-1 rounded-md text-[11px] font-medium mb-3 bg-[--role-accent-light] text-[--role-accent-dark]">
          <Sparkles className="w-3 h-3" />
          {isNew ? `New ${isGroup ? "class" : "1-on-1 service"}` : "Edit service"}
        </div>
        <SheetTitle className="text-[20px] font-semibold tracking-tight">
          {draft.name || (isGroup ? "Untitled class" : "Untitled service")}
        </SheetTitle>
        <SheetDescription>
          Define what you offer. Clients book {isGroup ? "seats in this class" : "this service 1-on-1"}.
        </SheetDescription>
      </SheetHeader>

      <div className="px-6 space-y-5 pb-4 overflow-auto">
        <Field label="Mode">
          <div role="tablist" className="grid grid-cols-2 gap-2">
            {(
              [
                { id: "solo" as const, label: "1-on-1", desc: "One client per session", icon: User },
                { id: "group" as const, label: "Class", desc: "Multiple clients", icon: Users },
              ] as const
            ).map((m) => {
              const active = draft.mode === m.id;
              const Icon = m.icon;
              return (
                <button
                  key={m.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setMode(m.id)}
                  className={cn(
                    "flex flex-col items-start gap-1 p-3 rounded-lg border text-left motion-safe:transition-colors",
                    active
                      ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                      : "border-border hover:border-primary/50"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-[13px] font-semibold">{m.label}</span>
                  <span className="text-[11px] text-muted-foreground">{m.desc}</span>
                </button>
              );
            })}
          </div>
        </Field>

        <Field label="Name">
          <Input value={draft.name} onChange={(v) => set("name", v)} placeholder="e.g. Yoga Flow" />
        </Field>

        <Field label="Description" hint="Shown to clients when they browse classes">
          <Textarea
            value={draft.description ?? ""}
            onChange={(v) => set("description", v)}
            placeholder={isGroup ? "All-levels vinyasa flow…" : "Cut, wash, gloss treatment…"}
          />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Duration" hint="minutes">
            <NumberInput
              value={draft.durationMin}
              onChange={(v) => set("durationMin", v)}
              min={5}
              step={5}
              suffix="min"
            />
          </Field>
          <Field label="Credits" hint="per attendee">
            <NumberInput
              value={draft.credits}
              onChange={(v) => set("credits", v)}
              min={0}
              suffix={`cr${draft.credits === 1 ? "" : "s"}`}
            />
          </Field>
        </div>

        {isGroup && (
          <Field label="Capacity" hint="max attendees per class instance">
            <NumberInput
              value={draft.defaultCapacity}
              onChange={(v) => set("defaultCapacity", v)}
              min={2}
              max={100}
              suffix="seats"
            />
          </Field>
        )}

        <Field label="Color">
          <div className="flex gap-2 flex-wrap">
            {HUE_PALETTE.map((h) => {
              const on = draft.hue === h;
              return (
                <button
                  key={h}
                  type="button"
                  onClick={() => set("hue", h)}
                  aria-label={`Color ${h}`}
                  aria-pressed={on}
                  className={cn(
                    "w-8 h-8 rounded-full motion-safe:transition-all motion-safe:duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    on && "ring-2 ring-offset-2 ring-offset-background ring-foreground scale-110"
                  )}
                  style={{
                    background: `linear-gradient(135deg, oklch(0.7 0.08 ${h}), oklch(0.55 0.07 ${h + 30}))`,
                  }}
                />
              );
            })}
          </div>
        </Field>

        <div className="flex items-center justify-between gap-3 pt-1">
          <div>
            <div className="text-[13px] font-medium">Active</div>
            <div className="text-[11px] text-muted-foreground">
              Inactive services are hidden from clients
            </div>
          </div>
          <Switch checked={draft.active} onCheckedChange={(v) => set("active", v)} />
        </div>
      </div>

      <div className="mt-auto p-6 pt-4 border-t border-border flex flex-col gap-2">
        <Button className="w-full" onClick={() => onSave(draft)} disabled={!draft.name.trim()}>
          {isNew ? "Create service" : "Save changes"}
        </Button>
        {isNew ? (
          <Button variant="ghost" className="w-full" onClick={onCancel}>
            Cancel
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button variant="ghost" className="flex-1" onClick={onCancel}>
              Cancel
            </Button>
            <Button variant="destructive" className="flex-1 gap-2" onClick={onDelete}>
              <Trash2 className="w-3.5 h-3.5" /> Delete
            </Button>
          </div>
        )}
      </div>
    </>
  );
}

/* ───────── small bits ───────── */

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
      <div className="flex items-baseline justify-between mb-1.5">
        <label className="text-[11px] font-medium tracking-[0.08em] uppercase text-muted-foreground">
          {label}
        </label>
        {hint && <span className="text-[10px] text-muted-foreground">{hint}</span>}
      </div>
      {children}
    </div>
  );
}

function Input({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full h-10 px-3 border border-border rounded-lg text-[13px] bg-card focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent motion-safe:transition-colors"
    />
  );
}

function Textarea({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={2}
      className="w-full px-3 py-2 border border-border rounded-lg text-[13px] bg-card resize-none focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent motion-safe:transition-colors"
    />
  );
}

function NumberInput({
  value,
  onChange,
  min,
  max,
  step = 1,
  suffix,
}: {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
  suffix?: string;
}) {
  return (
    <div className="relative">
      <input
        type="number"
        value={value}
        onChange={(e) => {
          const n = Number(e.target.value);
          if (Number.isNaN(n)) return;
          onChange(n);
        }}
        min={min}
        max={max}
        step={step}
        className="w-full h-10 px-3 pr-14 border border-border rounded-lg text-[13px] bg-card tabular-nums focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent motion-safe:transition-colors"
      />
      {suffix && (
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-muted-foreground pointer-events-none">
          {suffix}
        </span>
      )}
    </div>
  );
}
