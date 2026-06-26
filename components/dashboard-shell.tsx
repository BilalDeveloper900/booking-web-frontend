"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { AppSidebar } from "@/components/app-sidebar";
import { AppTopbar } from "@/components/app-topbar";
import { AppBottomTabs } from "@/components/app-bottom-tabs";
import {
  Sheet,
  SheetContent,
  SheetTitle,
} from "@/components/ui/sheet";
import { ChatNotificationsProvider } from "@/components/chat-notifications";
import { NotificationsProvider } from "@/components/notifications-provider";
import { PoweredByFooter } from "@/components/powered-by-footer";
import { ROLE_CONFIGS, type Role, type RoleConfig } from "@/lib/roles";
import { useCurrentMember } from "@/lib/auth/use-current-member";
import { useEffectivePlan } from "@/lib/limits";
import { planAllows } from "@/lib/plans";

function deriveTitle(pathname: string, config: { navItems: { href: string; label: string }[] }): string {
  // Static routes that don't appear in the sidebar still need a title.
  if (/\/notifications(\/|$)/.test(pathname)) return "Notifications";

  const match = config.navItems.find(
    (item) => pathname === item.href || (item.href !== config.navItems[0]?.href && pathname.startsWith(item.href))
  );
  return match?.label ?? config.navItems[0]?.label ?? "Dashboard";
}

interface DashboardShellProps {
  role: Role;
  children: React.ReactNode;
}

export function DashboardShell({ role, children }: DashboardShellProps) {
  const pathname = usePathname();
  const staticConfig = ROLE_CONFIGS[role];
  const { member } = useCurrentMember();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Live user from Supabase, with the static config as fallback while the
  // hook resolves on first paint. Subtitle stays from static config until we
  // wire studio_subscriptions / client plan into the membership query.
  const config: RoleConfig = member
    ? {
        ...staticConfig,
        user: {
          name: member.user.name,
          hue: member.user.avatar_hue,
          avatarUrl: member.user.avatar_url,
          subtitle:
            role === "admin" && member.member.specialty
              ? member.member.specialty
              : staticConfig.user.subtitle,
        },
      }
    : staticConfig;

  // Plan-gated navigation. While the plan resolves we show the full nav
  // (optimistic) so paid studios never see their tools flicker out; once
  // resolved we hide what this plan doesn't include.
  const { plan, loading: planLoading } = useEffectivePlan(member?.studio.id);
  const navItems = planLoading
    ? config.navItems
    : config.navItems.filter((item) => {
        if (item.id === "messages") return planAllows(plan, "chat"); // Solo+
        if (role === "owner" && (item.id === "finance" || item.id === "offers")) {
          return plan === "studio";
        }
        if (role === "client" && item.id === "credits") return plan === "studio";
        return true;
      });
  const navConfig: RoleConfig = { ...config, navItems };
  const showBranding = role === "client" && !planLoading && plan === "free";

  return (
    <ChatNotificationsProvider>
      <NotificationsProvider>
      <div data-role={role} className="flex h-dvh overflow-hidden bg-background">
        <AppSidebar config={navConfig} currentPath={pathname} />

        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetContent side="left" className="w-60 p-0" showCloseButton={false}>
            <SheetTitle className="sr-only">Account &amp; settings</SheetTitle>
            <AppSidebar config={navConfig} currentPath={pathname} className="flex w-full border-r-0" />
          </SheetContent>
        </Sheet>

        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
          <AppTopbar
            title={deriveTitle(pathname, config)}
            config={config}
            onMenuClick={() => setMobileOpen(true)}
          />
          <main className="flex-1 overflow-hidden flex flex-col min-h-0 pb-[calc(env(safe-area-inset-bottom)+64px)] lg:pb-0">
            {children}
            {showBranding && <PoweredByFooter />}
          </main>
        </div>

        <AppBottomTabs config={navConfig} currentPath={pathname} />
      </div>
      </NotificationsProvider>
    </ChatNotificationsProvider>
  );
}
