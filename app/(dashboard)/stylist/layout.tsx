import { DashboardShell } from "@/components/dashboard-shell";

export default function StylistLayout({ children }: { children: React.ReactNode }) {
  return <DashboardShell role="stylist">{children}</DashboardShell>;
}
