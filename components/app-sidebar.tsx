"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { HueAvatar } from "@/components/shared";
import { Star, Settings, ChevronUp } from "lucide-react";
import { ProfileMenu } from "@/components/profile-menu";
import { useUnread } from "@/components/chat-notifications";
import type { RoleConfig } from "@/lib/roles";

interface AppSidebarProps {
  config: RoleConfig;
  currentPath: string;
  className?: string;
}

export function AppSidebar({ config, currentPath, className }: AppSidebarProps) {
  const { navItems, user } = config;
  const settingsHref = `/${config.role}/settings`;
  const isSettingsActive = currentPath.startsWith(settingsHref);
  const isSubscriptionActive = currentPath.startsWith("/owner/subscription");
  const unread = useUnread();

  function isActive(href: string) {
    const isRootNav = navItems[0]?.href === href;
    if (isRootNav) return currentPath === href;
    return currentPath.startsWith(href);
  }

  /** Live override of the static `badge` in nav config — currently just the
   * Messages item, driven by the global unread count. */
  function badgeFor(itemId: string, staticBadge: string | undefined): string | undefined {
    if (itemId === "messages") {
      if (unread <= 0) return undefined;
      return unread > 99 ? "99+" : String(unread);
    }
    return staticBadge;
  }

  return (
    <aside
      className={cn(
        "hidden lg:flex w-60 shrink-0 h-full border-r border-border flex-col py-7 px-4 bg-card",
        className
      )}
    >
      <Link href={navItems[0]?.href ?? "/"} className="flex items-center gap-2.5 px-2 mb-9 group">
        <div className="w-8 h-8 rounded-md bg-foreground grid place-items-center text-background font-serif text-lg leading-none motion-safe:transition-transform motion-safe:duration-200 group-hover:rotate-[-4deg]">
          B
        </div>
        <div className="leading-tight">
          <div className="text-[15px] font-semibold tracking-tight">
            Book&nbsp;It&nbsp;Daily
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
          const liveBadge = badgeFor(id, badge);
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
              {liveBadge && (
                <span
                  className={cn(
                    "ml-auto text-[11px] px-1.5 py-px rounded-full tabular-nums motion-safe:transition-colors motion-safe:duration-150",
                    id === "messages" && !active
                      ? "bg-muted text-muted-foreground"
                      : active
                        ? "bg-muted text-muted-foreground"
                        : "bg-muted text-muted-foreground"
                  )}
                >
                  {liveBadge}
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
        {config.role === "owner" && (
          <Link
            href="/owner/subscription"
            aria-current={isSubscriptionActive ? "page" : undefined}
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-lg text-sm motion-safe:transition-colors motion-safe:duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card",
              isSubscriptionActive
                ? "bg-foreground text-background font-medium"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <Star className="w-4 h-4" aria-hidden />
            <span>Subscription</span>
          </Link>
        )}
        <Link
          href={settingsHref}
          aria-current={isSettingsActive ? "page" : undefined}
          className={cn(
            "flex items-center gap-3 px-3 py-2 rounded-lg text-sm motion-safe:transition-colors motion-safe:duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card",
            isSettingsActive
              ? "bg-foreground text-background font-medium"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          )}
        >
          <Settings className="w-4 h-4" aria-hidden />
          <span>Settings</span>
        </Link>
      </nav>

      <div className="mt-auto pt-3 border-t border-border">
        <ProfileMenu
          user={user}
          role={config.role}
          side="top"
          align="start"
          sideOffset={10}
          trigger={
            <button
              type="button"
              aria-label={`Open profile for ${user.name}`}
              className="w-full flex items-center gap-2.5 px-3 py-1.5 -mx-1 rounded-lg hover:bg-muted/60 data-popup-open:bg-muted/60 motion-safe:transition-colors motion-safe:duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card"
            >
              <HueAvatar name={user.name} hue={user.hue} size={32} src={user.avatarUrl} />
              <div className="leading-tight text-left min-w-0 flex-1">
                <div className="text-[13px] font-medium truncate">{user.name}</div>
                <div className="text-[11px] text-muted-foreground truncate">{user.subtitle}</div>
              </div>
              <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0" aria-hidden />
            </button>
          }
        />
      </div>
    </aside>
  );
}
