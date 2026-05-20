"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Camera,
  Lock,
  Smartphone,
  LogOut,
  Trash2,
  Globe,
  Sun,
  Moon,
  Monitor,
  Clock,
  Plus,
  CalendarOff,
  Loader2,
  AlertCircle,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { HueAvatar } from "@/components/shared";
import { useTheme } from "@/components/theme-provider";
import { ROLE_CONFIGS, type Role } from "@/lib/roles";
import { cn } from "@/lib/utils";
import { useCurrentMember } from "@/lib/auth/use-current-member";
import { createClient } from "@/lib/supabase/client";
import {
  useStudio,
  useStudioHours,
  updateStudio,
  upsertStudioHours,
  type StudioHourRow,
} from "@/lib/studio";
import {
  useAvailabilityRules,
  useTimeOff,
  replaceAvailabilityRules,
  addTimeOff,
  deleteTimeOff,
  type AvailabilityRuleRow,
  type AvailabilityExceptionRow,
} from "@/lib/availability";

const NOTIFICATION_GROUPS: Record<
  Role,
  { id: string; label: string; sub: string; defaultOn?: boolean }[]
> = {
  owner: [
    { id: "new-booking", label: "New booking", sub: "When a client books a session", defaultOn: true },
    { id: "cancellation", label: "Cancellations", sub: "When a booking is cancelled or rescheduled", defaultOn: true },
    { id: "payouts", label: "Payouts", sub: "Admin payout cycles + ledger summary" },
    { id: "subscription", label: "Subscription health", sub: "Churn, downgrades, low credits" },
    { id: "marketing", label: "Product updates", sub: "Book It Daily roadmap and tips" },
  ],
  admin: [
    { id: "new-booking", label: "New booking", sub: "When a client books with you", defaultOn: true },
    { id: "reminder", label: "Daily reminder", sub: "Tomorrow's schedule, evening before", defaultOn: true },
    { id: "messages", label: "Client messages", sub: "Push when a client sends a message" },
    { id: "payouts", label: "Payouts", sub: "When earnings are released" },
  ],
  client: [
    { id: "reminders", label: "Booking reminders", sub: "24h and 1h before your appointment", defaultOn: true },
    { id: "messages", label: "Admin messages", sub: "Push when your admin replies", defaultOn: true },
    { id: "low-credits", label: "Low credits", sub: "When you have ≤2 credits left" },
    { id: "promotions", label: "Promotions", sub: "Top-up deals + new services" },
  ],
};

/** Visible weekday order in the grid (Mon..Sun). */
const WEEKDAY_GRID: { weekday: number; label: string }[] = [
  { weekday: 1, label: "Mon" },
  { weekday: 2, label: "Tue" },
  { weekday: 3, label: "Wed" },
  { weekday: 4, label: "Thu" },
  { weekday: 5, label: "Fri" },
  { weekday: 6, label: "Sat" },
  { weekday: 0, label: "Sun" },
];

interface SettingsScreenProps {
  role: Role;
}

