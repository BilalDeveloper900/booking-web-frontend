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
import type { Role } from "@/lib/roles";
import { ROLE_CONFIGS } from "@/lib/roles";

function deriveTitle(pathname: string, config: { navItems: { href: string; label: string }[] }): string {
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
  const config = ROLE_CONFIGS[role];
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div data-role={role} className="flex h-dvh overflow-hidden bg-background">
      <AppSidebar config={config} currentPath={pathname} />

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-60 p-0" showCloseButton={false}>
          <SheetTitle className="sr-only">Account &amp; settings</SheetTitle>
          <AppSidebar config={config} currentPath={pathname} className="flex w-full border-r-0" />
        </SheetContent>
      </Sheet>

      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <AppTopbar
          title={deriveTitle(pathname, config)}
          onMenuClick={() => setMobileOpen(true)}
        />
        <main className="flex-1 overflow-hidden flex flex-col min-h-0 pb-[calc(env(safe-area-inset-bottom)+64px)] lg:pb-0">
          {children}
        </main>
      </div>

      <AppBottomTabs config={config} currentPath={pathname} />
    </div>
  );
}
