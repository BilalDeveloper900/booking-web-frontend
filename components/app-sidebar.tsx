"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { HueAvatar } from "@/components/shared";
import { Star, Settings } from "lucide-react";
import type { RoleConfig } from "@/lib/roles";

interface AppSidebarProps {
  config: RoleConfig;
  currentPath: string;
  className?: string;
}

export function AppSidebar({ config, currentPath, className }: AppSidebarProps) {
  const { navItems, user } = config;

  function isActive(href: string) {
    // For root role paths (e.g. /owner, /stylist, /client), exact match only
    const isRootNav = navItems[0]?.href === href;
    if (isRootNav) return currentPath === href;
    // For sub-routes, use startsWith
    return currentPath.startsWith(href);
  }

  return (
    <aside className={cn("hidden md:flex w-60 shrink-0 h-full border-r border-border flex-col py-7 px-5 bg-card", className)}>
      <div className="flex items-center gap-2.5 px-2 mb-9">
        <div className="w-7 h-7 rounded-md bg-foreground grid place-items-center text-background font-serif text-lg leading-none">
          M
        </div>
        <span className="text-[15px] font-semibold tracking-tight">
          Maison&nbsp;&amp;&nbsp;Co.
        </span>
      </div>

      <div className="text-[10px] font-medium tracking-[0.12em] uppercase text-muted-foreground px-3 mb-1.5 mt-4">
        Workspace
      </div>
      {navItems.map(({ id, label, icon: Icon, href, badge }) => {
        const active = isActive(href);
        return (
          <Link
            key={id}
            href={href}
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-left transition-colors",
              active
                ? "bg-foreground text-background font-medium"
                : "text-muted-foreground hover:bg-muted"
            )}
          >
            <Icon className="w-4 h-4 shrink-0" />
            <span>{label}</span>
            {badge && (
              <span
                className={cn(
                  "ml-auto text-[11px] px-1.5 py-px rounded-full tabular-nums",
                  active
                    ? "bg-white/20 text-background"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {badge}
              </span>
            )}
          </Link>
        );
      })}

      <div className="text-[10px] font-medium tracking-[0.12em] uppercase text-muted-foreground px-3 mb-1.5 mt-6">
        Account
      </div>
      <button className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-muted transition-colors">
        <Star className="w-4 h-4" />
        <span>Subscription</span>
      </button>
      <button className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-muted transition-colors">
        <Settings className="w-4 h-4" />
        <span>Settings</span>
      </button>

      <div className="mt-auto pt-3 border-t border-border flex items-center gap-2.5 px-3">
        <HueAvatar name={user.name} hue={user.hue} size={32} />
        <div className="leading-tight">
          <div className="text-[13px] font-medium">{user.name}</div>
          <div className="text-[11px] text-muted-foreground">{user.subtitle}</div>
        </div>
      </div>
    </aside>
  );
}
