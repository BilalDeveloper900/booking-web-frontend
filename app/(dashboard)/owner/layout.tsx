import { DashboardShell } from "@/components/dashboard-shell";
import { requireRole } from "@/lib/auth/server";

export default async function OwnerLayout({ children }: { children: React.ReactNode }) {
  await requireRole("owner", "/owner");
  return <DashboardShell role="owner">{children}</DashboardShell>;
}
