import {
  BadgeCheck,
  Bell,
  CalendarDays,
  CreditCard,
  LayoutDashboard,
  MessageSquare,
  TrendingUp,
  Users,
} from "lucide-react";

/**
 * Stylized, hand-built mock of the real dashboard rendered below the hero
 * headline. No screenshots — pure tokens, so it tracks light/dark themes.
 * Decorative: hidden from the accessibility tree, all motion is CSS and
 * disabled under prefers-reduced-motion (see globals.css `.bid-*`).
 */

type WeekDay = { day: string; n: number; chips: string[]; today?: boolean };

const WEEK: WeekDay[] = [
  { day: "Mon", n: 9, chips: ["bg-[--teal-500]/80", "bg-[--sage-500]/70"] },
  { day: "Tue", n: 10, chips: ["bg-[--teal-500]/80"] },
  { day: "Wed", n: 11, chips: ["bg-[--sage-500]/70", "bg-[--teal-500]/80", "bg-[--teal-100]"] },
  { day: "Thu", n: 12, chips: ["bg-[--teal-500]/80", "bg-[--sage-500]/70"], today: true },
  { day: "Fri", n: 13, chips: ["bg-[--teal-100]", "bg-[--teal-500]/80"] },
  { day: "Sat", n: 14, chips: ["bg-[--sage-500]/70"] },
];

const AGENDA = [
  { time: "09:00", title: "Vinyasa Flow", who: "Elena · 9/12", tone: "bg-[--teal-500]" },
  { time: "11:30", title: "Reformer Pilates", who: "Camille · 6/8", tone: "bg-[--sage-500]" },
  { time: "14:00", title: "1-on-1 · Yuki", who: "Personal training", tone: "bg-[--teal-700]" },
] as const;

