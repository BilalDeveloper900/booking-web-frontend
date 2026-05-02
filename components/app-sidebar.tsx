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
    const isRootNav = navItems[0]?.href === href;
    if (isRootNav) return currentPath === href;
    return currentPath.startsWith(href);
  }

  return (
    <aside
      className={cn(
        "hidden md:flex w-60 shrink-0 h-full border-r border-border flex-col py-7 px-4 bg-card",
        className
      )}
    >
      <Link href={navItems[0]?.href ?? "/"} className="flex items-center gap-2.5 px-2 mb-9 group">
        <div className="w-8 h-8 rounded-md bg-foreground grid place-items-center text-background font-serif text-lg leading-none motion-safe:transition-transform motion-safe:duration-200 group-hover:rotate-[-4deg]">
          M
        </div>
        <div className="leading-tight">
          <div className="text-[15px] font-semibold tracking-tight">
            Maison&nbsp;&amp;&nbsp;Co.
          </div>
          <div className="text-[10px] font-medium tracking-[0.12em] uppercase text-muted-foreground">
            {user.subtitle}
          </div>
        </div>
      </Link>

      <div className="text-[10px] font-medium tracking-[0.12em] uppercase text-muted-foreground px-3 mb-1.5 mt-2">
        Workspace
      </div>
      <nav className="flex flex-col gap-0.5">
        {navItems.map(({ id, label, icon: Icon, href, badge }) => {
          const active = isActive(href);
          return (
            <Link
              key={id}
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-left motion-safe:transition-all motion-safe:duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card",
                active
                  ? "bg-foreground text-background font-medium"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Icon className="w-4 h-4 shrink-0" aria-hidden />
              <span>{label}</span>
              {badge && (
                <span
                  className={cn(
                    "ml-auto text-[11px] px-1.5 py-px rounded-full tabular-nums motion-safe:transition-colors motion-safe:duration-150",
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
      </nav>

      <div className="text-[10px] font-medium tracking-[0.12em] uppercase text-muted-foreground px-3 mb-1.5 mt-7">
        Account
      </div>
      <nav className="flex flex-col gap-0.5">
        <button className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-muted hover:text-foreground motion-safe:transition-colors motion-safe:duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card">
          <Star className="w-4 h-4" aria-hidden />
          <span>Subscription</span>
        </button>
        <button className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-muted hover:text-foreground motion-safe:transition-colors motion-safe:duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card">
          <Settings className="w-4 h-4" aria-hidden />
          <span>Settings</span>
        </button>
      </nav>

      <button
        className="mt-auto pt-3 border-t border-border flex items-center gap-2.5 px-3 -mx-1 rounded-lg hover:bg-muted/60 motion-safe:transition-colors motion-safe:duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card"
        aria-label={`Open profile for ${user.name}`}
      >
        <HueAvatar name={user.name} hue={user.hue} size={32} />
        <div className="leading-tight text-left">
          <div className="text-[13px] font-medium">{user.name}</div>
          <div className="text-[11px] text-muted-foreground">{user.subtitle}</div>
        </div>
      </button>
    </aside>
  );
}