export function SettingsScreen({ role }: SettingsScreenProps) {
  const config = ROLE_CONFIGS[role];
  const { theme, setTheme } = useTheme();
  const router = useRouter();

  const { member } = useCurrentMember();
  const studioId = member?.studio.id;
  const myMemberId = member?.member.id;

  const [twoFA, setTwoFA] = useState(false);
  const [notifications, setNotifications] = useState<Record<string, boolean>>(() => {
    const out: Record<string, boolean> = {};
    for (const n of NOTIFICATION_GROUPS[role]) out[n.id] = !!n.defaultOn;
    return out;
  });

  return (
    <div className="flex-1 overflow-auto p-4 md:p-6 lg:p-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <h2 className="text-[20px] md:text-[24px] font-semibold tracking-tight leading-tight">
            Settings
          </h2>
          <p className="text-[13px] text-muted-foreground mt-1">
            Manage your profile, notifications, and account preferences.
          </p>
        </div>

        <ProfileCard role={role} fallbackHue={config.user.hue} fallbackSubtitle={config.user.subtitle} />

        <NotificationsCard
          groups={NOTIFICATION_GROUPS[role]}
          values={notifications}
          onChange={setNotifications}
        />

        {role === "owner" && (
          <>
            <StudioCard studioId={studioId} />
            <StudioHoursCard studioId={studioId} />
          </>
        )}

        {role === "admin" && (
          <>
            <WorkingHoursCard studioId={studioId} memberId={myMemberId} />
            <BookingRulesCard memberId={myMemberId} initialMember={member?.member ?? null} />
            <TimeOffCard studioId={studioId} memberId={myMemberId} />
          </>
        )}

        <AppearanceCard theme={theme} setTheme={setTheme} />

        <Card>
          <CardHeader title="Security" subtitle="Lock down access to your account." />
          <div className="divide-y divide-[--line-soft]">
            <SecurityRow
              icon={Lock}
              title="Password"
              sub="Manage via reset email for now."
              action={
                <Button variant="outline" size="sm" onClick={() => router.push("/forgot-password")}>
                  Change
                </Button>
              }
            />
            <SecurityRow
              icon={Smartphone}
              title="Two-factor authentication"
              sub={twoFA ? "Authenticator app enabled" : "Off — coming in a later release"}
              action={<Switch checked={twoFA} onCheckedChange={setTwoFA} />}
            />
            <SecurityRow
              icon={Globe}
              title="Active sessions"
              sub="Multi-session management coming later."
              action={
                <Button variant="outline" size="sm" disabled>
                  Manage
                </Button>
              }
            />
          </div>
        </Card>

        <Card tone="danger">
          <CardHeader title="Danger zone" subtitle="These actions are permanent. Take care." />
          <div className="space-y-3">
            <DangerRow
              title="Sign out everywhere"
              sub="Revoke every active session except this one."
              icon={LogOut}
              actionLabel="Sign out"
            />
            <DangerRow
              title="Delete account"
              sub="Permanently remove your profile and bookings."
              icon={Trash2}
              actionLabel="Delete"
              destructive
            />
          </div>
        </Card>
      </div>
    </div>
  );
}

/* ───────────────────────── Profile card ───────────────────────── */

