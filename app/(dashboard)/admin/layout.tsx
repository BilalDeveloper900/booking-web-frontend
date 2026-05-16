import { DashboardShell } from "@/components/dashboard-shell";
import { requireRole } from "@/lib/auth/server";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireRole("admin", "/admin");
  return <DashboardShell role="admin">{children}</DashboardShell>;
}
