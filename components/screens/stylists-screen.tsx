import { Filter, Plus, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PersonCell, UtilBar, HueAvatar, Pill } from "@/components/shared";
import { TRAINERS } from "@/lib/data";

const PENDING_INVITATIONS = [
  { n: "Saoirse Doyle", s: "Sent 2d ago", hue: 165 },
  { n: "Tomas Reyes", s: "Sent 5d ago", hue: 220 },
];

export function StylistsScreen() {
  return (
    <div className="flex-1 overflow-auto p-6 lg:p-8">
      <div className="flex items-start mb-6 gap-4 flex-wrap">
        <div>
          <h2 className="text-[24px] font-semibold tracking-tight leading-tight">Stylists</h2>
          <p className="text-[13px] text-muted-foreground mt-1">
            6 active · 1 on leave · avg utilization 81%
          </p>
        </div>
        <div className="flex-1" />
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-2">
            <Filter className="w-3.5 h-3.5" /> Active
          </Button>
          <Button size="sm" className="gap-2">
            <Plus className="w-3.5 h-3.5" /> Invite stylist
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardLabel>Schedule density (this week)</CardLabel>
          <div className="grid grid-cols-[80px_1fr] gap-x-3 gap-y-2 items-center mt-3.5">
            {TRAINERS.map((t) => (
              <div key={t.name} className="contents">
                <div className="text-xs text-muted-foreground truncate">{t.name.split(" ")[0]}</div>
                <UtilBar value={t.util} />
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <CardLabel>Commission split</CardLabel>
          <div className="flex items-end mt-3.5 mb-2.5 gap-3">
            <span className="text-[40px] font-semibold tracking-tight leading-none tabular-nums">
              55<span className="text-2xl text-muted-foreground font-normal">%</span>
            </span>
            <div className="flex-1" />
            <Pill kind="sage">House avg</Pill>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Stylists keep 45–65% per booking. Adjust per stylist in their profile.
          </p>
          <div className="h-px bg-border my-4" />
          <div className="flex items-center text-xs text-muted-foreground">
            <span>Range</span>
            <span className="flex-1" />
            <span className="tabular-nums">45% – 65%</span>
          </div>
        </Card>

        <Card>
          <CardLabel>Pending invitations</CardLabel>
          <div className="mt-2">
            {PENDING_INVITATIONS.map((p) => (
              <div
                key={p.n}
                className="flex items-center gap-2.5 py-2 border-b border-[--line-soft] last:border-0"
              >
                <HueAvatar name={p.n} hue={p.hue} />
                <div className="min-w-0">
                  <div className="text-[13px] font-medium truncate">{p.n}</div>
                  <div className="text-[11px] text-muted-foreground">{p.s}</div>
                </div>
                <div className="flex-1" />
                <Button variant="ghost" size="xs" className="text-[--role-accent] hover:text-[--role-accent-dark]">
                  Resend
                </Button>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="bg-card border border-border rounded-xl shadow-card overflow-hidden">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left text-[11px] font-medium tracking-[0.08em] uppercase text-muted-foreground pb-3 pt-3 pl-6">Stylist</th>
              <th className="text-left text-[11px] font-medium tracking-[0.08em] uppercase text-muted-foreground pb-3 pt-3">Clients</th>
              <th className="text-left text-[11px] font-medium tracking-[0.08em] uppercase text-muted-foreground pb-3 pt-3">Utilization</th>
              <th className="text-left text-[11px] font-medium tracking-[0.08em] uppercase text-muted-foreground pb-3 pt-3">Commission</th>
              <th className="text-right text-[11px] font-medium tracking-[0.08em] uppercase text-muted-foreground pb-3 pt-3">Earned (MTD)</th>
              <th className="text-left text-[11px] font-medium tracking-[0.08em] uppercase text-muted-foreground pb-3 pt-3">Schedule</th>
              <th className="pb-3 pt-3 pr-4" />
            </tr>
          </thead>
          <tbody>
            {TRAINERS.map((t) => (
              <tr
                key={t.name}
                className="border-b border-[--line-soft] last:border-0 hover:bg-muted/40 motion-safe:transition-colors motion-safe:duration-150"
              >
                <td className="py-3.5 pl-6"><PersonCell name={t.name} meta={t.role} hue={t.hue} /></td>
                <td className="tabular-nums">{t.clients}</td>
                <td><UtilBar value={t.util} /></td>
                <td className="tabular-nums font-medium">{t.rate}%</td>
                <td className="text-right tabular-nums">€{t.mtd.toLocaleString()}</td>
                <td><MiniWeek hue={t.hue} /></td>
                <td className="pr-4">
                  <Button variant="ghost" size="icon-sm" aria-label={`More actions for ${t.name}`}>
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-card border border-border rounded-xl p-6 shadow-card motion-safe:transition-shadow motion-safe:duration-200 hover:shadow-hero">
      {children}
    </div>
  );
}

function CardLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[11px] font-medium tracking-[0.08em] uppercase text-muted-foreground">
      {children}
    </div>
  );
}

const WEEK_DAYS = ["M", "T", "W", "T", "F", "S", "S"];

function MiniWeek({ hue }: { hue: number }) {
  return (
    <div className="flex items-center gap-[3px]" aria-label="Weekly schedule density">
      {WEEK_DAYS.map((_, i) => {
        const v = ((hue + i * 13) % 10) / 10;
        const intensity = i === 6 ? 0 : 0.3 + v * 0.7;
        return (
          <div
            key={i}
            className="w-[18px] h-[22px] rounded-[3px]"
            style={{
              background: i === 6 ? "var(--ink-100)" : `oklch(${0.95 - intensity * 0.4} ${0.04 * intensity + 0.01} ${hue})`,
            }}
          />
        );
      })}
    </div>
  );
}