function ProfileCard({
  role,
  fallbackHue,
  fallbackSubtitle,
}: {
  role: Role;
  fallbackHue: number;
  fallbackSubtitle: string;
}) {
  const { member } = useCurrentMember();
  const liveName = member?.user.name ?? "";
  const liveHue = member?.user.avatar_hue ?? fallbackHue;
  const liveEmail = member?.user.email ?? "";
  // `users.phone` isn't returned by the current member query (privacy), so we
  // fetch it ourselves on first load.
  const userId = member?.user.id;

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);

  // Sync local edit state when the live member resolves. We track "initialized"
  // via a ref so a server refetch doesn't overwrite in-flight edits.
  const initRef = useRef(false);
  useEffect(() => {
    if (!member || initRef.current) return;
    setName(member.user.name);
    initRef.current = true;
  }, [member]);

  // Phone — separate fetch since current_member doesn't return it.
  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    const supabase = createClient();
    supabase
      .from("users")
      .select("phone")
      .eq("id", userId)
      .maybeSingle()
      .then(({ data }) => {
        if (cancelled) return;
        setPhone(data?.phone ?? "");
      });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  function set<K extends "name" | "phone">(key: K, value: string) {
    if (key === "name") setName(value);
    else setPhone(value);
    setDirty(true);
  }

  async function save() {
    if (!userId || saving) return;
    setSaving(true);
    setError(null);
    const supabase = createClient();
    const { error: e } = await supabase
      .from("users")
      .update({ name: name.trim(), phone: phone.trim() || null })
      .eq("id", userId);
    setSaving(false);
    if (e) {
      setError(e.message);
      return;
    }
    setDirty(false);
  }

  function discard() {
    if (!member) return;
    setName(member.user.name);
    initRef.current = true;
    setDirty(false);
  }

  const subtitle =
    role === "admin" && member?.member.specialty
      ? member.member.specialty
      : fallbackSubtitle;

  return (
    <Card>
      <CardHeader title="Profile" subtitle="How you appear to the rest of Book It Daily." />
      <div className="flex items-start gap-4 mb-5">
        <button
          type="button"
          aria-label="Change profile photo"
          className="relative group rounded-full motion-safe:transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card"
        >
          <HueAvatar name={name || liveName || "?"} hue={liveHue} size={72} />
          <span
            aria-hidden
            className="absolute inset-0 rounded-full bg-foreground/0 group-hover:bg-foreground/40 motion-safe:transition-colors motion-safe:duration-150 grid place-items-center"
          >
            <Camera className="w-5 h-5 text-background opacity-0 group-hover:opacity-100 motion-safe:transition-opacity" />
          </span>
        </button>
        <div className="flex-1 min-w-0">
          <div className="text-[15px] font-semibold truncate">{name || liveName || "—"}</div>
          <div className="text-[12px] text-muted-foreground truncate">{subtitle}</div>
          <div className="flex gap-2 mt-3 flex-wrap">
            <Button variant="outline" size="sm" disabled>
              Upload photo
            </Button>
            <Button variant="ghost" size="sm" disabled>
              Remove
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Full name">
          <Input value={name} onChange={(e) => set("name", e.target.value)} />
        </Field>
        <Field label="Email" hint="Email changes go through a verification flow — coming later.">
          <Input type="email" value={liveEmail} disabled />
        </Field>
        <Field label="Phone">
          <Input
            type="tel"
            value={phone}
            onChange={(e) => set("phone", e.target.value)}
            placeholder="+33 6 12 34 56 78"
          />
        </Field>
        <Field label="Role">
          <Input value={subtitle} disabled />
        </Field>
      </div>

      {error && <ErrorBanner message={error} />}

      <FormFooter>
        <Button variant="ghost" onClick={discard} disabled={!dirty || saving}>
          Discard
        </Button>
        <Button onClick={save} disabled={!dirty || saving || !name.trim()}>
          {saving ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving
            </>
          ) : (
            "Save changes"
          )}
        </Button>
      </FormFooter>
    </Card>
  );
}

/* ───────────────────────── Notifications card ───────────────────────── */

function NotificationsCard({
  groups,
  values,
  onChange,
}: {
  groups: { id: string; label: string; sub: string; defaultOn?: boolean }[];
  values: Record<string, boolean>;
  onChange: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
}) {
  return (
    <Card>
      <CardHeader
        title="Notifications"
        subtitle="Choose what you want to hear about. We'll always send transactional emails."
      />
      <div className="divide-y divide-[--line-soft]">
        {groups.map((n) => (
          <label key={n.id} className="flex items-start gap-3 py-3 cursor-pointer">
            <div className="flex-1 min-w-0">
              <div className="text-[13px] font-medium">{n.label}</div>
              <div className="text-[11px] text-muted-foreground mt-0.5">{n.sub}</div>
            </div>
            <Switch
              checked={values[n.id] ?? false}
              onCheckedChange={(next: boolean) =>
                onChange((prev) => ({ ...prev, [n.id]: next }))
              }
            />
          </label>
        ))}
      </div>
      <p className="text-[11px] text-muted-foreground mt-3 leading-relaxed">
        Local preferences for now — persistence lands in a later phase.
      </p>
    </Card>
  );
}

/* ───────────────────────── Studio card (owner) ───────────────────────── */

const CURRENCIES = ["EUR", "USD", "GBP", "PKR"] as const;
const TIMEZONES = [
  "UTC",
  "Europe/Paris",
  "Europe/London",
  "America/New_York",
  "Asia/Karachi",
  "Asia/Dubai",
] as const;

