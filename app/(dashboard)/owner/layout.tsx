import { DashboardShell } from "@/components/dashboard-shell";

export default function OwnerLayout({ children }: { children: React.ReactNode }) {
  return <DashboardShell role="owner">{children}</DashboardShell>;
}
