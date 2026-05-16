import { DashboardShell } from "@/components/dashboard-shell";
import { requireRole } from "@/lib/auth/server";

export default async function ClientLayout({ children }: { children: React.ReactNode }) {
  await requireRole("client", "/client");
  return <DashboardShell role="client">{children}</DashboardShell>;
}
