"use client";

import { useEffect, useRef, useState } from "react";
import {
  BadgeCheck,
  Bell,
  CalendarDays,
  CreditCard,
  MessageSquare,
  Moon,
  Smartphone,
  Sun,
  Wifi,
} from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Bento grid of shipped features, each cell with a live micro-visual:
 * animated chat, growing finance bars (in-view), a working mini theme
 * toggle, a credit ledger, notifications, and the PWA pitch.
 * All decorative motion respects prefers-reduced-motion via `.bid-*`.
 */

function useInView<T extends HTMLElement>(threshold = 0.35) {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      // No IO support: reveal on the next frame (async, mirrors Reveal).
      const raf = requestAnimationFrame(() => setInView(true));
      return () => cancelAnimationFrame(raf);
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setInView(true);
          io.disconnect();
        }
      },
      { threshold }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [threshold]);
  return { ref, inView };
}

const CELL =
  "group bg-card border border-border rounded-xl p-5 md:p-6 shadow-card motion-safe:transition-all motion-safe:duration-200 hover:-translate-y-0.5 hover:shadow-hero overflow-hidden";

function CellHeading({ icon: Icon, title, body }: { icon: typeof Bell; title: string; body: string }) {
  return (
    <>
      <span className="w-9 h-9 rounded-lg bg-[--role-accent-light]/60 text-[--role-accent-dark] grid place-items-center mb-3 motion-safe:transition-transform motion-safe:duration-200 group-hover:scale-110 group-hover:-rotate-3">
        <Icon className="w-4 h-4" aria-hidden />
      </span>
      <h3 className="text-[15px] font-semibold mb-1">{title}</h3>
      <p className="text-[13px] text-muted-foreground leading-relaxed">{body}</p>
    </>
  );
}