export function HeroAppPreview() {
  return (
    <div aria-hidden className="relative max-w-4xl mx-auto mt-12 md:mt-20">
      {/* glow under the frame */}
      <div className="absolute inset-x-8 -bottom-6 top-1/3 -z-10 rounded-full bg-[--teal-500]/25 blur-[70px]" />

      {/* browser frame */}
      <div className="bid-tilt bg-card border border-border rounded-xl shadow-overlay overflow-hidden">
        {/* window chrome */}
        <div className="flex items-center gap-2 px-4 h-9 border-b border-border bg-muted/40">
          <span className="w-2.5 h-2.5 rounded-full bg-[--neg]/50" />
          <span className="w-2.5 h-2.5 rounded-full bg-[--warn]/50" />
          <span className="w-2.5 h-2.5 rounded-full bg-[--pos]/50" />
          <span className="ml-3 text-[10px] text-muted-foreground tracking-[0.08em] uppercase">
            app.bookitdaily.com/owner
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[160px_1fr]">
          {/* sidebar */}
          <div className="hidden md:block border-r border-border p-3 space-y-1 bg-muted/20">
            {[
              { icon: LayoutDashboard, label: "Overview", active: true },
              { icon: CalendarDays, label: "Calendar" },
              { icon: Users, label: "Clients" },
              { icon: MessageSquare, label: "Messages" },
              { icon: CreditCard, label: "Finance" },
            ].map((item) => (
              <div
                key={item.label}
                className={
                  "flex items-center gap-2 rounded-lg px-2 py-1.5 text-[11px] font-medium " +
                  (item.active
                    ? "bg-[--role-accent]/10 text-[--role-accent]"
                    : "text-muted-foreground")
                }
              >
                <item.icon className="w-3.5 h-3.5 shrink-0" />
                <span className="hidden md:inline">{item.label}</span>
              </div>
            ))}
          </div>

          {/* main panel */}
          <div className="p-3 md:p-5 space-y-3 md:space-y-4">
            {/* stat row */}
            <div className="grid grid-cols-3 gap-2 md:gap-3">
              {[
                { label: "Bookings today", short: "Bookings", value: "14", delta: "+3" },
                { label: "Revenue · June", short: "Revenue", value: "$4,820", delta: "+12%" },
                { label: "Active clients", short: "Clients", value: "212", delta: "+8" },
              ].map((s) => (
                <div key={s.label} className="bg-card border border-border rounded-lg p-2.5 md:p-3 shadow-card">
                  <div className="text-[9px] md:text-[10px] uppercase tracking-[0.08em] font-medium text-muted-foreground truncate">
                    <span className="md:hidden">{s.short}</span>
                    <span className="hidden md:inline">{s.label}</span>
                  </div>
                  <div className="text-[15px] md:text-[20px] font-semibold tracking-tight tabular-nums mt-0.5">
                    {s.value}
                  </div>
                  <div className="flex items-center gap-1 text-[9px] md:text-[10px] text-[--pos] font-medium tabular-nums">
                    <TrendingUp className="w-3 h-3" /> {s.delta}
                  </div>
                </div>
              ))}
            </div>

            {/* week strip */}
            <div className="bg-card border border-border rounded-lg p-2.5 md:p-3 shadow-card">
              <div className="text-[9px] md:text-[10px] uppercase tracking-[0.08em] font-medium text-muted-foreground mb-2">
                This week
              </div>
              <div className="grid grid-cols-6 gap-1.5 md:gap-2">
                {WEEK.map((d) => (
                  <div
                    key={d.day}
                    className={
                      "rounded-md p-1.5 text-center border " +
                      (d.today
                        ? "border-[--teal-500]/60 bg-[--teal-100]/50"
                        : "border-[--line-soft] bg-muted/30")
                    }
                  >
                    <div className="text-[8px] md:text-[9px] uppercase tracking-[0.08em] text-muted-foreground">
                      {d.day}
                    </div>
                    <div className="text-[11px] md:text-[12px] font-semibold tabular-nums">{d.n}</div>
                    <div className="mt-1 space-y-0.5">
                      {d.chips.map((c, i) => (
                        <div key={i} className={`h-1 rounded-full ${c}`} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* agenda */}
            <div className="bg-card border border-border rounded-lg p-2.5 md:p-3 shadow-card">
              <div className="text-[9px] md:text-[10px] uppercase tracking-[0.08em] font-medium text-muted-foreground mb-2">
                Today&apos;s sessions
              </div>
              <div className="space-y-1.5">
                {AGENDA.map((a) => (
                  <div key={a.time} className="flex items-center gap-2 md:gap-3">
                    <span className="text-[9px] md:text-[10px] text-muted-foreground tabular-nums w-8 shrink-0">
                      {a.time}
                    </span>
                    <span className={`w-1 h-6 rounded-full ${a.tone} shrink-0`} />
                    <div className="min-w-0">
                      <div className="text-[11px] md:text-[12px] font-medium truncate">{a.title}</div>
                      <div className="text-[9px] md:text-[10px] text-muted-foreground truncate tabular-nums">
                        {a.who}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* floating mini-cards */}
      <div className="bid-float absolute -left-2 md:-left-10 top-16 hidden sm:flex items-center gap-2 bg-card border border-border rounded-xl shadow-overlay px-3 py-2.5">
        <span className="w-7 h-7 rounded-full bg-[--sage-100] text-[--pos] grid place-items-center">
          <BadgeCheck className="w-4 h-4" />
        </span>
        <div>
          <div className="text-[11px] font-semibold leading-tight">Booking confirmed</div>
          <div className="text-[10px] text-muted-foreground tabular-nums">Vinyasa Flow · 09:00</div>
        </div>
      </div>

      <div
        className="bid-float absolute -right-2 md:-right-8 top-36 hidden sm:flex items-center gap-2 bg-card border border-border rounded-xl shadow-overlay px-3 py-2.5"
        style={{ animationDelay: "1.6s" }}
      >
        <span className="w-7 h-7 rounded-full bg-[--teal-100] text-[--teal-700] grid place-items-center">
          <Bell className="w-4 h-4" />
        </span>
        <div>
          <div className="text-[11px] font-semibold leading-tight">New message</div>
          <div className="text-[10px] text-muted-foreground">&ldquo;Can I move to 14:00?&rdquo;</div>
        </div>
      </div>

      <div
        className="bid-float absolute right-8 md:right-20 -bottom-4 hidden sm:flex items-center gap-2 bg-card border border-border rounded-xl shadow-overlay px-3 py-2.5"
        style={{ animationDelay: "3.2s" }}
      >
        <span className="w-7 h-7 rounded-full bg-[--teal-100] text-[--teal-700] grid place-items-center">
          <CreditCard className="w-4 h-4" />
        </span>
        <div>
          <div className="text-[11px] font-semibold leading-tight tabular-nums">8 credits left</div>
          <div className="text-[10px] text-muted-foreground">Yuki · Studio plan</div>
        </div>
      </div>
    </div>
  );
}