function StudioCard({ studioId }: { studioId: string | undefined }) {
  const { studio, loading, error, refetch } = useStudio(studioId);

  const [name, setName] = useState("");
  const [timezone, setTimezone] = useState("UTC");
  const [currency, setCurrency] = useState("EUR");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);

  const initRef = useRef(false);
  useEffect(() => {
    if (!studio || initRef.current) return;
    setName(studio.name);
    setTimezone(studio.timezone);
    setCurrency(studio.currency);
    initRef.current = true;
  }, [studio]);

  async function save() {
    if (!studioId || saving) return;
    setSaving(true);
    setSaveError(null);
    try {
      await updateStudio(studioId, { name: name.trim(), timezone, currency });
      await refetch();
      setDirty(false);
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  }

  function discard() {
    if (!studio) return;
    setName(studio.name);
    setTimezone(studio.timezone);
    setCurrency(studio.currency);
    setDirty(false);
  }

  return (
    <Card>
      <CardHeader
        title="Studio"
        subtitle="The name and locale your clients see. Changing currency only affects new prices."
      />

      {loading && !studio ? (
        <CardSkeleton rows={2} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Studio name">
            <Input
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setDirty(true);
              }}
              placeholder="Book It Daily"
            />
          </Field>
          <Field label="Slug" hint="Changing the slug breaks existing links — coming later.">
            <Input value={studio?.slug ?? ""} disabled />
          </Field>
          <Field label="Timezone">
            <Select
              value={timezone}
              onChange={(e) => {
                setTimezone(e.target.value);
                setDirty(true);
              }}
            >
              {TIMEZONES.map((tz) => (
                <option key={tz} value={tz}>
                  {tz}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Currency">
            <Select
              value={currency}
              onChange={(e) => {
                setCurrency(e.target.value);
                setDirty(true);
              }}
            >
              {CURRENCIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>
          </Field>
        </div>
      )}

      {(error || saveError) && <ErrorBanner message={error ?? saveError ?? ""} />}

      <FormFooter>
        <Button variant="ghost" onClick={discard} disabled={!dirty || saving}>
          Discard
        </Button>
        <Button onClick={save} disabled={!dirty || saving || !name.trim()}>
          {saving ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving
            </>
          ) : (
            "Save studio"
          )}
        </Button>
      </FormFooter>
    </Card>
  );
}

/* ───────────────────────── Studio hours card (owner) ───────────────────────── */

type DayGridRow = {
  weekday: number;
  label: string;
  open: boolean;
  start: string;
  end: string;
};

function rowsFromStudioHours(rows: StudioHourRow[]): DayGridRow[] {
  const map = new Map<number, StudioHourRow>();
  for (const r of rows) map.set(r.weekday, r);
  return WEEKDAY_GRID.map((g) => {
    const row = map.get(g.weekday);
    return {
      weekday: g.weekday,
      label: g.label,
      open: row ? !row.closed : false,
      start: row?.open_time?.slice(0, 5) ?? "09:00",
      end: row?.close_time?.slice(0, 5) ?? "18:00",
    };
  });
}

function StudioHoursCard({ studioId }: { studioId: string | undefined }) {
  const { hours, loading, error, refetch } = useStudioHours(studioId);

  const [grid, setGrid] = useState<DayGridRow[]>([]);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);

  const initRef = useRef(false);
  useEffect(() => {
    if (initRef.current && hours.length === 0) return;
    if (initRef.current) return;
    setGrid(rowsFromStudioHours(hours));
    initRef.current = true;
  }, [hours]);

  function setDay(weekday: number, patch: Partial<DayGridRow>) {
    setGrid((prev) =>
      prev.map((d) => (d.weekday === weekday ? { ...d, ...patch } : d))
    );
    setDirty(true);
  }

  async function save() {
    if (!studioId || saving) return;
    setSaving(true);
    setSaveError(null);
    try {
      await upsertStudioHours(
        studioId,
        grid.map((d) => ({
          weekday: d.weekday,
          open_time: `${d.start}:00`,
          close_time: `${d.end}:00`,
          closed: !d.open,
        }))
      );
      await refetch();
      setDirty(false);
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  }

  function discard() {
    setGrid(rowsFromStudioHours(hours));
    setDirty(false);
  }

  return (
    <Card>
      <CardHeader
        title="Studio hours"
        subtitle="Open/close for the whole studio. Clients can only book inside these hours."
      />

      {loading && grid.length === 0 ? (
        <CardSkeleton rows={4} />
      ) : (
        <div className="divide-y divide-[--line-soft]">
          {grid.map((d) => (
            <DayRow key={d.weekday} d={d} onChange={(p) => setDay(d.weekday, p)} />
          ))}
        </div>
      )}

      {(error || saveError) && <ErrorBanner message={error ?? saveError ?? ""} />}

      <FormFooter>
        <Button variant="ghost" onClick={discard} disabled={!dirty || saving}>
          Discard
        </Button>
        <Button onClick={save} disabled={!dirty || saving}>
          {saving ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving
            </>
          ) : (
            "Save hours"
          )}
        </Button>
      </FormFooter>
    </Card>
  );
}