/* — calendar cell (large): mini week with sessions — */
function CalendarCell() {
  return (
    <div className={cn(CELL, "md:col-span-2")}>
      <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-5 items-start">
        <div>
          <CellHeading
            icon={CalendarDays}
            title="A calendar that can't double-book"
            body="Classes and 1-on-1s share one schedule. Overlaps are rejected at the database level, capacity is enforced on every booking, and the slot grid only ever shows real availability."
          />
        </div>
        <div aria-hidden className="bg-muted/30 border border-border rounded-lg p-3 w-full sm:w-56 shrink-0">
          <div className="text-[10px] uppercase tracking-[0.08em] font-medium text-muted-foreground mb-2 tabular-nums">
            Thu · Jun 12
          </div>
          <div className="space-y-1.5">
            {[
              { t: "09:00", label: "Vinyasa Flow", cls: "bg-[--teal-100]/70 text-[--teal-900] border-[--teal-500]/30" },
              { t: "11:30", label: "Reformer", cls: "bg-[--sage-100]/70 text-foreground border-[--sage-500]/30" },
              { t: "14:00", label: "1-on-1 · Yuki", cls: "bg-[--teal-100]/70 text-[--teal-900] border-[--teal-500]/30" },
              { t: "18:00", label: "HIIT · full", cls: "bg-muted text-muted-foreground border-transparent" },
            ].map((s) => (
              <div key={s.t} className={`flex items-center gap-2 border rounded-md px-2 py-1.5 text-[11px] font-medium ${s.cls}`}>
                <span className="tabular-nums text-[10px] opacity-70">{s.t}</span>
                <span className="truncate">{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* — chat cell: typing indicator that resolves into a reply — */
function ChatCell() {
  const { ref, inView } = useInView<HTMLDivElement>();
  const [replied, setReplied] = useState(false);
  useEffect(() => {
    if (!inView) return;
    const t = setTimeout(() => setReplied(true), 1800);
    return () => clearTimeout(t);
  }, [inView]);

  return (
    <div ref={ref} className={CELL}>
      <CellHeading
        icon={MessageSquare}
        title="Built-in messaging"
        body="Clients message their trainer; staff reply from the same app, in real time."
      />
      <div aria-hidden className="mt-4 space-y-2">
        <div className="max-w-[85%] bg-muted rounded-xl rounded-bl-sm px-3 py-2 text-[12px]">
          Can I move tomorrow to 14:00?
        </div>
        {replied ? (
          <div className="bid-pop max-w-[85%] ml-auto bg-primary text-primary-foreground rounded-xl rounded-br-sm px-3 py-2 text-[12px]">
            Done — see you at 14:00 ✓
          </div>
        ) : (
          <div className="max-w-[40%] ml-auto bg-primary/90 rounded-xl rounded-br-sm px-3 py-2.5 flex items-center gap-1">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="bid-typing-dot w-1.5 h-1.5 rounded-full bg-primary-foreground"
                style={{ animationDelay: `${i * 0.18}s` }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* — finance cell: bars grow when scrolled into view — */
function FinanceCell() {
  const { ref, inView } = useInView<HTMLDivElement>();
  return (
    <div ref={ref} className={CELL}>
      <CellHeading
        icon={CreditCard}
        title="Finance, not a spreadsheet"
        body="Revenue, credit-pack sales, and per-staff commission splits — live."
      />
      <div aria-hidden className={cn("mt-4 flex items-end gap-1.5 h-20", inView && "bid-bars-play")}>
        {[40, 62, 48, 75, 58, 88, 70, 95].map((h, i) => (
          <div
            key={i}
            className="bid-bar flex-1 rounded-t bg-[--teal-500]/70"
            style={{ height: `${h}%`, animationDelay: `${i * 60}ms` }}
          />
        ))}
      </div>
      <div className="flex items-center justify-between mt-2 text-[10px] text-muted-foreground tabular-nums">
        <span>Nov</span>
        <span className="text-[--pos] font-medium">+38% YoY</span>
        <span>Jun</span>
      </div>
    </div>
  );
}

/* — credits cell: mini ledger — */
function CreditsCell() {
  return (
    <div className={CELL}>
      <CellHeading
        icon={BadgeCheck}
        title="Credits with an audit trail"
        body="Every grant, spend, and refund is a ledger entry. Balances can't drift."
      />
      <div aria-hidden className="mt-4 space-y-1.5 text-[11px]">
        {[
          { label: "Monthly grant", amount: "+8", pos: true },
          { label: "Reformer Pilates", amount: "−2", pos: false },
          { label: "Cancelled >24h — refund", amount: "+2", pos: true },
        ].map((row) => (
          <div key={row.label} className="flex items-center justify-between border-b border-[--line-soft] last:border-0 py-1.5">
            <span className="text-muted-foreground truncate">{row.label}</span>
            <span className={cn("font-semibold tabular-nums", row.pos ? "text-[--pos]" : "text-foreground")}>
              {row.amount}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* — dark mode cell: a real working mini toggle (local to the preview) — */
function ThemeCell() {
  const [dark, setDark] = useState(false);
  return (
    <div className={CELL}>
      <CellHeading
        icon={Moon}
        title="Dark mode end-to-end"
        body="Tokenized everywhere — calendar, charts, sheets. Try it:"
      />
      <div
        className={cn(
          "mt-4 rounded-lg border p-3 motion-safe:transition-colors motion-safe:duration-200",
          dark ? "bg-[oklch(0.18_0.01_240)] border-[oklch(0.3_0.01_240)]" : "bg-[--background] border-border"
        )}
      >
        <div className="flex items-center justify-between mb-2">
          <span
            className={cn(
              "text-[10px] uppercase tracking-[0.08em] font-medium motion-safe:transition-colors",
              dark ? "text-[oklch(0.65_0.01_240)]" : "text-muted-foreground"
            )}
          >
            Preview
          </span>
          <button
            type="button"
            role="switch"
            aria-checked={dark}
            aria-label="Toggle preview dark mode"
            onClick={() => setDark((d) => !d)}
            className={cn(
              "relative inline-flex h-6 w-11 items-center rounded-full motion-safe:transition-colors motion-safe:duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
              dark ? "bg-primary" : "bg-muted"
            )}
          >
            <span
              className={cn(
                "grid place-items-center h-5 w-5 rounded-full bg-card shadow-card motion-safe:transition-transform motion-safe:duration-200",
                dark ? "translate-x-[22px]" : "translate-x-0.5"
              )}
            >
              {dark ? <Moon className="w-3 h-3 text-primary" aria-hidden /> : <Sun className="w-3 h-3 text-[--warn]" aria-hidden />}
            </span>
          </button>
        </div>
        <div
          className={cn(
            "rounded-md border p-2.5 motion-safe:transition-colors motion-safe:duration-200",
            dark ? "bg-[oklch(0.22_0.01_240)] border-[oklch(0.32_0.01_240)]" : "bg-card border-border"
          )}
        >
          <div className={cn("text-[12px] font-semibold", dark ? "text-[oklch(0.93_0.005_240)]" : "text-foreground")}>
            Tonight&apos;s closing report
          </div>
          <div className={cn("text-[10px] tabular-nums", dark ? "text-[oklch(0.6_0.01_240)]" : "text-muted-foreground")}>
            22:40 · 14 bookings · $480
          </div>
        </div>
      </div>
    </div>
  );
}

/* — notifications cell — */
function NotificationsCell() {
  return (
    <div className={CELL}>
      <CellHeading
        icon={Bell}
        title="Real-time notifications"
        body="Bookings, cancellations, credits — staff and owners know the second it happens."
      />
      <div aria-hidden className="mt-4 space-y-2">
        {[
          { icon: BadgeCheck, text: "Yuki booked Vinyasa Flow", time: "now", tone: "text-[--pos] bg-[--sage-100]" },
          { icon: CreditCard, text: "Olivia bought a 10-pack", time: "2m", tone: "text-[--teal-700] bg-[--teal-100]" },
        ].map((n) => (
          <div key={n.text} className="flex items-center gap-2.5 border border-border rounded-lg px-3 py-2">
            <span className={`w-6 h-6 rounded-full grid place-items-center shrink-0 ${n.tone}`}>
              <n.icon className="w-3 h-3" aria-hidden />
            </span>
            <span className="text-[11px] flex-1 truncate">{n.text}</span>
            <span className="text-[10px] text-muted-foreground tabular-nums shrink-0">{n.time}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* — PWA cell — */
function PwaCell() {
  return (
    <div className={cn(CELL, "md:col-span-2")}>
      <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-5 items-center">
        <div>
          <CellHeading
            icon={Smartphone}
            title="An app, without the app store"
            body="Installable PWA with native-feeling bottom tabs, an offline page, and home-screen icons. Your clients tap your link once and keep your studio on their phone."
          />
        </div>
        <div aria-hidden className="flex items-center justify-center gap-3 sm:pr-2">
          <div className="w-24 rounded-[18px] border-2 border-border bg-muted/30 p-1.5">
            <div className="rounded-[12px] bg-card border border-border p-2 space-y-1.5">
              <div className="h-1.5 w-10 rounded-full bg-[--teal-500]/70" />
              <div className="h-1.5 w-14 rounded-full bg-muted" />
              <div className="h-8 rounded-md bg-[--teal-100]/70" />
              <div className="flex justify-between pt-1">
                {[0, 1, 2, 3].map((i) => (
                  <span key={i} className={cn("w-1.5 h-1.5 rounded-full", i === 0 ? "bg-[--teal-700]" : "bg-muted-foreground/30")} />
                ))}
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <Wifi className="w-3.5 h-3.5" aria-hidden /> Offline-friendly
            </span>
            <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <Smartphone className="w-3.5 h-3.5" aria-hidden /> Home-screen install
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function BentoFeatures() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
      <CalendarCell />
      <ChatCell />
      <FinanceCell />
      <CreditsCell />
      <ThemeCell />
      <NotificationsCell />
      <PwaCell />
    </div>
  );
}
