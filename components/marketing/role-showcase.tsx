"use client";

import { useState } from "react";
import {
  BadgeCheck,
  Bell,
  CalendarDays,
  Check,
  CreditCard,
  MessageSquare,
  Sparkles,
  TrendingUp,
  UserCog,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * "What you already get" — tabbed walkthrough of the three real dashboards.
 * Each tab pairs feature bullets (all shipped features) with a hand-built
 * mock of that role's screen, so visitors see the actual product surface.
 */

const ROLES = [
  {
    id: "owner",
    label: "Owner",
    icon: CreditCard,
    accent: "text-[--teal-700]",
    headline: "Run the business",
    bullets: [
      "Revenue, payouts & commission splits in one finance view",
      "Invite staff and clients with one-tap links",
      "Build your own subscription plans & credit packs",
      "Gift credits, manage your team, see every booking",
    ],
  },
  {
    id: "admin",
    label: "Staff",
    icon: UserCog,
    accent: "text-[--role-accent]",
    headline: "Own your schedule",
    bullets: [
      "Personal calendar with availability rules & day blocks",
      "Your clients, your earnings, your services",
      "Chat with clients between sessions",
      "Instant notifications when bookings land or cancel",
    ],
  },
  {
    id: "client",
    label: "Client",
    icon: Users,
    accent: "text-[--pos]",
    headline: "Book in seconds",
    bullets: [
      "Live slot grid — only real availability, no back-and-forth",
      "Credits balance with a full transaction history",
      "Reschedule or cancel with automatic refunds (24h rule)",
      "Installable app — book from the home screen",
    ],
  },
] as const;

type RoleId = (typeof ROLES)[number]["id"];

function OwnerMock() {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2.5">
        {[
          { label: "Revenue · June", value: "$4,820", delta: "+12%" },
          { label: "Payouts due", value: "$1,140", delta: "3 staff" },
        ].map((s) => (
          <div key={s.label} className="bg-card border border-border rounded-lg p-3 shadow-card">
            <div className="text-[10px] uppercase tracking-[0.08em] font-medium text-muted-foreground">{s.label}</div>
            <div className="text-[20px] font-semibold tracking-tight tabular-nums mt-0.5">{s.value}</div>
            <div className="flex items-center gap-1 text-[10px] text-[--pos] font-medium tabular-nums">
              <TrendingUp className="w-3 h-3" aria-hidden /> {s.delta}
            </div>
          </div>
        ))}
      </div>
      <div className="bg-card border border-border rounded-lg p-3 shadow-card">
        <div className="text-[10px] uppercase tracking-[0.08em] font-medium text-muted-foreground mb-2">Revenue mix</div>
        <div className="flex items-end gap-1.5 h-16">
          {[35, 55, 42, 70, 58, 85, 64, 92].map((h, i) => (
            <div key={i} className="flex-1 rounded-t bg-[--teal-500]/70" style={{ height: `${h}%` }} />
          ))}
        </div>
        <div className="flex items-center gap-3 mt-2 text-[10px] text-muted-foreground">
          <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[--teal-500]" aria-hidden /> Memberships</span>
          <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[--sage-500]" aria-hidden /> Credit packs</span>
        </div>
      </div>
    </div>
  );
}

function AdminMock() {
  return (
    <div className="space-y-3">
      <div className="bg-card border border-border rounded-lg p-3 shadow-card">
        <div className="text-[10px] uppercase tracking-[0.08em] font-medium text-muted-foreground mb-2">Today · Thursday</div>
        <div className="space-y-2">
          {[
            { time: "09:00", title: "Vinyasa Flow", meta: "9/12 booked", tone: "bg-[--teal-500]" },
            { time: "11:30", title: "Reformer Pilates", meta: "6/8 booked", tone: "bg-[--sage-500]" },
            { time: "14:00", title: "1-on-1 · Yuki", meta: "confirmed", tone: "bg-[--teal-700]" },
          ].map((a) => (
            <div key={a.time} className="flex items-center gap-2.5">
              <span className="text-[10px] text-muted-foreground tabular-nums w-9 shrink-0">{a.time}</span>
              <span className={`w-1 h-7 rounded-full ${a.tone} shrink-0`} aria-hidden />
              <div className="min-w-0 flex-1">
                <div className="text-[12px] font-medium truncate">{a.title}</div>
                <div className="text-[10px] text-muted-foreground tabular-nums">{a.meta}</div>
              </div>
              <BadgeCheck className="w-3.5 h-3.5 text-[--pos] shrink-0" aria-hidden />
            </div>
          ))}
        </div>
      </div>
      <div className="bg-card border border-border rounded-lg p-3 shadow-card flex items-center gap-2.5">
        <span className="w-7 h-7 rounded-full bg-[--teal-100] text-[--teal-700] grid place-items-center shrink-0">
          <MessageSquare className="w-3.5 h-3.5" aria-hidden />
        </span>
        <div className="min-w-0">
          <div className="text-[12px] font-medium">Yuki Tanaka</div>
          <div className="text-[10px] text-muted-foreground truncate">&ldquo;See you at 2 — bringing a friend for the trial!&rdquo;</div>
        </div>
        <span className="ml-auto w-2 h-2 rounded-full bg-[--role-accent] shrink-0" aria-hidden />
      </div>
    </div>
  );
}

