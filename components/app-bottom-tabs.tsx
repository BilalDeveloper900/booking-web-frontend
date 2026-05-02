"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import type { RoleConfig } from "@/lib/roles";

interface AppBottomTabsProps {
  config: RoleConfig;
  currentPath: string;
}

/**
 * Mobile bottom tab bar — visible only below `md`. Mirrors the design in
 * `Salon Booking - Mobile.html`: blurred white background, brand-color icon
 * for active tab, optional unread/count badge, safe-area padding for the iOS
 * home indicator. Reads its items from `RoleConfig.navItems` so the same
 * source of truth feeds desktop sidebar + mobile tabs.
 */
export function AppBottomTabs({ config, currentPath }: AppBottomTabsProps) {
  const { navItems } = config;

  function isActive(href: string) {
    const isRootNav = navItems[0]?.href === href;
    if (isRootNav) return currentPath === href;
    return currentPath.startsWith(href);
  }

  return (
    <nav
      aria-label="Primary"
      className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-card/85 backdrop-blur supports-backdrop-filter:bg-card/70 border-t border-border pb-[max(env(safe-area-inset-bottom),8px)] pt-2"
    >
      <ul
        className="grid"
        style={{ gridTemplateColumns: `repeat(${navItems.length}, 1fr)` }}
      >
        {navItems.map(({ id, label, icon: Icon, href, badge }) => {
          const active = isActive(href);
          return (
            <li key={id}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 py-1 motion-safe:transition-colors motion-safe:duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-lg",
                  active
                    ? "text-[--role-accent]"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <span className="relative">
                  <Icon className="w-5.5 h-5.5" aria-hidden />
                  {badge && (
                    <span
                      aria-hidden
                      className="absolute -top-1.5 -right-2.5 min-w-4 h-4 px-1 rounded-full bg-[--role-accent] text-white text-[9px] font-bold tabular-nums grid place-items-center"
                    >
                      {badge}
                    </span>
                  )}
                </span>
                <span
                  className={cn(
                    "text-[10px] tracking-tight",
                    active ? "font-semibold" : "font-medium"
                  )}
                >
                  {label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
