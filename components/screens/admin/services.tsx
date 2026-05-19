"use client";

import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import {
  Plus,
  Trash2,
  User,
  Users,
  Sparkles,
  ChevronRight,
  Loader2,
  AlertCircle,
  CalendarPlus,
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
  useServices,
  createService,
  updateService,
  deleteService,
  setServiceActive,
  type ServiceRow,
} from "@/lib/services";
import { createGroupSession } from "@/lib/sessions";
import { useCurrentMember } from "@/lib/auth/use-current-member";
import { cn } from "@/lib/utils";

type ServiceMode = "solo" | "group";

// Draft used by the editor form. Same shape as the DB row, but `id` is empty
// for new services (which signals "insert" on save).
type Draft = {
  id: string;
  studio_id: string;
  admin_member_id: string;
  name: string;
  description: string;
  mode: ServiceMode;
  default_capacity: number;
  duration_min: number;
  credits_cost: number;
  gross_price_cents: number;
  hue: number;
  active: boolean;
};

function rowToDraft(row: ServiceRow): Draft {
  return {
    id: row.id,
    studio_id: row.studio_id,
    admin_member_id: row.admin_member_id ?? "",
    name: row.name,
    description: row.description ?? "",
    mode: row.mode as ServiceMode,
    default_capacity: row.default_capacity,
    duration_min: row.duration_min,
    credits_cost: row.credits_cost,
    gross_price_cents: row.gross_price_cents,
    hue: row.hue,
    active: row.active,
  };
}

/**
 * Embeddable services panel for the admin overview.
 * Two sub-sections: 1-on-1 services and Classes. Each row is click-to-edit
 * with an inline active toggle; sub-sections have their own contextual "Add".
 *
 * Reads live from `public.services` filtered by this admin's member id.
 */
export function ServicesPanel() {
  const { member, loading: memberLoading } = useCurrentMember();
  const adminMemberId = member?.member.id;
  const studioId = member?.studio.id;
  const { services, loading, error, refetch } = useServices(adminMemberId);

  const [editing, setEditing] = useState<Draft | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [scheduling, setScheduling] = useState<ServiceRow | null>(null);

  const { soloList, groupList } = useMemo(() => {
    const soloList = services.filter((s) => s.mode === "solo");
    const groupList = services.filter((s) => s.mode === "group");
    return { soloList, groupList };
  }, [services]);

  async function save(draft: Draft) {
    setSaveError(null);
    try {
      if (draft.id === "") {
        await createService({
          studio_id: draft.studio_id,
          admin_member_id: draft.admin_member_id,
          name: draft.name,
          description: draft.description || null,
          mode: draft.mode,
          default_capacity: draft.default_capacity,
          duration_min: draft.duration_min,
          credits_cost: draft.credits_cost,
          gross_price_cents: draft.gross_price_cents,
          hue: draft.hue,
          active: draft.active,
        });
      } else {
        await updateService(draft.id, {
          name: draft.name,
          description: draft.description || null,
          mode: draft.mode,
          default_capacity: draft.default_capacity,
          duration_min: draft.duration_min,
          credits_cost: draft.credits_cost,
          gross_price_cents: draft.gross_price_cents,
          hue: draft.hue,
          active: draft.active,
        });
      }
      await refetch();
      setEditing(null);
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : String(e));
    }
  }

  async function remove(id: string) {
    setSaveError(null);
    try {
      await deleteService(id);
      await refetch();
      setEditing(null);
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : String(e));
    }
  }

  async function toggle(id: string, next: boolean) {
    try {
      await setServiceActive(id, next);
      await refetch();
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : String(e));
    }
  }

  function startNew(mode: ServiceMode) {
    if (!studioId || !adminMemberId) return;
    setEditing({
      id: "",
      studio_id: studioId,
      admin_member_id: adminMemberId,
      name: "",
      description: "",
      mode,
      default_capacity: mode === "solo" ? 1 : 12,
      duration_min: 60,
      credits_cost: 1,
      gross_price_cents: 0,
      hue: 195,
      active: true,
    });
  }

  const showInitialLoading = memberLoading || (loading && services.length === 0);

  return (
    <>
      <div className="mb-5">
        <div className="text-[15px] font-semibold tracking-tight">Services</div>
        <p className="text-[12px] text-muted-foreground mt-0.5">
          What you offer your clients. Inactive ones are hidden from the booking flow.
        </p>
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-lg border border-[--neg]/30 bg-[--neg]/10 px-3 py-2 text-[12px] text-[--neg] mb-4 inline-flex items-center gap-2"
        >
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          Couldn&rsquo;t load services: {error}
        </div>
      )}

      {showInitialLoading ? (
        <div className="space-y-5">
          <SectionSkeleton title="1-on-1 services" subtitle="One client at a time." />
          <SectionSkeleton title="Classes" subtitle="Group sessions with a capacity." />
        </div>
      ) : (
        <div className="space-y-5">
          <ServiceSection
            icon={User}
            title="1-on-1 services"
            subtitle="One client at a time."
            count={soloList.length}
            onAdd={() => startNew("solo")}
            disabled={!studioId || !adminMemberId}
            emptyHint="Add a service like a haircut or training session."
            mode="solo"
          >
            {soloList.map((s) => (
              <ServiceRowItem
                key={s.id}
                service={s}
                onEdit={() => setEditing(rowToDraft(s))}
                onToggle={(next) => toggle(s.id, next)}
              />
            ))}
          </ServiceSection>

          <ServiceSection
            icon={Users}
            title="Classes"
            subtitle="Group sessions with a capacity."
            count={groupList.length}
            onAdd={() => startNew("group")}
            disabled={!studioId || !adminMemberId}
            emptyHint="Add a class like Yoga Flow or Spin."
            mode="group"
          >
            {groupList.map((s) => (
              <ServiceRowItem
                key={s.id}
                service={s}
                onEdit={() => setEditing(rowToDraft(s))}
                onToggle={(next) => toggle(s.id, next)}
                onSchedule={() => setScheduling(s)}
              />
            ))}
          </ServiceSection>
        </div>
      )}

      <ServiceEditorSheet
        editing={editing}
        saveError={saveError}
        onClose={() => {
          setEditing(null);
          setSaveError(null);
        }}
        onSave={save}
        onDelete={remove}
      />

      <ScheduleClassSheet
        service={scheduling}
        onClose={() => setScheduling(null)}
        onScheduled={refetch}
      />
    </>
  );
}

