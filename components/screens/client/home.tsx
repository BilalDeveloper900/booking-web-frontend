import Link from "next/link";
import { ArrowRight, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PersonCell } from "@/components/shared";
import {
  CLIENT_PROFILE,
  CLIENT_UPCOMING,
  CLIENT_PAST_VISITS,
  CLIENT_BOOK_AGAIN,
} from "@/lib/data";

export function ClientHome() {
  const p = CLIENT_PROFILE;
  const remaining = p.creditsTotal - p.creditsUsed;
  const remainingPct = (remaining / p.creditsTotal) * 100;

  return (
    <div className="flex-1 overflow-auto p-6 lg:p-8">
      <div className="mb-6">
        <h2 className="text-[24px] font-semibold tracking-tight leading-tight">
          Welcome back, Olivia
        </h2>
        <p className="text-[13px] text-muted-foreground mt-1">
          Your next visit is Thu, 30 Apr at 2:00 PM
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr_1fr] gap-4 mb-8">
        <div className="bg-foreground text-background rounded-xl p-6 flex flex-col justify-between shadow-hero motion-safe:transition-shadow motion-safe:duration-200 hover:shadow-overlay">
          <div className="text-[11px] font-medium tracking-[0.08em] uppercase opacity-60 mb-4">
            Credits remaining
          </div>
          <div className="flex items-baseline gap-1 mb-3">
            <span className="text-[42px] font-bold tracking-tight leading-none tabular-nums">
              {remaining}
            </span>
            <span className="text-lg opacity-50 tabular-nums">/ {p.creditsTotal}</span>
          </div>
          <div className="h-2 bg-background/20 rounded-full overflow-hidden mb-3">
            <div
              className="h-full rounded-full bg-[--role-accent] motion-safe:transition-[width] motion-safe:duration-500 motion-safe:ease-out"
              style={{ width: `${remainingPct}%` }}
            />
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs opacity-60">Renews {p.renewalDate}</span>
            <Button
              variant="outline"
              size="sm"
              className="border-background/30 text-background hover:bg-background/10"
            >
              Top up
            </Button>
          </div>
        </div>

        <SmallStat label="This year" value={p.yearlyVisits} unit="visits" foot={`€${p.yearlySpent.toLocaleString()} spent`} />
        <SmallStat label="Loyalty" value={p.tier} foot={`${p.visitsToNextTier} visits to Platinum`} />
      </div>

      <Section title="Upcoming appointments">
        <div className="grid grid-cols-1 gap-3">
          {CLIENT_UPCOMING.map((a) => (
            <div
              key={a.id}
              className="bg-card border border-border rounded-xl shadow-card p-4 flex flex-col sm:flex-row sm:items-center gap-4 motion-safe:transition-all motion-safe:duration-200 hover:shadow-hero hover:-translate-y-px"
            >
              <div className="flex items-center gap-4 sm:gap-5">
                <div className="w-12 h-14 rounded-lg bg-[--role-accent-light] text-[--role-accent-dark] flex flex-col items-center justify-center shrink-0">
                  <span className="text-[11px] font-medium leading-none">{a.date}</span>
                  <span className="text-lg font-bold leading-tight tabular-nums">{a.dateNum}</span>
                </div>
                <div className="min-w-0">
                  <div className="text-[13px] font-medium">{a.service}</div>
                  <div className="text-xs text-muted-foreground tabular-nums">
                    {a.time} · {a.duration} · {a.credits} credits
                  </div>
                  <div className="mt-1.5">
                    <PersonCell name={a.admin} hue={a.hue} />
                  </div>
                </div>
              </div>
              <div className="flex-1" />
              <div className="flex gap-2 shrink-0">
                <Button variant="outline" size="sm">Reschedule</Button>
                <Button variant="ghost" size="sm">Details</Button>
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Book again" right={<SectionLink href="/client/book">Browse services</SectionLink>}>
        <div className="flex gap-3 overflow-x-auto pb-1 -mx-1 px-1">
          {CLIENT_BOOK_AGAIN.map((b) => (
            <div
              key={b.service}
              className="bg-card border border-border rounded-xl shadow-card p-4 min-w-[200px] shrink-0 flex flex-col motion-safe:transition-all motion-safe:duration-200 hover:shadow-hero hover:-translate-y-px"
            >
              <div className="text-[13px] font-medium mb-1">{b.service}</div>
              <div className="text-xs text-muted-foreground mb-1">{b.admin}</div>
              <div className="text-xs text-muted-foreground mb-3 tabular-nums">
                {b.duration} · {b.credits} credits
              </div>
              <div className="flex-1" />
              <Button size="sm" className="w-full">Book</Button>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Recent visits">
        <div className="bg-card border border-border rounded-xl shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-border">
                  <Th>Date</Th>
                  <Th>Service</Th>
                  <Th>Admin</Th>
                  <Th align="right">Credits</Th>
                  <Th align="right">Rating</Th>
                </tr>
              </thead>
              <tbody>
                {CLIENT_PAST_VISITS.map((v, i) => (
                  <tr
                    key={i}
                    className="border-b border-[--line-soft] last:border-0 hover:bg-muted/40 motion-safe:transition-colors motion-safe:duration-150"
                  >
                    <td className="px-4 py-3 tabular-nums">{v.date}</td>
                    <td className="px-4 py-3">{v.service}</td>
                    <td className="px-4 py-3">{v.admin}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{v.credits}</td>
                    <td className="px-4 py-3 text-right">
                      <Stars value={v.rating} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </Section>
    </div>
  );
}

function SmallStat({
  label,
  value,
  unit,
  foot,
}: {
  label: string;
  value: string | number;
  unit?: string;
  foot: string;
}) {
  return (
    <div className="bg-card border border-border rounded-xl shadow-card p-[18px] motion-safe:transition-shadow motion-safe:duration-200 hover:shadow-hero">
      <div className="text-[11px] font-medium tracking-[0.08em] uppercase text-muted-foreground mb-3.5">
        {label}
      </div>
      <div className="text-[28px] font-semibold tracking-tight leading-none tabular-nums">
        {value}
        {unit && <span className="text-sm text-muted-foreground ml-1 font-normal">{unit}</span>}
      </div>
      <div className="text-xs text-muted-foreground mt-3">{foot}</div>
    </div>
  );
}

function Section({
  title,
  right,
  children,
}: {
  title: string;
  right?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-6">
      <div className="flex items-baseline justify-between mb-3 gap-3">
        <h3 className="text-[13px] font-medium text-foreground">{title}</h3>
        {right}
      </div>
      {children}
    </div>
  );
}

function SectionLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1 text-xs font-medium text-[--role-accent] hover:gap-1.5 motion-safe:transition-all motion-safe:duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
    >
      {children}
      <ArrowRight className="w-3 h-3" aria-hidden />
    </Link>
  );
}

function Th({ children, align = "left" }: { children: React.ReactNode; align?: "left" | "right" }) {
  return (
    <th
      className={`text-[11px] font-medium tracking-[0.08em] uppercase text-muted-foreground px-4 py-3 ${
        align === "right" ? "text-right" : "text-left"
      }`}
    >
      {children}
    </th>
  );
}

function Stars({ value }: { value: number }) {
  return (
    <span className="inline-flex gap-0.5" aria-label={`${value} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={`w-3.5 h-3.5 ${n <= value ? "fill-amber-400 text-amber-400" : "fill-muted text-muted-foreground/40"}`}
          aria-hidden
        />
      ))}
    </span>
  );
}