/* ───────────────────────── Working hours card (admin) ───────────────────────── */

function rowsFromAvailability(rules: AvailabilityRuleRow[]): DayGridRow[] {
  // For v1 we collapse split shifts to the earliest start / latest end of
  // that weekday. Multi-shift editing arrives in a later phase.
  const byWeekday = new Map<number, { start: string; end: string }>();
  for (const r of rules) {
    const existing = byWeekday.get(r.weekday);
    if (!existing) {
      byWeekday.set(r.weekday, {
        start: r.start_time.slice(0, 5),
        end: r.end_time.slice(0, 5),
      });
    } else {
      if (r.start_time < existing.start) existing.start = r.start_time.slice(0, 5);
      if (r.end_time > existing.end) existing.end = r.end_time.slice(0, 5);
    }
  }
  return WEEKDAY_GRID.map((g) => {
    const block = byWeekday.get(g.weekday);
    return {
      weekday: g.weekday,
      label: g.label,
      open: Boolean(block),
      start: block?.start ?? "10:00",
      end: block?.end ?? "18:00",
    };
  });
}

function WorkingHoursCard({
  studioId,
  memberId,
}: {
  studioId: string | undefined;
  memberId: string | undefined;
}) {
  const { rules, loading, error, refetch } = useAvailabilityRules(memberId);
  const [grid, setGrid] = useState<DayGridRow[]>([]);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);

  const initRef = useRef(false);
  useEffect(() => {
    if (initRef.current) return;
    setGrid(rowsFromAvailability(rules));
    initRef.current = true;
  }, [rules]);

  function setDay(weekday: number, patch: Partial<DayGridRow>) {
    setGrid((prev) =>
      prev.map((d) => (d.weekday === weekday ? { ...d, ...patch } : d))
    );
    setDirty(true);
  }

  async function save() {
    if (!studioId || !memberId || saving) return;
    setSaving(true);
    setSaveError(null);
    try {
      await replaceAvailabilityRules(
        studioId,
        memberId,
        grid.map((d) => ({
          weekday: d.weekday,
          open: d.open,
          start_time: `${d.start}:00`,
          end_time: `${d.end}:00`,
        }))
      );
      await refetch();
      setDirty(false);
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  }

  function discard() {
    setGrid(rowsFromAvailability(rules));
    setDirty(false);
  }

  return (
    <Card>
      <CardHeader
        title="Working hours"
        subtitle="Clients can only book free slots that fall inside these hours."
      />

      {loading && grid.length === 0 ? (
        <CardSkeleton rows={4} />
      ) : (
        <div className="divide-y divide-[--line-soft]">
          {grid.map((d) => (
            <DayRow key={d.weekday} d={d} onChange={(p) => setDay(d.weekday, p)} />
          ))}
        </div>
      )}

      {(error || saveError) && <ErrorBanner message={error ?? saveError ?? ""} />}

      <FormFooter>
        <Button variant="ghost" onClick={discard} disabled={!dirty || saving}>
          Discard
        </Button>
        <Button onClick={save} disabled={!dirty || saving}>
          {saving ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving
            </>
          ) : (
            "Save hours"
          )}
        </Button>
      </FormFooter>
    </Card>
  );
}

/* ───────────────────────── Booking rules card (admin) ───────────────────────── */

