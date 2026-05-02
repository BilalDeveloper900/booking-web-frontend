"use client";

import { useState } from "react";
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { HueAvatar } from "@/components/shared";
import { useTheme } from "@/components/theme-provider";
import { ROLE_CONFIGS, type Role } from "@/lib/roles";
import { cn } from "@/lib/utils";

const NOTIFICATION_GROUPS: Record<
  Role,
  { id: string; label: string; sub: string; defaultOn?: boolean }[]
> = {
  owner: [
    { id: "new-booking", label: "New booking", sub: "When a client books a session", defaultOn: true },
    { id: "cancellation", label: "Cancellations", sub: "When a booking is cancelled or rescheduled", defaultOn: true },
    { id: "payouts", label: "Payouts", sub: "Stylist payout cycles + ledger summary" },
    { id: "subscription", label: "Subscription health", sub: "Churn, downgrades, low credits" },
    { id: "marketing", label: "Product updates", sub: "Maison & Co. roadmap and tips" },
  ],
  stylist: [
    { id: "new-booking", label: "New booking", sub: "When a client books with you", defaultOn: true },
    { id: "reminder", label: "Daily reminder", sub: "Tomorrow's schedule, evening before", defaultOn: true },
    { id: "messages", label: "Client messages", sub: "Push when a client sends a message" },
    { id: "payouts", label: "Payouts", sub: "When earnings are released" },
  ],
  client: [
    { id: "reminders", label: "Booking reminders", sub: "24h and 1h before your appointment", defaultOn: true },
    { id: "messages", label: "Stylist messages", sub: "Push when your stylist replies", defaultOn: true },
    { id: "low-credits", label: "Low credits", sub: "When you have ≤2 credits left" },
    { id: "promotions", label: "Promotions", sub: "Top-up deals + new services" },
  ],
};

interface SettingsScreenProps {
  role: Role;
}

export function SettingsScreen({ role }: SettingsScreenProps) {
  const config = ROLE_CONFIGS[role];
  const initialEmail = `${config.user.name.split(" ")[0].toLowerCase()}@maison.co`;

  const [name, setName] = useState(config.user.name);
  const [email, setEmail] = useState(initialEmail);
  const [phone, setPhone] = useState("+33 6 12 34 56 78");
  const [bio, setBio] = useState(
    role === "stylist"
      ? "Senior colorist specializing in balayage and dimensional color. Trained in Paris and Milan."
      : role === "owner"
        ? "Owner of Maison & Co., running two locations in the 11th."
        : "Studio plan member since April 2025."
  );

  const { theme, setTheme } = useTheme();
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

        {/* Profile */}
        <Card>
          <CardHeader title="Profile" subtitle="How you appear to the rest of Maison & Co." />
          <div className="flex items-start gap-4 mb-5">
            <button
              type="button"
              aria-label="Change profile photo"
              className="relative group rounded-full motion-safe:transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card"
            >
              <HueAvatar name={name} hue={config.user.hue} size={72} />
              <span
                aria-hidden
                className="absolute inset-0 rounded-full bg-foreground/0 group-hover:bg-foreground/40 motion-safe:transition-colors motion-safe:duration-150 grid place-items-center"
              >
                <Camera className="w-5 h-5 text-background opacity-0 group-hover:opacity-100 motion-safe:transition-opacity" />
              </span>
            </button>
            <div className="flex-1 min-w-0">
              <div className="text-[15px] font-semibold">{name}</div>
              <div className="text-[12px] text-muted-foreground">{config.user.subtitle}</div>
              <div className="flex gap-2 mt-3 flex-wrap">
                <Button variant="outline" size="sm">Upload photo</Button>
                <Button variant="ghost" size="sm">Remove</Button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Full name">
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </Field>
            <Field label="Email">
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </Field>
            <Field label="Phone">
              <Input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </Field>
            <Field label="Role">
              <Input value={config.user.subtitle} disabled />
            </Field>
            <div className="md:col-span-2">
              <Field label="Bio" hint="Visible to your clients on your public profile.">
                <Textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={3} />
              </Field>
            </div>
          </div>

          <FormFooter>
            <Button variant="ghost">Discard</Button>
            <Button>Save changes</Button>
          </FormFooter>
        </Card>

        {/* Notifications */}
        <Card>
          <CardHeader
            title="Notifications"
            subtitle="Choose what you want to hear about. We'll always send transactional emails."
          />
          <div className="divide-y divide-[--line-soft]">
            {NOTIFICATION_GROUPS[role].map((n) => (
              <label
                key={n.id}
                className="flex items-start gap-3 py-3 cursor-pointer"
              >
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-medium">{n.label}</div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">{n.sub}</div>
                </div>
                <Switch
                  checked={notifications[n.id] ?? false}
                  onCheckedChange={(next: boolean) =>
                    setNotifications((prev) => ({ ...prev, [n.id]: next }))
                  }
                />
              </label>
            ))}
          </div>
        </Card>

        {/* Appearance */}
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

          <Field label="Language">
            <Select defaultValue="en-FR">
              <option value="en-FR">English (France)</option>
              <option value="fr-FR">Français</option>
              <option value="en-US">English (US)</option>
              <option value="es-ES">Español</option>
            </Select>
          </Field>
        </Card>

        {/* Security */}
        <Card>
          <CardHeader
            title="Security"
            subtitle="Lock down access to your account."
          />
          <div className="divide-y divide-[--line-soft]">
            <SecurityRow
              icon={Lock}
              title="Password"
              sub="Last changed 38 days ago"
              action={<Button variant="outline" size="sm">Change</Button>}
            />
            <SecurityRow
              icon={Smartphone}
              title="Two-factor authentication"
              sub={twoFA ? "Authenticator app enabled" : "Off — recommended for owners"}
              action={
                <Switch checked={twoFA} onCheckedChange={setTwoFA} />
              }
            />
            <SecurityRow
              icon={Globe}
              title="Active sessions"
              sub="2 devices · Paris, France"
              action={<Button variant="outline" size="sm">Manage</Button>}
            />
          </div>
        </Card>

        {/* Danger zone */}
        <Card tone="danger">
          <CardHeader
            title="Danger zone"
            subtitle="These actions are permanent. Take care."
          />
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
        tone === "danger"
          ? "border-[--neg]/30"
          : "border-border"
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
      {subtitle && (
        <p className="text-[12px] text-muted-foreground mt-0.5">{subtitle}</p>
      )}
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
      {hint && (
        <p className="text-[11px] text-muted-foreground mt-1.5">{hint}</p>
      )}
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
        "disabled:bg-muted/50 disabled:cursor-not-allowed disabled:text-muted-foreground"
      )}
    />
  );
}

function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={cn(
        "w-full rounded-lg border border-border bg-background px-3 py-2 text-[13px] outline-none motion-safe:transition-colors motion-safe:duration-150 resize-none",
        "hover:border-foreground/30 focus:border-ring focus:ring-2 focus:ring-ring/20"
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
        "hover:border-foreground/30 focus:border-ring focus:ring-2 focus:ring-ring/20"
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
      <Button variant={destructive ? "destructive" : "outline"} size="sm">
        {actionLabel}
      </Button>
    </div>
  );
}
