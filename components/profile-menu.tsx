"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CircleUserRound,
  CreditCard,
  Settings,
  LifeBuoy,
  Moon,
  LogOut,
  Bell,
  Loader2,
} from "lucide-react";
import toast from "react-hot-toast";
import { HueAvatar } from "@/components/shared";
import { Switch } from "@/components/ui/switch";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useTheme } from "@/components/theme-provider";
import type { RoleConfig } from "@/lib/roles";
import { useCurrentMember } from "@/lib/auth/use-current-member";
import { useDesktopNotifications } from "@/lib/desktop-notifications";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

type Item = {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  shortcut?: string;
  danger?: boolean;
  href?: string;
  onClick?: () => void;
  loading?: boolean;
};

interface ProfileMenuProps {
  user: RoleConfig["user"];
  role: string;
  trigger: React.ReactNode;
  align?: "start" | "center" | "end";
  side?: "top" | "right" | "bottom" | "left";
  sideOffset?: number;
}

export function ProfileMenu({
  user,
  role,
  trigger,
  align = "start",
  side = "top",
  sideOffset = 8,
}: ProfileMenuProps) {
  const router = useRouter();
  const { permission: notifPermission, request: requestNotifPermission } =
    useDesktopNotifications();
  const [signingOut, setSigningOut] = React.useState(false);
  const { resolvedTheme, setTheme } = useTheme();
  const { member } = useCurrentMember();
  // Real email from Supabase, with a placeholder until the hook resolves.
  const email = member?.user.email ?? "Loading...";

  const notificationsOn = notifPermission === "granted";
  async function toggleNotifications(next: boolean) {
    if (notifPermission === "unsupported") {
      toast.error("This browser doesn't support desktop notifications.");
      return;
    }
    if (!next) {
      // Browsers don't expose a programmatic "revoke" — we can only ask the
      // user to disable it manually from the site settings.
      toast(
        "To turn off browser notifications, open this site's permissions in your browser and set Notifications to Block.",
        { duration: 6000, icon: "ℹ️" }
      );
      return;
    }
    if (notifPermission === "denied") {
      toast.error(
        "Notifications are blocked. Open the site settings in your browser and allow notifications, then try again."
      );
      return;
    }
    const result = await requestNotifPermission();
    if (result === "granted") {
      toast.success("Browser notifications enabled");
    } else if (result === "denied") {
      toast.error("Notifications were blocked.");
    }
  }

  async function signOut() {
    if (signingOut) return;
    setSigningOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  const settingsHref = `/${role}/settings`;
  const items: Item[] = [
    { label: "View profile", icon: CircleUserRound, shortcut: "⌘P", href: settingsHref },
    role === "client"
      ? { label: "Payment methods", icon: CreditCard }
      : role === "admin"
        ? { label: "Payouts", icon: CreditCard }
        : { label: "Billing", icon: CreditCard },
    { label: "Account settings", icon: Settings, shortcut: "⌘,", href: settingsHref },
  ];

  return (
    <Popover>
      <PopoverTrigger render={trigger as React.ReactElement} />
      <PopoverContent
        align={align}
        side={side}
        sideOffset={sideOffset}
        className="w-65 p-0"
      >
        <div className="flex items-center gap-3 px-3 py-3 border-b border-border">
          <HueAvatar name={user.name} hue={user.hue} size={40} />
          <div className="min-w-0 leading-tight">
            <div className="text-[13px] font-semibold truncate">{user.name}</div>
            <div className="text-[11px] text-muted-foreground truncate">{email}</div>
            <div className="text-[10px] tracking-[0.08em] uppercase text-muted-foreground mt-1">
              {user.subtitle}
            </div>
          </div>
        </div>

        <MenuGroup>
          {items.map((item) => (
            <MenuItem key={item.label} {...item} />
          ))}
        </MenuGroup>

        <Separator />

        <MenuGroup>
          <MenuToggleRow
            icon={Bell}
            label="Browser notifications"
            checked={notificationsOn}
            onCheckedChange={toggleNotifications}
          />
          <MenuToggleRow
            icon={Moon}
            label="Dark mode"
            checked={resolvedTheme === "dark"}
            onCheckedChange={(next) => setTheme(next ? "dark" : "light")}
          />
        </MenuGroup>

        <Separator />

        <MenuGroup>
          <MenuItem icon={LifeBuoy} label="Help &amp; support" />
          <MenuItem
            icon={signingOut ? Loader2 : LogOut}
            label={signingOut ? "Signing out…" : "Sign out"}
            danger
            shortcut={signingOut ? undefined : "⇧⌘Q"}
            onClick={signOut}
            loading={signingOut}
          />
        </MenuGroup>
      </PopoverContent>
    </Popover>
  );
}

function MenuGroup({ children }: { children: React.ReactNode }) {
  return <div className="py-1">{children}</div>;
}

function Separator() {
  return <div className="h-px bg-border" aria-hidden />;
}

function MenuItem({
  icon: Icon,
  label,
  shortcut,
  danger,
  href,
  onClick,
  loading,
}: Item) {
  const className = cn(
    "flex items-center gap-2.5 px-2.5 py-1.5 mx-1 rounded-md text-[13px] motion-safe:transition-colors motion-safe:duration-100 focus-visible:outline-none focus-visible:bg-muted w-[calc(100%-0.5rem)]",
    danger
      ? "text-[--neg] hover:bg-[--neg]/10"
      : "text-foreground hover:bg-muted",
    loading && "opacity-70 cursor-wait"
  );
  const inner = (
    <>
      <Icon className={cn("w-4 h-4 shrink-0", loading && "animate-spin")} aria-hidden />
      <span className="flex-1 text-left">{label}</span>
      {shortcut && (
        <kbd className="text-[10px] text-muted-foreground tabular-nums">
          {shortcut}
        </kbd>
      )}
    </>
  );
  if (href) {
    return (
      <Link href={href} className={className} onClick={onClick}>
        {inner}
      </Link>
    );
  }
  return (
    <button type="button" onClick={onClick} disabled={loading} className={className}>
      {inner}
    </button>
  );
}

function MenuToggleRow({
  icon: Icon,
  label,
  checked,
  onCheckedChange,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  checked: boolean;
  onCheckedChange: (next: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-2.5 px-2.5 py-1.5 mx-1 rounded-md text-[13px] hover:bg-muted cursor-pointer">
      <Icon className="w-4 h-4 shrink-0 text-foreground" aria-hidden />
      <span className="flex-1">{label}</span>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </label>
  );
}