function BookingRulesCard({
  memberId,
  initialMember,
}: {
  memberId: string | undefined;
  initialMember: {
    require_booking_approval: boolean;
    buffer_min: number;
  } | null;
}) {
  const [requireApproval, setRequireApproval] = useState(false);
  const [bufferMin, setBufferMin] = useState(10);
  const [error, setError] = useState<string | null>(null);

  const initRef = useRef(false);
  useEffect(() => {
    if (!initialMember || initRef.current) return;
    setRequireApproval(initialMember.require_booking_approval);
    setBufferMin(initialMember.buffer_min);
    initRef.current = true;
  }, [initialMember]);

  const saveApproval = useCallback(
    async (next: boolean) => {
      if (!memberId) return;
      setRequireApproval(next);
      setError(null);
      const supabase = createClient();
      const { error: e } = await supabase
        .from("studio_members")
        .update({ require_booking_approval: next })
        .eq("id", memberId);
      if (e) setError(e.message);
    },
    [memberId]
  );

  const saveBuffer = useCallback(
    async (next: number) => {
      if (!memberId) return;
      setBufferMin(next);
      setError(null);
      const supabase = createClient();
      const { error: e } = await supabase
        .from("studio_members")
        .update({ buffer_min: next })
        .eq("id", memberId);
      if (e) setError(e.message);
    },
    [memberId]
  );

  return (
    <Card>
      <CardHeader
        title="Booking rules"
        subtitle="How clients book your time inside your working hours."
      />

      <div className="divide-y divide-[--line-soft]">
        <label className="flex items-start gap-3 py-3 cursor-pointer">
          <span className="w-9 h-9 rounded-lg bg-muted text-muted-foreground grid place-items-center shrink-0">
            <Lock className="w-4 h-4" />
          </span>
          <div className="flex-1 min-w-0">
            <div className="text-[13px] font-medium">Require my approval</div>
            <div className="text-[11px] text-muted-foreground mt-0.5">
              New bookings land as pending until you confirm. Off by default — most clients expect instant confirmation.
            </div>
          </div>
          <Switch checked={requireApproval} onCheckedChange={saveApproval} />
        </label>

        <div className="flex items-start gap-3 py-3">
          <span className="w-9 h-9 rounded-lg bg-muted text-muted-foreground grid place-items-center shrink-0">
            <Clock className="w-4 h-4" />
          </span>
          <div className="flex-1 min-w-0">
            <div className="text-[13px] font-medium">Buffer between sessions</div>
            <div className="text-[11px] text-muted-foreground mt-0.5">
              Auto-blocked time after each 1-on-1 (cleanup, notes, transition).
            </div>
          </div>
          <Select
            value={String(bufferMin)}
            onChange={(e) => saveBuffer(Number(e.target.value))}
            className="w-30!"
          >
            <option value="0">No buffer</option>
            <option value="5">5 min</option>
            <option value="10">10 min</option>
            <option value="15">15 min</option>
            <option value="30">30 min</option>
          </Select>
        </div>
      </div>

      {error && <ErrorBanner message={error} />}
    </Card>
  );
}

/* ───────────────────────── Time off card (admin) ───────────────────────── */

