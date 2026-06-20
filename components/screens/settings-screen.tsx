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
  CreditCard,
  ExternalLink,
  Wallet,
} from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { HueAvatar } from "@/components/shared";
import { useTheme } from "@/components/theme-provider";
import { ROLE_CONFIGS, type Role } from "@/lib/roles";
import { cn } from "@/lib/utils";
import { useCurrentMember } from "@/lib/auth/use-current-member";
import { createClient } from "@/lib/supabase/client";
import { uploadAvatar, removeAvatar, MAX_AVATAR_BYTES } from "@/lib/avatar";
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
import {
  useStudioPaymentAccount,
  useStudioPayoutInfo,
  setPayoutNote,
  stripeConfigured,
} from "@/lib/payments";

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

        {role === "owner" && (
          <>
            <StudioCard studioId={studioId} />
            <PaymentsCard studioId={studioId} />
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
            {/* <SecurityRow
              icon={Smartphone}
              title="Two-factor authentication"
              sub={twoFA ? "Authenticator app enabled" : "Off — coming in a later release"}
              action={<Switch checked={twoFA} onCheckedChange={setTwoFA} />}
            /> */}
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

  // Avatar: `undefined` means "use the live value from the member query";
  // a string / null is a local override applied after upload / remove.
  const liveAvatarUrl = member?.user.avatar_url ?? null;
  const [avatarOverride, setAvatarOverride] = useState<string | null | undefined>(undefined);
  const [avatarBusy, setAvatarBusy] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const displayAvatar = avatarOverride === undefined ? liveAvatarUrl : avatarOverride;

  async function onPickAvatar(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-picking the same file
    if (!file || !userId || avatarBusy) return;
    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file (JPG, PNG, or WebP).");
      return;
    }
    if (file.size > MAX_AVATAR_BYTES) {
      setError("Image is too large — please choose one under 5 MB.");
      return;
    }
    setAvatarBusy(true);
    setError(null);
    try {
      const url = await uploadAvatar(userId, file);
      setAvatarOverride(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setAvatarBusy(false);
    }
  }

  async function onRemoveAvatar() {
    if (!userId || avatarBusy || !displayAvatar) return;
    setAvatarBusy(true);
    setError(null);
    try {
      await removeAvatar(userId);
      setAvatarOverride(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setAvatarBusy(false);
    }
  }

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
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          className="sr-only"
          onChange={onPickAvatar}
        />
        <button
          type="button"
          aria-label="Change profile photo"
          onClick={() => fileInputRef.current?.click()}
          disabled={avatarBusy || !userId}
          className="relative group rounded-full motion-safe:transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card disabled:cursor-default"
        >
          <HueAvatar name={name || liveName || "?"} hue={liveHue} size={72} src={displayAvatar} />
          <span
            aria-hidden
            className={cn(
              "absolute inset-0 rounded-full motion-safe:transition-colors motion-safe:duration-150 grid place-items-center",
              avatarBusy ? "bg-foreground/50" : "bg-foreground/0 group-hover:bg-foreground/40"
            )}
          >
            {avatarBusy ? (
              <Loader2 className="w-5 h-5 text-background animate-spin" />
            ) : (
              <Camera className="w-5 h-5 text-background opacity-0 group-hover:opacity-100 motion-safe:transition-opacity" />
            )}
          </span>
        </button>
        <div className="flex-1 min-w-0">
          <div className="text-[15px] font-semibold truncate">{name || liveName || "—"}</div>
          <div className="text-[12px] text-muted-foreground truncate">{subtitle}</div>
          <div className="flex gap-2 mt-3 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={avatarBusy || !userId}
            >
              {avatarBusy ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Uploading
                </>
              ) : (
                "Upload photo"
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onRemoveAvatar}
              disabled={avatarBusy || !displayAvatar}
            >
              Remove
            </Button>
          </div>
          <p className="text-[11px] text-muted-foreground mt-2">JPG, PNG, or WebP — up to 5&nbsp;MB.</p>
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
          {/* <Field label="Currency">
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
          </Field> */}
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

/* ───────────────────────── Payments card (owner) ───────────────────────── */

function PaymentsCard({ studioId }: { studioId: string | undefined }) {
  const { payoutNote, loading, refetch } = useStudioPayoutInfo(studioId);

  const [note, setNote] = useState("");
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  // Sync the editable note from the server until the owner starts editing.
  useEffect(() => {
    if (dirty) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setNote(payoutNote ?? "");
  }, [payoutNote, dirty]);

  async function save() {
    if (!studioId || saving) return;
    setSaving(true);
    setSaveError(null);
    try {
      await setPayoutNote(studioId, note);
      await refetch();
      setDirty(false);
      setSavedAt(Date.now());
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader
        title="Payments & payouts"
        subtitle="How clients pay you for credits and memberships."
      />

      {/* Manual payments — always available, no setup required. */}
      <div className="flex items-start gap-3 py-1 mb-3">
        <span className="w-9 h-9 rounded-lg bg-muted text-foreground grid place-items-center shrink-0">
          <Wallet className="w-4 h-4" />
        </span>
        <div className="flex-1 min-w-0">
          <div className="text-[13px] font-medium">Manual payments</div>
          <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
            Tell clients how to pay you — bank transfer, your own payment link, or cash.
            After they pay, open the client in <span className="font-medium">Clients</span> and
            choose <span className="font-medium">Record payment</span> to add their credits.
          </p>
        </div>
      </div>

      {loading ? (
        <CardSkeleton rows={2} />
      ) : (
        <Field
          label="Payment instructions for clients"
          hint="Shown to clients on their Credits page when they tap Buy. Leave blank to hide."
        >
          <textarea
            value={note}
            onChange={(e) => {
              setNote(e.target.value);
              setDirty(true);
            }}
            rows={3}
            maxLength={500}
            placeholder={"e.g. Pay via bank transfer to IBAN DE00 0000 …, or my link revolut.me/yourstudio. Reference your name."}
            className={cn(
              "w-full rounded-lg border border-border bg-background px-3 py-2 text-[13px] outline-none motion-safe:transition-colors motion-safe:duration-150 resize-y",
              "hover:border-foreground/30 focus:border-ring focus:ring-2 focus:ring-ring/20"
            )}
          />
        </Field>
      )}

      {/* Stripe Connect — only when the platform has enabled it (needs a US/UK entity). */}
      {stripeConfigured && <StripeConnectRow studioId={studioId} />}

      {saveError && <ErrorBanner message={saveError} />}

      <FormFooter>
        {savedAt && !dirty && (
          <span className="inline-flex items-center gap-1.5 text-[12px] text-[--pos] mr-auto">
            <Check className="w-3.5 h-3.5" /> Saved
          </span>
        )}
        <Button onClick={save} disabled={!dirty || saving || !studioId}>
          {saving ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving
            </>
          ) : (
            "Save instructions"
          )}
        </Button>
      </FormFooter>
    </Card>
  );
}

/** Stripe Connect status row — rendered only when payments are enabled platform-side. */
function StripeConnectRow({ studioId }: { studioId: string | undefined }) {
  const { account, loading } = useStudioPaymentAccount(studioId);
  const connected = account?.charges_enabled === true && account?.status === "connected";
  const started = Boolean(account?.stripe_account_id) && !connected;

  return (
    <div className="mt-4 pt-4 border-t border-[--line-soft]">
      <div className="flex items-start gap-3 py-1">
        <span className="w-9 h-9 rounded-lg bg-muted text-foreground grid place-items-center shrink-0">
          <CreditCard className="w-4 h-4" />
        </span>
        <div className="flex-1 min-w-0">
          <div className="text-[13px] font-medium flex items-center gap-2">
            Card payments (Stripe)
            {!loading && (
              <span
                className={cn(
                  "inline-flex items-center gap-1 text-[11px] px-1.5 py-0.5 rounded-full font-medium",
                  connected
                    ? "bg-[--pos]/15 text-[--pos]"
                    : started
                      ? "bg-[--warn]/15 text-[oklch(0.45_0.1_60)]"
                      : "bg-muted text-muted-foreground"
                )}
              >
                {connected ? "Connected" : started ? "Setup incomplete" : "Not connected"}
              </span>
            )}
          </div>
          <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
            {connected
              ? "Clients can pay by card; money goes to your Stripe balance and you withdraw to your bank."
              : "Let clients pay by card automatically — money goes straight to your Stripe account."}
          </p>
        </div>
      </div>

      <div className="flex justify-end mt-3">
        {connected ? (
          <a
            href="/api/connect/dashboard"
            className={cn(buttonVariants({ variant: "outline" }), "gap-2")}
          >
            <ExternalLink className="w-3.5 h-3.5" /> Manage payouts
          </a>
        ) : (
          <a href="/api/connect/onboard" className={cn(buttonVariants(), "gap-2")}>
            <CreditCard className="w-3.5 h-3.5" />
            {started ? "Finish setup" : "Connect card payments"}
          </a>
        )}
      </div>
    </div>
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

  // Keep the editable grid in sync with the server data until the user starts
  // editing. Seeding off the first (empty, still-loading) `hours` value and then
  // locking would leave saved hours invisible after a reload — instead re-sync
  // whenever `hours` changes while there are no unsaved edits.
  useEffect(() => {
    if (dirty) return;
    // Intentional external-store sync: mirror server hours into the editable
    // grid while there are no unsaved edits.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setGrid(rowsFromStudioHours(hours));
  }, [hours, dirty]);

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
  // Studio hours gate the admin's hours — the admin can only work inside the
  // studio's open/close window for each day, and "24h" is offered only on days
  // the studio is itself open 24h.
  const { hours: studioHours } = useStudioHours(studioId);
  const studioWindowByWeekday = new Map<number, { open: string; close: string }>();
  for (const h of studioHours) {
    if (!h.closed && h.open_time && h.close_time) {
      studioWindowByWeekday.set(h.weekday, {
        open: h.open_time.slice(0, 5),
        close: h.close_time.slice(0, 5),
      });
    }
  }
  const studio24hWeekdays = new Set(
    [...studioWindowByWeekday.entries()]
      .filter(([, w]) => w.open === "00:00" && w.close === "24:00")
      .map(([weekday]) => weekday)
  );
  const [grid, setGrid] = useState<DayGridRow[]>([]);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);

  // Re-sync from the server whenever rules change while there are no unsaved
  // edits. Seeding off the first (empty, still-loading) `rules` value and then
  // locking would leave saved working hours invisible after a reload.
  useEffect(() => {
    if (dirty) return;
    // Intentional external-store sync: mirror server rules into the editable
    // grid while there are no unsaved edits.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setGrid(rowsFromAvailability(rules));
  }, [rules, dirty]);

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
          {grid.map((d) => {
            const win = studioWindowByWeekday.get(d.weekday);
            const full = win?.open === "00:00" && win?.close === "24:00";
            return (
              <DayRow
                key={d.weekday}
                d={d}
                onChange={(p) => setDay(d.weekday, p)}
                allow24h={studio24hWeekdays.has(d.weekday)}
                minTime={full ? undefined : win?.open}
                maxTime={full ? undefined : win?.close}
              />
            );
          })}
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
  allow24h = true,
  minTime,
  maxTime,
}: {
  d: DayGridRow;
  onChange: (patch: Partial<DayGridRow>) => void;
  /** Whether the "24h" quick-set is offered for this day. Working hours only
   * allow it on days the studio itself is open 24h. */
  allow24h?: boolean;
  /** Restrict the selectable time range (HH:MM). Working hours are clamped to
   * the studio's open/close window for that day. */
  minTime?: string;
  maxTime?: string;
}) {
  // 00:00 → 24:00 is a full-day window (Postgres accepts time '24:00:00').
  const is24h = d.start === "00:00" && d.end === "24:00";
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
        is24h ? (
          <div className="flex items-center gap-2 text-[12px]">
            <span className="font-medium">Open 24 hours</span>
            <Button
              variant="ghost"
              size="xs"
              onClick={() => onChange({ start: "09:00", end: "18:00" })}
            >
              Set hours
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-[12px]">
            <Input
              type="time"
              value={d.start}
              min={minTime}
              max={maxTime}
              onChange={(e) => onChange({ start: e.target.value })}
              className="w-27.5!"
            />
            <span className="text-muted-foreground">→</span>
            <Input
              type="time"
              value={d.end}
              min={minTime}
              max={maxTime}
              onChange={(e) => onChange({ end: e.target.value })}
              className="w-27.5!"
            />
            {allow24h && (
              <Button
                variant="ghost"
                size="xs"
                className="shrink-0"
                onClick={() => onChange({ start: "00:00", end: "24:00" })}
              >
                24h
              </Button>
            )}
          </div>
        )
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