function ClientMock() {
  return (
    <div className="space-y-3">
      <div className="bg-card border border-border rounded-lg p-3 shadow-card">
        <div className="flex items-center justify-between mb-2">
          <div className="text-[10px] uppercase tracking-[0.08em] font-medium text-muted-foreground">Next session</div>
          <span className="inline-flex items-center gap-1 text-[10px] font-medium text-[--pos]">
            <BadgeCheck className="w-3 h-3" aria-hidden /> Confirmed
          </span>
        </div>
        <div className="text-[14px] font-semibold">Reformer Pilates</div>
        <div className="text-[11px] text-muted-foreground tabular-nums">Thu · 11:30 · with Camille</div>
      </div>
      <div className="grid grid-cols-2 gap-2.5">
        <div className="bg-card border border-border rounded-lg p-3 shadow-card">
          <div className="text-[10px] uppercase tracking-[0.08em] font-medium text-muted-foreground">Credits</div>
          <div className="text-[20px] font-semibold tabular-nums mt-0.5 inline-flex items-center gap-1.5">
            8 <Sparkles className="w-3.5 h-3.5 text-[--teal-700]" aria-hidden />
          </div>
          <div className="text-[10px] text-muted-foreground">renews Jul 1</div>
        </div>
        <div className="bg-card border border-border rounded-lg p-3 shadow-card">
          <div className="text-[10px] uppercase tracking-[0.08em] font-medium text-muted-foreground">This month</div>
          <div className="text-[20px] font-semibold tabular-nums mt-0.5">6</div>
          <div className="text-[10px] text-muted-foreground">sessions booked</div>
        </div>
      </div>
      <div className="bg-card border border-border rounded-lg p-3 shadow-card flex items-center gap-2.5">
        <span className="w-7 h-7 rounded-full bg-[--sage-100] text-[--pos] grid place-items-center shrink-0">
          <Bell className="w-3.5 h-3.5" aria-hidden />
        </span>
        <div className="text-[11px] text-muted-foreground">
          <span className="text-foreground font-medium">Reminder:</span> Vinyasa Flow tomorrow at 09:00
        </div>
      </div>
    </div>
  );
}

const MOCKS: Record<RoleId, () => React.ReactNode> = {
  owner: OwnerMock,
  admin: AdminMock,
  client: ClientMock,
};

export function RoleShowcase() {
  const [active, setActive] = useState<RoleId>("owner");
  const role = ROLES.find((r) => r.id === active)!;
  const Mock = MOCKS[active];

  return (
    <div>
      {/* role tabs */}
      <div role="tablist" aria-label="Choose a role" className="flex justify-center mb-10">
        <div className="flex items-center gap-0.5 p-0.5 bg-muted rounded-lg">
          {ROLES.map((r) => (
            <button
              key={r.id}
              role="tab"
              aria-selected={active === r.id}
              onClick={() => setActive(r.id)}
              className={cn(
                "flex items-center gap-1.5 px-4 py-1.5 text-[13px] rounded-md motion-safe:transition-all motion-safe:duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                active === r.id
                  ? "bg-card text-foreground shadow-card font-medium"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <r.icon className="w-3.5 h-3.5" aria-hidden />
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <div key={active} className="bid-pop grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center">
        {/* bullets */}
        <div>
          <h3 className="text-[22px] font-semibold tracking-tight mb-4">{role.headline}</h3>
          <ul className="space-y-3">
            {role.bullets.map((b) => (
              <li key={b} className="flex gap-2.5 items-start">
                <span className="w-5 h-5 rounded-full bg-[--teal-100]/70 text-[--teal-700] grid place-items-center shrink-0 mt-px">
                  <Check className="w-3 h-3" aria-hidden />
                </span>
                <span className="text-[14px] text-muted-foreground leading-relaxed">{b}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* mock screen */}
        <div aria-hidden className="relative">
          <div className="absolute inset-x-6 bottom-0 top-1/2 -z-10 rounded-full bg-[--teal-500]/15 blur-[50px]" />
          <div className="bg-muted/30 border border-border rounded-xl p-4 md:p-5">
            <div className="flex items-center gap-2 mb-3">
              <CalendarDays className="w-3.5 h-3.5 text-muted-foreground" aria-hidden />
              <span className="text-[10px] uppercase tracking-[0.08em] font-medium text-muted-foreground">
                {role.label} dashboard
              </span>
            </div>
            <Mock />
          </div>
        </div>
      </div>
    </div>
  );
}