function TimeOffCard({
  studioId,
  memberId,
}: {
  studioId: string | undefined;
  memberId: string | undefined;
}) {
  const { exceptions, loading, error, refetch } = useTimeOff(memberId);
  const [addingDate, setAddingDate] = useState("");
  const [addingReason, setAddingReason] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [working, setWorking] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  async function handleAdd() {
    if (!studioId || !memberId || !addingDate || working) return;
    setWorking(true);
    setActionError(null);
    try {
      await addTimeOff(studioId, memberId, addingDate, addingReason || "Time off");
      await refetch();
      setAddingDate("");
      setAddingReason("");
      setShowForm(false);
    } catch (e) {
      setActionError(e instanceof Error ? e.message : String(e));
    } finally {
      setWorking(false);
    }
  }

  async function handleRemove(id: string) {
    if (working) return;
    setWorking(true);
    setActionError(null);
    try {
      await deleteTimeOff(id);
      await refetch();
    } catch (e) {
      setActionError(e instanceof Error ? e.message : String(e));
    } finally {
      setWorking(false);
    }
  }

  return (
    <Card>
      <div className="flex items-start mb-5 gap-3">
        <div className="flex-1">
          <h3 className="text-[15px] font-semibold tracking-tight">Time off</h3>
          <p className="text-[12px] text-muted-foreground mt-0.5">
            Block dates where you&apos;re unavailable. Clients won&apos;t see those slots.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="gap-2 shrink-0"
          onClick={() => setShowForm((v) => !v)}
        >
          <Plus className="w-3.5 h-3.5" /> Add
        </Button>
      </div>

      {showForm && (
        <div className="rounded-lg border border-border p-3 mb-3 bg-muted/30 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-[160px_1fr] gap-2">
            <Input
              type="date"
              value={addingDate}
              onChange={(e) => setAddingDate(e.target.value)}
            />
            <Input
              type="text"
              value={addingReason}
              onChange={(e) => setAddingReason(e.target.value)}
              placeholder="Reason (e.g. Vacation)"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setShowForm(false);
                setAddingDate("");
                setAddingReason("");
              }}
              disabled={working}
            >
              Cancel
            </Button>
            <Button size="sm" onClick={handleAdd} disabled={!addingDate || working}>
              {working ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Adding
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5" /> Add
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {loading && exceptions.length === 0 ? (
        <CardSkeleton rows={1} />
      ) : exceptions.length === 0 ? (
        <div className="text-[12px] text-muted-foreground border border-dashed border-border rounded-lg py-6 text-center">
          No time off scheduled.
        </div>
      ) : (
        <div className="divide-y divide-[--line-soft]">
          {exceptions.map((t) => (
            <TimeOffRow key={t.id} row={t} onRemove={handleRemove} working={working} />
          ))}
        </div>
      )}

      {(error || actionError) && <ErrorBanner message={error ?? actionError ?? ""} />}
    </Card>
  );
}

function TimeOffRow({
  row,
  onRemove,
  working,
}: {
  row: AvailabilityExceptionRow;
  onRemove: (id: string) => void;
  working: boolean;
}) {
  return (
    <div className="flex items-center gap-3 py-3">
      <span className="w-9 h-9 rounded-lg bg-[--neg]/10 text-[--neg] grid place-items-center shrink-0">
        <CalendarOff className="w-4 h-4" />
      </span>
      <div className="flex-1 min-w-0">
        <div className="text-[13px] font-medium truncate">{row.reason ?? "Time off"}</div>
        <div className="text-[11px] text-muted-foreground tabular-nums">{row.date}</div>
      </div>
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label={`Remove ${row.reason ?? row.date}`}
        onClick={() => onRemove(row.id)}
        disabled={working}
      >
        <Trash2 className="w-3.5 h-3.5" />
      </Button>
    </div>
  );
}

/* ───────────────────────── Appearance card ───────────────────────── */

function AppearanceCard({
  theme,
  setTheme,
}: {
  theme: "light" | "dark" | "system";
  setTheme: (next: "light" | "dark" | "system") => void;
}) {
  return (
    <Card>
      <CardHeader
        title="Appearance"
        subtitle="System theme follows your operating system preference."
      />
      <Field label="Theme">
        <div role="radiogroup" className="grid grid-cols-3 gap-2">
          {(
            [
              { id: "light", label: "Light", icon: Sun },
              { id: "system", label: "System", icon: Monitor },
              { id: "dark", label: "Dark", icon: Moon },
            ] as const
          ).map(({ id, label, icon: Icon }) => {
            const active = theme === id;
            return (
              <button
                key={id}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => setTheme(id)}
                className={cn(
                  "flex flex-col items-center justify-center gap-2 py-3 rounded-lg border motion-safe:transition-colors motion-safe:duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  active
                    ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                    : "border-border hover:border-primary/50 bg-card"
                )}
              >
                <Icon className="w-5 h-5" aria-hidden />
                <span className="text-[12px] font-medium">{label}</span>
              </button>
            );
          })}
        </div>
      </Field>
    </Card>
  );
}

/* ───────────────────────── Building blocks ───────────────────────── */

