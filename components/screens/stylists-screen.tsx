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
    <div className="flex-1 overflow-auto p-8">
      <div className="flex items-center mb-5">
        <div>
          <h2 className="text-[15px] font-semibold tracking-tight">Stylists</h2>
          <p className="text-[13px] text-muted-foreground">6 active · 1 on leave · avg utilization 81%</p>
        </div>
        <div className="flex-1" />
        <Button variant="outline" size="sm" className="gap-2 mr-2"><Filter className="w-3.5 h-3.5" /> Active</Button>
        <Button size="sm" className="gap-2"><Plus className="w-3.5 h-3.5" /> Invite stylist</Button>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-card border border-border rounded-lg p-6">
          <div className="text-[13px] font-medium text-muted-foreground mb-3.5">Schedule density (this week)</div>
          <div className="grid grid-cols-[80px_1fr] gap-x-3 gap-y-2 items-center">
            {TRAINERS.map((t) => (
              <div key={t.name} className="contents">
                <div className="text-xs text-muted-foreground truncate">{t.name.split(" ")[0]}</div>
                <UtilBar value={t.util} />
              </div>
            ))}
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-6">
          <div className="text-[13px] font-medium text-muted-foreground mb-3.5">Commission split</div>
          <div className="flex items-center mb-2.5">
            <span className="text-4xl font-semibold tracking-tight">55%</span>
            <div className="flex-1" />
            <Pill kind="sage">House avg</Pill>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Stylists keep 45–65% per booking. Adjust per stylist in their profile.
          </p>
          <div className="h-px bg-border my-4" />
          <div className="flex items-center text-xs text-muted-foreground">
            <span>Range</span><span className="flex-1" /><span className="tabular-nums">45% – 65%</span>
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-6">
          <div className="text-[13px] font-medium text-muted-foreground mb-3.5">Pending invitations</div>
          {PENDING_INVITATIONS.map((p) => (
            <div key={p.n} className="flex items-center gap-2.5 py-2 border-b border-[--line-soft] last:border-0">
              <HueAvatar name={p.n} hue={p.hue} />
              <div>
                <div className="text-[13px] font-medium">{p.n}</div>
                <div className="text-[11px] text-muted-foreground">{p.s}</div>
              </div>
              <div className="flex-1" />
              <span className="text-xs text-[--teal-700] cursor-pointer hover:underline">Resend</span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-card border border-border rounded-lg overflow-hidden">
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
              <tr key={t.name} className="border-b border-[--line-soft] last:border-0">
                <td className="py-3.5 pl-6"><PersonCell name={t.name} meta={t.role} hue={t.hue} /></td>
                <td className="tabular-nums">{t.clients}</td>
                <td><UtilBar value={t.util} /></td>
                <td className="tabular-nums font-medium">{t.rate}%</td>
                <td className="text-right tabular-nums">€{t.mtd.toLocaleString()}</td>
                <td><MiniWeek hue={t.hue} /></td>
                <td className="pr-4 text-muted-foreground"><MoreHorizontal className="w-4 h-4" /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const WEEK_DAYS = ["M", "T", "W", "T", "F", "S", "S"];

function MiniWeek({ hue }: { hue: number }) {
  return (
    <div className="flex items-center gap-[3px]">
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
