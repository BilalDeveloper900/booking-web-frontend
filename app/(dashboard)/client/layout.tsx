import { DashboardShell } from "@/components/dashboard-shell";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return <DashboardShell role="client">{children}</DashboardShell>;
}
