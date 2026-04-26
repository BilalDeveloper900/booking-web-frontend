import { Button } from "@/components/ui/button";
import { PersonCell, Pill } from "@/components/shared";
import {
  CLIENT_PROFILE,
  CLIENT_UPCOMING,
  CLIENT_PAST_VISITS,
  CLIENT_BOOK_AGAIN,
} from "@/lib/data";

export function ClientHome() {
  const p = CLIENT_PROFILE;

  return (
    <div className="flex-1 overflow-auto p-6 lg:p-8">
      <div className="mb-6">
        <h2 className="text-[15px] font-semibold tracking-tight">
          Welcome back, Olivia
        </h2>
        <p className="text-[13px] text-muted-foreground">
          Your next visit is Thu, 30 Apr at 2:00 PM
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr_1fr] gap-4 mb-6">
        <div className="bg-foreground text-background rounded-lg p-6 flex flex-col justify-between">
          <div className="text-[11px] font-medium tracking-[0.08em] uppercase opacity-60 mb-4">
            Credits remaining
          </div>
          <div className="flex items-baseline gap-1 mb-3">
            <span className="text-[42px] font-bold tracking-tight leading-none tabular-nums">
              {p.creditsTotal - p.creditsUsed}
            </span>
            <span className="text-lg opacity-50">/ {p.creditsTotal}</span>
          </div>
          <div className="h-2 bg-background/20 rounded-full overflow-hidden mb-3">
            <div
              className="h-full rounded-full"
              style={{
                width: `${((p.creditsTotal - p.creditsUsed) / p.creditsTotal) * 100}%`,
                background: "var(--teal-500, oklch(0.7 0.12 195))",
              }}
            />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs opacity-60">
              Renews {p.renewalDate}
            </span>
            <Button
              variant="outline"
              size="sm"
              className="border-background/30 text-background hover:bg-background/10"
            >
              Top up
            </Button>
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-[18px]">
          <div className="text-[11px] font-medium tracking-[0.08em] uppercase text-muted-foreground mb-3.5">
            This year
          </div>
          <div className="text-[28px] font-semibold tracking-tight leading-none tabular-nums">
            {p.yearlyVisits}
            <span className="text-sm text-muted-foreground ml-1">visits</span>
          </div>
          <div className="text-xs text-muted-foreground mt-3">
            {"\u20AC"}{p.yearlySpent.toLocaleString()} spent
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-[18px]">
          <div className="text-[11px] font-medium tracking-[0.08em] uppercase text-muted-foreground mb-3.5">
            Loyalty
          </div>
          <div className="text-[28px] font-semibold tracking-tight leading-none tabular-nums">
            {p.tier}
          </div>
          <div className="text-xs text-muted-foreground mt-3">
            {p.visitsToNextTier} visits to Platinum
          </div>
        </div>
      </div>

      <div className="mb-6">
        <h3 className="text-[13px] font-medium text-muted-foreground mb-3">
          Upcoming appointments
        </h3>
        <div className="grid grid-cols-1 gap-3">
          {CLIENT_UPCOMING.map((a) => (
            <div
              key={a.id}
              className="bg-card border border-border rounded-lg p-4 flex flex-col sm:flex-row sm:items-center gap-4"
            >
              <div className="flex items-center gap-4 sm:gap-5">
                <div className="w-12 h-14 rounded-lg bg-muted flex flex-col items-center justify-center shrink-0">
                  <span className="text-[11px] font-medium text-muted-foreground leading-none">
                    {a.date}
                  </span>
                  <span className="text-lg font-bold leading-tight tabular-nums">
                    {a.dateNum}
                  </span>
                </div>
                <div className="min-w-0">
                  <div className="text-[13px] font-medium">{a.service}</div>
                  <div className="text-xs text-muted-foreground">
                    {a.time} · {a.duration} · {a.credits} credits
                  </div>
                  <div className="mt-1.5">
                    <PersonCell
                      name={a.stylist}
                      hue={a.hue}
                    />
                  </div>
                </div>
              </div>
              <div className="flex-1" />
              <div className="flex gap-2 shrink-0">
                <Button variant="outline" size="sm">
                  Reschedule
                </Button>
                <Button variant="ghost" size="sm">
                  Details
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mb-6">
        <h3 className="text-[13px] font-medium text-muted-foreground mb-3">
          Book again
        </h3>
        <div className="flex gap-3 overflow-x-auto pb-1">
          {CLIENT_BOOK_AGAIN.map((b) => (
            <div
              key={b.service}
              className="bg-card border border-border rounded-lg p-4 min-w-[200px] shrink-0 flex flex-col"
            >
              <div className="text-[13px] font-medium mb-1">{b.service}</div>
              <div className="text-xs text-muted-foreground mb-1">
                {b.stylist}
              </div>
              <div className="text-xs text-muted-foreground mb-3">
                {b.duration} · {b.credits} credits
              </div>
              <div className="flex-1" />
              <Button variant="outline" size="sm" className="w-full">
                Book
              </Button>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-[13px] font-medium text-muted-foreground mb-3">
          Recent visits
        </h3>
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left text-[11px] font-medium tracking-[0.08em] uppercase text-muted-foreground px-4 py-3">
                    Date
                  </th>
                  <th className="text-left text-[11px] font-medium tracking-[0.08em] uppercase text-muted-foreground px-4 py-3">
                    Service
                  </th>
                  <th className="text-left text-[11px] font-medium tracking-[0.08em] uppercase text-muted-foreground px-4 py-3">
                    Stylist
                  </th>
                  <th className="text-right text-[11px] font-medium tracking-[0.08em] uppercase text-muted-foreground px-4 py-3">
                    Credits
                  </th>
                  <th className="text-right text-[11px] font-medium tracking-[0.08em] uppercase text-muted-foreground px-4 py-3">
                    Rating
                  </th>
                </tr>
              </thead>
              <tbody>
                {CLIENT_PAST_VISITS.map((v, i) => (
                  <tr
                    key={i}
                    className="border-b border-[--line-soft] last:border-0"
                  >
                    <td className="px-4 py-3 tabular-nums">{v.date}</td>
                    <td className="px-4 py-3">{v.service}</td>
                    <td className="px-4 py-3">{v.stylist}</td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {v.credits}
                    </td>
                    <td className="px-4 py-3 text-right text-amber-500 tracking-tight">
                      {"★".repeat(v.rating)}
                      {"★".repeat(5 - v.rating).split("").map((_, j) => (
                        <span key={j} className="opacity-20">★</span>
                      ))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
