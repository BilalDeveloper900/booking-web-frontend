"use client";

import * as React from "react";
import Link from "next/link";
import {
  CircleUserRound,
  CreditCard,
  Settings,
  LifeBuoy,
  Moon,
  LogOut,
  Bell,
} from "lucide-react";
import { HueAvatar } from "@/components/shared";
import { Switch } from "@/components/ui/switch";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useTheme } from "@/components/theme-provider";
import type { RoleConfig } from "@/lib/roles";
import { cn } from "@/lib/utils";

type Item = { label: string; icon: React.ComponentType<{ className?: string }>; shortcut?: string; danger?: boolean; href?: string; onClick?: () => void };

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
  const [notifications, setNotifications] = React.useState(true);
  const { resolvedTheme, setTheme } = useTheme();
  const email = `${user.name.split(" ")[0].toLowerCase()}@maison.co`;

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
            label="Notifications"
            checked={notifications}
            onCheckedChange={setNotifications}
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
          <MenuItem icon={LogOut} label="Sign out" danger shortcut="⇧⌘Q" />
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
}: Item) {
  const className = cn(
    "flex items-center gap-2.5 px-2.5 py-1.5 mx-1 rounded-md text-[13px] motion-safe:transition-colors motion-safe:duration-100 focus-visible:outline-none focus-visible:bg-muted w-[calc(100%-0.5rem)]",
    danger
      ? "text-[--neg] hover:bg-[--neg]/10"
      : "text-foreground hover:bg-muted"
  );
  const inner = (
    <>
      <Icon className="w-4 h-4 shrink-0" aria-hidden />
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
    <button type="button" onClick={onClick} className={className}>
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