/* ───────── Section (header + list / empty state / skeleton) ───────── */

function SectionSkeleton({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <section>
      <div className="flex items-center gap-3 mb-2.5">
        <span className="w-7 h-7 rounded-md bg-muted text-muted-foreground grid place-items-center shrink-0">
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        </span>
        <div className="flex-1 min-w-0">
          <h4 className="text-[13px] font-semibold tracking-tight">{title}</h4>
          <p className="text-[11px] text-muted-foreground leading-tight">{subtitle}</p>
        </div>
      </div>
      <div className="space-y-1.5">
        {[0, 1].map((i) => (
          <div
            key={i}
            className="h-14.5 rounded-lg border border-border bg-muted/30 animate-pulse"
          />
        ))}
      </div>
    </section>
  );
}

function ServiceSection({
  icon: Icon,
  title,
  subtitle,
  count,
  onAdd,
  disabled,
  emptyHint,
  mode,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  subtitle: string;
  count: number;
  onAdd: () => void;
  disabled?: boolean;
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
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 shrink-0"
          onClick={onAdd}
          disabled={disabled}
        >
          <Plus className="w-3.5 h-3.5" /> Add
        </Button>
      </div>

      {isEmpty ? (
        <button
          type="button"
          onClick={onAdd}
          disabled={disabled}
          className="block w-full border border-dashed border-border rounded-lg py-5 text-center motion-safe:transition-colors motion-safe:duration-150 hover:border-primary/50 hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 disabled:cursor-not-allowed"
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

function ServiceRowItem({
  service,
  onEdit,
  onToggle,
  onSchedule,
}: {
  service: ServiceRow;
  onEdit: () => void;
  onToggle: (next: boolean) => void;
  onSchedule?: () => void;
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
          <span>{service.duration_min}m</span>
          <span>·</span>
          <span>
            {service.credits_cost} cr{service.credits_cost === 1 ? "" : "s"}
          </span>
          {isGroup && (
            <>
              <span>·</span>
              <span>{service.default_capacity} seats</span>
            </>
          )}
        </div>

        <ChevronRight className="hidden sm:block w-4 h-4 text-muted-foreground/40 shrink-0 motion-safe:transition-transform motion-safe:duration-150 group-hover/row:translate-x-0.5 group-hover/row:text-muted-foreground" />
      </button>

      {isGroup && onSchedule && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onSchedule();
          }}
          disabled={!service.active}
          aria-label={`Schedule a session of ${service.name}`}
          title="Schedule a session"
          className="flex items-center gap-1.5 px-3 border-l border-border bg-card text-[12px] text-muted-foreground hover:text-foreground hover:bg-muted/40 motion-safe:transition-colors motion-safe:duration-150 focus-visible:outline-none focus-visible:bg-muted/40 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <CalendarPlus className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Schedule</span>
        </button>
      )}

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
  saveError,
  onClose,
  onSave,
  onDelete,
}: {
  editing: Draft | null;
  saveError: string | null;
  onClose: () => void;
  onSave: (draft: Draft) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) {
  return (
    <Sheet open={editing !== null} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-md p-0">
        {editing && (
          <ServiceEditorForm
            initial={editing}
            saveError={saveError}
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
  saveError,
  onCancel,
  onSave,
  onDelete,
}: {
  initial: Draft;
  saveError: string | null;
  onCancel: () => void;
  onSave: (draft: Draft) => Promise<void>;
  onDelete: () => Promise<void>;
}) {
  const [draft, setDraft] = useState<Draft>(initial);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const isGroup = draft.mode === "group";
  const isNew = initial.id === "";

  function set<K extends keyof Draft>(key: K, value: Draft[K]) {
    setDraft((d) => ({ ...d, [key]: value }));
  }

  function setMode(mode: ServiceMode) {
    setDraft((d) => ({
      ...d,
      mode,
      default_capacity: mode === "solo" ? 1 : Math.max(2, d.default_capacity),
    }));
  }

  async function handleSave() {
    if (saving) return;
    setSaving(true);
    await onSave(draft);
    setSaving(false);
  }

  async function handleDelete() {
    if (deleting) return;
    setDeleting(true);
    await onDelete();
    setDeleting(false);
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
            value={draft.description}
            onChange={(v) => set("description", v)}
            placeholder={isGroup ? "All-levels vinyasa flow…" : "Cut, wash, gloss treatment…"}
          />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Duration" hint="minutes">
            <NumberInput
              value={draft.duration_min}
              onChange={(v) => set("duration_min", v)}
              min={5}
              step={5}
              suffix="min"
            />
          </Field>
          <Field label="Credits" hint="per attendee">
            <NumberInput
              value={draft.credits_cost}
              onChange={(v) => set("credits_cost", v)}
              min={0}
              suffix={`cr${draft.credits_cost === 1 ? "" : "s"}`}
            />
          </Field>
        </div>

        <Field label="Gross price" hint="EUR; used for earnings + statements">
          <NumberInput
            value={Math.round(draft.gross_price_cents / 100)}
            onChange={(v) => set("gross_price_cents", Math.max(0, v) * 100)}
            min={0}
            step={5}
            suffix="EUR"
          />
        </Field>

        {isGroup && (
          <Field label="Capacity" hint="max attendees per class instance">
            <NumberInput
              value={draft.default_capacity}
              onChange={(v) => set("default_capacity", v)}
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

        {saveError && (
          <div
            role="alert"
            className="rounded-lg border border-[--neg]/30 bg-[--neg]/10 px-3 py-2 text-[12px] text-[--neg]"
          >
            {saveError}
          </div>
        )}
      </div>

      <div className="mt-auto p-6 pt-4 border-t border-border flex flex-col gap-2">
        <Button
          className="w-full"
          onClick={handleSave}
          disabled={!draft.name.trim() || saving || deleting}
        >
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              {isNew ? "Creating" : "Saving"}
            </>
          ) : isNew ? (
            "Create service"
          ) : (
            "Save changes"
          )}
        </Button>
        {isNew ? (
          <Button variant="ghost" className="w-full" onClick={onCancel} disabled={saving}>
            Cancel
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button variant="ghost" className="flex-1" onClick={onCancel} disabled={saving || deleting}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              className="flex-1 gap-2"
              onClick={handleDelete}
              disabled={saving || deleting}
            >
              {deleting ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Trash2 className="w-3.5 h-3.5" />
              )}{" "}
              {deleting ? "Deleting" : "Delete"}
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

/* ───────── Schedule-a-class sheet (group services only) ───────── */

function ScheduleClassSheet({
  service,
  onClose,
  onScheduled,
}: {
  service: ServiceRow | null;
  onClose: () => void;
  onScheduled?: () => void | Promise<void>;
}) {
  return (
    <Sheet open={service !== null} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-md p-0">
        {service && (
          <ScheduleForm
            service={service}
            onClose={onClose}
            onScheduled={onScheduled}
          />
        )}
      </SheetContent>
    </Sheet>
  );
}

function ScheduleForm({
  service,
  onClose,
  onScheduled,
}: {
  service: ServiceRow;
  onClose: () => void;
  onScheduled?: () => void | Promise<void>;
}) {
  // Default to the next half-hour boundary, 1 hour from now.
  const [startsAt, setStartsAt] = useState<string>(() => nextHalfHourIso());
  const [capacity, setCapacity] = useState<number>(service.default_capacity);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (submitting) return;
    if (!service.admin_member_id) {
      setError("This class has no admin assigned. Edit the service first.");
      return;
    }
    const date = new Date(startsAt);
    if (Number.isNaN(date.getTime())) {
      setError("Pick a valid date and time.");
      return;
    }
    if (date.getTime() <= Date.now()) {
      setError("Pick a future date and time.");
      return;
    }
    if (capacity < 1) {
      setError("Capacity must be at least 1.");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await createGroupSession({
        studioId: service.studio_id,
        serviceId: service.id,
        adminMemberId: service.admin_member_id,
        startsAt: date,
        durationMin: service.duration_min,
        capacity,
      });
      toast.success(
        `Scheduled ${service.name} for ${date.toLocaleString([], {
          weekday: "short",
          month: "short",
          day: "numeric",
          hour: "numeric",
          minute: "2-digit",
        })}`
      );
      await onScheduled?.();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <SheetHeader className="p-6 pb-4">
        <div className="inline-flex items-center gap-2 self-start px-2 py-1 rounded-md text-[11px] font-medium mb-3 bg-[--role-accent-light] text-[--role-accent-dark]">
          <CalendarPlus className="w-3 h-3" />
          New session
        </div>
        <SheetTitle className="text-[20px] font-semibold tracking-tight">
          Schedule {service.name}
        </SheetTitle>
        <SheetDescription>
          Place an instance of this class on the calendar so clients can
          enroll. Duration ({service.duration_min}m) and credits cost (
          {service.credits_cost}) come from the service.
        </SheetDescription>
      </SheetHeader>

      <div className="px-6 pb-4 space-y-4">
        <div>
          <label
            htmlFor="schedule-starts-at"
            className="block text-[11px] font-medium tracking-[0.08em] uppercase text-muted-foreground mb-1.5"
          >
            Starts at
          </label>
          <input
            id="schedule-starts-at"
            type="datetime-local"
            value={startsAt}
            onChange={(e) => setStartsAt(e.target.value)}
            className="w-full h-10 px-3 border border-border rounded-lg text-[13px] bg-card tabular-nums focus:outline-none focus:ring-2 focus:ring-ring motion-safe:transition-colors"
          />
        </div>

        <div>
          <label
            htmlFor="schedule-capacity"
            className="block text-[11px] font-medium tracking-[0.08em] uppercase text-muted-foreground mb-1.5"
          >
            Capacity
          </label>
          <input
            id="schedule-capacity"
            type="number"
            min={1}
            value={capacity}
            onChange={(e) => setCapacity(Math.max(1, parseInt(e.target.value, 10) || 1))}
            className="w-full h-10 px-3 border border-border rounded-lg text-[13px] bg-card tabular-nums focus:outline-none focus:ring-2 focus:ring-ring motion-safe:transition-colors"
          />
          <p className="text-[11px] text-muted-foreground mt-1.5">
            Defaults to {service.default_capacity} seat
            {service.default_capacity === 1 ? "" : "s"} from the service.
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
      </div>

      <div className="mt-auto p-6 pt-4 border-t border-border flex flex-col gap-2">
        <Button className="w-full gap-2" onClick={submit} disabled={submitting}>
          {submitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" /> Scheduling
            </>
          ) : (
            <>
              <CalendarPlus className="w-4 h-4" /> Schedule session
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
      </div>
    </>
  );
}

/** Returns an ISO-local string (no timezone) like "2026-05-19T15:00",
 * rounded up to the next half-hour at least an hour from now. Used as the
 * default value of the datetime-local input. */
function nextHalfHourIso(): string {
  const d = new Date(Date.now() + 60 * 60 * 1000);
  d.setSeconds(0, 0);
  d.setMinutes(d.getMinutes() < 30 ? 30 : 60);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