function DayRow({
  d,
  onChange,
}: {
  d: DayGridRow;
  onChange: (patch: Partial<DayGridRow>) => void;
}) {
  return (
    <div className="flex items-center gap-3 py-3 flex-wrap">
      <div className="w-12 text-[13px] font-medium tabular-nums shrink-0">{d.label}</div>
      <Switch
        checked={d.open}
        onCheckedChange={(v: boolean) => onChange({ open: v })}
        aria-label={`${d.label} open`}
      />
      <div className="flex-1" />
      {d.open ? (
        <div className="flex items-center gap-2 text-[12px]">
          <Input
            type="time"
            value={d.start}
            onChange={(e) => onChange({ start: e.target.value })}
            className="w-27.5!"
          />
          <span className="text-muted-foreground">→</span>
          <Input
            type="time"
            value={d.end}
            onChange={(e) => onChange({ end: e.target.value })}
            className="w-27.5!"
          />
        </div>
      ) : (
        <span className="text-[12px] text-muted-foreground">Closed</span>
      )}
    </div>
  );
}

function CardSkeleton({ rows }: { rows: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-11 rounded-lg bg-muted/40 animate-pulse" />
      ))}
    </div>
  );
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <div
      role="alert"
      className="rounded-lg border border-[--neg]/30 bg-[--neg]/10 px-3 py-2 text-[12px] text-[--neg] mt-4 inline-flex items-center gap-2"
    >
      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
      {message}
    </div>
  );
}

/* ---------- primitives ---------- */

function Card({
  children,
  tone = "default",
}: {
  children: React.ReactNode;
  tone?: "default" | "danger";
}) {
  return (
    <section
      className={cn(
        "bg-card border rounded-xl shadow-card p-5 md:p-6 mb-5",
        tone === "danger" ? "border-[--neg]/30" : "border-border"
      )}
    >
      {children}
    </section>
  );
}

function CardHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <header className="mb-5">
      <h3 className="text-[15px] font-semibold tracking-tight">{title}</h3>
      {subtitle && <p className="text-[12px] text-muted-foreground mt-0.5">{subtitle}</p>}
    </header>
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
    <div className="mb-4 last:mb-0">
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
        "hover:border-foreground/30 focus:border-ring focus:ring-2 focus:ring-ring/20",
        "disabled:bg-muted/50 disabled:cursor-not-allowed disabled:text-muted-foreground",
        props.className
      )}
    />
  );
}

function Select({
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={cn(
        "w-full h-10 rounded-lg border border-border bg-background px-3 text-[13px] outline-none motion-safe:transition-colors motion-safe:duration-150 cursor-pointer",
        "hover:border-foreground/30 focus:border-ring focus:ring-2 focus:ring-ring/20",
        props.className
      )}
    >
      {children}
    </select>
  );
}

function FormFooter({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex justify-end gap-2 mt-6 pt-5 border-t border-[--line-soft]">
      {children}
    </div>
  );
}

function SecurityRow({
  icon: Icon,
  title,
  sub,
  action,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  sub: string;
  action: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 py-3">
      <span className="w-9 h-9 rounded-lg bg-muted text-muted-foreground grid place-items-center shrink-0">
        <Icon className="w-4 h-4" />
      </span>
      <div className="flex-1 min-w-0">
        <div className="text-[13px] font-medium">{title}</div>
        <div className="text-[11px] text-muted-foreground">{sub}</div>
      </div>
      {action}
    </div>
  );
}

function DangerRow({
  icon: Icon,
  title,
  sub,
  actionLabel,
  destructive,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  sub: string;
  actionLabel: string;
  destructive?: boolean;
}) {
  return (
    <div className="flex items-center gap-3">
      <span
        className={cn(
          "w-9 h-9 rounded-lg grid place-items-center shrink-0",
          destructive ? "bg-[--neg]/10 text-[--neg]" : "bg-muted text-muted-foreground"
        )}
      >
        <Icon className="w-4 h-4" />
      </span>
      <div className="flex-1 min-w-0">
        <div className="text-[13px] font-medium">{title}</div>
        <div className="text-[11px] text-muted-foreground">{sub}</div>
      </div>
      <Button variant={destructive ? "destructive" : "outline"} size="sm" disabled>
        {actionLabel}
      </Button>
    </div>
  );
}
