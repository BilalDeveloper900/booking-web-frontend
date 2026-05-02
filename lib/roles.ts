import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  CalendarDays,
  Users,
  Scissors,
  Wallet,
  Home,
  CalendarPlus,
  ClipboardList,
  CreditCard,
  MessageSquare,
} from "lucide-react";

export type Role = "owner" | "admin" | "client";

export interface NavItem {
  id: string;
  label: string;
  icon: LucideIcon;
  href: string;
  badge?: string;
}

export interface RoleConfig {
  role: Role;
  label: string;
  navItems: NavItem[];
  user: { name: string; hue: number; subtitle: string };
}

export const ROLE_CONFIGS: Record<Role, RoleConfig> = {
  owner: {
    role: "owner",
    label: "Owner",
    navItems: [
      { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, href: "/owner" },
      { id: "calendar", label: "Calendar", icon: CalendarDays, href: "/owner/calendar", badge: "12" },
      { id: "clients", label: "Clients", icon: Users, href: "/owner/clients" },
      { id: "admins", label: "Admins", icon: Scissors, href: "/owner/admins" },
      { id: "finance", label: "Finance", icon: Wallet, href: "/owner/finance" },
    ],
    user: { name: "Elena Marchetti", hue: 195, subtitle: "Owner · Pro plan" },
  },
  admin: {
    role: "admin",
    label: "Admin",
    navItems: [
      { id: "overview", label: "Overview", icon: LayoutDashboard, href: "/admin" },
      { id: "calendar", label: "My Calendar", icon: CalendarDays, href: "/admin/calendar", badge: "7" },
      { id: "bookings", label: "Bookings", icon: ClipboardList, href: "/admin/bookings" },
      { id: "clients", label: "My Clients", icon: Users, href: "/admin/clients" },
      { id: "messages", label: "Messages", icon: MessageSquare, href: "/admin/messages", badge: "3" },
      { id: "earnings", label: "Earnings", icon: Wallet, href: "/admin/earnings" },
    ],
    user: { name: "Camille Roux", hue: 195, subtitle: "Senior Colorist" },
  },
  client: {
    role: "client",
    label: "Client",
    navItems: [
      { id: "home", label: "Home", icon: Home, href: "/client" },
      { id: "book", label: "Book a Session", icon: CalendarPlus, href: "/client/book" },
      { id: "bookings", label: "Bookings", icon: ClipboardList, href: "/client/bookings", badge: "2" },
      { id: "credits", label: "Credits", icon: CreditCard, href: "/client/credits" },
      { id: "messages", label: "Messages", icon: MessageSquare, href: "/client/messages" },
    ],
    user: { name: "Olivia Wren", hue: 195, subtitle: "Studio · 8 credits/mo" },
  },
};
